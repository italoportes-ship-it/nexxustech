import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import { createCheckoutSession } from "./stripe";
import { sendB2BLeadToCRM, sendNewsletterToCRM } from "./crm";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ===== CATEGORIES =====
  categories: router({
    list: publicProcedure.query(async () => {
      return db.getAllCategories();
    }),
    getBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
      return db.getCategoryBySlug(input.slug);
    }),
  }),

  // ===== PRODUCTS =====
  products: router({
    list: publicProcedure.query(async () => {
      return db.getAllProducts();
    }),
    byCategory: publicProcedure.input(z.object({ categoryId: z.number() })).query(async ({ input }) => {
      return db.getProductsByCategory(input.categoryId);
    }),
    byType: publicProcedure.input(z.object({ type: z.enum(["software", "course"]) })).query(async ({ input }) => {
      return db.getProductsByType(input.type);
    }),
    bySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
      return db.getProductBySlug(input.slug);
    }),
    byId: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return db.getProductById(input.id);
    }),
  }),

  // ===== CART =====
  cart: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getCartItems(ctx.user.id);
    }),
    add: protectedProcedure.input(z.object({ productId: z.number() })).mutation(async ({ ctx, input }) => {
      await db.addToCart(ctx.user.id, input.productId);
      return { success: true };
    }),
    remove: protectedProcedure.input(z.object({ productId: z.number() })).mutation(async ({ ctx, input }) => {
      await db.removeFromCart(ctx.user.id, input.productId);
      return { success: true };
    }),
    updateQuantity: protectedProcedure.input(z.object({ productId: z.number(), quantity: z.number() })).mutation(async ({ ctx, input }) => {
      await db.updateCartItemQuantity(ctx.user.id, input.productId, input.quantity);
      return { success: true };
    }),
    clear: protectedProcedure.mutation(async ({ ctx }) => {
      await db.clearCart(ctx.user.id);
      return { success: true };
    }),
  }),

  // ===== ORDERS =====
  orders: router({
    myOrders: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserOrders(ctx.user.id);
    }),
    getItems: protectedProcedure.input(z.object({ orderId: z.number() })).query(async ({ input }) => {
      return db.getOrderItems(input.orderId);
    }),
    create: protectedProcedure.mutation(async ({ ctx }) => {
      const cartItems = await db.getCartItems(ctx.user.id);
      if (cartItems.length === 0) {
        throw new Error("Cart is empty");
      }
      const total = cartItems.reduce((sum, item) => sum + parseFloat(item.product.price) * item.quantity, 0);
      const orderId = await db.createOrder(ctx.user.id, total.toFixed(2), ctx.user.email ?? null);
      if (!orderId) throw new Error("Failed to create order");
      for (const item of cartItems) {
        await db.addOrderItem(orderId, item.productId, item.product.name, item.product.price, item.quantity);
      }
      await db.clearCart(ctx.user.id);
      
      // Notify owner about new order
      await notifyOwner({
        title: `Novo Pedido #${orderId}`,
        content: `Um novo pedido foi realizado por ${ctx.user.name || ctx.user.email || 'Cliente'}. Total: R$ ${total.toFixed(2)}. Itens: ${cartItems.map(i => i.product.name).join(', ')}.`
      });

      // CRM notification happens on payment confirmation (Stripe webhook)

      // Create Stripe checkout session
      const origin = ctx.req.headers.origin || `${ctx.req.protocol}://${ctx.req.headers.host}`;
      const stripeItems = cartItems.map(item => ({
        name: item.product.name,
        price: parseFloat(item.product.price),
        quantity: item.quantity,
      }));
      
      let checkoutUrl: string | null = null;
      try {
        checkoutUrl = await createCheckoutSession(
          ctx.user.id,
          ctx.user.email ?? null,
          ctx.user.name ?? null,
          orderId,
          stripeItems,
          origin
        );
      } catch (err) {
        console.error("[Stripe] Failed to create checkout session:", err);
      }

      return { orderId, total: total.toFixed(2), checkoutUrl };
    }),
  }),

  // ===== B2B LEADS =====
  b2b: router({
    lookup: publicProcedure.input(z.object({
      protocol: z.string().min(1),
    })).query(async ({ input }) => {
      const lead = await db.getLeadByProtocol(input.protocol.toUpperCase().trim());
      if (!lead) return null;
      return {
        protocol: lead.protocol,
        companyName: lead.companyName,
        contactName: lead.contactName,
        status: lead.status,
        createdAt: lead.createdAt,
      };
    }),
    submit: publicProcedure.input(z.object({
      companyName: z.string().min(1),
      contactName: z.string().min(1),
      email: z.string().email(),
      phone: z.string().optional(),
      employees: z.string().optional(),
      message: z.string().optional(),
    })).mutation(async ({ input }) => {
      // Generate protocol number: NXT-YYYYMMDD-XXXXX
      const now = new Date();
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
      const protocol = `NXT-${dateStr}-${randomSuffix}`;

      // Save lead with protocol to database
      await db.createB2BLead({ ...input, protocol });

      // Notify owner with protocol
      await notifyOwner({
        title: `Novo Lead B2B: ${input.companyName} [${protocol}]`,
        content: `Protocolo: ${protocol}\nEmpresa: ${input.companyName}\nContato: ${input.contactName}\nEmail: ${input.email}\nTelefone: ${input.phone || 'N/A'}\nFuncionários: ${input.employees || 'N/A'}\nMensagem: ${input.message || 'N/A'}`
      });

      // Send lead to CRM webhook
      await sendB2BLeadToCRM({
        companyName: input.companyName,
        contactName: input.contactName,
        email: input.email,
        phone: input.phone,
        employees: input.employees,
        message: input.message,
      });

      // Send confirmation email to client via notification (owner receives and forwards)
      await notifyOwner({
        title: `[Enviar ao Cliente] Confirmação de Orçamento - ${protocol}`,
        content: `ENVIAR PARA: ${input.email}\n\nOlá ${input.contactName},\n\nSua solicitação de orçamento foi recebida com sucesso!\n\nProtocolo: ${protocol}\nEmpresa: ${input.companyName}\n\nNossa equipe comercial entrará em contato em até 24 horas úteis.\n\nVocê pode acompanhar o status em: https://nexxustech.one/protocolo\n\nAtenciosamente,\nEquipe NexxusTECH`
      });

      return { success: true, protocol };
    }),
  }),

  // ===== CHATBOT =====
  chat: router({
    send: publicProcedure.input(z.object({
      message: z.string().min(1),
      sessionId: z.string(),
      history: z.array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })).optional(),
    })).mutation(async ({ input }) => {
      const systemPrompt = `Você é o assistente virtual da NexxusTECH, uma plataforma premium de revenda de softwares e cursos digitais. 

Suas responsabilidades:
- Ajudar clientes a encontrar o software ou curso ideal para suas necessidades
- Responder dúvidas sobre produtos, preços e funcionalidades
- Guiar o processo de compra
- Explicar as categorias disponíveis: Infraestrutura e Segurança Digital, Desenvolvimento e DevOps, Design e Produtividade, Análise de Dados e Estatística
- Informar sobre opções B2B para empresas (licenciamento em volume, suporte dedicado)

Seja profissional, amigável e direto. Responda sempre em português brasileiro. Mantenha respostas concisas mas informativas.`;

      const messages = [
        { role: "system" as const, content: systemPrompt },
        ...(input.history || []).slice(-10).map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
        { role: "user" as const, content: input.message },
      ];

      try {
        const response = await invokeLLM({ messages });
        const rawContent = response.choices?.[0]?.message?.content;
        const assistantMessage = typeof rawContent === 'string' ? rawContent : "Desculpe, não consegui processar sua mensagem. Tente novamente.";
        
        // Save to DB
        await db.saveChatMessage(input.sessionId, "user", input.message);
        await db.saveChatMessage(input.sessionId, "assistant", assistantMessage);

        return { message: assistantMessage };
      } catch (error) {
        return { message: "Desculpe, estou com dificuldades técnicas no momento. Por favor, tente novamente em instantes." };
      }
    }),
  }),

  // ===== REVIEWS =====
  reviews: router({
    byProduct: publicProcedure.input(z.object({ productId: z.number() })).query(async ({ input }) => {
      return db.getProductReviews(input.productId);
    }),
    rating: publicProcedure.input(z.object({ productId: z.number() })).query(async ({ input }) => {
      return db.getProductAverageRating(input.productId);
    }),
    canReview: protectedProcedure.input(z.object({ productId: z.number() })).query(async ({ ctx, input }) => {
      const hasReviewed = await db.hasUserReviewed(ctx.user.id, input.productId);
      return { canReview: !hasReviewed };
    }),
    create: protectedProcedure.input(z.object({
      productId: z.number(),
      rating: z.number().min(1).max(5),
      comment: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const hasReviewed = await db.hasUserReviewed(ctx.user.id, input.productId);
      if (hasReviewed) throw new Error("Você já avaliou este produto.");
      await db.createReview({
        userId: ctx.user.id,
        productId: input.productId,
        rating: input.rating,
        comment: input.comment,
        userName: ctx.user.name ?? undefined,
      });
      return { success: true };
    }),
  }),

  // ===== NEWSLETTER =====
  newsletter: router({
    subscribe: publicProcedure.input(z.object({
      email: z.string().email(),
    })).mutation(async ({ input }) => {
      const success = await db.subscribeNewsletter(input.email);
      if (success) {
        // Send newsletter subscriber as lead to CRM
        await sendNewsletterToCRM(input.email);
      }
      if (!success) return { success: true, message: "Você já está inscrito!" };
      return { success: true, message: "Inscrito com sucesso!" };
    }),
  }),

  // ===== ADMIN =====
  admin: router({
    products: router({
      list: adminProcedure.query(async () => {
        return db.getAllProducts();
      }),
      create: adminProcedure.input(z.object({
        name: z.string().min(1),
        slug: z.string().min(1),
        description: z.string().optional(),
        shortDescription: z.string().optional(),
        price: z.string(),
        categoryId: z.number(),
        type: z.enum(["software", "course"]),
        features: z.string().optional(),
        level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
        duration: z.string().optional(),
        imageUrl: z.string().optional(),
      })).mutation(async ({ input }) => {
        await db.createProduct(input as any);
        return { success: true };
      }),
      update: adminProcedure.input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        shortDescription: z.string().optional(),
        price: z.string().optional(),
        categoryId: z.number().optional(),
        type: z.enum(["software", "course"]).optional(),
        features: z.string().optional(),
        level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
        imageUrl: z.string().optional(),
      })).mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateProduct(id, data as any);
        return { success: true };
      }),
      delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
        await db.deleteProduct(input.id);
        return { success: true };
      }),
    }),
    orders: router({
      list: adminProcedure.query(async () => {
        return db.getAllOrders();
      }),
      getItems: adminProcedure.input(z.object({ orderId: z.number() })).query(async ({ input }) => {
        return db.getOrderItems(input.orderId);
      }),
    }),
    leads: router({
      list: adminProcedure.query(async () => {
        return db.getAllLeads();
      }),
    }),
    users: router({
      list: adminProcedure.query(async () => {
        return db.getAllUsers();
      }),
    }),
  }),
});

export type AppRouter = typeof appRouter;

import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import { sendNewsletterToCRM } from "./crm";
import {
  LEAD_ANTI_SPAM,
  evaluateFormSignals,
  evaluateRateLimits,
  extractClientIp,
  hashClientIp,
  normalizeCompanyName,
  normalizeLeadEmail,
} from "./leadAntiSpam";
import { syncB2BLeadWithCRM } from "./leadSync";
import { adminPricingRouter, productResourcesRouter } from "./routers/commercial";
import { adminPdsRouter } from "./routers/pds";
import { adminAdministrationRouter } from "./routers/administration";
import { checkoutRouter } from "./routers/checkout";
import { adminCommerceRouter } from "./routers/commerceAdmin";

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

  productResources: productResourcesRouter,
  checkout: checkoutRouter,

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
    myOrders: protectedProcedure.query(() => {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Use o módulo seguro de pedidos em checkout.myOrders." });
    }),
    getItems: protectedProcedure.input(z.object({ orderId: z.number() })).query(() => {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Use checkout.details para consultar itens com autorização." });
    }),
    create: protectedProcedure.mutation(() => {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Use o checkout seguro com dados fiscais do comprador." });
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
      companyName: z.string().trim().min(1).max(255),
      contactName: z.string().trim().min(1).max(255),
      email: z.string().trim().email().max(320),
      phone: z.string().trim().max(50).optional(),
      employees: z.string().trim().max(50).optional(),
      message: z.string().trim().max(4_000).optional(),
      website: z.string().max(200).optional(),
      formStartedAt: z.number().int().positive(),
    })).mutation(async ({ input, ctx }) => {
      const nowMs = Date.now();
      const formSignals = evaluateFormSignals(input, nowMs);
      if (!formSignals.allowed) {
        console.warn(`[AntiSpam] Formulário B2B bloqueado: ${formSignals.reason}`);
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Não foi possível enviar agora. Aguarde alguns minutos e tente novamente.",
        });
      }

      const companyName = normalizeCompanyName(input.companyName);
      const email = normalizeLeadEmail(input.email);
      const clientIp = extractClientIp(
        ctx.req.headers as Record<string, unknown>,
        ctx.req.ip || ctx.req.socket?.remoteAddress || "unknown",
      );
      const ipHash = hashClientIp(clientIp, process.env.JWT_SECRET || "nexxus-lead-ip-hash");
      const duplicateSince = new Date(nowMs - LEAD_ANTI_SPAM.duplicateWindowMs);
      const duplicate = await db.findRecentDuplicateB2BLead(email, companyName, duplicateSince);
      if (duplicate?.protocol) {
        return { success: true, protocol: duplicate.protocol, duplicate: true };
      }

      const rateSince = new Date(nowMs - LEAD_ANTI_SPAM.rateWindowMs);
      const [recentByEmail, recentByIp] = await Promise.all([
        db.countRecentB2BLeadsByEmail(email, rateSince),
        db.countRecentB2BLeadsByIpHash(ipHash, rateSince),
      ]);
      const rateLimit = evaluateRateLimits({ recentByEmail, recentByIp });
      if (!rateLimit.allowed) {
        console.warn(`[AntiSpam] Formulário B2B limitado: ${rateLimit.reason}`);
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Não foi possível enviar agora. Aguarde alguns minutos e tente novamente.",
        });
      }

      const now = new Date(nowMs);
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
      const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
      const protocol = `NXT-${dateStr}-${randomSuffix}`;
      const leadData = {
        companyName,
        contactName: input.contactName.trim(),
        email,
        phone: input.phone || null,
        employees: input.employees || null,
        message: input.message || null,
        protocol,
        ipHash,
        crmSyncStatus: "pending" as const,
        crmSyncAttempts: 0,
      };
      const leadId = await db.createB2BLead(leadData);

      await notifyOwner({
        title: `Novo Lead B2B: ${companyName} [${protocol}]`,
        content: `Protocolo: ${protocol}\nEmpresa: ${companyName}\nContato: ${leadData.contactName}\nEmail: ${email}\nTelefone: ${leadData.phone || "N/A"}\nFuncionários: ${leadData.employees || "N/A"}\nMensagem: ${leadData.message || "N/A"}`,
      });

      await syncB2BLeadWithCRM({
        id: leadId,
        ...leadData,
        crmLeadId: null,
      });

      await notifyOwner({
        title: `[Enviar ao Cliente] Confirmação de Orçamento - ${protocol}`,
        content: `ENVIAR PARA: ${email}\n\nOlá ${leadData.contactName},\n\nSua solicitação de orçamento foi recebida com sucesso!\n\nProtocolo: ${protocol}\nEmpresa: ${companyName}\n\nNossa equipe comercial entrará em contato em até 24 horas úteis.\n\nVocê pode acompanhar o status em: https://nexxustech.one/protocolo\n\nAtenciosamente,\nEquipe NexxusTECH`,
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
      const systemPrompt = `Você é o assistente virtual da NexxusTECH para o Ampler, a única solução publicada no catálogo.

Fatos que você pode usar:
- Ampler é uma plataforma de produtividade para PowerPoint, Excel, Word e Outlook.
- Para PowerPoint, oferece 150+ ferramentas, biblioteca corporativa, Agenda, Storyboard, Ampler Charts, barra personalizável e Scan & Fix.
- A biblioteca pode integrar conteúdo de SharePoint, OneDrive e Google Drive.
- O instalador oficial é oferecido para Office 2007–2021 e Microsoft 365.
- A contratação no Brasil é consultiva e depende de módulos, usuários e implantação.

Suas responsabilidades:
- Explicar os recursos do Ampler e identificar o contexto do cliente.
- Incentivar a solicitação de demonstração e orçamento pelo formulário corporativo.
- Ser claro quando um dado estiver pendente de validação.

Nunca invente preço em reais, economia percentual, SKU, SLA, case, avaliação ou superioridade sobre Think-cell. Responda sempre em português brasileiro, com tom profissional, amigável e conciso.`;

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
    commerce: adminCommerceRouter,
    administration: adminAdministrationRouter,
    pricing: adminPricingRouter,
    pds: adminPdsRouter,
    products: router({
      list: adminProcedure.query(async () => {
        return db.getAllProductsIncludingInactive();
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
        manufacturer: z.string().optional(),
        officialUrl: z.string().url().optional(),
        licensing: z.string().optional(),
        requirements: z.string().optional(),
        seoTitle: z.string().optional(),
        seoDescription: z.string().optional(),
        seoKeywords: z.string().optional(),
        faqs: z.string().optional(),
        qualityScore: z.number().int().min(0).max(100).optional(),
        sourceDocument: z.string().optional(),
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
        manufacturer: z.string().optional(),
        officialUrl: z.string().url().optional(),
        licensing: z.string().optional(),
        requirements: z.string().optional(),
        seoTitle: z.string().optional(),
        seoDescription: z.string().optional(),
        seoKeywords: z.string().optional(),
        faqs: z.string().optional(),
        qualityScore: z.number().int().min(0).max(100).optional(),
        sourceDocument: z.string().optional(),
        isActive: z.boolean().optional(),
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
      list: adminProcedure.query(() => {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Use admin.commerce.list." });
      }),
      getItems: adminProcedure.input(z.object({ orderId: z.number() })).query(() => {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Use admin.commerce.details." });
      }),
    }),
    leads: router({
      list: adminProcedure.query(async () => {
        return db.getAllLeads();
      }),
      reprocess: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
        const lead = await db.getB2BLeadById(input.id);
        if (!lead) throw new TRPCError({ code: "NOT_FOUND", message: "Lead não encontrado." });
        if (lead.crmSyncStatus === "synced") {
          return { success: true, alreadySynced: true };
        }

        const result = await syncB2BLeadWithCRM(lead);
        return {
          success: result.success,
          error: result.success ? undefined : result.error,
          attempts: result.attempts,
        };
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

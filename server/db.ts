import { eq, and, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, categories, products, orders, orderItems, cartItems, b2bLeads, chatMessages, reviews, newsletterSubscribers } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ===== CATEGORIES =====
export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories);
}

export async function getCategoryBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return result[0];
}

// ===== PRODUCTS =====
export async function getAllProducts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(eq(products.isActive, true));
}

export async function getProductsByCategory(categoryId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(and(eq(products.categoryId, categoryId), eq(products.isActive, true)));
}

export async function getProductBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  return result[0];
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result[0];
}

export async function getProductsByType(type: "software" | "course") {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(and(eq(products.type, type), eq(products.isActive, true)));
}

// ===== CART =====
export async function getCartItems(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const items = await db.select().from(cartItems).where(eq(cartItems.userId, userId));
  const result = [];
  for (const item of items) {
    const product = await getProductById(item.productId);
    if (product) {
      result.push({ ...item, product });
    }
  }
  return result;
}

export async function addToCart(userId: number, productId: number) {
  const db = await getDb();
  if (!db) return;
  // Check if already in cart
  const existing = await db.select().from(cartItems).where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId))).limit(1);
  if (existing.length > 0) {
    await db.update(cartItems).set({ quantity: existing[0].quantity + 1 }).where(eq(cartItems.id, existing[0].id));
  } else {
    await db.insert(cartItems).values({ userId, productId, quantity: 1 });
  }
}

export async function removeFromCart(userId: number, productId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(cartItems).where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId)));
}

export async function clearCart(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(cartItems).where(eq(cartItems.userId, userId));
}

export async function updateCartItemQuantity(userId: number, productId: number, quantity: number) {
  const db = await getDb();
  if (!db) return;
  if (quantity <= 0) {
    await removeFromCart(userId, productId);
  } else {
    await db.update(cartItems).set({ quantity }).where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId)));
  }
}

// ===== ORDERS =====
export async function createOrder(userId: number, totalAmount: string, customerEmail: string | null) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(orders).values({ userId, totalAmount, customerEmail, status: "pending" });
  return result[0].insertId;
}

export async function addOrderItem(orderId: number, productId: number, productName: string, price: string, quantity: number) {
  const db = await getDb();
  if (!db) return;
  await db.insert(orderItems).values({ orderId, productId, productName, price, quantity });
}

export async function updateOrderStatus(orderId: number, status: "pending" | "paid" | "failed" | "refunded", stripeSessionId?: string, stripePaymentIntentId?: string) {
  const db = await getDb();
  if (!db) return;
  const updateData: Record<string, unknown> = { status };
  if (stripeSessionId) updateData.stripeSessionId = stripeSessionId;
  if (stripePaymentIntentId) updateData.stripePaymentIntentId = stripePaymentIntentId;
  await db.update(orders).set(updateData).where(eq(orders.id, orderId));
}

export async function getUserOrders(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
}

export async function getOrderItems(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

export async function getOrderById(orderId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  return result[0];
}

export async function getAllOrders() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).orderBy(desc(orders.createdAt));
}

// ===== B2B LEADS =====
export async function createB2BLead(data: { companyName: string; contactName: string; email: string; phone?: string; employees?: string; message?: string; protocol?: string }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(b2bLeads).values(data);
}

export async function getAllLeads() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(b2bLeads).orderBy(desc(b2bLeads.createdAt));
}

// ===== CHAT =====
export async function saveChatMessage(sessionId: string, role: "user" | "assistant" | "system", content: string, userId?: number) {
  const db = await getDb();
  if (!db) return;
  await db.insert(chatMessages).values({ sessionId, role, content, userId });
}

export async function getChatHistory(sessionId: string, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatMessages).where(eq(chatMessages.sessionId, sessionId)).orderBy(desc(chatMessages.createdAt)).limit(limit);
}

// ===== ADMIN =====
export async function createProduct(data: Omit<typeof products.$inferInsert, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) return;
  await db.insert(products).values(data);
}

export async function updateProduct(id: number, data: Partial<typeof products.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(products).set(data).where(eq(products.id, id));
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(products).set({ isActive: false }).where(eq(products.id, id));
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

// ===== REVIEWS =====
export async function getProductReviews(productId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reviews).where(eq(reviews.productId, productId)).orderBy(desc(reviews.createdAt));
}

export async function createReview(data: { userId: number; productId: number; rating: number; comment?: string; userName?: string }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(reviews).values(data);
}

export async function getProductAverageRating(productId: number) {
  const db = await getDb();
  if (!db) return { average: 0, count: 0 };
  const result = await db.select({
    avg: sql<number>`AVG(rating)`,
    count: sql<number>`COUNT(*)`,
  }).from(reviews).where(eq(reviews.productId, productId));
  return { average: result[0]?.avg || 0, count: result[0]?.count || 0 };
}

export async function hasUserReviewed(userId: number, productId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(reviews).where(and(eq(reviews.userId, userId), eq(reviews.productId, productId))).limit(1);
  return result.length > 0;
}

// ===== NEWSLETTER =====
export async function subscribeNewsletter(email: string) {
  const db = await getDb();
  if (!db) return false;
  try {
    await db.insert(newsletterSubscribers).values({ email });
    return true;
  } catch (err: any) {
    // Duplicate email
    if (err?.code === "ER_DUP_ENTRY") return false;
    throw err;
  }
}

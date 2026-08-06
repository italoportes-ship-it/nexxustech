import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Product categories
 */
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;

/**
 * Software products
 */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  shortDescription: varchar("shortDescription", { length: 500 }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  categoryId: int("categoryId").notNull(),
  type: mysqlEnum("type", ["software", "course"]).notNull().default("software"),
  imageUrl: varchar("imageUrl", { length: 1000 }),
  features: text("features"),
  manufacturer: varchar("manufacturer", { length: 255 }),
  officialUrl: varchar("officialUrl", { length: 1000 }),
  licensing: varchar("licensing", { length: 255 }),
  requirements: text("requirements"),
  seoTitle: varchar("seoTitle", { length: 255 }),
  seoDescription: varchar("seoDescription", { length: 500 }),
  seoKeywords: text("seoKeywords"),
  faqs: text("faqs"),
  qualityScore: int("qualityScore"),
  sourceDocument: varchar("sourceDocument", { length: 255 }),
  lastPdsSyncAt: timestamp("lastPdsSyncAt"),
  level: mysqlEnum("level", ["beginner", "intermediate", "advanced"]),
  duration: varchar("duration", { length: 100 }),
  isActive: boolean("isActive").default(true).notNull(),
  stripePriceId: varchar("stripePriceId", { length: 255 }),
  stripeProductId: varchar("stripeProductId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Public reference prices and confidential commercial pricing workflow.
 */
export const productPrices = mysqlTable("productPrices", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  sourceType: mysqlEnum("sourceType", ["public", "internal"]).notNull(),
  planName: varchar("planName", { length: 255 }).notNull(),
  minSeats: int("minSeats").default(1).notNull(),
  maxSeats: int("maxSeats"),
  billingPeriod: mysqlEnum("billingPeriod", ["monthly", "annual", "custom"]).default("annual").notNull(),
  currency: varchar("currency", { length: 3 }).notNull(),
  sourceAmount: decimal("sourceAmount", { precision: 14, scale: 4 }).notNull(),
  exchangeRate: decimal("exchangeRate", { precision: 14, scale: 6 }),
  taxRate: decimal("taxRate", { precision: 8, scale: 4 }).default("0").notNull(),
  operationalCostRate: decimal("operationalCostRate", { precision: 8, scale: 4 }).default("0").notNull(),
  marginRate: decimal("marginRate", { precision: 8, scale: 4 }).default("0").notNull(),
  calculatedCostBrl: decimal("calculatedCostBrl", { precision: 14, scale: 2 }),
  suggestedPriceBrl: decimal("suggestedPriceBrl", { precision: 14, scale: 2 }),
  approvedPriceBrl: decimal("approvedPriceBrl", { precision: 14, scale: 2 }),
  status: mysqlEnum("status", ["draft", "in_review", "approved", "published"]).default("draft").notNull(),
  isPublic: boolean("isPublic").default(false).notNull(),
  sourceLabel: varchar("sourceLabel", { length: 255 }),
  sourceUrl: varchar("sourceUrl", { length: 1000 }),
  effectiveFrom: timestamp("effectiveFrom"),
  effectiveTo: timestamp("effectiveTo"),
  approvedByUserId: int("approvedByUserId"),
  approvedAt: timestamp("approvedAt"),
  publishedAt: timestamp("publishedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProductPrice = typeof productPrices.$inferSelect;
export type InsertProductPrice = typeof productPrices.$inferInsert;

/**
 * Official customer stories and videos sourced from the manufacturer.
 */
export const productMedia = mysqlTable("productMedia", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  mediaType: mysqlEnum("mediaType", ["case", "video"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  summary: text("summary"),
  customerName: varchar("customerName", { length: 255 }),
  resultText: text("resultText"),
  sourceUrl: varchar("sourceUrl", { length: 1000 }).notNull(),
  embedUrl: varchar("embedUrl", { length: 1000 }),
  imageUrl: varchar("imageUrl", { length: 1000 }),
  isOfficial: boolean("isOfficial").default(true).notNull(),
  isPublished: boolean("isPublished").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProductMedia = typeof productMedia.$inferSelect;

/**
 * Uploaded Product Decision Sheets and their human approval workflow.
 */
export const pdsImports = mysqlTable("pdsImports", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId"),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileType: varchar("fileType", { length: 100 }).notNull(),
  fileKey: varchar("fileKey", { length: 1000 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 1000 }).notNull(),
  fileHash: varchar("fileHash", { length: 64 }).notNull(),
  modelId: varchar("modelId", { length: 100 }),
  status: mysqlEnum("status", ["uploaded", "analyzing", "review", "approved", "rejected", "applied", "failed"]).default("uploaded").notNull(),
  extractedText: text("extractedText"),
  parsedData: text("parsedData"),
  changePreview: text("changePreview"),
  warnings: text("warnings"),
  errorMessage: text("errorMessage"),
  createdByUserId: int("createdByUserId").notNull(),
  reviewedByUserId: int("reviewedByUserId"),
  approvedAt: timestamp("approvedAt"),
  appliedAt: timestamp("appliedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PdsImport = typeof pdsImports.$inferSelect;

/**
 * Immutable product snapshots created whenever an approved PDS is applied.
 */
export const productVersions = mysqlTable("productVersions", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  pdsImportId: int("pdsImportId"),
  versionNumber: int("versionNumber").notNull(),
  snapshot: text("snapshot").notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const pdsAuditLogs = mysqlTable("pdsAuditLogs", {
  id: int("id").autoincrement().primaryKey(),
  pdsImportId: int("pdsImportId").notNull(),
  action: mysqlEnum("action", ["upload", "analyze", "approve", "reject", "apply", "fail"]).notNull(),
  actorUserId: int("actorUserId").notNull(),
  details: text("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Orders
 */
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  status: mysqlEnum("status", ["pending", "paid", "failed", "refunded"]).default("pending").notNull(),
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(),
  stripeSessionId: varchar("stripeSessionId", { length: 255 }),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  customerEmail: varchar("customerEmail", { length: 320 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Order items
 */
export const orderItems = mysqlTable("orderItems", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  productId: int("productId").notNull(),
  productName: varchar("productName", { length: 255 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  quantity: int("quantity").default(1).notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;

/**
 * Cart items (per user)
 */
export const cartItems = mysqlTable("cartItems", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  quantity: int("quantity").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CartItem = typeof cartItems.$inferSelect;

/**
 * B2B leads / contact form submissions
 */
export const b2bLeads = mysqlTable("b2bLeads", {
  id: int("id").autoincrement().primaryKey(),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  contactName: varchar("contactName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  employees: varchar("employees", { length: 50 }),
  message: text("message"),
  status: mysqlEnum("status", ["new", "contacted", "qualified", "closed"]).default("new").notNull(),
  protocol: varchar("protocol", { length: 30 }),
  ipHash: varchar("ipHash", { length: 64 }),
  crmSyncStatus: mysqlEnum("crmSyncStatus", ["pending", "synced", "failed"]).default("pending").notNull(),
  crmSyncAttempts: int("crmSyncAttempts").default(0).notNull(),
  crmLeadId: int("crmLeadId"),
  crmLastError: text("crmLastError"),
  crmSyncedAt: timestamp("crmSyncedAt"),
  crmLastAttemptAt: timestamp("crmLastAttemptAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type B2BLead = typeof b2bLeads.$inferSelect;

/**
 * Chat messages for AI chatbot history
 */
export const chatMessages = mysqlTable("chatMessages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  sessionId: varchar("sessionId", { length: 100 }).notNull(),
  role: mysqlEnum("role", ["user", "assistant", "system"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;

/**
 * Product reviews
 */
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  rating: int("rating").notNull(),
  comment: text("comment"),
  userName: varchar("userName", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

/**
 * Newsletter subscribers
 */
export const newsletterSubscribers = mysqlTable("newsletterSubscribers", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;

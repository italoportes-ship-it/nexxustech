import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createAuthContext(role: "user" | "admin" = "user"): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: { origin: "http://localhost:3000" },
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("categories.list", () => {
  it("expõe somente a categoria que possui o Ampler ativo", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.categories.list();
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ slug: "design-produtividade", name: "Produtividade para Microsoft Office" });
  });
});

describe("products.list", () => {
  it("expõe somente o Ampler no catálogo público", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.products.list();
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ name: "Ampler", slug: "ampler", type: "software", isActive: true });
    expect(result[0].manufacturer).toBe("Ampler");
    expect(result[0].qualityScore).toBe(93);
  });

  it("não expõe URLs de produtos históricos", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const historical = await caller.products.bySlug({ slug: "cloudguard-enterprise" });
    expect(historical).toBeUndefined();
  });
});

describe("products.byType", () => {
  it("retorna somente o Ampler para software", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.products.byType({ type: "software" });
    expect(result).toHaveLength(1);
    expect(result[0]?.slug).toBe("ampler");
  });

  it("não expõe cursos desativados", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.products.byType({ type: "course" });
    expect(result).toEqual([]);
  });
});

describe("admin.products.list", () => {
  it("preserva o histórico de produtos inativos no painel administrativo", async () => {
    const caller = appRouter.createCaller(createAuthContext("admin"));
    const result = await caller.admin.products.list();
    expect(result.some((product) => product.slug === "ampler" && product.isActive)).toBe(true);
    expect(result.some((product) => product.slug !== "ampler" && !product.isActive)).toBe(true);
  });
});

describe("cart (protected)", () => {
  it("throws unauthorized error for unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.cart.list()).rejects.toThrow();
  });

  it("returns cart items for authenticated users", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.cart.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("b2b.submit", () => {
  it("validates required fields", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.b2b.submit({
        companyName: "",
        contactName: "Test",
        email: "test@test.com",
      })
    ).rejects.toThrow();
  });
});

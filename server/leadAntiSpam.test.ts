import { describe, expect, it } from "vitest";
import {
  LEAD_ANTI_SPAM,
  evaluateFormSignals,
  evaluateRateLimits,
  extractClientIp,
  hashClientIp,
  normalizeCompanyName,
  normalizeLeadEmail,
} from "./leadAntiSpam";

describe("Proteção anti-spam do formulário B2B", () => {
  const now = 1_800_000_000_000;

  it("aceita um formulário legítimo preenchido dentro da janela esperada", () => {
    expect(evaluateFormSignals({ website: "", formStartedAt: now - 10_000 }, now)).toEqual({ allowed: true });
  });

  it("bloqueia honeypot preenchido", () => {
    expect(evaluateFormSignals({ website: "spam.example", formStartedAt: now - 10_000 }, now)).toEqual({
      allowed: false,
      reason: "honeypot",
    });
  });

  it("bloqueia envio rápido demais e formulário expirado", () => {
    expect(evaluateFormSignals({ website: "", formStartedAt: now - 500 }, now)).toEqual({
      allowed: false,
      reason: "too_fast",
    });
    expect(evaluateFormSignals({
      website: "",
      formStartedAt: now - LEAD_ANTI_SPAM.maximumFillMs - 1,
    }, now)).toEqual({ allowed: false, reason: "expired" });
  });

  it("aplica os limites por e-mail e IP", () => {
    expect(evaluateRateLimits({ recentByEmail: LEAD_ANTI_SPAM.maxPerEmail, recentByIp: 0 })).toEqual({
      allowed: false,
      reason: "email_rate",
    });
    expect(evaluateRateLimits({ recentByEmail: 0, recentByIp: LEAD_ANTI_SPAM.maxPerIp })).toEqual({
      allowed: false,
      reason: "ip_rate",
    });
    expect(evaluateRateLimits({ recentByEmail: 1, recentByIp: 1 })).toEqual({ allowed: true });
  });

  it("normaliza dados e gera hash estável sem armazenar o IP", () => {
    expect(normalizeLeadEmail("  CONTATO@EXAMPLE.COM ")).toBe("contato@example.com");
    expect(normalizeCompanyName("  Empresa   Teste  ")).toBe("Empresa Teste");
    expect(extractClientIp({ "x-forwarded-for": "203.0.113.5, 10.0.0.1" })).toBe("203.0.113.5");
    expect(hashClientIp("203.0.113.5", "segredo")).toMatch(/^[a-f0-9]{64}$/);
    expect(hashClientIp("203.0.113.5", "segredo")).toBe(hashClientIp("203.0.113.5", "segredo"));
  });
});

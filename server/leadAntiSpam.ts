import { createHash } from "node:crypto";

export const LEAD_ANTI_SPAM = {
  minimumFillMs: 2_500,
  maximumFillMs: 2 * 60 * 60 * 1_000,
  rateWindowMs: 15 * 60 * 1_000,
  duplicateWindowMs: 30 * 60 * 1_000,
  maxPerEmail: 3,
  maxPerIp: 5,
} as const;

export type AntiSpamReason = "honeypot" | "too_fast" | "expired" | "email_rate" | "ip_rate";

export function normalizeLeadEmail(email: string) {
  return email.trim().toLowerCase();
}

export function normalizeCompanyName(companyName: string) {
  return companyName.trim().replace(/\s+/g, " ");
}

export function evaluateFormSignals(
  input: { website?: string; formStartedAt: number },
  now = Date.now(),
): { allowed: true } | { allowed: false; reason: AntiSpamReason } {
  if ((input.website || "").trim()) return { allowed: false, reason: "honeypot" };

  const elapsed = now - input.formStartedAt;
  if (!Number.isFinite(elapsed) || elapsed < LEAD_ANTI_SPAM.minimumFillMs) {
    return { allowed: false, reason: "too_fast" };
  }
  if (elapsed > LEAD_ANTI_SPAM.maximumFillMs) {
    return { allowed: false, reason: "expired" };
  }

  return { allowed: true };
}

export function evaluateRateLimits(input: {
  recentByEmail: number;
  recentByIp: number;
}): { allowed: true } | { allowed: false; reason: AntiSpamReason } {
  if (input.recentByEmail >= LEAD_ANTI_SPAM.maxPerEmail) {
    return { allowed: false, reason: "email_rate" };
  }
  if (input.recentByIp >= LEAD_ANTI_SPAM.maxPerIp) {
    return { allowed: false, reason: "ip_rate" };
  }
  return { allowed: true };
}

export function extractClientIp(headers: Record<string, unknown>, fallback = "unknown") {
  const forwarded = headers["x-forwarded-for"];
  const firstForwarded = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  if (typeof firstForwarded === "string" && firstForwarded.trim()) {
    return firstForwarded.split(",")[0]!.trim();
  }

  const realIp = headers["x-real-ip"];
  if (typeof realIp === "string" && realIp.trim()) return realIp.trim();
  return fallback;
}

export function hashClientIp(ip: string, secret: string) {
  return createHash("sha256").update(`${secret}:${ip}`).digest("hex");
}

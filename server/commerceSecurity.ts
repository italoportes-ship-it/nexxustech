import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from "node:crypto";

function encryptionKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET não configurado para criptografia de dados do checkout.");
  return createHash("sha256").update(`checkout:${secret}`).digest();
}

export function encryptSensitive(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptSensitive(value: string) {
  const [version, ivValue, tagValue, encryptedValue] = value.split(".");
  if (version !== "v1" || !ivValue || !tagValue || !encryptedValue) throw new Error("Formato criptografado inválido.");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encryptedValue, "base64url")), decipher.final()]).toString("utf8");
}

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function allDigitsEqual(value: string) {
  return /^([0-9])\1+$/.test(value);
}

export function isValidCpf(value: string) {
  const cpf = digitsOnly(value);
  if (cpf.length !== 11 || allDigitsEqual(cpf)) return false;
  const calculate = (length: number) => {
    let sum = 0;
    for (let index = 0; index < length; index += 1) sum += Number(cpf[index]) * (length + 1 - index);
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };
  return calculate(9) === Number(cpf[9]) && calculate(10) === Number(cpf[10]);
}

export function isValidCnpj(value: string) {
  const cnpj = digitsOnly(value);
  if (cnpj.length !== 14 || allDigitsEqual(cnpj)) return false;
  const calculate = (length: 12 | 13) => {
    const weights = length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = weights.reduce((total, weight, index) => total + Number(cnpj[index]) * weight, 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  return calculate(12) === Number(cnpj[12]) && calculate(13) === Number(cnpj[13]);
}

export function validateTaxId(value: string, type: "person" | "company") {
  const normalized = digitsOnly(value);
  const valid = type === "person" ? isValidCpf(normalized) : isValidCnpj(normalized);
  if (!valid) throw new Error(type === "person" ? "CPF inválido." : "CNPJ inválido.");
  return normalized;
}

export function taxIdLast4(value: string) {
  return digitsOnly(value).slice(-4);
}

export function generateOrderNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `NXT-${date}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export function generateEntitlementToken() {
  const token = `ent_${randomBytes(24).toString("base64url")}`;
  return { token, hash: sha256(token), last4: token.slice(-4) };
}

export function generateCheckoutIdempotencyKey(userId: number) {
  return sha256(`${userId}:${Date.now()}:${randomUUID()}`);
}

export function maskSecretLast4(last4?: string | null) {
  return last4 ? `••••${last4}` : null;
}

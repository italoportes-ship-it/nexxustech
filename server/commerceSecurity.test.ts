import { beforeAll, describe, expect, it } from "vitest";
import { decryptSensitive, encryptSensitive, generateEntitlementToken, generateOrderNumber, isValidCnpj, isValidCpf, sha256, validateTaxId } from "./commerceSecurity";

beforeAll(() => {
  process.env.JWT_SECRET ||= "checkout-test-secret-with-sufficient-length";
});

describe("commerceSecurity", () => {
  it("criptografa e descriptografa dados sensíveis com payload autenticado", () => {
    const encrypted = encryptSensitive("52998224725");
    expect(encrypted).not.toContain("52998224725");
    expect(decryptSensitive(encrypted)).toBe("52998224725");
  });

  it("valida CPF e CNPJ e rejeita sequências inválidas", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
    expect(isValidCnpj("11.222.333/0001-81")).toBe(true);
    expect(() => validateTaxId("111.111.111-11", "person")).toThrow("CPF inválido");
    expect(() => validateTaxId("11.111.111/1111-11", "company")).toThrow("CNPJ inválido");
  });

  it("gera entitlement não previsível e armazena apenas hash", () => {
    const entitlement = generateEntitlementToken();
    expect(entitlement.token).toMatch(/^ent_/);
    expect(entitlement.hash).toBe(sha256(entitlement.token));
    expect(entitlement.hash).not.toContain(entitlement.token);
    expect(entitlement.last4).toHaveLength(4);
  });

  it("gera número de pedido sem dados pessoais", () => {
    expect(generateOrderNumber()).toMatch(/^NXT-\d{8}-[A-F0-9]{8}$/);
  });
});

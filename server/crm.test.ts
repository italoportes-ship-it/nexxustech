import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import { sendB2BLeadToCRM } from "./crm";

vi.mock("axios", () => ({
  default: {
    post: vi.fn(),
  },
}));

const mockedPost = vi.mocked(axios.post);

describe("Integração Site → Nexxus CRM", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRM_URL = "https://nexxus-crm.onrender.com";
    process.env.CRM_INTAKE_KEY = "chave-segura-de-teste";
    delete process.env.CRM_WEBHOOK_URL;
  });

  it("envia o formulário B2B ao endpoint público com a chave e o protocolo", async () => {
    mockedPost.mockResolvedValue({
      status: 201,
      data: { success: true, data: { id: 123, deduplicated: false } },
    });

    const result = await sendB2BLeadToCRM({
      companyName: "Empresa Teste",
      contactName: "Contato Teste",
      email: "contato@example.com",
      phone: "+55 11 99999-9999",
      employees: "11 - 50",
      message: "Quero uma cotação",
      protocol: "NXT-20260711-TESTE",
    });

    expect(result).toEqual({ success: true, crmLeadId: 123, deduplicated: false });
    expect(mockedPost).toHaveBeenCalledWith(
      "https://nexxus-crm.onrender.com/api/public/leads",
      {
        companyName: "Empresa Teste",
        contactName: "Contato Teste",
        email: "contato@example.com",
        phone: "+55 11 99999-9999",
        employees: "11 - 50",
        message: "Quero uma cotação",
        protocol: "NXT-20260711-TESTE",
        origem: "nexxustech.one/b2b",
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-intake-key": "chave-segura-de-teste",
        },
        timeout: 10000,
      }
    );
  });

  it("não envia requisição quando a chave do CRM não está configurada", async () => {
    delete process.env.CRM_INTAKE_KEY;

    const result = await sendB2BLeadToCRM({
      companyName: "Empresa sem chave",
      contactName: "Contato",
      email: "contato@example.com",
    });

    expect(result).toEqual({
      success: false,
      error: "CRM_INTAKE_KEY não configurada",
    });
    expect(mockedPost).not.toHaveBeenCalled();
  });

  it("retorna erro controlado quando o CRM rejeita a chave", async () => {
    mockedPost.mockRejectedValue({
      response: {
        data: {
          error: { message: "Chave de captura inválida." },
        },
      },
    });

    const result = await sendB2BLeadToCRM({
      companyName: "Empresa",
      contactName: "Contato",
      email: "contato@example.com",
    });

    expect(result).toEqual({
      success: false,
      error: "Chave de captura inválida.",
    });
  });
});

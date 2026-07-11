import axios from "axios";

const DEFAULT_CRM_URL = "https://nexxus-crm.onrender.com";

interface CRMLeadPayload {
  companyName?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  employees?: string;
  message?: string;
  protocol?: string;
  origem?: string;
  title?: string;
  value?: string;
  summary?: string;
  customFields?: Record<string, string>;
}

function getCRMConfig() {
  const baseUrl = (process.env.CRM_URL || DEFAULT_CRM_URL).replace(/\/+$/, "");

  return {
    leadsUrl: process.env.CRM_WEBHOOK_URL || `${baseUrl}/api/public/leads`,
    intakeKey: process.env.CRM_INTAKE_KEY || "",
  };
}

/**
 * Envia um lead do backend do site ao endpoint público do Nexxus CRM.
 * A chave permanece exclusivamente no servidor e nunca é exposta ao navegador.
 */
async function sendToCRM(payload: CRMLeadPayload): Promise<{ success: boolean; error?: string }> {
  const { leadsUrl, intakeKey } = getCRMConfig();

  if (!intakeKey) {
    console.warn("[CRM] CRM_INTAKE_KEY não configurada; integração ignorada");
    return { success: false, error: "CRM_INTAKE_KEY não configurada" };
  }

  try {
    await axios.post(leadsUrl, payload, {
      headers: {
        "Content-Type": "application/json",
        "x-intake-key": intakeKey,
      },
      timeout: 10000,
    });

    console.log(
      "[CRM] Lead enviado com sucesso:",
      payload.protocol || payload.companyName || payload.title || payload.email
    );
    return { success: true };
  } catch (error: any) {
    const errorMsg =
      error?.response?.data?.error?.message ||
      error?.response?.data?.message ||
      error?.message ||
      "Erro desconhecido";
    console.error("[CRM] Falha ao enviar lead:", errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Envia ao CRM um lead originado pelo formulário B2B do site.
 */
export async function sendB2BLeadToCRM(data: {
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  employees?: string;
  message?: string;
  protocol?: string;
}): Promise<{ success: boolean; error?: string }> {
  return sendToCRM({
    ...data,
    origem: "nexxustech.one/b2b",
  });
}

/**
 * Envia um pedido confirmado como negócio ganho no CRM.
 */
export async function sendOrderToCRM(data: {
  orderId: number;
  customerName: string;
  customerEmail: string;
  totalAmount: string;
  items: string[];
}): Promise<{ success: boolean; error?: string }> {
  return sendToCRM({
    title: `Pedido #${data.orderId} - ${data.customerName}`,
    value: data.totalAmount,
    summary: `Itens: ${data.items.join(", ")}`,
    customFields: {
      pedido_id: data.orderId.toString(),
      cliente: data.customerName,
      email: data.customerEmail,
      valor: `R$ ${data.totalAmount}`,
      itens: data.items.join(", "),
      origem: "nexxustech.one/checkout",
    },
  });
}

/**
 * Envia uma inscrição da newsletter como lead de marketing no CRM.
 */
export async function sendNewsletterToCRM(
  email: string
): Promise<{ success: boolean; error?: string }> {
  return sendToCRM({
    email,
    origem: "nexxustech.one/newsletter",
    title: `Newsletter - ${email}`,
    summary: "Inscrito na newsletter do site.",
    customFields: {
      email,
      origem: "nexxustech.one/newsletter",
    },
  });
}

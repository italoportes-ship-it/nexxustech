import axios from "axios";

const CRM_WEBHOOK_URL = process.env.CRM_WEBHOOK_URL || "https://nexxus-crm.onrender.com/api/webhooks/lead";
const CRM_API_KEY = process.env.CRM_API_KEY || "";

interface CRMLeadPayload {
  title: string;
  value: string;
  summary?: string;
  customFields: Record<string, string>;
}

/**
 * Send a lead to the NexxusCRM webhook endpoint.
 * Creates a deal in the "Form Orçamento" stage of the CRM pipeline.
 */
async function sendToCRM(payload: CRMLeadPayload): Promise<{ success: boolean; error?: string }> {
  if (!CRM_API_KEY) {
    console.warn("[CRM] API key not configured, skipping CRM integration");
    return { success: false, error: "API key not configured" };
  }

  try {
    const response = await axios.post(CRM_WEBHOOK_URL, payload, {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CRM_API_KEY,
      },
      timeout: 10000,
    });

    console.log("[CRM] Lead sent successfully:", payload.title);
    return { success: true };
  } catch (error: any) {
    const errorMsg = error?.response?.data?.message || error?.message || "Unknown error";
    console.error("[CRM] Failed to send lead:", errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Send a B2B lead from the contact form to the CRM.
 */
export async function sendB2BLeadToCRM(data: {
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  employees?: string;
  message?: string;
}): Promise<{ success: boolean }> {
  return sendToCRM({
    title: `Orçamento B2B - ${data.companyName} (${data.contactName})`,
    value: "0",
    summary: data.message || "",
    customFields: {
      empresa: data.companyName,
      nome: data.contactName,
      email: data.email,
      telefone: data.phone || "",
      funcionarios: data.employees || "",
      origem: "nexxustech.one/b2b",
    },
  });
}

/**
 * Send an order as a deal to the CRM pipeline.
 */
export async function sendOrderToCRM(data: {
  orderId: number;
  customerName: string;
  customerEmail: string;
  totalAmount: string;
  items: string[];
}): Promise<{ success: boolean }> {
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
 * Send a newsletter subscriber as a lead to the CRM.
 */
export async function sendNewsletterToCRM(email: string): Promise<{ success: boolean }> {
  return sendToCRM({
    title: `Newsletter - ${email}`,
    value: "0",
    summary: "Inscrito na newsletter do site.",
    customFields: {
      email,
      origem: "nexxustech.one/newsletter",
    },
  });
}

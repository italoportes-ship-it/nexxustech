import axios from "axios";

const CRM_BASE_URL = "https://nexxuscrm.one";
const CRM_API_KEY = process.env.CRM_API_KEY || "";

interface CRMLeadData {
  title: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  company?: string;
  value?: number;
  source?: string;
  notes?: string;
}

/**
 * Send a new lead to the NexxusCRM pipeline.
 * Uses the deals.create and contacts.create tRPC endpoints.
 * Falls back gracefully if the CRM is unavailable.
 */
export async function sendLeadToCRM(data: CRMLeadData): Promise<{ success: boolean; error?: string }> {
  if (!CRM_API_KEY) {
    console.warn("[CRM] API key not configured, skipping CRM integration");
    return { success: false, error: "API key not configured" };
  }

  try {
    // Try to create a deal in the CRM pipeline
    const response = await axios.post(
      `${CRM_BASE_URL}/api/trpc/deals.create`,
      {
        json: {
          title: data.title,
          contactName: data.contactName,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone || "",
          company: data.company || "",
          value: data.value || 0,
          source: data.source || "NexxusTECH Website",
          notes: data.notes || "",
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": CRM_API_KEY,
        },
        timeout: 10000,
      }
    );

    if (response.data?.result) {
      console.log("[CRM] Lead sent successfully:", data.title);
      return { success: true };
    }

    // If deals.create requires user auth, try contacts.create as fallback
    if (response.data?.error?.json?.code === -32001) {
      const contactResponse = await axios.post(
        `${CRM_BASE_URL}/api/trpc/contacts.create`,
        {
          json: {
            name: data.contactName,
            email: data.contactEmail,
            phone: data.contactPhone || "",
            company: data.company || "",
            notes: `[Lead via NexxusTECH] ${data.title}\nValor: R$ ${data.value || 0}\n${data.notes || ""}`,
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": CRM_API_KEY,
          },
          timeout: 10000,
        }
      );

      if (contactResponse.data?.result) {
        console.log("[CRM] Contact created successfully:", data.contactName);
        return { success: true };
      }
    }

    console.warn("[CRM] Lead sent but response unclear:", JSON.stringify(response.data).slice(0, 200));
    return { success: true }; // Consider it sent even if response is unclear
  } catch (error: any) {
    const errorMsg = error?.response?.data?.error?.json?.message || error?.message || "Unknown error";
    console.error("[CRM] Failed to send lead:", errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Send order notification to CRM as a deal
 */
export async function sendOrderToCRM(data: {
  orderId: number;
  customerName: string;
  customerEmail: string;
  totalAmount: string;
  items: string[];
}): Promise<{ success: boolean }> {
  return sendLeadToCRM({
    title: `Pedido #${data.orderId} - R$ ${data.totalAmount}`,
    contactName: data.customerName,
    contactEmail: data.customerEmail,
    value: parseFloat(data.totalAmount),
    source: "NexxusTECH - Pedido",
    notes: `Itens: ${data.items.join(", ")}`,
  });
}

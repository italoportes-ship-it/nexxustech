import type { B2BLead } from "../drizzle/schema";
import { notifyOwner } from "./_core/notification";
import { sendB2BLeadToCRM, type CRMDeliveryResult } from "./crm";
import { updateB2BLeadCrmSync } from "./db";

export type SyncableB2BLead = Pick<
  B2BLead,
  | "id"
  | "companyName"
  | "contactName"
  | "email"
  | "phone"
  | "employees"
  | "message"
  | "protocol"
  | "crmSyncAttempts"
  | "crmLeadId"
>;

type SyncUpdate = Parameters<typeof updateB2BLeadCrmSync>[1];

export interface LeadSyncDependencies {
  send: (payload: {
    companyName: string;
    contactName: string;
    email: string;
    phone?: string;
    employees?: string;
    message?: string;
    protocol?: string;
  }) => Promise<CRMDeliveryResult>;
  update: (id: number, data: SyncUpdate) => Promise<void>;
  notify: (input: { title: string; content: string }) => Promise<boolean>;
}

const defaultDependencies: LeadSyncDependencies = {
  send: sendB2BLeadToCRM,
  update: updateB2BLeadCrmSync,
  notify: notifyOwner,
};

export async function syncB2BLeadWithCRM(
  lead: SyncableB2BLead,
  dependencies: LeadSyncDependencies = defaultDependencies,
) {
  const attemptedAt = new Date();
  const attempts = (lead.crmSyncAttempts || 0) + 1;
  const result = await dependencies.send({
    companyName: lead.companyName,
    contactName: lead.contactName,
    email: lead.email,
    phone: lead.phone || undefined,
    employees: lead.employees || undefined,
    message: lead.message || undefined,
    protocol: lead.protocol || undefined,
  });

  if (result.success) {
    await dependencies.update(lead.id, {
      crmSyncStatus: "synced",
      crmSyncAttempts: attempts,
      crmLeadId: result.crmLeadId ?? lead.crmLeadId ?? null,
      crmLastError: null,
      crmSyncedAt: attemptedAt,
      crmLastAttemptAt: attemptedAt,
    });
    return { ...result, attempts };
  }

  const error = result.error || "Falha desconhecida ao enviar lead ao CRM";
  await dependencies.update(lead.id, {
    crmSyncStatus: "failed",
    crmSyncAttempts: attempts,
    crmLastError: error.slice(0, 2_000),
    crmLastAttemptAt: attemptedAt,
  });

  await dependencies.notify({
    title: `Falha ao sincronizar lead com o CRM [${lead.protocol || lead.id}]`,
    content: [
      `Empresa: ${lead.companyName}`,
      `Contato: ${lead.contactName}`,
      `E-mail: ${lead.email}`,
      `Protocolo: ${lead.protocol || "N/A"}`,
      `Tentativa: ${attempts}`,
      `Erro: ${error}`,
      "Ação: acesse Painel Administrativo → Leads B2B e clique em Reprocessar.",
      "https://nexxustech.one/admin?tab=leads",
    ].join("\n"),
  });

  return { success: false as const, error, attempts };
}

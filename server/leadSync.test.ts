import { describe, expect, it, vi } from "vitest";
import { syncB2BLeadWithCRM, type LeadSyncDependencies, type SyncableB2BLead } from "./leadSync";

const baseLead: SyncableB2BLead = {
  id: 42,
  companyName: "Empresa Teste",
  contactName: "Contato Teste",
  email: "contato@example.com",
  phone: null,
  employees: "11-50",
  message: "Preciso de uma cotação",
  protocol: "NXT-TEST-RETRY",
  crmSyncAttempts: 0,
  crmLeadId: null,
};

describe("Sincronização e reprocessamento de leads", () => {
  it("persiste a falha e alerta o proprietário", async () => {
    const dependencies: LeadSyncDependencies = {
      send: vi.fn().mockResolvedValue({ success: false, error: "CRM indisponível" }),
      update: vi.fn().mockResolvedValue(undefined),
      notify: vi.fn().mockResolvedValue(true),
    };

    const result = await syncB2BLeadWithCRM(baseLead, dependencies);

    expect(result).toMatchObject({ success: false, error: "CRM indisponível", attempts: 1 });
    expect(dependencies.update).toHaveBeenCalledWith(42, expect.objectContaining({
      crmSyncStatus: "failed",
      crmSyncAttempts: 1,
      crmLastError: "CRM indisponível",
      crmLastAttemptAt: expect.any(Date),
    }));
    expect(dependencies.notify).toHaveBeenCalledWith(expect.objectContaining({
      title: expect.stringContaining("NXT-TEST-RETRY"),
      content: expect.stringContaining("Reprocessar"),
    }));
  });

  it("marca como sincronizado após reprocessamento e preserva idempotência por protocolo", async () => {
    const dependencies: LeadSyncDependencies = {
      send: vi.fn().mockResolvedValue({ success: true, crmLeadId: 77, deduplicated: true }),
      update: vi.fn().mockResolvedValue(undefined),
      notify: vi.fn().mockResolvedValue(true),
    };

    const result = await syncB2BLeadWithCRM({ ...baseLead, crmSyncAttempts: 1 }, dependencies);

    expect(result).toMatchObject({ success: true, crmLeadId: 77, deduplicated: true, attempts: 2 });
    expect(dependencies.send).toHaveBeenCalledWith(expect.objectContaining({
      protocol: "NXT-TEST-RETRY",
    }));
    expect(dependencies.update).toHaveBeenCalledWith(42, expect.objectContaining({
      crmSyncStatus: "synced",
      crmSyncAttempts: 2,
      crmLeadId: 77,
      crmLastError: null,
      crmSyncedAt: expect.any(Date),
    }));
    expect(dependencies.notify).not.toHaveBeenCalled();
  });
});

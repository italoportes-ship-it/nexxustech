import { trpc } from "@/lib/trpc";
import { AlertTriangle, CheckCircle2, Clock3, FileCheck2, FileText, Loader2, UploadCloud, XCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type PdsManagerProps = { productId: number };

type PreviewChange = {
  field: string;
  label: string;
  currentValue: unknown;
  proposedValue: unknown;
  kind: "added" | "changed" | "removed";
  willApply: boolean;
};

type Preview = {
  changes: PreviewChange[];
  unchangedFields: string[];
  pendingValidation: string[];
  warnings: string[];
  confidenceScore: number;
  targetSlug: string;
};

function decodeJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

function statusConfig(status: string) {
  const map: Record<string, { label: string; classes: string }> = {
    uploaded: { label: "Enviado", classes: "bg-blue-500/10 text-blue-300" },
    analyzing: { label: "Analisando", classes: "bg-purple-500/10 text-purple-300" },
    review: { label: "Aguardando aprovação", classes: "bg-amber-500/10 text-amber-300" },
    approved: { label: "Aprovado", classes: "bg-cyan-500/10 text-cyan-300" },
    applied: { label: "Aplicado", classes: "bg-green-500/10 text-green-300" },
    rejected: { label: "Rejeitado", classes: "bg-red-500/10 text-red-300" },
    failed: { label: "Falhou", classes: "bg-red-500/10 text-red-300" },
  };
  return map[status] || { label: status, classes: "bg-white/5 text-muted-foreground" };
}

async function fileToBase64(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  const chunkSize = 32_768;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(offset, offset + chunkSize)));
  }
  return btoa(binary);
}

export default function PdsManager({ productId }: PdsManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();
  const importsQuery = trpc.admin.pds.list.useQuery();
  const versionsQuery = trpc.admin.pds.versions.useQuery({ productId });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const detailQuery = trpc.admin.pds.detail.useQuery({ id: selectedId || 1 }, { enabled: Boolean(selectedId) });
  const upload = trpc.admin.pds.uploadAndAnalyze.useMutation();
  const approve = trpc.admin.pds.approveAndApply.useMutation();
  const reject = trpc.admin.pds.reject.useMutation();
  const retryAnalyze = trpc.admin.pds.retryAnalyze.useMutation();
  const restoreVersion = trpc.admin.pds.restoreVersion.useMutation();

  const imports = importsQuery.data || [];
  const selected = detailQuery.data?.item;
  const preview = useMemo(() => decodeJson<Preview | null>(selected?.changePreview, null), [selected?.changePreview]);
  const warnings = useMemo(() => decodeJson<string[]>(selected?.warnings, []), [selected?.warnings]);

  useEffect(() => {
    setSelectedFields(preview?.changes.filter((change) => change.willApply).map((change) => change.field) || []);
  }, [preview]);

  const refresh = async () => {
    await Promise.all([utils.admin.pds.list.invalidate(), utils.admin.pds.versions.invalidate({ productId })]);
    if (selectedId) await utils.admin.pds.detail.invalidate({ id: selectedId });
  };

  const handleFile = async (file?: File) => {
    if (!file) return;
    try {
      const base64 = await fileToBase64(file);
      upload.mutate({ fileName: file.name, mimeType: file.type || "application/octet-stream", base64 }, {
        onSuccess: async (result) => {
          toast.success(result.analysisMode === "ai" ? "PDS analisado por IA. Revise a prévia." : "PDS analisado pelo parser estruturado. Revise e aprove ou tente enriquecer por IA depois.");
          setSelectedId(result.id);
          if (fileInputRef.current) fileInputRef.current.value = "";
          await refresh();
        },
        onError: async (error) => {
          toast.error(error.message);
          await utils.admin.pds.list.invalidate();
        },
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao ler o arquivo.");
    }
  };

  const handleApprove = () => {
    if (!selectedId || selectedFields.length === 0) { toast.error("Selecione ao menos um campo para aplicar."); return; }
    if (!window.confirm(`Aplicar ${selectedFields.length} campo(s) selecionado(s)? Um snapshot será salvo antes da alteração.`)) return;
    approve.mutate({ id: selectedId, confirmation: "APROVAR E APLICAR", fields: selectedFields }, {
      onSuccess: async (result) => {
        toast.success(`PDS aplicado. Versão ${result.versionNumber} registrada.`);
        await refresh();
      },
      onError: (error) => toast.error(error.message),
    });
  };

  const handleRetry = () => {
    if (!selectedId) return;
    retryAnalyze.mutate({ id: selectedId }, {
      onSuccess: async (result) => { toast.success(result.analysisMode === "ai" ? "Reanálise por IA concluída." : "A IA segue indisponível; a prévia estruturada foi preservada."); await refresh(); },
      onError: (error) => toast.error(error.message),
    });
  };

  const handleRestore = (versionId: number, versionNumber: number) => {
    if (!window.confirm(`Restaurar a versão ${versionNumber}? O estado atual será salvo como nova versão antes da restauração.`)) return;
    restoreVersion.mutate({ versionId, confirmation: "RESTAURAR VERSÃO" }, {
      onSuccess: async (result) => {
        toast.success(`Versão ${result.restoredFrom} restaurada. Backup atual salvo como v${result.backupVersion}.`);
        await refresh();
        await utils.admin.products.list.invalidate();
      },
      onError: (error) => toast.error(error.message),
    });
  };

  const handleReject = () => {
    if (!selectedId) return;
    const reason = window.prompt("Motivo da rejeição:");
    if (!reason || reason.trim().length < 3) return;
    reject.mutate({ id: selectedId, reason }, {
      onSuccess: async () => { toast.success("PDS rejeitado sem alterar o produto."); await refresh(); },
      onError: (error) => toast.error(error.message),
    });
  };

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-[#58a9ff]/20 bg-gradient-to-br from-[#0b2034]/70 to-[#141019]/70 p-6 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3"><UploadCloud className="h-6 w-6 text-[#58a9ff]" /><h2 className="text-xl font-semibold text-white">Importar Product Decision Sheet</h2></div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              DOCX ou TXT, até 5 MB. O arquivo é armazenado, extraído sem execução e analisado pelo gpt-5-mini com schema estrito. Nenhuma alteração é aplicada sem aprovação humana.
            </p>
          </div>
          <label className="apple-btn apple-btn-primary cursor-pointer justify-center px-6 py-3">
            {upload.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analisando...</> : <><UploadCloud className="mr-2 h-4 w-4" /> Selecionar PDS</>}
            <input ref={fileInputRef} type="file" accept=".docx,.txt,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" disabled={upload.isPending} onChange={(event) => handleFile(event.target.files?.[0])} />
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-[#54d6c7]/20 bg-[#54d6c7]/[0.045] p-4 text-sm leading-relaxed text-foreground/75">
        <strong className="text-[#54d6c7]">Modo operacional atual:</strong> o parser estruturado gera a prévia imediatamente e mantém a aprovação humana obrigatória. O <strong>gpt-5-mini é opcional</strong>; use <strong>Enriquecer prévia com IA</strong> quando quiser uma segunda leitura e o serviço estiver disponível. A indisponibilidade da IA nunca aplica nem bloqueia alterações.
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-3">
          <div className="flex items-center justify-between"><h3 className="font-semibold text-white">Histórico de imports</h3><span className="text-xs text-muted-foreground">{imports.length} registro(s)</span></div>
          {importsQuery.isLoading && <Loader2 className="mx-auto h-5 w-5 animate-spin text-[#58a9ff]" />}
          {imports.map((item) => {
            const status = statusConfig(item.status);
            return (
              <button key={item.id} onClick={() => setSelectedId(item.id)} className={`w-full rounded-2xl border p-4 text-left transition-colors ${selectedId === item.id ? "border-[#58a9ff]/40 bg-[#58a9ff]/5" : "border-border bg-white/[0.02] hover:border-white/15"}`}>
                <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-medium text-white">{item.fileName}</p><p className="mt-1 text-[11px] text-muted-foreground">#{item.id} · {new Date(item.createdAt).toLocaleString("pt-BR")}</p></div><span className={`flex-shrink-0 rounded-full px-2 py-1 text-[10px] ${status.classes}`}>{status.label}</span></div>
              </button>
            );
          })}
        </div>

        <div className="min-h-[280px] rounded-3xl border border-border bg-white/[0.02] p-5 md:p-6">
          {!selectedId && <div className="flex h-full min-h-[240px] flex-col items-center justify-center text-center"><FileText className="h-9 w-9 text-muted-foreground/40" /><p className="mt-4 text-sm text-muted-foreground">Selecione um import para revisar a prévia.</p></div>}
          {selectedId && detailQuery.isLoading && <div className="flex min-h-[240px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#58a9ff]" /></div>}
          {selected && (
            <div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div><p className="text-lg font-semibold text-white">{selected.fileName}</p><p className="mt-1 text-xs text-muted-foreground">Modelo: {selected.modelId || "—"} · Hash: {selected.fileHash.slice(0, 12)}…</p></div>
                <span className={`self-start rounded-full px-3 py-1 text-xs ${statusConfig(selected.status).classes}`}>{statusConfig(selected.status).label}</span>
              </div>

              {preview && (
                <>
                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-white/[0.03] p-4"><p className="text-xl font-semibold text-white">{preview.changes.length}</p><p className="text-xs text-muted-foreground">alterações detectadas</p></div>
                    <div className="rounded-2xl bg-white/[0.03] p-4"><p className="text-xl font-semibold text-white">{preview.confidenceScore.toFixed(0)}%</p><p className="text-xs text-muted-foreground">confiança da extração</p></div>
                    <div className="rounded-2xl bg-white/[0.03] p-4"><p className="truncate text-sm font-semibold text-white">/{preview.targetSlug}</p><p className="text-xs text-muted-foreground">slug preservado/alvo</p></div>
                  </div>

                  <div className="mt-6 space-y-3">
                    {preview.changes.map((change) => (
                      <div key={change.field} className={`rounded-2xl border p-4 ${change.willApply ? "border-white/8 bg-white/[0.025]" : "border-amber-400/15 bg-amber-400/[0.035]"}`}>
                        <div className="flex items-center justify-between gap-3"><label className="flex items-center gap-3 text-sm font-medium text-white"><input type="checkbox" disabled={!change.willApply} checked={change.willApply && selectedFields.includes(change.field)} onChange={(event) => setSelectedFields((current) => event.target.checked ? Array.from(new Set([...current, change.field])) : current.filter((field) => field !== change.field))} className="h-4 w-4 accent-[#58a9ff]" />{change.label}</label><span className={`rounded-full px-2 py-0.5 text-[10px] ${change.kind === "added" ? "bg-green-500/10 text-green-300" : change.kind === "removed" ? "bg-amber-500/10 text-amber-300" : "bg-blue-500/10 text-blue-300"}`}>{change.kind === "added" ? "NOVO" : change.kind === "removed" ? "NÃO SERÁ REMOVIDO" : "ALTERADO"}</span></div>
                        <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2"><div><p className="mb-1 text-muted-foreground">Atual</p><p className="break-words text-foreground/65">{String(change.currentValue ?? "—")}</p></div><div><p className="mb-1 text-muted-foreground">Proposto</p><p className="break-words text-foreground/85">{String(change.proposedValue ?? "—")}</p></div></div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {(warnings.length > 0 || selected.errorMessage) && (
                <div className="mt-6 rounded-2xl border border-amber-400/15 bg-amber-400/[0.04] p-4">
                  <div className="flex gap-3"><AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" /><div className="space-y-1 text-xs leading-relaxed text-amber-100/75">{warnings.map((warning) => <p key={warning}>{warning}</p>)}{selected.errorMessage && <p>{selected.errorMessage}</p>}</div></div>
                </div>
              )}

              {((selected.status === "failed" && selected.extractedText) || (selected.status === "review" && selected.modelId === "structured-fallback")) && (
                <div className="mt-6 flex justify-end">
                  <button onClick={handleRetry} disabled={retryAnalyze.isPending} className="apple-btn apple-btn-primary justify-center px-5 py-2.5 text-sm">
                    {retryAnalyze.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Reanalisando...</> : <>{selected.modelId === "structured-fallback" ? "Enriquecer prévia com IA" : "Tentar análise novamente"}</>}
                  </button>
                </div>
              )}

              {selected.status === "review" && (
                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button onClick={handleReject} disabled={reject.isPending} className="inline-flex items-center justify-center gap-2 rounded-full border border-red-400/20 px-5 py-2.5 text-sm text-red-300"><XCircle className="h-4 w-4" /> Rejeitar</button>
                  <button onClick={handleApprove} disabled={approve.isPending} className="apple-btn apple-btn-primary justify-center px-5 py-2.5 text-sm"><FileCheck2 className="mr-2 h-4 w-4" /> Aprovar e aplicar</button>
                </div>
              )}

              <div className="mt-6 border-t border-border pt-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Auditoria</p>
                <div className="space-y-2">{detailQuery.data?.logs.map((log) => <div key={log.id} className="flex items-center gap-3 text-xs text-muted-foreground"><Clock3 className="h-3.5 w-3.5" /><span>{new Date(log.createdAt).toLocaleString("pt-BR")}</span><span className="font-medium text-foreground/70">{log.action}</span></div>)}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border p-5">
        <div className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-[#54d6c7]" /><h3 className="font-semibold text-white">Histórico de versões do produto</h3></div>
        <div className="mt-4 flex flex-wrap gap-2">{(versionsQuery.data || []).map((version) => <button key={version.id} onClick={() => handleRestore(version.id, version.versionNumber)} disabled={restoreVersion.isPending} className="rounded-full bg-white/[0.04] px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-white">Restaurar v{version.versionNumber} · {new Date(version.createdAt).toLocaleDateString("pt-BR")}</button>)}{versionsQuery.data?.length === 0 && <p className="text-sm text-muted-foreground">A primeira aprovação criará o snapshot inicial e a nova versão.</p>}</div>
      </div>
    </div>
  );
}

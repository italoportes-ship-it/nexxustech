import { trpc } from "@/lib/trpc";
import { Ban, CheckCircle2, CreditCard, FileText, KeyRound, Loader2, Mail, RefreshCw, RotateCcw, Search, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const statuses = ["all", "pending", "paid", "failed", "cancelled", "refunded", "chargeback"] as const;

function label(status: string) {
  return ({ pending: "Pendente", paid: "Pago", failed: "Falhou", cancelled: "Cancelado", refunded: "Estornado", chargeback: "Contestado" } as Record<string, string>)[status] || status;
}

export default function CommerceManager() {
  const utils = trpc.useUtils();
  const [status, setStatus] = useState<(typeof statuses)[number]>("all");
  const [selected, setSelected] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [licenseForm, setLicenseForm] = useState({ licenseId: 0, licenseKey: "", downloadUrl: "", instructions: "" });
  const listQuery = trpc.admin.commerce.list.useQuery(status === "all" ? undefined : { status });
  const detailsQuery = trpc.admin.commerce.details.useQuery({ orderId: selected || 1 }, { enabled: Boolean(selected) });
  const notesMutation = trpc.admin.commerce.notes.useMutation();
  const fulfill = trpc.admin.commerce.fulfillLicense.useMutation();
  const resend = trpc.admin.commerce.resendConfirmation.useMutation();
  const requestInvoice = trpc.admin.commerce.requestInvoice.useMutation();
  const cancel = trpc.admin.commerce.cancel.useMutation();
  const refund = trpc.admin.commerce.refund.useMutation();

  const refresh = async () => {
    await utils.admin.commerce.list.invalidate();
    if (selected) await utils.admin.commerce.details.invalidate({ orderId: selected });
  };
  const action = (mutation: any, variables: any, success: string) => mutation.mutate(variables, { onSuccess: async () => { toast.success(success); await refresh(); }, onError: (error: Error) => toast.error(error.message) });

  const selectOrder = (orderId: number, internalNotes?: string | null) => {
    setSelected(orderId);
    setNotes(internalNotes || "");
    setLicenseForm({ licenseId: 0, licenseKey: "", downloadUrl: "", instructions: "" });
  };

  return (
    <div className="grid gap-7 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <section>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-semibold text-white">Pedidos e pagamentos</h2><p className="mt-1 text-sm text-muted-foreground">Status confirmado pelo backend e webhooks assinados.</p></div><label className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><select value={status} onChange={(event) => setStatus(event.target.value as any)} className="rounded-xl border border-border bg-accent py-2.5 pl-9 pr-8 text-sm text-white">{statuses.map((value) => <option key={value} value={value}>{value === "all" ? "Todos os status" : label(value)}</option>)}</select></label></div>
        <div className="mt-5 space-y-3">{listQuery.isLoading && <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#58a9ff]" />}{(listQuery.data || []).map((entry) => <button key={entry.order.id} onClick={() => selectOrder(entry.order.id, entry.order.internalNotes)} className={`w-full rounded-2xl border p-4 text-left ${selected === entry.order.id ? "border-[#58a9ff]/40 bg-[#58a9ff]/5" : "border-border bg-white/[0.02] hover:border-white/15"}`}><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-white">{entry.order.orderNumber || `Pedido #${entry.order.id}`}</p><p className="mt-1 text-xs text-muted-foreground">{entry.order.customerEmail || "Sem e-mail"} · {new Date(entry.order.createdAt).toLocaleString("pt-BR")}</p></div><span className="rounded-full bg-white/5 px-2 py-1 text-[10px] text-muted-foreground">{label(entry.order.status)}</span></div><div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground"><span>R$ {Number(entry.order.totalAmount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span><span>Pagamento: {entry.payment?.status || "—"}</span><span>Fiscal: {entry.invoice?.status || "—"}</span><span>Licença: {entry.licenses[0]?.status || "—"}</span></div></button>)}{listQuery.data?.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">Nenhum pedido neste filtro.</p>}</div>
      </section>

      <section className="min-h-[460px] rounded-3xl border border-border bg-white/[0.02] p-5 md:p-7">
        {!selected && <div className="flex min-h-[420px] flex-col items-center justify-center text-center"><CreditCard className="h-10 w-10 text-muted-foreground/40" /><p className="mt-4 text-sm text-muted-foreground">Selecione um pedido para administrar.</p></div>}
        {selected && detailsQuery.isLoading && <div className="flex min-h-[420px] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-[#58a9ff]" /></div>}
        {detailsQuery.data && <div className="space-y-7"><header><p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{detailsQuery.data.order.orderNumber || `Pedido #${detailsQuery.data.order.id}`}</p><div className="mt-2 flex flex-wrap items-center justify-between gap-3"><h3 className="text-2xl font-semibold text-white">{label(detailsQuery.data.order.status)}</h3><p className="text-xl font-semibold text-white">R$ {Number(detailsQuery.data.order.totalAmount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p></div></header>
          <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-white/[0.03] p-4"><CreditCard className="h-4 w-4 text-[#58a9ff]" /><p className="mt-3 text-xs text-muted-foreground">Pagamento</p><p className="mt-1 text-sm font-medium text-white">{detailsQuery.data.payment?.status || "—"}</p></div><div className="rounded-2xl bg-white/[0.03] p-4"><FileText className="h-4 w-4 text-[#ec70b9]" /><p className="mt-3 text-xs text-muted-foreground">Fiscal</p><p className="mt-1 text-sm font-medium text-white">{detailsQuery.data.invoice?.status || "—"}</p></div><div className="rounded-2xl bg-white/[0.03] p-4"><KeyRound className="h-4 w-4 text-[#54d6c7]" /><p className="mt-3 text-xs text-muted-foreground">Licenças</p><p className="mt-1 text-sm font-medium text-white">{detailsQuery.data.licenses.length}</p></div></div>

          <div><h4 className="text-sm font-semibold text-white">Itens</h4><div className="mt-3 space-y-2">{detailsQuery.data.items.map((item) => <div key={item.id} className="flex justify-between text-sm"><span className="text-muted-foreground">{item.productName} · {item.quantity} licença(s)</span><span className="text-white">R$ {Number(item.totalPrice || Number(item.unitPrice) * item.quantity).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>)}</div></div>

          <div><h4 className="text-sm font-semibold text-white">Observações internas</h4><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} className="mt-3 w-full rounded-xl border border-border bg-accent p-3 text-sm text-white" /><button onClick={() => action(notesMutation, { orderId: selected, internalNotes: notes || null }, "Observações salvas.")} className="mt-3 rounded-full border border-border px-4 py-2 text-xs text-foreground/80">Salvar observação</button></div>

          {detailsQuery.data.licenses.map((license) => <div key={license.id} className="rounded-2xl border border-white/7 p-4"><div className="flex items-center justify-between"><p className="text-sm font-medium text-white">Licença #{license.id}</p><span className="text-xs text-muted-foreground">{license.status}</span></div>{license.status === "awaiting_vendor" && <div className="mt-4 grid gap-3"><input placeholder="Chave oficial do fornecedor" value={licenseForm.licenseId === license.id ? licenseForm.licenseKey : ""} onFocus={() => setLicenseForm((current) => ({ ...current, licenseId: license.id }))} onChange={(event) => setLicenseForm((current) => ({ ...current, licenseId: license.id, licenseKey: event.target.value }))} className="rounded-xl border border-border bg-accent px-3 py-2 text-sm text-white" /><input placeholder="URL oficial de download" value={licenseForm.licenseId === license.id ? licenseForm.downloadUrl : ""} onChange={(event) => setLicenseForm((current) => ({ ...current, licenseId: license.id, downloadUrl: event.target.value }))} className="rounded-xl border border-border bg-accent px-3 py-2 text-sm text-white" /><textarea placeholder="Instruções de instalação" value={licenseForm.licenseId === license.id ? licenseForm.instructions : ""} onChange={(event) => setLicenseForm((current) => ({ ...current, licenseId: license.id, instructions: event.target.value }))} rows={3} className="rounded-xl border border-border bg-accent p-3 text-sm text-white" /><button onClick={() => action(fulfill, { licenseId: license.id, licenseKey: licenseForm.licenseKey || null, downloadUrl: licenseForm.downloadUrl || null, installationInstructions: licenseForm.instructions || null }, "Licença oficial liberada.")} className="rounded-full bg-[#54d6c7]/15 px-4 py-2 text-xs font-medium text-[#54d6c7]">Liberar licença oficial</button></div>}</div>)}

          <div className="flex flex-wrap gap-2"><button onClick={() => action(resend, { orderId: selected, type: "payment_confirmed" }, "Confirmação processada.")} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs text-foreground/80"><Mail className="h-3.5 w-3.5" />Reenviar confirmação</button><button onClick={() => action(requestInvoice, { orderId: selected }, "Solicitação fiscal processada.")} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs text-foreground/80"><FileText className="h-3.5 w-3.5" />Solicitar nota</button>{detailsQuery.data.order.status === "pending" && <button onClick={() => window.confirm("Cancelar este pedido pendente?") && action(cancel, { orderId: selected, confirmation: "CANCELAR PEDIDO" }, "Pedido cancelado.")} className="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-4 py-2 text-xs text-red-300"><Ban className="h-3.5 w-3.5" />Cancelar</button>}{detailsQuery.data.order.status === "paid" && <button onClick={() => window.confirm("Solicitar estorno integral no Stripe? A atualização final virá pelo webhook.") && action(refund, { orderId: selected, confirmation: "ESTORNAR PEDIDO" }, "Estorno solicitado ao Stripe.")} className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-2 text-xs text-amber-300"><RotateCcw className="h-3.5 w-3.5" />Estornar</button>}</div>
        </div>}
      </section>
    </div>
  );
}

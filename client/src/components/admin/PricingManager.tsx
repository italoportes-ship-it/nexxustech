import { trpc } from "@/lib/trpc";
import { Calculator, CheckCircle2, ExternalLink, Eye, EyeOff, FileVideo2, Loader2, Pencil, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type PricingManagerProps = { productId: number };

type EditablePrice = {
  id?: number;
  productId: number;
  sourceType: "public" | "internal";
  planName: string;
  minSeats: string;
  maxSeats: string;
  billingPeriod: "monthly" | "annual" | "custom";
  currency: string;
  sourceAmount: string;
  exchangeRate: string;
  taxRate: string;
  operationalCostRate: string;
  marginRate: string;
  sourceLabel: string;
  sourceUrl: string;
  notes: string;
};

function statusLabel(status: string) {
  return ({ draft: "Rascunho", in_review: "Em revisão", approved: "Homologado", published: "Publicado" } as Record<string, string>)[status] || status;
}

function toEditable(price: any): EditablePrice {
  return {
    id: price.id,
    productId: price.productId,
    sourceType: price.sourceType,
    planName: price.planName,
    minSeats: String(price.minSeats || 1),
    maxSeats: price.maxSeats ? String(price.maxSeats) : "",
    billingPeriod: price.billingPeriod,
    currency: price.currency,
    sourceAmount: String(price.sourceAmount),
    exchangeRate: price.exchangeRate ? String(price.exchangeRate) : "",
    taxRate: String(price.taxRate || 0),
    operationalCostRate: String(price.operationalCostRate || 0),
    marginRate: String(price.marginRate || 0),
    sourceLabel: price.sourceLabel || "",
    sourceUrl: price.sourceUrl || "",
    notes: price.notes || "",
  };
}

export default function PricingManager({ productId }: PricingManagerProps) {
  const utils = trpc.useUtils();
  const pricesQuery = trpc.admin.pricing.list.useQuery({ productId });
  const mediaQuery = trpc.admin.pricing.media.useQuery({ productId });
  const saveDraft = trpc.admin.pricing.saveDraft.useMutation();
  const submitReview = trpc.admin.pricing.submitReview.useMutation();
  const approve = trpc.admin.pricing.approve.useMutation();
  const publish = trpc.admin.pricing.publish.useMutation();
  const unpublish = trpc.admin.pricing.unpublish.useMutation();
  const [editing, setEditing] = useState<EditablePrice | null>(null);
  const [approvalValues, setApprovalValues] = useState<Record<number, string>>({});

  const prices = pricesQuery.data || [];
  const media = mediaQuery.data || [];
  const summary = useMemo(() => ({
    publicReferences: prices.filter((price) => price.sourceType === "public").length,
    internalRows: prices.filter((price) => price.sourceType === "internal").length,
    published: prices.filter((price) => price.status === "published" && price.isPublic).length,
  }), [prices]);

  const refresh = async () => {
    await Promise.all([
      utils.admin.pricing.list.invalidate({ productId }),
      utils.productResources.publishedPrices.invalidate({ productId }),
    ]);
  };

  const handleSave = () => {
    if (!editing) return;
    saveDraft.mutate({
      id: editing.id,
      productId: editing.productId,
      sourceType: editing.sourceType,
      planName: editing.planName,
      minSeats: Number(editing.minSeats),
      maxSeats: editing.maxSeats ? Number(editing.maxSeats) : null,
      billingPeriod: editing.billingPeriod,
      currency: editing.currency,
      sourceAmount: Number(editing.sourceAmount),
      exchangeRate: editing.exchangeRate ? Number(editing.exchangeRate) : null,
      taxRate: Number(editing.taxRate),
      operationalCostRate: Number(editing.operationalCostRate),
      marginRate: Number(editing.marginRate),
      sourceLabel: editing.sourceLabel || null,
      sourceUrl: editing.sourceUrl || null,
      notes: editing.notes || null,
    }, {
      onSuccess: async (result) => {
        toast.success(result.calculation ? "Cálculo atualizado e salvo como rascunho." : "Referência salva; informe o câmbio para calcular.");
        setEditing(null);
        await refresh();
      },
      onError: (error) => toast.error(error.message),
    });
  };

  const runAction = (mutation: any, variables: any, successMessage: string) => {
    mutation.mutate(variables, {
      onSuccess: async () => { toast.success(successMessage); await refresh(); },
      onError: (error: Error) => toast.error(error.message),
    });
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Referências públicas", value: summary.publicReferences, icon: ExternalLink },
          { label: "Faixas internas", value: summary.internalRows, icon: ShieldCheck },
          { label: "Preços publicados", value: summary.published, icon: Eye },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bento-card !p-5">
            <Icon className="h-5 w-5 text-[#58a9ff]" />
            <p className="mt-4 text-2xl font-semibold text-white">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-amber-400/15 bg-amber-400/[0.04] p-4 text-sm leading-relaxed text-amber-100/75">
        Custos, câmbio, impostos e margens são restritos a administradores. A página pública recebe apenas o preço final homologado quando o estado for <strong>Publicado</strong>.
      </div>

      <div className="space-y-3">
        {pricesQuery.isLoading && <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#58a9ff]" />}
        {prices.map((price) => (
          <div key={price.id} className="bento-card !p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-white">{price.planName}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${price.sourceType === "internal" ? "bg-purple-500/10 text-purple-300" : "bg-blue-500/10 text-blue-300"}`}>
                    {price.sourceType === "internal" ? "INTERNO" : "OFICIAL"}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] ${price.status === "published" ? "bg-green-500/10 text-green-300" : price.status === "approved" ? "bg-cyan-500/10 text-cyan-300" : price.status === "in_review" ? "bg-amber-500/10 text-amber-300" : "bg-white/5 text-muted-foreground"}`}>
                    {statusLabel(price.status)}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {price.currency} {Number(price.sourceAmount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} · {price.billingPeriod === "monthly" ? "mensal" : price.billingPeriod === "annual" ? "anual" : "personalizado"} · a partir de {price.minSeats} assento(s)
                </p>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs">
                  <span className="text-muted-foreground">Custo BRL: <strong className="text-foreground">{price.calculatedCostBrl ? `R$ ${Number(price.calculatedCostBrl).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "pendente"}</strong></span>
                  <span className="text-muted-foreground">Sugerido: <strong className="text-foreground">{price.suggestedPriceBrl ? `R$ ${Number(price.suggestedPriceBrl).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "pendente"}</strong></span>
                  <span className="text-muted-foreground">Aprovado: <strong className="text-foreground">{price.approvedPriceBrl ? `R$ ${Number(price.approvedPriceBrl).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "pendente"}</strong></span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => setEditing(toEditable(price))} className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-xs text-foreground/75 hover:bg-accent">
                  <Pencil className="h-3.5 w-3.5" /> Editar cálculo
                </button>
                {price.status === "draft" && price.suggestedPriceBrl && (
                  <button onClick={() => runAction(submitReview, { id: price.id }, "Preço enviado para revisão.")} className="rounded-full bg-amber-500/15 px-3 py-2 text-xs text-amber-300">Enviar para revisão</button>
                )}
                {price.status === "in_review" && (
                  <>
                    <input
                      value={approvalValues[price.id] ?? price.suggestedPriceBrl ?? ""}
                      onChange={(event) => setApprovalValues((current) => ({ ...current, [price.id]: event.target.value }))}
                      type="number"
                      min="0.01"
                      step="0.01"
                      className="w-32 rounded-full border border-border bg-accent px-3 py-2 text-xs text-white"
                      placeholder="Preço aprovado"
                    />
                    <button onClick={() => runAction(approve, { id: price.id, approvedPriceBrl: Number(approvalValues[price.id] ?? price.suggestedPriceBrl) }, "Preço homologado.")} className="rounded-full bg-cyan-500/15 px-3 py-2 text-xs text-cyan-300">Homologar</button>
                  </>
                )}
                {price.status === "approved" && (
                  <button onClick={() => runAction(publish, { id: price.id }, "Preço publicado no site.")} className="inline-flex items-center gap-2 rounded-full bg-green-500/15 px-3 py-2 text-xs text-green-300"><Eye className="h-3.5 w-3.5" /> Publicar</button>
                )}
                {price.status === "published" && (
                  <button onClick={() => runAction(unpublish, { id: price.id }, "Preço removido da página pública.")} className="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-2 text-xs text-red-300"><EyeOff className="h-3.5 w-3.5" /> Retirar</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="rounded-3xl border border-[#58a9ff]/20 bg-[#101419] p-6">
          <div className="flex items-center gap-3"><Calculator className="h-5 w-5 text-[#58a9ff]" /><h3 className="font-semibold text-white">Cálculo brasileiro — {editing.planName}</h3></div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Valor de origem", "sourceAmount"],
              ["Câmbio para BRL", "exchangeRate"],
              ["Impostos (%)", "taxRate"],
              ["Custo operacional (%)", "operationalCostRate"],
              ["Margem desejada (%)", "marginRate"],
              ["Assentos mínimos", "minSeats"],
            ].map(([label, key]) => (
              <label key={key} className="text-xs text-muted-foreground">
                {label}
                <input
                  value={(editing as any)[key]}
                  onChange={(event) => setEditing((current) => current ? ({ ...current, [key]: event.target.value }) : current)}
                  type="number"
                  step="0.0001"
                  className="mt-2 w-full rounded-xl border border-border bg-accent px-3 py-2.5 text-sm text-white"
                />
              </label>
            ))}
            <label className="text-xs text-muted-foreground">Moeda<input value={editing.currency} onChange={(event) => setEditing({ ...editing, currency: event.target.value.toUpperCase().slice(0, 3) })} className="mt-2 w-full rounded-xl border border-border bg-accent px-3 py-2.5 text-sm text-white" /></label>
            <label className="text-xs text-muted-foreground">Periodicidade<select value={editing.billingPeriod} onChange={(event) => setEditing({ ...editing, billingPeriod: event.target.value as EditablePrice["billingPeriod"] })} className="mt-2 w-full rounded-xl border border-border bg-accent px-3 py-2.5 text-sm text-white"><option value="monthly">Mensal</option><option value="annual">Anual</option><option value="custom">Personalizada</option></select></label>
          </div>
          <div className="mt-6 flex justify-end gap-3"><button onClick={() => setEditing(null)} className="rounded-full px-4 py-2 text-sm text-muted-foreground">Cancelar</button><button onClick={handleSave} disabled={saveDraft.isPending} className="apple-btn apple-btn-primary px-5 py-2.5 text-sm disabled:opacity-50">{saveDraft.isPending ? "Calculando..." : "Calcular e salvar rascunho"}</button></div>
        </div>
      )}

      <div>
        <div className="mb-4 flex items-center gap-3"><FileVideo2 className="h-5 w-5 text-[#58a9ff]" /><h3 className="font-semibold text-white">Mídia oficial cadastrada</h3></div>
        <div className="grid gap-3 md:grid-cols-2">
          {media.map((item) => (
            <a key={item.id} href={item.sourceUrl} target="_blank" rel="noreferrer" className="bento-card !p-4 transition-colors hover:border-[#58a9ff]/25">
              <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-white">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.mediaType === "case" ? item.customerName : "Vídeo oficial"}</p></div>{item.isOfficial && <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-400" />}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

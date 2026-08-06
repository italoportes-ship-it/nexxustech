import { trpc } from "@/lib/trpc";
import { calculateAdministrationPricing, type AdministrationPricingResult } from "../../../../server/pricingGovernance";
import { AlertTriangle, Calculator, CheckCircle2, Eye, EyeOff, FileCheck2, Loader2, Plus, Save, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type AdministrationManagerProps = { productId: number };

type FormState = {
  id?: number;
  scenarioName: string;
  planName: string;
  sourceType: "public" | "internal";
  costPeriod: "monthly" | "annual" | "custom";
  sourceCurrency: string;
  listUnitCost: string;
  negotiatedUnitCost: string;
  useNegotiatedCost: boolean;
  quantity: string;
  periodMonths: string;
  dealDiscountRate: string;
  exchangeRate: string;
  exchangeSpreadRate: string;
  manufacturerAbsorbsIrrf: boolean;
  irrfRate: string;
  cideRate: string;
  pisRate: string;
  cofinsRate: string;
  issRate: string;
  iofRate: string;
  otherTaxRate: string;
  financialCostRate: string;
  operationalCostRate: string;
  contingencyRate: string;
  minimumMarginRate: string;
  targetMarginRate: string;
  manualSalePriceBrl: string;
  publicPlanName: string;
  publicBillingPeriod: "monthly" | "annual" | "custom";
  publicMinSeats: string;
  publicMaxSeats: string;
  publicDescription: string;
  sourceLabel: string;
  sourceUrl: string;
  notes: string;
};

const initialForm: FormState = {
  scenarioName: "Ampler — 1 licença anual",
  planName: "Ampler anual — 1 usuário",
  sourceType: "internal",
  costPeriod: "annual",
  sourceCurrency: "USD",
  listUnitCost: "164",
  negotiatedUnitCost: "164",
  useNegotiatedCost: true,
  quantity: "1",
  periodMonths: "12",
  dealDiscountRate: "0",
  exchangeRate: "5.105299",
  exchangeSpreadRate: "0",
  manufacturerAbsorbsIrrf: true,
  irrfRate: "15",
  cideRate: "0",
  pisRate: "0",
  cofinsRate: "0",
  issRate: "0",
  iofRate: "0",
  otherTaxRate: "0",
  financialCostRate: "0",
  operationalCostRate: "5",
  contingencyRate: "0",
  minimumMarginRate: "25",
  targetMarginRate: "30",
  manualSalePriceBrl: "",
  publicPlanName: "Ampler — licença anual",
  publicBillingPeriod: "annual",
  publicMinSeats: "1",
  publicMaxSeats: "",
  publicDescription: "Licença anual do Ampler. Condições sujeitas à quantidade e ao escopo de implantação.",
  sourceLabel: "Tabela comercial Ampler",
  sourceUrl: "",
  notes: "IRRF absorvido pelo fabricante, conforme orientação comercial.",
};

const percentageFields: Array<[keyof FormState, string]> = [
  ["dealDiscountRate", "Desconto comercial"],
  ["exchangeSpreadRate", "Spread cambial"],
  ["irrfRate", "IRRF"],
  ["cideRate", "CIDE"],
  ["pisRate", "PIS"],
  ["cofinsRate", "COFINS"],
  ["issRate", "ISS"],
  ["iofRate", "IOF"],
  ["otherTaxRate", "Outros impostos"],
  ["financialCostRate", "Custo financeiro"],
  ["operationalCostRate", "Custo operacional"],
  ["contingencyRate", "Contingência"],
  ["minimumMarginRate", "Margem mínima"],
  ["targetMarginRate", "Margem sugerida"],
];

function numeric(value: string) {
  return Number(value.replace(",", ".")) || 0;
}

function money(value?: number | string | null) {
  const number = Number(value || 0);
  return number.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function statusLabel(status: string) {
  return ({ draft: "Rascunho", in_review: "Em revisão", approved: "Homologado", published: "Publicado", withdrawn: "Retirado" } as Record<string, string>)[status] || status;
}

function scenarioToForm(scenario: any): FormState {
  const fields: FormState = { ...initialForm, id: scenario.id };
  Object.keys(fields).forEach((key) => {
    const typedKey = key as keyof FormState;
    if (typedKey === "id") return;
    if (typeof fields[typedKey] === "boolean") (fields as any)[typedKey] = Boolean(scenario[typedKey]);
    else if (scenario[typedKey] !== null && scenario[typedKey] !== undefined) (fields as any)[typedKey] = String(scenario[typedKey]);
  });
  return fields;
}

export default function AdministrationManager({ productId }: AdministrationManagerProps) {
  const utils = trpc.useUtils();
  const scenariosQuery = trpc.admin.administration.list.useQuery({ productId });
  const saveDraft = trpc.admin.administration.saveDraft.useMutation();
  const submitReview = trpc.admin.administration.submitReview.useMutation();
  const approve = trpc.admin.administration.approve.useMutation();
  const publish = trpc.admin.administration.publish.useMutation();
  const withdraw = trpc.admin.administration.withdraw.useMutation();
  const [form, setForm] = useState<FormState>(initialForm);

  const payload = useMemo(() => ({
    id: form.id,
    productId,
    scenarioName: form.scenarioName,
    planName: form.planName,
    sourceType: form.sourceType,
    costPeriod: form.costPeriod,
    sourceCurrency: form.sourceCurrency.toUpperCase(),
    listUnitCost: numeric(form.listUnitCost),
    negotiatedUnitCost: form.negotiatedUnitCost ? numeric(form.negotiatedUnitCost) : null,
    useNegotiatedCost: form.useNegotiatedCost,
    quantity: Math.max(1, Math.round(numeric(form.quantity))),
    periodMonths: Math.max(1, Math.round(numeric(form.periodMonths))),
    dealDiscountRate: numeric(form.dealDiscountRate),
    exchangeRate: numeric(form.exchangeRate),
    exchangeSpreadRate: numeric(form.exchangeSpreadRate),
    manufacturerAbsorbsIrrf: form.manufacturerAbsorbsIrrf,
    irrfRate: numeric(form.irrfRate),
    cideRate: numeric(form.cideRate),
    pisRate: numeric(form.pisRate),
    cofinsRate: numeric(form.cofinsRate),
    issRate: numeric(form.issRate),
    iofRate: numeric(form.iofRate),
    otherTaxRate: numeric(form.otherTaxRate),
    financialCostRate: numeric(form.financialCostRate),
    operationalCostRate: numeric(form.operationalCostRate),
    contingencyRate: numeric(form.contingencyRate),
    minimumMarginRate: numeric(form.minimumMarginRate),
    targetMarginRate: numeric(form.targetMarginRate),
    manualSalePriceBrl: form.manualSalePriceBrl ? numeric(form.manualSalePriceBrl) : null,
    publicPlanName: form.publicPlanName,
    publicBillingPeriod: form.publicBillingPeriod,
    publicMinSeats: Math.max(1, Math.round(numeric(form.publicMinSeats))),
    publicMaxSeats: form.publicMaxSeats ? Math.max(1, Math.round(numeric(form.publicMaxSeats))) : null,
    publicDescription: form.publicDescription || null,
    sourceLabel: form.sourceLabel || null,
    sourceUrl: form.sourceUrl || null,
    notes: form.notes || null,
  }), [form, productId]);

  const simulation = useMemo<{ result: AdministrationPricingResult | null; error: string | null }>(() => {
    try {
      return { result: calculateAdministrationPricing(payload), error: null };
    } catch (error) {
      return { result: null, error: error instanceof Error ? error.message : "Parâmetros inválidos." };
    }
  }, [payload]);

  const scenarios = scenariosQuery.data || [];
  const currentScenario = form.id ? scenarios.find((scenario) => scenario.id === form.id) : undefined;

  const update = (key: keyof FormState, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));
  const refresh = async () => {
    await Promise.all([
      utils.admin.administration.list.invalidate({ productId }),
      utils.productResources.publishedPrices.invalidate({ productId }),
    ]);
  };

  const handleSave = () => {
    if (!simulation.result) { toast.error(simulation.error || "Revise os parâmetros."); return; }
    saveDraft.mutate(payload, {
      onSuccess: async (response) => {
        setForm((current) => ({ ...current, id: response.id }));
        toast.success("Cenário salvo como rascunho.");
        await refresh();
      },
      onError: (error) => toast.error(error.message),
    });
  };

  const action = (mutation: any, variables: any, success: string) => mutation.mutate(variables, {
    onSuccess: async () => { toast.success(success); await refresh(); },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleApprove = () => {
    if (!currentScenario) return;
    const belowMinimum = Number(currentScenario.finalSalePriceBrl || 0) < Number(currentScenario.minimumPriceBrl || 0);
    if (belowMinimum && !window.confirm("O preço final está abaixo do mínimo calculado. Confirma a exceção estratégica e a homologação?")) return;
    action(approve, { id: currentScenario.id, allowBelowMinimum: belowMinimum }, belowMinimum ? "Exceção estratégica homologada." : "Preço homologado.");
  };

  const numberInput = (key: keyof FormState, label: string, step = "0.01") => (
    <label className="text-xs text-muted-foreground">
      {label}
      <input type="number" min="0" step={step} value={String(form[key] ?? "")} onChange={(event) => update(key, event.target.value)} className="mt-2 w-full rounded-xl border border-border bg-accent px-3 py-2.5 text-sm text-white" />
    </label>
  );

  return (
    <div className="grid gap-8 xl:grid-cols-[310px_minmax(0,1fr)]">
      <aside className="space-y-4">
        <button onClick={() => setForm({ ...initialForm })} className="apple-btn apple-btn-primary w-full justify-center py-3"><Plus className="mr-2 h-4 w-4" /> Novo cenário</button>
        <div className="space-y-2">
          {scenariosQuery.isLoading && <Loader2 className="mx-auto h-5 w-5 animate-spin text-[#58a9ff]" />}
          {scenarios.map((scenario) => (
            <button key={scenario.id} onClick={() => setForm(scenarioToForm(scenario))} className={`w-full rounded-2xl border p-4 text-left ${form.id === scenario.id ? "border-[#58a9ff]/40 bg-[#58a9ff]/5" : "border-border bg-white/[0.02] hover:border-white/15"}`}>
              <div className="flex items-start justify-between gap-2"><p className="text-sm font-medium text-white">{scenario.scenarioName}</p><span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground">{statusLabel(scenario.status)}</span></div>
              <p className="mt-2 text-xs text-muted-foreground">{scenario.quantity} licença(s) · {scenario.sourceCurrency} {Number(scenario.listUnitCost).toLocaleString("pt-BR")}</p>
              <p className="mt-1 text-xs font-medium text-[#54d6c7]">{money(scenario.finalSalePriceBrl)}</p>
            </button>
          ))}
        </div>
      </aside>

      <div className="min-w-0 space-y-8">
        <section className="rounded-3xl border border-[#58a9ff]/20 bg-gradient-to-br from-[#0b2034]/75 to-[#15111b]/75 p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#58a9ff]">Base Administração</p><h2 className="mt-3 text-2xl font-semibold text-white">Formação confidencial do preço de venda</h2><p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">A simulação acontece em tempo real. Nada é gravado até salvar; nada é publicado até revisão, homologação e confirmação explícita.</p></div>
            <ShieldCheck className="h-8 w-8 text-[#54d6c7]" />
          </div>
        </section>

        <section className="space-y-5">
          <h3 className="text-lg font-semibold text-white">1. Cenário e custo do fabricante</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs text-muted-foreground md:col-span-2">Nome do cenário<input value={form.scenarioName} onChange={(event) => update("scenarioName", event.target.value)} className="mt-2 w-full rounded-xl border border-border bg-accent px-3 py-2.5 text-sm text-white" /></label>
            <label className="text-xs text-muted-foreground md:col-span-2">Plano interno<input value={form.planName} onChange={(event) => update("planName", event.target.value)} className="mt-2 w-full rounded-xl border border-border bg-accent px-3 py-2.5 text-sm text-white" /></label>
            <label className="text-xs text-muted-foreground">Período do custo<select value={form.costPeriod} onChange={(event) => update("costPeriod", event.target.value)} className="mt-2 w-full rounded-xl border border-border bg-accent px-3 py-2.5 text-sm text-white"><option value="monthly">Mensal</option><option value="annual">Anual</option><option value="custom">Personalizado</option></select></label>
            <label className="text-xs text-muted-foreground">Fonte do custo<select value={form.sourceType} onChange={(event) => update("sourceType", event.target.value)} className="mt-2 w-full rounded-xl border border-border bg-accent px-3 py-2.5 text-sm text-white"><option value="internal">Tabela interna</option><option value="public">Referência pública</option></select></label>
            <label className="text-xs text-muted-foreground">Moeda<input value={form.sourceCurrency} maxLength={3} onChange={(event) => update("sourceCurrency", event.target.value.toUpperCase())} className="mt-2 w-full rounded-xl border border-border bg-accent px-3 py-2.5 text-sm text-white" /></label>
            {numberInput("quantity", "Quantidade", "1")}
            {numberInput("periodMonths", "Período (meses)", "1")}
            {numberInput("listUnitCost", "Custo unitário de lista")}
            {numberInput("negotiatedUnitCost", "Custo unitário negociado")}
            <label className="flex items-center gap-3 self-end rounded-xl border border-border bg-white/[0.02] px-3 py-3 text-sm text-foreground/80"><input type="checkbox" checked={form.useNegotiatedCost} onChange={(event) => update("useNegotiatedCost", event.target.checked)} className="h-4 w-4 accent-[#58a9ff]" /> Usar custo negociado</label>
            {numberInput("dealDiscountRate", "Desconto adicional (%)")}
            {numberInput("exchangeRate", "Câmbio para BRL", "0.000001")}
            {numberInput("exchangeSpreadRate", "Spread cambial (%)")}
          </div>
        </section>

        <section className="space-y-5">
          <h3 className="text-lg font-semibold text-white">2. Impostos e retenções</h3>
          <label className="flex items-center gap-3 rounded-2xl border border-[#54d6c7]/15 bg-[#54d6c7]/[0.035] p-4 text-sm text-foreground/80"><input type="checkbox" checked={form.manufacturerAbsorbsIrrf} onChange={(event) => update("manufacturerAbsorbsIrrf", event.target.checked)} className="h-4 w-4 accent-[#54d6c7]" /><span><strong className="text-white">Fabricante absorve o IRRF</strong><br /><span className="text-xs text-muted-foreground">Quando ativo, o IRRF efetivo do cálculo é 0%, mesmo que a alíquota de referência permaneça informada.</span></span></label>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">{percentageFields.slice(2, 9).map(([key, label]) => numberInput(key, `${label} (%)`))}</div>
        </section>

        <section className="space-y-5">
          <h3 className="text-lg font-semibold text-white">3. Custos internos, margem e preço manual</h3>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">{percentageFields.slice(9).map(([key, label]) => numberInput(key, `${label} (%)`))}{numberInput("manualSalePriceBrl", "Preço final manual (BRL)")}</div>
        </section>

        <section className="space-y-5">
          <h3 className="text-lg font-semibold text-white">4. Simulação em tempo real</h3>
          {simulation.error && <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.04] p-4 text-sm text-red-200">{simulation.error}</div>}
          {simulation.result && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ["Custo fabricante", `${form.sourceCurrency} ${simulation.result.netForeignCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
                  ["Custo base BRL", money(simulation.result.baseCostBrl)],
                  ["Impostos", money(simulation.result.taxesBrl)],
                  ["Custo total", money(simulation.result.totalCostBrl)],
                  ["Preço mínimo", money(simulation.result.minimumPriceBrl)],
                  ["Preço sugerido", money(simulation.result.suggestedPriceBrl)],
                  ["Preço final", money(simulation.result.finalSalePriceBrl)],
                  ["Preço por licença", money(simulation.result.unitSalePriceBrl)],
                  ["Contribuição", money(simulation.result.contributionBrl)],
                  ["Margem efetiva", `${simulation.result.contributionRate.toFixed(2)}%`],
                  ["Markup informativo", `${simulation.result.markupRate.toFixed(2)}%`],
                  ["Câmbio efetivo", simulation.result.effectiveExchangeRate.toFixed(6)],
                ].map(([label, value]) => <div key={label} className="bento-card !p-4"><p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">{label}</p><p className="mt-2 text-lg font-semibold text-white">{value}</p></div>)}
              </div>
              {simulation.result.warnings.map((warning) => <div key={warning} className="flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/[0.04] p-4 text-sm text-amber-100/80"><AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />{warning}</div>)}
            </>
          )}
        </section>

        <section className="space-y-5">
          <h3 className="text-lg font-semibold text-white">5. Conteúdo público</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs text-muted-foreground md:col-span-2">Nome público do plano<input value={form.publicPlanName} onChange={(event) => update("publicPlanName", event.target.value)} className="mt-2 w-full rounded-xl border border-border bg-accent px-3 py-2.5 text-sm text-white" /></label>
            <label className="text-xs text-muted-foreground">Periodicidade pública<select value={form.publicBillingPeriod} onChange={(event) => update("publicBillingPeriod", event.target.value)} className="mt-2 w-full rounded-xl border border-border bg-accent px-3 py-2.5 text-sm text-white"><option value="monthly">Mensal</option><option value="annual">Anual</option><option value="custom">Personalizada</option></select></label>
            {numberInput("publicMinSeats", "Assentos mínimos", "1")}
            {numberInput("publicMaxSeats", "Assentos máximos", "1")}
            <label className="text-xs text-muted-foreground md:col-span-4">Descrição pública<textarea value={form.publicDescription} onChange={(event) => update("publicDescription", event.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-border bg-accent px-3 py-2.5 text-sm text-white" /></label>
            <label className="text-xs text-muted-foreground md:col-span-2">Identificação da fonte<input value={form.sourceLabel} onChange={(event) => update("sourceLabel", event.target.value)} className="mt-2 w-full rounded-xl border border-border bg-accent px-3 py-2.5 text-sm text-white" /></label>
            <label className="text-xs text-muted-foreground md:col-span-2">URL de referência<input value={form.sourceUrl} onChange={(event) => update("sourceUrl", event.target.value)} placeholder="https://" className="mt-2 w-full rounded-xl border border-border bg-accent px-3 py-2.5 text-sm text-white" /></label>
            <label className="text-xs text-muted-foreground md:col-span-4">Notas internas<textarea value={form.notes} onChange={(event) => update("notes", event.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-border bg-accent px-3 py-2.5 text-sm text-white" /></label>
          </div>
          <div className="rounded-2xl border border-green-400/15 bg-green-400/[0.035] p-4 text-sm text-green-100/75"><strong>A API pública receberá somente:</strong> nome do plano, quantidade mínima, periodicidade, preço final e vigência. Custos, impostos, margem e markup nunca são copiados.</div>
        </section>

        <section className="flex flex-col gap-3 rounded-3xl border border-border bg-white/[0.02] p-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <button onClick={handleSave} disabled={saveDraft.isPending || !simulation.result} className="inline-flex items-center justify-center rounded-full border border-border px-5 py-2.5 text-sm text-foreground/80 hover:bg-accent disabled:opacity-50"><Save className="mr-2 h-4 w-4" /> Salvar rascunho</button>
          {currentScenario?.status === "draft" && <button onClick={() => action(submitReview, { id: currentScenario.id }, "Cenário enviado para revisão.")} className="inline-flex items-center justify-center rounded-full bg-amber-500/15 px-5 py-2.5 text-sm text-amber-300"><FileCheck2 className="mr-2 h-4 w-4" /> Enviar para revisão</button>}
          {currentScenario?.status === "in_review" && <button onClick={handleApprove} className="inline-flex items-center justify-center rounded-full bg-cyan-500/15 px-5 py-2.5 text-sm text-cyan-300"><CheckCircle2 className="mr-2 h-4 w-4" /> Homologar</button>}
          {currentScenario?.status === "approved" && <button onClick={() => window.confirm("Publicar apenas o preço final deste cenário no site?") && action(publish, { id: currentScenario.id }, "Preço final publicado.")} className="apple-btn apple-btn-primary justify-center px-5 py-2.5 text-sm"><Eye className="mr-2 h-4 w-4" /> Publicar preço final</button>}
          {currentScenario?.status === "published" && <button onClick={() => window.confirm("Retirar este preço do site público?") && action(withdraw, { id: currentScenario.id }, "Preço retirado do site.")} className="inline-flex items-center justify-center rounded-full bg-red-500/10 px-5 py-2.5 text-sm text-red-300"><EyeOff className="mr-2 h-4 w-4" /> Retirar preço</button>}
          {!currentScenario && <span className="text-xs text-muted-foreground"><Calculator className="mr-1 inline h-3.5 w-3.5" /> Salve o cenário para iniciar o workflow.</span>}
        </section>
      </div>
    </div>
  );
}

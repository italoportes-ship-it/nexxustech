import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Building2, CreditCard, Loader2, LockKeyhole, Package, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";

type BuyerForm = {
  customerType: "person" | "company";
  fullName: string;
  legalName: string;
  email: string;
  taxId: string;
  phone: string;
  postalCode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  cityCode: string;
  state: string;
};

export default function CheckoutStart() {
  const { user, isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });
  const [, setLocation] = useLocation();
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const productId = Number(params.get("productId") || 0);
  const initialQuantity = Math.max(1, Number(params.get("quantity") || 1));
  const [quantity, setQuantity] = useState(initialQuantity);
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [form, setForm] = useState<BuyerForm>({
    customerType: "person",
    fullName: user?.name || "",
    legalName: "",
    email: user?.email || "",
    taxId: "",
    phone: "",
    postalCode: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    cityCode: "",
    state: "",
  });

  const profileQuery = trpc.checkout.profile.useQuery(undefined, { enabled: isAuthenticated });
  const quoteQuery = trpc.checkout.quote.useQuery({ productId: productId || 1, quantity }, { enabled: isAuthenticated && productId > 0 });
  const createCheckout = trpc.checkout.create.useMutation();

  useEffect(() => {
    if (!user) return;
    setForm((current) => ({ ...current, fullName: current.fullName || user.name || "", email: user.email || current.email }));
  }, [user]);

  useEffect(() => {
    const profile = profileQuery.data;
    if (!profile) return;
    setForm({
      customerType: profile.customerType,
      fullName: profile.fullName,
      legalName: profile.legalName || "",
      email: profile.email,
      taxId: profile.taxId,
      phone: profile.phone,
      postalCode: profile.address?.postalCode || "",
      street: profile.address?.street || "",
      number: profile.address?.number || "",
      complement: profile.address?.complement || "",
      neighborhood: profile.address?.neighborhood || "",
      city: profile.address?.city || "",
      cityCode: profile.address?.cityCode || "",
      state: profile.address?.state || "",
    });
  }, [profileQuery.data]);

  const update = (field: keyof BuyerForm, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const quote = quoteQuery.data;

  const submit = () => {
    if (!quote || !acceptTerms || !acceptPrivacy) {
      toast.error(!quote ? "Preço homologado indisponível para esta quantidade." : "Aceite os termos e a política de privacidade.");
      return;
    }
    const paymentWindow = window.open("about:blank", "_blank");
    createCheckout.mutate({
      productId,
      quantity,
      requestId,
      buyer: {
        customerType: form.customerType,
        fullName: form.fullName,
        legalName: form.customerType === "company" ? form.legalName || null : null,
        email: form.email,
        taxId: form.taxId,
        phone: form.phone,
        address: {
          postalCode: form.postalCode,
          street: form.street,
          number: form.number,
          complement: form.complement || null,
          neighborhood: form.neighborhood,
          city: form.city,
          cityCode: form.cityCode || null,
          state: form.state.toUpperCase(),
          country: "BRA",
        },
      },
      acceptTerms: true,
      acceptPrivacy: true,
    }, {
      onSuccess: (result) => {
        if (paymentWindow) paymentWindow.location.href = result.checkoutUrl;
        else window.location.href = result.checkoutUrl;
        setRequestId(crypto.randomUUID());
        setLocation(`/checkout/${result.orderId}`);
        toast.success("Pedido criado. Conclua o pagamento na janela segura do Stripe.");
      },
      onError: (error) => {
        paymentWindow?.close();
        toast.error(error.message);
      },
    });
  };

  const inputClass = "mt-2 w-full rounded-xl border border-border bg-accent px-3 py-2.5 text-sm text-white outline-none focus:border-[#58a9ff]/60";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pb-20 pt-24 md:pt-32">
        <div className="container max-w-6xl">
          <Link href={productId ? `/produto/${quote?.product.slug || "ampler"}` : "/softwares"} className="inline-flex items-center gap-2 text-sm text-[#58a9ff]"><ArrowLeft className="h-4 w-4" /> Voltar</Link>
          <div className="mt-8 grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
            <section className="space-y-8">
              <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#54d6c7]">Checkout seguro</p><h1 className="mt-3 text-3xl font-semibold text-white md:text-5xl">Dados do comprador</h1><p className="mt-3 text-sm text-muted-foreground">Os dados fiscais são criptografados no servidor. Nenhum dado de cartão passa pelo NexxusTECH.</p></div>

              <div className="bento-card !p-6 md:!p-8">
                <div className="flex items-center gap-3"><Building2 className="h-5 w-5 text-[#58a9ff]" /><h2 className="font-semibold text-white">Identificação</h2></div>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <label className="text-xs text-muted-foreground">Tipo<select value={form.customerType} onChange={(event) => update("customerType", event.target.value)} className={inputClass}><option value="person">Pessoa física</option><option value="company">Pessoa jurídica</option></select></label>
                  <label className="text-xs text-muted-foreground">{form.customerType === "company" ? "Nome do responsável" : "Nome completo"}<input value={form.fullName} onChange={(event) => update("fullName", event.target.value)} className={inputClass} /></label>
                  {form.customerType === "company" && <label className="text-xs text-muted-foreground md:col-span-2">Razão social<input value={form.legalName} onChange={(event) => update("legalName", event.target.value)} className={inputClass} /></label>}
                  <label className="text-xs text-muted-foreground">E-mail da conta<input value={form.email} readOnly className={`${inputClass} cursor-not-allowed opacity-70`} /></label>
                  <label className="text-xs text-muted-foreground">{form.customerType === "company" ? "CNPJ" : "CPF"}<input value={form.taxId} onChange={(event) => update("taxId", event.target.value)} className={inputClass} /></label>
                  <label className="text-xs text-muted-foreground">Telefone<input value={form.phone} onChange={(event) => update("phone", event.target.value)} className={inputClass} /></label>
                </div>
              </div>

              <div className="bento-card !p-6 md:!p-8">
                <h2 className="font-semibold text-white">Endereço fiscal</h2>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <label className="text-xs text-muted-foreground">CEP<input value={form.postalCode} onChange={(event) => update("postalCode", event.target.value)} className={inputClass} /></label>
                  <label className="text-xs text-muted-foreground">Rua<input value={form.street} onChange={(event) => update("street", event.target.value)} className={inputClass} /></label>
                  <label className="text-xs text-muted-foreground">Número<input value={form.number} onChange={(event) => update("number", event.target.value)} className={inputClass} /></label>
                  <label className="text-xs text-muted-foreground">Complemento<input value={form.complement} onChange={(event) => update("complement", event.target.value)} className={inputClass} /></label>
                  <label className="text-xs text-muted-foreground">Bairro<input value={form.neighborhood} onChange={(event) => update("neighborhood", event.target.value)} className={inputClass} /></label>
                  <label className="text-xs text-muted-foreground">Cidade<input value={form.city} onChange={(event) => update("city", event.target.value)} className={inputClass} /></label>
                  <label className="text-xs text-muted-foreground">Código IBGE da cidade <span className="opacity-60">(fiscal)</span><input value={form.cityCode} onChange={(event) => update("cityCode", event.target.value)} placeholder="7 dígitos" className={inputClass} /></label>
                  <label className="text-xs text-muted-foreground">UF<input value={form.state} maxLength={2} onChange={(event) => update("state", event.target.value.toUpperCase())} className={inputClass} /></label>
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-border p-5 text-sm text-foreground/75">
                <label className="flex items-start gap-3"><input type="checkbox" checked={acceptTerms} onChange={(event) => setAcceptTerms(event.target.checked)} className="mt-1 h-4 w-4 accent-[#58a9ff]" /><span>Li e aceito os termos de compra e licenciamento do software digital.</span></label>
                <label className="flex items-start gap-3"><input type="checkbox" checked={acceptPrivacy} onChange={(event) => setAcceptPrivacy(event.target.checked)} className="mt-1 h-4 w-4 accent-[#58a9ff]" /><span>Autorizo o tratamento dos dados necessários para pagamento, entrega e obrigação fiscal.</span></label>
              </div>
            </section>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="bento-card !p-6">
                <div className="flex items-center gap-3"><Package className="h-5 w-5 text-[#58a9ff]" /><h2 className="font-semibold text-white">Resumo</h2></div>
                {quoteQuery.isLoading && <Loader2 className="mx-auto my-12 h-6 w-6 animate-spin text-[#58a9ff]" />}
                {quote && <div className="mt-6 space-y-4"><div><p className="font-medium text-white">{quote.product.name}</p><p className="mt-1 text-xs text-muted-foreground">{quote.price.planName}</p></div><label className="text-xs text-muted-foreground">Licenças<input type="number" min="1" max="10000" value={quantity} onChange={(event) => setQuantity(Math.max(1, Number(event.target.value)))} className={inputClass} /></label><div className="border-t border-border pt-4"><div className="flex justify-between text-sm text-muted-foreground"><span>Preço por licença</span><span>R$ {quote.price.unitPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div><div className="mt-3 flex justify-between text-lg font-semibold text-white"><span>Total</span><span>R$ {quote.price.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div></div></div>}
                {quoteQuery.isError && <p className="my-8 text-sm text-amber-300">{quoteQuery.error.message}</p>}
                <button onClick={submit} disabled={!quote || createCheckout.isPending || !acceptTerms || !acceptPrivacy} className="apple-btn apple-btn-primary mt-6 w-full justify-center py-3.5 disabled:opacity-50">{createCheckout.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Criando pedido...</> : <><CreditCard className="mr-2 h-4 w-4" />Ir para pagamento seguro</>}</button>
                <div className="mt-5 space-y-3 text-xs text-muted-foreground"><p className="flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-[#54d6c7]" /> Cartão, Pix e boleto conforme disponibilidade da conta Stripe.</p><p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#54d6c7]" /> A licença só é liberada após confirmação do webhook.</p></div>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

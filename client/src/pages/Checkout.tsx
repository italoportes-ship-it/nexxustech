import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock3, CreditCard, FileText, KeyRound, Loader2, Package, RefreshCw, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Link, useParams } from "wouter";

const statusMap: Record<string, { label: string; color: string; icon: typeof Clock3 }> = {
  pending: { label: "Aguardando pagamento", color: "text-amber-300", icon: Clock3 },
  paid: { label: "Pagamento confirmado", color: "text-green-300", icon: CheckCircle2 },
  failed: { label: "Pagamento não aprovado", color: "text-red-300", icon: XCircle },
  cancelled: { label: "Pedido cancelado", color: "text-muted-foreground", icon: XCircle },
  refunded: { label: "Pagamento estornado", color: "text-blue-300", icon: RefreshCw },
  chargeback: { label: "Pagamento contestado", color: "text-red-300", icon: AlertTriangle },
};

export default function Checkout() {
  const { isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });
  const params = useParams<{ orderId: string }>();
  const orderId = Number(params.orderId || 0);
  const detailsQuery = trpc.checkout.details.useQuery({ orderId }, {
    enabled: isAuthenticated && orderId > 0,
    refetchInterval: (query) => query.state.data?.order.status === "pending" ? 4_000 : false,
  });
  const resume = trpc.checkout.resume.useMutation();
  const details = detailsQuery.data;
  const status = statusMap[details?.order.status || "pending"] || statusMap.pending;
  const StatusIcon = status.icon;
  const cancelled = new URLSearchParams(window.location.search).get("cancelled") === "1";

  const resumePayment = () => resume.mutate({ orderId }, {
    onSuccess: ({ checkoutUrl }) => window.open(checkoutUrl, "_blank"),
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pb-20 pt-24 md:pt-32">
        <div className="container max-w-4xl">
          <Link href="/conta" className="inline-flex items-center gap-2 text-sm text-[#58a9ff]"><ArrowLeft className="h-4 w-4" /> Minha conta</Link>
          {detailsQuery.isLoading && <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#58a9ff]" /></div>}
          {detailsQuery.isError && <div className="mt-10 rounded-3xl border border-red-400/20 bg-red-400/[0.04] p-8 text-center text-red-200">{detailsQuery.error.message}</div>}
          {details && (
            <div className="mt-8 space-y-6">
              {cancelled && details.order.status === "pending" && <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.04] p-4 text-sm text-amber-100/80">Você saiu da página de pagamento. O pedido continua pendente e pode ser retomado enquanto a sessão estiver válida.</div>}
              <section className="rounded-3xl border border-border bg-white/[0.025] p-6 md:p-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div><p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{details.order.orderNumber || `Pedido #${details.order.id}`}</p><h1 className="mt-3 text-3xl font-semibold text-white">Acompanhe seu pedido</h1><p className="mt-2 text-sm text-muted-foreground">Criado em {new Date(details.order.createdAt).toLocaleString("pt-BR")}</p></div>
                  <div className={`flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm font-medium ${status.color}`}><StatusIcon className="h-4 w-4" />{status.label}</div>
                </div>
                <div className="mt-8 space-y-3">{details.items.map((item) => <div key={item.id} className="flex items-center justify-between border-b border-border py-3 last:border-0"><div><p className="text-sm font-medium text-white">{item.productName}</p><p className="text-xs text-muted-foreground">{item.planName} · {item.quantity} licença(s)</p></div><p className="text-sm font-semibold text-white">R$ {Number(item.totalPrice || Number(item.unitPrice) * item.quantity).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p></div>)}</div>
                <div className="mt-5 flex items-center justify-between border-t border-border pt-5"><span className="font-medium text-muted-foreground">Total</span><span className="text-2xl font-semibold text-white">R$ {Number(details.order.totalAmount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
                {details.order.status === "pending" && <button onClick={resumePayment} disabled={resume.isPending} className="apple-btn apple-btn-primary mt-6 w-full justify-center py-3"><CreditCard className="mr-2 h-4 w-4" />Retomar pagamento seguro</button>}
              </section>

              <div className="grid gap-5 md:grid-cols-3">
                <section className="bento-card !p-5"><CreditCard className="h-5 w-5 text-[#58a9ff]" /><h2 className="mt-4 font-semibold text-white">Pagamento</h2><p className="mt-2 text-sm text-muted-foreground">{details.payment?.status || "pending"}{details.payment?.paymentMethod ? ` · ${details.payment.paymentMethod}` : ""}</p><p className="mt-3 text-xs text-muted-foreground">A confirmação vem exclusivamente do webhook Stripe.</p></section>
                <section className="bento-card !p-5"><KeyRound className="h-5 w-5 text-[#54d6c7]" /><h2 className="mt-4 font-semibold text-white">Licença</h2><p className="mt-2 text-sm text-muted-foreground">{details.licenses[0]?.status === "active" ? "Ativa" : details.order.status === "paid" ? "Aguardando fornecedor" : "Bloqueada até o pagamento"}</p>{details.licenses[0]?.status === "active" && <Link href="/conta" className="mt-3 inline-flex text-xs font-semibold text-[#54d6c7]">Ver chave e download</Link>}</section>
                <section className="bento-card !p-5"><FileText className="h-5 w-5 text-[#ec70b9]" /><h2 className="mt-4 font-semibold text-white">Nota fiscal</h2><p className="mt-2 text-sm text-muted-foreground">{details.invoice?.status === "issued" ? `Emitida ${details.invoice.number || ""}` : details.invoice?.status === "pending_configuration" ? "Aguardando configuração fiscal" : details.invoice?.status || "Pendente"}</p>{details.invoice?.pdfUrl && <a href={details.invoice.pdfUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-xs font-semibold text-[#ec70b9]">Abrir PDF</a>}</section>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

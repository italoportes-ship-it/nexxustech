import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Clock3, Download, FileText, KeyRound, LogOut, Package, RefreshCw, ShoppingCart, User, XCircle } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

const orderStatus: Record<string, { label: string; color: string; icon: typeof Clock3 }> = {
  pending: { label: "Pendente", color: "text-amber-300", icon: Clock3 },
  paid: { label: "Pago", color: "text-green-300", icon: CheckCircle2 },
  failed: { label: "Falhou", color: "text-red-300", icon: XCircle },
  cancelled: { label: "Cancelado", color: "text-muted-foreground", icon: XCircle },
  refunded: { label: "Estornado", color: "text-blue-300", icon: RefreshCw },
  chargeback: { label: "Contestado", color: "text-red-300", icon: XCircle },
};

function OrderCard({ entry }: { entry: any }) {
  const [expanded, setExpanded] = useState(false);
  const detailsQuery = trpc.checkout.details.useQuery({ orderId: entry.order.id }, { enabled: expanded });
  const status = orderStatus[entry.order.status] || orderStatus.pending;
  const StatusIcon = status.icon;

  return (
    <article className="bento-card !p-5">
      <button onClick={() => setExpanded((value) => !value)} className="flex w-full flex-col gap-4 text-left sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent"><Package className="h-5 w-5 text-[#58a9ff]" /></div><div><p className="text-sm font-medium text-white">{entry.order.orderNumber || `Pedido #${entry.order.id}`}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(entry.order.createdAt).toLocaleString("pt-BR")}</p></div></div>
        <div className="flex items-center gap-5"><span className={`flex items-center gap-2 text-xs font-medium ${status.color}`}><StatusIcon className="h-4 w-4" />{status.label}</span><span className="font-semibold text-white">R$ {Number(entry.order.totalAmount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
      </button>
      <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-muted-foreground"><span className="rounded-full bg-white/5 px-3 py-1">Pagamento: {entry.payment?.status || "pending"}</span><span className="rounded-full bg-white/5 px-3 py-1">Fiscal: {entry.invoice?.status || "pending_configuration"}</span><span className="rounded-full bg-white/5 px-3 py-1">Licença: {entry.licenses[0]?.status || "pending_payment"}</span></div>
      {expanded && <div className="mt-6 border-t border-border pt-5">
        {detailsQuery.isLoading && <p className="text-sm text-muted-foreground">Carregando detalhes...</p>}
        {detailsQuery.data && <div className="space-y-5">
          <div className="space-y-2">{detailsQuery.data.items.map((item) => <div key={item.id} className="flex items-center justify-between text-sm"><span className="text-foreground/80">{item.productName} · {item.quantity} licença(s)</span><span className="text-white">R$ {Number(item.totalPrice || Number(item.unitPrice) * item.quantity).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>)}</div>
          {detailsQuery.data.licenses.map((license) => <div key={license.id} className="rounded-2xl border border-white/7 bg-white/[0.02] p-4"><div className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-[#54d6c7]" /><p className="text-sm font-medium text-white">Licença #{license.id}</p></div><p className="mt-2 text-xs text-muted-foreground">Status: {license.status}</p>{license.licenseKey && <div className="mt-4 rounded-xl bg-black/30 p-3 font-mono text-sm text-[#54d6c7]">{license.licenseKey}</div>}{license.downloadUrl && <a href={license.downloadUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#58a9ff]"><Download className="h-4 w-4" />Download oficial</a>}{license.installationInstructions && <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{license.installationInstructions}</p>}{license.status === "awaiting_vendor" && <p className="mt-4 text-sm text-amber-200/80">Pagamento confirmado. A ativação oficial aguarda o fornecedor.</p>}</div>)}
          {detailsQuery.data.invoice?.status === "issued" && detailsQuery.data.invoice.pdfUrl && <a href={detailsQuery.data.invoice.pdfUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-[#ec70b9]"><FileText className="h-4 w-4" />Baixar nota fiscal</a>}
          <Link href={`/checkout/${entry.order.id}`} className="inline-flex text-sm font-semibold text-[#58a9ff]">Acompanhar pedido completo</Link>
        </div>}
      </div>}
    </article>
  );
}

export default function Account() {
  const { user, isAuthenticated, logout } = useAuth({ redirectOnUnauthenticated: true });
  const ordersQuery = trpc.checkout.myOrders.useQuery(undefined, { enabled: isAuthenticated });
  const entries = ordersQuery.data || [];
  const paid = entries.filter((entry) => entry.order.status === "paid");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pb-20 pt-24 md:pt-32">
        <div className="container">
          <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#58a9ff]/10"><User className="h-7 w-7 text-[#58a9ff]" /></div><div><h1 className="text-3xl font-semibold text-white">{user?.name || "Minha conta"}</h1><p className="mt-1 text-sm text-muted-foreground">{user?.email}</p></div></div><button onClick={() => logout()} className="inline-flex items-center gap-2 text-sm text-muted-foreground"><LogOut className="h-4 w-4" />Sair</button></header>

          <div className="mt-10 grid gap-4 md:grid-cols-3"><div className="bento-card !p-5"><p className="text-2xl font-semibold text-white">{entries.length}</p><p className="mt-1 text-xs text-muted-foreground">Pedidos</p></div><div className="bento-card !p-5"><p className="text-2xl font-semibold text-white">{paid.length}</p><p className="mt-1 text-xs text-muted-foreground">Pagamentos confirmados</p></div><div className="bento-card !p-5"><p className="text-2xl font-semibold text-white">{paid.reduce((sum, entry) => sum + Number(entry.order.totalAmount), 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p><p className="mt-1 text-xs text-muted-foreground">Total confirmado</p></div></div>

          <section className="mt-12"><h2 className="text-xl font-semibold text-white">Pedidos e licenças</h2>{ordersQuery.isLoading && <p className="mt-6 text-sm text-muted-foreground">Carregando pedidos...</p>}{entries.length === 0 && !ordersQuery.isLoading ? <div className="mt-6 rounded-3xl border border-border py-16 text-center"><ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" /><p className="mt-4 text-muted-foreground">Você ainda não possui pedidos.</p><Link href="/produto/ampler" className="apple-btn apple-btn-primary mt-6 inline-flex px-6 py-3">Conhecer o Ampler</Link></div> : <div className="mt-6 space-y-4">{entries.map((entry) => <OrderCard key={entry.order.id} entry={entry} />)}</div>}</section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

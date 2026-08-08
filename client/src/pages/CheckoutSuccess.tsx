import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Clock3, Loader2, ShieldCheck } from "lucide-react";
import { Link } from "wouter";

export default function CheckoutSuccess() {
  const { isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });
  const params = new URLSearchParams(window.location.search);
  const orderId = Number(params.get("order") || 0);
  const detailsQuery = trpc.checkout.details.useQuery({ orderId }, {
    enabled: isAuthenticated && orderId > 0,
    refetchInterval: (query) => query.state.data?.order.status === "pending" ? 3_000 : false,
  });
  const details = detailsQuery.data;
  const paid = details?.order.status === "paid";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="flex min-h-[80vh] items-center justify-center px-4 pb-16 pt-24">
        <div className="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-white/[0.025] p-8 text-center md:p-12">
          {detailsQuery.isLoading && <><Loader2 className="mx-auto h-10 w-10 animate-spin text-[#58a9ff]" /><h1 className="mt-6 text-2xl font-semibold text-white">Confirmando seu pagamento</h1><p className="mt-3 text-sm text-muted-foreground">Aguardando confirmação segura do webhook Stripe.</p></>}
          {detailsQuery.isError && <><Clock3 className="mx-auto h-10 w-10 text-amber-300" /><h1 className="mt-6 text-2xl font-semibold text-white">Pedido em processamento</h1><p className="mt-3 text-sm text-muted-foreground">Abra sua conta para acompanhar o status. O retorno visual não confirma pagamento.</p></>}
          {details && <>{paid ? <CheckCircle2 className="mx-auto h-12 w-12 text-[#54d6c7]" /> : <Clock3 className="mx-auto h-12 w-12 text-amber-300" />}<p className="mt-6 text-xs uppercase tracking-[0.16em] text-muted-foreground">{details.order.orderNumber || `Pedido #${details.order.id}`}</p><h1 className="mt-3 text-3xl font-semibold text-white">{paid ? "Pagamento confirmado" : "Pagamento em processamento"}</h1><p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">{paid ? "O pagamento foi confirmado pelo backend. O entitlement foi liberado e a licença oficial aguarda provisionamento do fornecedor." : "Pix e boleto podem confirmar de forma assíncrona. Esta página continuará consultando o backend; nenhuma licença é liberada antes do webhook."}</p><div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 text-[#54d6c7]" />Confirmação baseada no estado persistido do pedido</div><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link href={`/checkout/${orderId}`} className="apple-btn apple-btn-secondary justify-center px-6 py-3">Ver pedido</Link><Link href="/conta" className="apple-btn apple-btn-primary justify-center px-6 py-3">Ir para minha conta</Link></div></>}
        </div>
      </main>
      <Footer />
    </div>
  );
}

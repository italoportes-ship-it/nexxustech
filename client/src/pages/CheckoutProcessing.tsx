import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Clock3, Loader2, ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import { Link, useLocation } from "wouter";

export default function CheckoutProcessing() {
  const { isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });
  const [, setLocation] = useLocation();
  const orderId = Number(new URLSearchParams(window.location.search).get("order") || 0);
  const details = trpc.checkout.details.useQuery({ orderId }, { enabled: isAuthenticated && orderId > 0, refetchInterval: 3_000 });
  useEffect(() => {
    const status = details.data?.order.status;
    if (status === "paid") setLocation(`/checkout/sucesso?order=${orderId}`);
    if (status === "failed" || status === "chargeback") setLocation(`/checkout/erro?order=${orderId}`);
    if (status === "cancelled") setLocation(`/checkout/cancelado?order=${orderId}`);
  }, [details.data?.order.status, orderId, setLocation]);
  return <div className="min-h-screen bg-background"><Navbar /><main className="flex min-h-[80vh] items-center justify-center px-4 pb-16 pt-24"><div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-white/[0.025] p-10 text-center"><Loader2 className="mx-auto h-11 w-11 animate-spin text-[#58a9ff]" /><h1 className="mt-6 text-3xl font-semibold text-white">Processando pagamento</h1><p className="mt-4 text-sm leading-relaxed text-muted-foreground">Cartões costumam confirmar rapidamente. Pix e boleto podem permanecer pendentes até o webhook de liquidação.</p><p className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 text-[#54d6c7]" />Nenhuma licença é liberada por esta página</p><Link href={`/checkout/${orderId}`} className="apple-btn apple-btn-secondary mt-8 inline-flex px-6 py-3"><Clock3 className="mr-2 h-4 w-4" />Acompanhar pedido</Link></div></main><Footer /></div>;
}

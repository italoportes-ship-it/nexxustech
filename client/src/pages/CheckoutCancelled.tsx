import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, CreditCard, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function CheckoutCancelled() {
  useAuth({ redirectOnUnauthenticated: true });
  const orderId = Number(new URLSearchParams(window.location.search).get("order") || 0);
  const resume = trpc.checkout.resume.useMutation();
  return <div className="min-h-screen bg-background"><Navbar /><main className="flex min-h-[80vh] items-center justify-center px-4 pb-16 pt-24"><div className="w-full max-w-xl rounded-[2rem] border border-amber-400/15 bg-amber-400/[0.025] p-10 text-center"><XCircle className="mx-auto h-11 w-11 text-amber-300" /><h1 className="mt-6 text-3xl font-semibold text-white">Checkout interrompido</h1><p className="mt-4 text-sm leading-relaxed text-muted-foreground">Nenhuma confirmação de pagamento foi recebida. Se a sessão ainda estiver válida, você pode retomá-la com segurança.</p><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link href={`/checkout/${orderId}`} className="apple-btn apple-btn-secondary justify-center px-6 py-3"><ArrowLeft className="mr-2 h-4 w-4" />Ver pedido</Link><button onClick={() => resume.mutate({ orderId }, { onSuccess: ({ checkoutUrl }) => window.open(checkoutUrl, "_blank"), onError: (error) => toast.error(error.message) })} className="apple-btn apple-btn-primary justify-center px-6 py-3"><CreditCard className="mr-2 h-4 w-4" />Retomar pagamento</button></div></div></main><Footer /></div>;
}

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function CheckoutError() {
  const orderId = Number(new URLSearchParams(window.location.search).get("order") || 0);
  return <div className="min-h-screen bg-background"><Navbar /><main className="flex min-h-[80vh] items-center justify-center px-4 pb-16 pt-24"><div className="w-full max-w-xl rounded-[2rem] border border-red-400/15 bg-red-400/[0.025] p-10 text-center"><AlertTriangle className="mx-auto h-11 w-11 text-red-300" /><h1 className="mt-6 text-3xl font-semibold text-white">Não foi possível confirmar o pagamento</h1><p className="mt-4 text-sm leading-relaxed text-muted-foreground">O pedido não foi liberado. Consulte o motivo registrado e tente um novo checkout se necessário.</p><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link href={`/checkout/${orderId}`} className="apple-btn apple-btn-secondary justify-center px-6 py-3"><ArrowLeft className="mr-2 h-4 w-4" />Ver pedido</Link><Link href="/produto/ampler" className="apple-btn apple-btn-primary justify-center px-6 py-3">Voltar ao Ampler</Link></div></div></main><Footer /></div>;
}

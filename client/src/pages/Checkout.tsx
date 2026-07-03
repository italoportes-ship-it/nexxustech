import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useParams, Link } from "wouter";
import { Check, Package, CreditCard, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function Checkout() {
  const { isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });
  const params = useParams<{ orderId: string }>();
  const orderId = parseInt(params.orderId || "0");

  const orderItemsQuery = trpc.orders.getItems.useQuery({ orderId }, { enabled: isAuthenticated && orderId > 0 });
  const items = orderItemsQuery.data || [];
  const total = items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);

  const handlePayment = () => {
    // The checkout session is created when the order is placed from the cart.
    // If the user lands here without a checkout URL, we show a fallback message.
    toast.info("Seu pedido foi registrado. Você será redirecionado para o pagamento quando disponível.");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-32 pb-24">
        <div className="container max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link href="/carrinho" className="inline-flex items-center gap-2 text-sm text-[#0071E3] mb-8 hover:underline">
              <ArrowLeft className="w-4 h-4" /> Voltar ao carrinho
            </Link>

            <h1 className="text-headline text-foreground mb-2">Checkout</h1>
            <p className="text-sm text-muted-foreground mb-10">Pedido #{orderId}</p>

            {/* Order Summary */}
            <div className="bento-card !p-6 mb-6">
              <h3 className="text-base font-semibold text-foreground mb-5 flex items-center gap-2">
                <Package className="w-5 h-5 text-[#0071E3]" />
                Itens do Pedido
              </h3>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">Qtd: {item.quantity}</p>
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      R$ {(parseFloat(item.price) * item.quantity).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-5 border-t border-border flex justify-between items-center">
                <span className="text-base font-semibold text-foreground">Total</span>
                <span className="text-2xl font-bold text-foreground">
                  R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Payment */}
            <div className="bento-card !p-6">
              <h3 className="text-base font-semibold text-foreground mb-5 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#0071E3]" />
                Pagamento
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Processamento seguro via Stripe. Aceitamos cartão de crédito, débito e outros métodos.
              </p>
              <button
                onClick={handlePayment}
                className="apple-btn apple-btn-primary w-full text-base py-4"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Pagar R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </button>
              <p className="text-xs text-muted-foreground text-center mt-4">
                Pagamento processado com segurança pelo Stripe. Seus dados estão protegidos.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

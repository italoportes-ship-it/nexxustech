import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function Cart() {
  const { isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });
  const [, setLocation] = useLocation();
  const cartQuery = trpc.cart.list.useQuery(undefined, { enabled: isAuthenticated });
  const removeMutation = trpc.cart.remove.useMutation();
  const updateQtyMutation = trpc.cart.updateQuantity.useMutation();
  const createOrderMutation = trpc.orders.create.useMutation();
  const utils = trpc.useUtils();

  const items = cartQuery.data || [];
  const total = items.reduce((sum, item) => sum + parseFloat(item.product.price) * item.quantity, 0);

  const handleRemove = (productId: number) => {
    removeMutation.mutate({ productId }, {
      onSuccess: () => {
        utils.cart.list.invalidate();
        toast.success("Item removido do carrinho.");
      },
    });
  };

  const handleQuantity = (productId: number, quantity: number) => {
    updateQtyMutation.mutate({ productId, quantity }, {
      onSuccess: () => utils.cart.list.invalidate(),
    });
  };

  const handleCheckout = () => {
    createOrderMutation.mutate(undefined, {
      onSuccess: (data) => {
        utils.cart.list.invalidate();
        if (data.checkoutUrl) {
          toast.success("Redirecionando para o pagamento...");
          window.open(data.checkoutUrl, "_blank");
        } else {
          toast.success("Pedido criado! Redirecionando...");
          setLocation(`/checkout/${data.orderId}`);
        }
      },
      onError: () => {
        toast.error("Erro ao criar pedido. Tente novamente.");
      },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-24 md:pt-32 pb-16 md:pb-24">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-headline text-foreground mb-8">Carrinho</h1>

            {items.length === 0 ? (
              <div className="text-center py-20">
                <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
                <p className="text-lg text-muted-foreground mb-6">Seu carrinho está vazio.</p>
                <Link href="/softwares">
                  <span className="apple-btn apple-btn-primary">Explorar Produtos</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Items */}
                <div className="lg:col-span-2 space-y-4">
                  {items.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bento-card !p-5 flex items-center gap-5"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-[#0071E3]/10 flex items-center justify-center flex-shrink-0">
                        <ShoppingCart className="w-7 h-7 text-[#0071E3]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/produto/${item.product.slug}`}>
                          <h3 className="text-sm font-semibold text-foreground hover:text-[#0071E3] transition-colors truncate">
                            {item.product.name}
                          </h3>
                        </Link>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.product.type === "course" ? "Curso Digital" : "Software"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleQuantity(item.productId, item.quantity - 1)}
                          className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center text-muted-foreground hover:bg-white/10"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm text-foreground w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => handleQuantity(item.productId, item.quantity + 1)}
                          className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center text-muted-foreground hover:bg-white/10"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-sm font-semibold text-foreground w-28 text-right">
                        R$ {(parseFloat(item.product.price) * item.quantity).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                      <button
                        onClick={() => handleRemove(item.productId)}
                        className="p-2 text-muted-foreground hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>

                {/* Summary */}
                <div className="lg:col-span-1">
                  <div className="bento-card !p-6 sticky top-24">
                    <h3 className="text-base font-semibold text-foreground mb-6">Resumo do Pedido</h3>
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal ({items.length} {items.length === 1 ? "item" : "itens"})</span>
                        <span className="text-foreground">R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Desconto</span>
                        <span className="text-green-400">-R$ 0,00</span>
                      </div>
                    </div>
                    <div className="border-t border-border pt-4 mb-6">
                      <div className="flex justify-between">
                        <span className="text-base font-semibold text-foreground">Total</span>
                        <span className="text-xl font-bold text-foreground">
                          R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={handleCheckout}
                      disabled={createOrderMutation.isPending}
                      className="apple-btn apple-btn-primary w-full text-base py-3.5 disabled:opacity-50"
                    >
                      {createOrderMutation.isPending ? "Processando..." : (
                        <>Finalizar Compra <ArrowRight className="w-4 h-4 ml-2" /></>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

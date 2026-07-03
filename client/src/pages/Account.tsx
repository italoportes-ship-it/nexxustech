import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { Package, ShoppingCart, User, LogOut, Clock, CheckCircle, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import AnimatedCounter from "@/components/AnimatedCounter";

const statusLabels: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pendente", color: "text-yellow-400", icon: <Clock className="w-4 h-4" /> },
  paid: { label: "Pago", color: "text-green-400", icon: <CheckCircle className="w-4 h-4" /> },
  failed: { label: "Falhou", color: "text-red-400", icon: <XCircle className="w-4 h-4" /> },
  refunded: { label: "Reembolsado", color: "text-blue-400", icon: <Package className="w-4 h-4" /> },
};

export default function Account() {
  const { user, isAuthenticated, logout } = useAuth({ redirectOnUnauthenticated: true });
  const ordersQuery = trpc.orders.myOrders.useQuery(undefined, { enabled: isAuthenticated });
  const orders = ordersQuery.data || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-32 pb-24">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Profile Header */}
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#0071E3]/10 flex items-center justify-center">
                  <User className="w-7 h-7 text-[#0071E3]" />
                </div>
                <div>
                  <h1 className="text-title text-foreground">{user?.name || "Minha Conta"}</h1>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={() => logout()}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <LogOut className="w-4 h-4" /> Sair
              </button>
            </div>

            {/* Quick Stats with animated counters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
              <div className="bento-card !p-5 text-center">
                <p className="text-2xl font-bold text-foreground">
                  <AnimatedCounter end={orders.length} duration={1500} />
                </p>
                <p className="text-xs text-muted-foreground mt-1">Pedidos Realizados</p>
              </div>
              <div className="bento-card !p-5 text-center">
                <p className="text-2xl font-bold text-foreground">
                  <AnimatedCounter end={orders.filter(o => o.status === "paid").length} duration={1500} />
                </p>
                <p className="text-xs text-muted-foreground mt-1">Produtos Ativos</p>
              </div>
              <div className="bento-card !p-5 text-center">
                <p className="text-2xl font-bold text-foreground">
                  <AnimatedCounter
                    end={orders.filter(o => o.status === "paid").reduce((s, o) => s + parseFloat(o.totalAmount), 0)}
                    duration={2000}
                    decimals={2}
                    prefix="R$ "
                  />
                </p>
                <p className="text-xs text-muted-foreground mt-1">Total Investido</p>
              </div>
            </div>

            {/* Purchased Products */}
            {orders.filter(o => o.status === "paid").length > 0 && (
              <div className="mb-12">
                <h2 className="text-lg font-semibold text-foreground mb-6">Meus Produtos</h2>
                <div className="bento-card !p-5">
                  <p className="text-sm text-muted-foreground mb-3">Você tem acesso aos produtos dos pedidos pagos abaixo. Clique em um pedido para ver os itens.</p>
                  <div className="space-y-2">
                    {orders.filter(o => o.status === "paid").map(order => (
                      <div key={order.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <span className="text-sm text-foreground">Pedido #{order.id}</span>
                        <span className="text-xs text-green-400">Acesso Liberado</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Orders */}
            <h2 className="text-lg font-semibold text-foreground mb-6">Histórico de Pedidos</h2>
            {orders.length === 0 ? (
              <div className="text-center py-16 bento-card">
                <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">Você ainda não realizou nenhum pedido.</p>
                <Link href="/softwares">
                  <span className="apple-btn apple-btn-primary text-sm">Explorar Produtos</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order, index) => {
                  const status = statusLabels[order.status] || statusLabels.pending;
                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bento-card !p-5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                            <Package className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">Pedido #{order.id}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(order.createdAt).toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`flex items-center gap-1.5 text-xs font-medium ${status.color}`}>
                            {status.icon} {status.label}
                          </span>
                          <span className="text-sm font-semibold text-foreground">
                            R$ {parseFloat(order.totalAmount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

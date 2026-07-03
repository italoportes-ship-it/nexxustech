import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Package, Users, ShoppingCart, MessageSquare, Plus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";

export default function Admin() {
  const { user, isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });
  const [activeTab, setActiveTab] = useState<"products" | "orders" | "leads" | "users">("products");

  const productsQuery = trpc.admin.products.list.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const ordersQuery = trpc.admin.orders.list.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" && activeTab === "orders" });
  const leadsQuery = trpc.admin.leads.list.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" && activeTab === "leads" });
  const usersQuery = trpc.admin.users.list.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" && activeTab === "users" });
  const deleteMutation = trpc.admin.products.delete.useMutation();
  const utils = trpc.useUtils();

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Navbar />
        <p className="text-muted-foreground text-lg">Acesso restrito a administradores.</p>
      </div>
    );
  }

  const products = productsQuery.data || [];
  const orders = ordersQuery.data || [];
  const leads = leadsQuery.data || [];
  const users2 = usersQuery.data || [];

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        toast.success("Produto desativado.");
        utils.admin.products.list.invalidate();
      },
    });
  };

  const tabs = [
    { key: "products" as const, label: "Produtos", icon: <Package className="w-4 h-4" />, count: products.length },
    { key: "orders" as const, label: "Pedidos", icon: <ShoppingCart className="w-4 h-4" />, count: orders.length },
    { key: "leads" as const, label: "Leads B2B", icon: <MessageSquare className="w-4 h-4" />, count: leads.length },
    { key: "users" as const, label: "Usuários", icon: <Users className="w-4 h-4" />, count: users2.length },
  ];

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
            <h1 className="text-headline text-foreground mb-8">Painel Administrativo</h1>

            {/* Tabs */}
            <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    activeTab === tab.key
                      ? "bg-[#0071E3] text-white"
                      : "bg-accent text-muted-foreground hover:bg-white/10"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  <span className="text-xs opacity-60">({tab.count})</span>
                </button>
              ))}
            </div>

            {/* Products Tab */}
            {activeTab === "products" && (
              <div className="space-y-3">
                {products.map((product) => (
                  <div key={product.id} className="bento-card !p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                        <Package className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.type} | R$ {parseFloat(product.price).toFixed(2)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-2 text-muted-foreground hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === "orders" && (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div key={order.id} className="bento-card !p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Pedido #{order.id}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString("pt-BR")} | {order.customerEmail || "N/A"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">R$ {parseFloat(order.totalAmount).toFixed(2)}</p>
                      <p className={`text-xs ${order.status === "paid" ? "text-green-400" : "text-yellow-400"}`}>
                        {order.status}
                      </p>
                    </div>
                  </div>
                ))}
                {orders.length === 0 && <p className="text-center text-muted-foreground py-10">Nenhum pedido encontrado.</p>}
              </div>
            )}

            {/* Leads Tab */}
            {activeTab === "leads" && (
              <div className="space-y-3">
                {leads.map((lead) => (
                  <div key={lead.id} className="bento-card !p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-foreground">{lead.companyName}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        lead.status === "new" ? "bg-blue-500/10 text-blue-400" : "bg-green-500/10 text-green-400"
                      }`}>
                        {lead.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{lead.contactName} | {lead.email}</p>
                    {lead.message && <p className="text-xs text-muted-foreground mt-2">{lead.message}</p>}
                  </div>
                ))}
                {leads.length === 0 && <p className="text-center text-muted-foreground py-10">Nenhum lead encontrado.</p>}
              </div>
            )}

            {/* Users Tab */}
            {activeTab === "users" && (
              <div className="space-y-3">
                {users2.map((u) => (
                  <div key={u.id} className="bento-card !p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
                        <Users className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{u.name || "Sem nome"}</p>
                        <p className="text-xs text-muted-foreground">{u.email || "Sem email"}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      u.role === "admin" ? "bg-purple-500/10 text-purple-400" : "bg-accent text-muted-foreground"
                    }`}>
                      {u.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

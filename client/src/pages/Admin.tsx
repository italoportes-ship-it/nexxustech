import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdministrationManager from "@/components/admin/AdministrationManager";
import PdsManager from "@/components/admin/PdsManager";
import CommerceManager from "@/components/admin/CommerceManager";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { AlertTriangle, CheckCircle2, Clock3, CreditCard, FileUp, Package, RefreshCw, SlidersHorizontal, Users, MessageSquare, Plus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";

type AdminTab = "products" | "administration" | "pds" | "commerce" | "leads" | "users";

function getInitialAdminTab(): AdminTab {
  const tab = new URLSearchParams(window.location.search).get("tab");
  if (tab === "pricing") return "administration";
  if (tab === "orders") return "commerce";
  return tab === "administration" || tab === "pds" || tab === "commerce" || tab === "leads" || tab === "users" ? tab : "products";
}

export default function Admin() {
  const { user, isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });
  const [activeTab, setActiveTab] = useState<AdminTab>(getInitialAdminTab);

  const productsQuery = trpc.admin.products.list.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const leadsQuery = trpc.admin.leads.list.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" && activeTab === "leads" });
  const usersQuery = trpc.admin.users.list.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" && activeTab === "users" });
  const deleteMutation = trpc.admin.products.delete.useMutation();
  const reprocessLeadMutation = trpc.admin.leads.reprocess.useMutation();
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
  const leads = leadsQuery.data || [];
  const users2 = usersQuery.data || [];
  const amplerProduct = products.find((product) => product.slug === "ampler");

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        toast.success("Produto desativado.");
        utils.admin.products.list.invalidate();
      },
    });
  };

  const handleReprocessLead = (id: number) => {
    reprocessLeadMutation.mutate({ id }, {
      onSuccess: (result) => {
        if (result.success) toast.success("Lead sincronizado com o CRM.");
        else toast.error(result.error || "Não foi possível sincronizar o lead.");
        utils.admin.leads.list.invalidate();
      },
      onError: (error) => toast.error(error.message || "Falha ao reprocessar o lead."),
    });
  };

  const tabs = [
    { key: "products" as const, label: "Produtos", icon: <Package className="w-4 h-4" />, count: products.length },
    { key: "administration" as const, label: "Administração", icon: <SlidersHorizontal className="w-4 h-4" />, count: null },
    { key: "pds" as const, label: "Importar PDS", icon: <FileUp className="w-4 h-4" />, count: null },
    { key: "commerce" as const, label: "Commerce", icon: <CreditCard className="w-4 h-4" />, count: null },
    { key: "leads" as const, label: "Leads B2B", icon: <MessageSquare className="w-4 h-4" />, count: leads.length },
    { key: "users" as const, label: "Usuários", icon: <Users className="w-4 h-4" />, count: users2.length },
  ];

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
                  {tab.count !== null && <span className="text-xs opacity-60">({tab.count})</span>}
                </button>
              ))}
            </div>

            {/* Products Tab */}
            {activeTab === "products" && (
              <div className="space-y-3">
                {products.map((product) => (
                  <div key={product.id} className={`bento-card !p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${!product.isActive ? "opacity-55" : ""}`}>
                    <div className="flex min-w-0 items-center gap-4">
                      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${product.isActive ? "bg-[#0071E3]/10 text-[#58a9ff]" : "bg-accent text-muted-foreground"}`}>
                        <Package className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-medium text-foreground">{product.name}</p>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${product.isActive ? "bg-green-500/10 text-green-400" : "bg-white/5 text-muted-foreground"}`}>
                            {product.isActive ? "ATIVO" : "HISTÓRICO"}
                          </span>
                          {product.qualityScore != null && (
                            <span className="rounded-full bg-[#54d6c7]/10 px-2 py-0.5 text-[10px] text-[#54d6c7]">Qualidade {product.qualityScore}/100</span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {product.manufacturer || "Fabricante não informado"} · {parseFloat(product.price) > 0 ? `R$ ${parseFloat(product.price).toFixed(2)}` : "Preço sob consulta"}
                        </p>
                        <p className="mt-1 truncate text-[11px] text-muted-foreground/60">/{product.slug}</p>
                      </div>
                    </div>
                    {product.isActive && product.slug !== "ampler" ? (
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="self-end p-2 text-muted-foreground transition-colors hover:text-red-400 sm:self-auto"
                        aria-label={`Desativar ${product.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : (
                      <span className="self-end text-[11px] text-muted-foreground/50 sm:self-auto">
                        {product.slug === "ampler" ? "Produto principal" : "Registro preservado"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === "administration" && (
              amplerProduct ? <AdministrationManager productId={amplerProduct.id} /> : <p className="py-10 text-center text-muted-foreground">Carregando cadastro do Ampler...</p>
            )}

            {activeTab === "pds" && (
              amplerProduct ? <PdsManager productId={amplerProduct.id} /> : <p className="py-10 text-center text-muted-foreground">Carregando cadastro do Ampler...</p>
            )}

            {activeTab === "commerce" && <CommerceManager />}

            {/* Leads Tab */}
            {activeTab === "leads" && (
              <div className="space-y-3">
                {leads.map((lead) => (
                  <div key={lead.id} className="bento-card !p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-sm font-medium text-foreground">{lead.companyName}</p>
                          {lead.protocol && (
                            <span className="text-[10px] font-mono text-muted-foreground bg-accent px-2 py-0.5 rounded">
                              {lead.protocol}
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">{lead.contactName} | {lead.email}</p>
                        {lead.message && <p className="mt-2 text-xs text-muted-foreground/60 line-clamp-2">{lead.message}</p>}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          lead.status === "new" ? "bg-blue-500/10 text-blue-400" :
                          lead.status === "contacted" ? "bg-yellow-500/10 text-yellow-400" :
                          lead.status === "qualified" ? "bg-green-500/10 text-green-400" :
                          "bg-accent text-muted-foreground"
                        }`}>
                          {lead.status}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${
                          lead.crmSyncStatus === "synced" ? "bg-green-500/10 text-green-400" :
                          lead.crmSyncStatus === "failed" ? "bg-red-500/10 text-red-400" :
                          "bg-yellow-500/10 text-yellow-400"
                        }`}>
                          {lead.crmSyncStatus === "synced" ? <CheckCircle2 className="h-3 w-3" /> :
                            lead.crmSyncStatus === "failed" ? <AlertTriangle className="h-3 w-3" /> :
                            <Clock3 className="h-3 w-3" />}
                          {lead.crmSyncStatus === "synced" ? "CRM sincronizado" :
                            lead.crmSyncStatus === "failed" ? "Falha no CRM" : "CRM pendente"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-col gap-2 border-t border-border/60 pt-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-[11px] text-muted-foreground">
                        {lead.crmSyncAttempts} tentativa{lead.crmSyncAttempts === 1 ? "" : "s"}
                        {lead.crmLastAttemptAt && ` · Última: ${new Date(lead.crmLastAttemptAt).toLocaleString("pt-BR")}`}
                        {lead.crmLastError && <p className="mt-1 max-w-2xl text-red-400/80">{lead.crmLastError}</p>}
                      </div>
                      {lead.crmSyncStatus !== "synced" && (
                        <button
                          type="button"
                          onClick={() => handleReprocessLead(lead.id)}
                          disabled={reprocessLeadMutation.isPending && reprocessLeadMutation.variables?.id === lead.id}
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0071E3] px-4 py-2 text-xs font-medium text-white transition-transform active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <RefreshCw className={`h-3.5 w-3.5 ${reprocessLeadMutation.isPending && reprocessLeadMutation.variables?.id === lead.id ? "animate-spin" : ""}`} />
                          {lead.crmSyncStatus === "failed" ? "Reprocessar" : "Sincronizar"}
                        </button>
                      )}
                    </div>
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

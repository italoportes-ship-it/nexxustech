import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Clock, CheckCircle, Phone, Award, XCircle } from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode; description: string }> = {
  new: { label: "Novo", color: "text-blue-400 bg-blue-500/10", icon: <Clock className="w-5 h-5" />, description: "Sua solicitação foi recebida e está aguardando análise da equipe comercial." },
  contacted: { label: "Em Contato", color: "text-yellow-400 bg-yellow-500/10", icon: <Phone className="w-5 h-5" />, description: "Nossa equipe já entrou em contato. Estamos preparando seu orçamento personalizado." },
  qualified: { label: "Qualificado", color: "text-green-400 bg-green-500/10", icon: <Award className="w-5 h-5" />, description: "Sua solicitação foi qualificada. O orçamento está sendo finalizado." },
  closed: { label: "Fechado", color: "text-muted-foreground bg-accent", icon: <CheckCircle className="w-5 h-5" />, description: "Este processo foi concluído. Obrigado pela confiança!" },
};

export default function Protocol() {
  const [protocolInput, setProtocolInput] = useState("");
  const [searchProtocol, setSearchProtocol] = useState("");

  const leadQuery = trpc.b2b.lookup.useQuery(
    { protocol: searchProtocol },
    { enabled: searchProtocol.length > 0 }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (protocolInput.trim()) {
      setSearchProtocol(protocolInput.trim());
    }
  };

  const lead = leadQuery.data;
  const notFound = searchProtocol && !leadQuery.isLoading && !lead;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-24 md:pt-32 pb-10 md:pb-16 bg-secondary">
        <div className="container">
          <Breadcrumbs items={[{ label: "Consultar Protocolo" }]} />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-headline text-foreground mb-4">Consultar Protocolo</h1>
            <p className="text-body-large text-muted-foreground max-w-xl mx-auto">
              Digite o número de protocolo recebido para acompanhar o status da sua solicitação.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-10 md:py-16 bg-background">
        <div className="container max-w-xl mx-auto">
          {/* Search Form */}
          <motion.form
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            onSubmit={handleSearch}
            className="flex gap-2 mb-10"
          >
            <input
              type="text"
              value={protocolInput}
              onChange={(e) => setProtocolInput(e.target.value.toUpperCase())}
              placeholder="Ex: NXT-20260707-A1B2C"
              className="flex-1 px-5 py-3.5 bg-accent border border-border rounded-2xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#0071E3] transition-colors font-mono tracking-wide"
            />
            <button
              type="submit"
              disabled={!protocolInput.trim() || leadQuery.isLoading}
              className="apple-btn apple-btn-primary py-3.5 px-6 disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
            </button>
          </motion.form>

          {/* Loading */}
          {leadQuery.isLoading && (
            <div className="text-center py-10">
              <div className="w-8 h-8 border-2 border-[#0071E3] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Buscando protocolo...</p>
            </div>
          )}

          {/* Result */}
          <AnimatePresence mode="wait">
            {lead && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="bento-card !p-6 md:!p-8"
              >
                {/* Status Badge */}
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs font-mono text-muted-foreground">{lead.protocol}</span>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${statusConfig[lead.status]?.color || statusConfig.new.color}`}>
                    {statusConfig[lead.status]?.icon}
                    {statusConfig[lead.status]?.label || "Novo"}
                  </span>
                </div>

                {/* Info */}
                <h3 className="text-lg font-semibold text-foreground mb-1">{lead.companyName}</h3>
                <p className="text-sm text-muted-foreground mb-6">Contato: {lead.contactName}</p>

                {/* Status Description */}
                <div className="bg-accent rounded-xl p-4 mb-6">
                  <p className="text-sm text-foreground/80">
                    {statusConfig[lead.status]?.description || statusConfig.new.description}
                  </p>
                </div>

                {/* Timeline */}
                <div className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Histórico</p>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#0071E3]" />
                    <span className="text-sm text-muted-foreground">
                      Solicitação recebida em {new Date(lead.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Not Found */}
            {notFound && (
              <motion.div
                key="not-found"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="text-center py-10"
              >
                <XCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-foreground font-medium mb-2">Protocolo não encontrado</p>
                <p className="text-sm text-muted-foreground">
                  Verifique se o número foi digitado corretamente (formato: NXT-XXXXXXXX-XXXXX).
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <Footer />
    </div>
  );
}

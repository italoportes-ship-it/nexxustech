import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { Building2, Users, HeadphonesIcon, FileText, ArrowRight, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";

export default function B2B() {
  const submitLead = trpc.b2b.submit.useMutation();
  const [form, setForm] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    employees: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitLead.mutate(form, {
      onSuccess: () => {
        toast.success("Solicitação enviada com sucesso! Nossa equipe entrará em contato em breve.");
        setForm({ companyName: "", contactName: "", email: "", phone: "", employees: "", message: "" });
      },
      onError: () => {
        toast.error("Erro ao enviar. Verifique os campos e tente novamente.");
      },
    });
  };

  const benefits = [
    { icon: <Building2 className="w-6 h-6" />, title: "Licenciamento em Volume", desc: "Preços especiais para grandes quantidades de licenças." },
    { icon: <Users className="w-6 h-6" />, title: "Gestão Centralizada", desc: "Painel único para gerenciar todas as licenças da empresa." },
    { icon: <HeadphonesIcon className="w-6 h-6" />, title: "Suporte Dedicado", desc: "Equipe técnica exclusiva para sua empresa." },
    { icon: <FileText className="w-6 h-6" />, title: "Nota Fiscal", desc: "Emissão de NF para todas as compras corporativas." },
  ];

  return (
    <div className="min-h-screen bg-[#1D1D1F]">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-20 bg-[#0a0a0a] relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-[#0071E3]/5 rounded-full blur-[100px]" />
        </div>
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <p className="text-[#0071E3] text-sm font-medium tracking-wide uppercase mb-4">
              Soluções Corporativas
            </p>
            <h1 className="text-headline text-white mb-6">
              Tecnologia sob medida
              <br />para sua empresa.
            </h1>
            <p className="text-body-large text-white/50 max-w-2xl">
              Pacotes corporativos com licenciamento em volume, suporte dedicado e condições especiais para equipes de todos os tamanhos.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-[#1D1D1F]">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bento-card text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#0071E3]/10 flex items-center justify-center text-[#0071E3] mx-auto mb-4">
                  {item.icon}
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-xs text-white/50">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-20 bg-[#0a0a0a]">
        <div className="container">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-title text-white mb-4">Solicitar Orçamento</h2>
              <p className="text-sm text-white/50">
                Preencha o formulário e nossa equipe comercial entrará em contato em até 24h.
              </p>
            </motion.div>

            <motion.form
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-2">Nome da Empresa *</label>
                  <input
                    type="text"
                    required
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#0071E3] transition-colors"
                    placeholder="Sua empresa"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-2">Nome do Contato *</label>
                  <input
                    type="text"
                    required
                    value={form.contactName}
                    onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#0071E3] transition-colors"
                    placeholder="Seu nome"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-2">E-mail Corporativo *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#0071E3] transition-colors"
                    placeholder="email@empresa.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-2">Telefone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#0071E3] transition-colors"
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/60 mb-2">Número de Funcionários</label>
                <select
                  value={form.employees}
                  onChange={(e) => setForm({ ...form, employees: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#0071E3] transition-colors"
                >
                  <option value="" className="bg-[#1D1D1F]">Selecione</option>
                  <option value="1-10" className="bg-[#1D1D1F]">1 - 10</option>
                  <option value="11-50" className="bg-[#1D1D1F]">11 - 50</option>
                  <option value="51-200" className="bg-[#1D1D1F]">51 - 200</option>
                  <option value="201-500" className="bg-[#1D1D1F]">201 - 500</option>
                  <option value="500+" className="bg-[#1D1D1F]">500+</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/60 mb-2">Mensagem</label>
                <textarea
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#0071E3] transition-colors resize-none"
                  placeholder="Descreva suas necessidades..."
                />
              </div>

              <button
                type="submit"
                disabled={submitLead.isPending}
                className="apple-btn apple-btn-primary w-full text-base py-4 disabled:opacity-50"
              >
                {submitLead.isPending ? "Enviando..." : "Enviar Solicitação"}
              </button>
            </motion.form>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

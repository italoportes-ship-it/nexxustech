import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { Building2, Users, HeadphonesIcon, FileText, ArrowRight, Check, CheckCircle, Copy, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

const fadeInUp = {
  hidden: { opacity: 0, y: 40, filter: "blur(10px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const cardReveal = {
  hidden: { opacity: 0, y: 25, scale: 0.94, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] },
  },
};

function hasAmplerInterest() {
  return typeof window !== "undefined" && new URLSearchParams(window.location.search).get("produto") === "ampler";
}

export default function B2B() {
  const submitLead = trpc.b2b.submit.useMutation();
  const isAmplerInterest = hasAmplerInterest();
  const formStartedAt = useRef(Date.now());
  const [website, setWebsite] = useState("");
  const [form, setForm] = useState(() => ({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    employees: "",
    message: isAmplerInterest ? "Tenho interesse em uma demonstração e orçamento do Ampler para minha equipe." : "",
  }));
  const [submitted, setSubmitted] = useState(false);
  const [protocol, setProtocol] = useState("");
  const [submittedName, setSubmittedName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitLead.mutate({ ...form, website, formStartedAt: formStartedAt.current }, {
      onSuccess: (data) => {
        setProtocol(data.protocol || "");
        setSubmittedName(form.contactName);
        setSubmitted(true);
        setForm({ companyName: "", contactName: "", email: "", phone: "", employees: "", message: "" });
        setWebsite("");
        formStartedAt.current = Date.now();
      },
      onError: () => {
        toast.error("Erro ao enviar. Verifique os campos e tente novamente.");
      },
    });
  };

  const copyProtocol = () => {
    navigator.clipboard.writeText(protocol);
    toast.success("Protocolo copiado!");
  };

  // Confirmation page after successful submission
  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <section className="pt-24 md:pt-32 pb-16 md:pb-24">
          <div className="container max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              className="text-center"
            >
              {/* Success icon */}
              <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-8">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>

              <h1 className="text-headline text-foreground mb-4">
                Solicitação Enviada!
              </h1>
              <p className="text-body-large text-muted-foreground mb-10">
                Obrigado, {submittedName}. Nossa equipe comercial analisará o contexto e retornará com os próximos passos.
              </p>

              {/* Protocol card */}
              <div className="bento-card !p-8 mb-8 text-center">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Número de Protocolo
                </p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl md:text-3xl font-bold text-foreground tracking-wide font-mono">
                    {protocol}
                  </span>
                  <button
                    onClick={copyProtocol}
                    className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    title="Copiar protocolo"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Guarde este número para acompanhar sua solicitação.
                </p>
              </div>

              {/* Next steps */}
              <div className="bento-card !p-6 text-left mb-10">
                <h3 className="text-sm font-semibold text-foreground mb-4">Próximos passos</h3>
                <div className="space-y-3">
                  {[
                    "Nossa equipe analisará sua solicitação e preparará um orçamento personalizado.",
                    "Você receberá um contato para alinhar aplicativos, usuários e necessidades de implantação.",
                    "Após a definição do escopo, apresentamos a proposta de licenciamento e suporte.",
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#0071E3]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-[#0071E3]">{i + 1}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/protocolo">
                  <span className="apple-btn apple-btn-primary px-6 py-3">
                    Consultar Status
                  </span>
                </Link>
                <Link href="/">
                  <span className="apple-btn apple-btn-secondary text-[#0071E3]">
                    Voltar ao Início <ArrowRight className="w-4 h-4 inline ml-1" />
                  </span>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  const benefits = [
    { icon: <Building2 className="w-6 h-6" />, title: "Licenciamento por Usuário", desc: "Dimensionado conforme aplicativos e quantidade de usuários." },
    { icon: <Users className="w-6 h-6" />, title: "Gestão de Assentos", desc: "Administração centralizada das licenças contratadas." },
    { icon: <HeadphonesIcon className="w-6 h-6" />, title: "Implantação Consultiva", desc: "Diagnóstico de módulos, conteúdo e governança da organização." },
    { icon: <FileText className="w-6 h-6" />, title: "Orçamento no Brasil", desc: "Proposta comercial conforme o escopo validado com a equipe." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-24 md:pt-32 pb-12 md:pb-20 bg-secondary relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-[#0071E3]/5 rounded-full blur-[100px]" />
        </div>
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="max-w-3xl"
          >
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-[#0071E3] text-sm font-medium tracking-wide uppercase mb-4"
            >
              {isAmplerInterest ? "Ampler para empresas" : "Soluções Corporativas"}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 25, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="text-headline text-foreground mb-6"
            >
              {isAmplerInterest ? (
                <>Veja o Ampler aplicado<br />ao seu fluxo de trabalho.</>
              ) : (
                <>Tecnologia sob medida<br />para sua empresa.</>
              )}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-body-large text-muted-foreground max-w-2xl"
            >
              {isAmplerInterest
                ? "Conte quantas pessoas usam PowerPoint, Excel, Word ou Outlook e receba uma recomendação de módulos, implantação e licenciamento."
                : "Pacotes corporativos com licenciamento em volume, suporte dedicado e condições especiais para equipes de todos os tamanhos."}
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-12 md:py-20 bg-background">
        <div className="container">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
          >
            {benefits.map((item, index) => (
              <motion.div
                key={index}
                variants={cardReveal}
                className="bento-card text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#0071E3]/10 flex items-center justify-center text-[#0071E3] mx-auto mb-4">
                  {item.icon}
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-12 md:py-20 bg-secondary">
        <div className="container">
          <div className="max-w-2xl mx-auto">
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] }}
              className="text-center mb-12"
            >
              <h2 className="text-title text-foreground mb-4">{isAmplerInterest ? "Solicitar demonstração do Ampler" : "Solicitar Orçamento"}</h2>
              <p className="text-sm text-muted-foreground">
                {isAmplerInterest
                  ? "Preencha os dados e nossa equipe preparará uma conversa direcionada ao seu ambiente Microsoft Office."
                  : "Preencha o formulário e nossa equipe comercial entrará em contato em até 24h."}
              </p>
            </motion.div>

            <motion.form
              initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.23, 1, 0.32, 1] }}
              onSubmit={handleSubmit}
              className="relative space-y-5"
            >
              <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
                <label htmlFor="b2b-website">Website</label>
                <input
                  id="b2b-website"
                  name="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-2">Nome da Empresa *</label>
                  <input
                    type="text"
                    required
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    className="w-full px-4 py-3 bg-accent border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#0071E3] transition-colors"
                    placeholder="Sua empresa"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-2">Nome do Contato *</label>
                  <input
                    type="text"
                    required
                    value={form.contactName}
                    onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                    className="w-full px-4 py-3 bg-accent border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#0071E3] transition-colors"
                    placeholder="Seu nome"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-2">E-mail Corporativo *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 bg-accent border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#0071E3] transition-colors"
                    placeholder="email@empresa.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-2">Telefone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-accent border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#0071E3] transition-colors"
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">Número de Funcionários</label>
                <select
                  value={form.employees}
                  onChange={(e) => setForm({ ...form, employees: e.target.value })}
                  className="w-full px-4 py-3 bg-accent border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-[#0071E3] transition-colors"
                >
                  <option value="" className="bg-background">Selecione</option>
                  <option value="1-10" className="bg-background">1 - 10</option>
                  <option value="11-50" className="bg-background">11 - 50</option>
                  <option value="51-200" className="bg-background">51 - 200</option>
                  <option value="201-500" className="bg-background">201 - 500</option>
                  <option value="500+" className="bg-background">500+</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">Mensagem</label>
                <textarea
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full px-4 py-3 bg-accent border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#0071E3] transition-colors resize-none"
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

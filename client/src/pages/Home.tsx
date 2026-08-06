import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Seo from "@/components/Seo";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  BriefcaseBusiness,
  Building2,
  Check,
  FileSpreadsheet,
  FileText,
  Layers3,
  Mail,
  Presentation,
  ScanSearch,
  Sparkles,
  Users,
} from "lucide-react";

const HERO_IMAGE = "/manus-storage/ampler-hero_2ba32fe5.png";
const AMPLER_LOGO = "/manus-storage/ampler-logo-official_40fe246e.webp";

const fadeUp = {
  hidden: { opacity: 0, y: 28, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

const officeApps = [
  { icon: Presentation, name: "PowerPoint", detail: "Slides, gráficos e consistência" },
  { icon: FileSpreadsheet, name: "Excel", detail: "Modelos e produtividade" },
  { icon: FileText, name: "Word", detail: "Documentos padronizados" },
  { icon: Mail, name: "Outlook", detail: "Assinaturas e organização" },
];

const capabilities = [
  {
    icon: Sparkles,
    title: "150+ ferramentas para PowerPoint",
    description: "Automatize formatação, alinhamento, verificações de consistência e tarefas recorrentes.",
  },
  {
    icon: Layers3,
    title: "Biblioteca corporativa",
    description: "Centralize slides, formas, layouts, imagens e ícones para toda a organização.",
  },
  {
    icon: ScanSearch,
    title: "Scan & Fix",
    description: "Identifique inconsistências e prepare apresentações com padrão profissional.",
  },
  {
    icon: BarChart3,
    title: "Ampler Charts",
    description: "Crie gráficos e visualizações, incluindo Gantt, com layouts reutilizáveis.",
  },
  {
    icon: BookOpenCheck,
    title: "Agenda e Storyboard",
    description: "Estruture a narrativa e atualize páginas de agenda com menos trabalho manual.",
  },
  {
    icon: Building2,
    title: "Padrões compartilhados",
    description: "Distribua templates e conteúdo aprovado para manter a identidade visual da empresa.",
  },
];

const audiences = [
  "Consultoria",
  "Finanças",
  "Estratégia",
  "Vendas",
  "PMO",
  "Times corporativos",
];

export default function Home() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "NexxusTECH",
        url: `${window.location.origin}/`,
      },
      {
        "@type": "SoftwareApplication",
        name: "Ampler",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Windows / Microsoft Office",
        description:
          "Plataforma de produtividade para PowerPoint, Excel, Word e Outlook com biblioteca corporativa, gráficos e recursos de consistência.",
        url: `${window.location.origin}/produto/ampler`,
        image: new URL(HERO_IMAGE, window.location.origin).toString(),
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "BRL",
          description: "Preço sob consulta conforme módulos e quantidade de usuários.",
          availability: "https://schema.org/InStock",
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Seo
        title="Ampler para Microsoft Office | Produtividade e Consistência | NexxusTECH"
        description="Conheça o Ampler para PowerPoint, Excel, Word e Outlook. Automatize apresentações, padronize conteúdos e solicite uma demonstração com a NexxusTECH."
        canonicalPath="/"
        image={HERO_IMAGE}
        keywords="Ampler, Ampler PowerPoint, produtividade Microsoft Office, add-in PowerPoint, gráficos PowerPoint, biblioteca de slides, Scan & Fix"
        schema={schema}
      />
      <Navbar />

      <main>
        <section className="relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-28">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(0,113,227,0.20),transparent_34%),radial-gradient(circle_at_30%_70%,rgba(236,72,153,0.10),transparent_28%)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background" />

          <div className="container relative z-10 grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
            >
              <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 backdrop-blur-xl">
                <span className="h-2 w-2 rounded-full bg-[#54d6c7] shadow-[0_0_18px_rgba(84,214,199,0.75)]" />
                <span className="text-xs font-medium uppercase tracking-[0.18em] text-foreground/70">
                  Ampler para Microsoft Office
                </span>
              </div>

              <img src={AMPLER_LOGO} alt="Ampler" className="mb-8 h-auto w-40 md:w-52" />

              <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl md:text-6xl lg:text-[4.6rem] lg:leading-[0.98]">
                Menos formatação.
                <span className="mt-2 block bg-gradient-to-r from-[#60d7ce] via-[#58a9ff] to-[#ec70b9] bg-clip-text text-transparent">
                  Mais trabalho que gera valor.
                </span>
              </h1>

              <p className="mt-7 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
                Crie apresentações, planilhas e documentos profissionais com ferramentas inteligentes,
                biblioteca corporativa e padrões que acompanham toda a organização.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="/b2b?produto=ampler" className="apple-btn apple-btn-primary justify-center px-7 py-3.5 text-base">
                  Solicitar demonstração <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link href="/produto/ampler" className="apple-btn apple-btn-secondary justify-center px-7 py-3.5 text-base">
                  Explorar recursos
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-foreground/55">
                <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#54d6c7]" /> Teste oficial de 30 dias</span>
                <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#54d6c7]" /> Office 2007–2021 e Microsoft 365</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.94, x: 24 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.85, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
              className="relative"
            >
              <div className="absolute -inset-8 rounded-[3rem] bg-[#0071E3]/10 blur-3xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] p-2 shadow-2xl shadow-black/30 backdrop-blur-xl">
                <img
                  src={HERO_IMAGE}
                  alt="Composição visual de apresentações, gráficos e documentos representando a produtividade do Ampler"
                  className="aspect-video w-full rounded-[1.55rem] object-cover"
                />
              </div>
            </motion.div>
          </div>
        </section>

        <section className="border-y border-white/5 bg-white/[0.015] py-8">
          <div className="container grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {officeApps.map(({ icon: Icon, name, detail }) => (
              <div key={name} className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.025] p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0071E3]/10 text-[#58a9ff]">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{name}</p>
                  <p className="text-xs text-muted-foreground">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="recursos" className="py-20 md:py-28">
          <div className="container">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6 }}
              className="mx-auto max-w-3xl text-center"
            >
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#58a9ff]">Uma suíte. Vários fluxos.</p>
              <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white md:text-5xl">
                Do slide em branco ao arquivo pronto para o cliente.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground md:text-lg">
                O Ampler reúne produtividade individual, conteúdo corporativo e controle de qualidade em uma experiência integrada ao Microsoft Office.
              </p>
            </motion.div>

            <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {capabilities.map(({ icon: Icon, title, description }, index) => (
                <motion.article
                  key={title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.45, delay: index * 0.04 }}
                  className="group rounded-3xl border border-white/7 bg-gradient-to-b from-white/[0.045] to-white/[0.018] p-6 transition-colors hover:border-[#58a9ff]/30"
                >
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0071E3]/10 text-[#58a9ff]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-secondary py-20 md:py-28">
          <div className="container grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <div>
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#54d6c7]">Conteúdo onde o trabalho acontece</p>
              <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white md:text-5xl">
                Pare de procurar slides. Comece a construir argumentos.
              </h2>
              <p className="mt-6 text-base leading-relaxed text-muted-foreground">
                A biblioteca do Ampler leva conteúdo aprovado para dentro do Office e pode conectar fontes como SharePoint, OneDrive e Google Drive. Templates, slides e elementos passam a ser reutilizáveis por toda a equipe.
              </p>
              <div className="mt-8 space-y-4">
                {["Templates e slides aprovados", "Acesso direto no Microsoft Office", "Mais consistência entre equipes"].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm text-foreground/75">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#54d6c7]/10"><Check className="h-3.5 w-3.5 text-[#54d6c7]" /></span>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/8 bg-background/70 p-6 sm:row-span-2">
                <Users className="h-7 w-7 text-[#58a9ff]" />
                <p className="mt-8 text-4xl font-semibold tracking-tight text-white">Um padrão</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">para apresentações, documentos e conteúdos compartilhados por toda a organização.</p>
              </div>
              <div className="rounded-3xl border border-white/8 bg-background/70 p-6">
                <BriefcaseBusiness className="h-6 w-6 text-[#ec70b9]" />
                <p className="mt-6 text-lg font-semibold text-white">Foco no insight</p>
                <p className="mt-2 text-sm text-muted-foreground">Menos tempo em tarefas repetitivas.</p>
              </div>
              <div className="rounded-3xl border border-white/8 bg-background/70 p-6">
                <ScanSearch className="h-6 w-6 text-[#54d6c7]" />
                <p className="mt-6 text-lg font-semibold text-white">Qualidade consistente</p>
                <p className="mt-2 text-sm text-muted-foreground">Verificações antes de entregar.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 md:py-28">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#58a9ff]">Para equipes que vivem de clareza</p>
              <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white md:text-5xl">
                Produtividade para quem precisa comunicar decisões.
              </h2>
            </div>
            <div className="mx-auto mt-10 flex max-w-4xl flex-wrap justify-center gap-3">
              {audiences.map((audience) => (
                <span key={audience} className="rounded-full border border-white/8 bg-white/[0.025] px-5 py-3 text-sm text-foreground/70">
                  {audience}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-20 md:pb-28">
          <div className="container">
            <div className="relative overflow-hidden rounded-[2rem] border border-[#58a9ff]/20 bg-gradient-to-br from-[#0b2034] via-[#101923] to-[#251428] px-6 py-14 text-center md:px-12 md:py-20">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(88,169,255,0.18),transparent_45%)]" />
              <div className="relative z-10 mx-auto max-w-3xl">
                <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white md:text-5xl">
                  Veja o Ampler aplicado ao seu fluxo de trabalho.
                </h2>
                <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/60">
                  Conte quantas pessoas usam PowerPoint, Excel, Word ou Outlook e receba uma recomendação de módulos, implantação e licenciamento.
                </p>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                  <Link href="/b2b?produto=ampler" className="apple-btn apple-btn-primary justify-center px-7 py-3.5 text-base">
                    Solicitar demonstração
                  </Link>
                  <Link href="/comparar" className="apple-btn apple-btn-secondary justify-center px-7 py-3.5 text-base">
                    Comparar abordagens
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

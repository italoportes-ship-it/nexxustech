import Breadcrumbs from "@/components/Breadcrumbs";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Seo from "@/components/Seo";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

type FAQItem = { category: string; question: string; answer: string };

const faqItems: FAQItem[] = [
  {
    category: "Produto",
    question: "O que é o Ampler?",
    answer: "Ampler é uma plataforma de produtividade para Microsoft Office. Ela reúne ferramentas para PowerPoint, Excel, Word e Outlook, além do Ampler Charts.",
  },
  {
    category: "Produto",
    question: "Quais recursos estão disponíveis no PowerPoint?",
    answer: "O Ampler oferece mais de 150 ferramentas para PowerPoint, biblioteca corporativa, Agenda, Storyboard, gráficos, barra personalizável e Scan & Fix para identificar inconsistências de formatação.",
  },
  {
    category: "Produto",
    question: "É possível centralizar templates e slides corporativos?",
    answer: "Sim. A biblioteca do Ampler pode reunir slides, formas, layouts, imagens e ícones e também conectar conteúdo de SharePoint, OneDrive e Google Drive.",
  },
  {
    category: "Compatibilidade",
    question: "Quais versões do Microsoft Office são suportadas?",
    answer: "A página oficial de download oferece o instalador para Office 2007–2021 e Microsoft 365. Requisitos adicionais de implantação devem ser confirmados durante o diagnóstico técnico.",
  },
  {
    category: "Compatibilidade",
    question: "O Ampler funciona com apresentações já existentes?",
    answer: "O Ampler é instalado como uma guia no Microsoft Office e trabalha dentro do PowerPoint. A compatibilidade específica deve seguir a versão suportada do Office e as políticas do ambiente corporativo.",
  },
  {
    category: "Licenciamento",
    question: "Como funciona a contratação no Brasil?",
    answer: "A NexxusTECH dimensiona aplicativos, quantidade de usuários, biblioteca corporativa e necessidades de implantação antes de apresentar o orçamento.",
  },
  {
    category: "Licenciamento",
    question: "Existe avaliação gratuita?",
    answer: "A página oficial do fabricante informa avaliação gratuita com funcionalidade completa por 30 dias. A disponibilidade e o processo de ativação são confirmados durante o atendimento.",
  },
  {
    category: "Implantação",
    question: "A NexxusTECH ajuda na implantação?",
    answer: "Sim. O atendimento começa com um diagnóstico do ambiente, dos módulos e do conteúdo corporativo. O escopo e os prazos são definidos na proposta, sem promessas genéricas de SLA.",
  },
];

const categories = Array.from(new Set(faqItems.map((item) => item.category)));

function AccordionItem({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-border last:border-0">
      <button onClick={onToggle} className="group flex w-full items-center justify-between px-1 py-5 text-left">
        <span className="pr-4 text-sm font-medium text-foreground transition-colors group-hover:text-[#58a9ff] md:text-base">{item.question}</span>
        <ChevronDown className={`h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform duration-300 ${isOpen ? "rotate-180 text-[#58a9ff]" : ""}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <p className="px-1 pb-5 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const filteredItems = activeCategory ? faqItems.filter((item) => item.category === activeCategory) : faqItems;
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Perguntas frequentes sobre o Ampler | NexxusTECH"
        description="Tire dúvidas sobre recursos, compatibilidade, licenciamento e implantação do Ampler para Microsoft Office."
        canonicalPath="/faq"
        image="/manus-storage/ampler-hero_2ba32fe5.png"
        schema={schema}
      />
      <Navbar />

      <main>
        <section className="bg-secondary pt-24 pb-10 md:pt-32 md:pb-16">
          <div className="container">
            <Breadcrumbs items={[{ label: "Ampler", href: "/produto/ampler" }, { label: "FAQ" }]} />
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#58a9ff]">Ampler sem dúvidas</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-white md:text-6xl">Perguntas frequentes</h1>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">Respostas baseadas no Product Decision Sheet e em informações oficiais do fabricante.</p>
            </motion.div>
          </div>
        </section>

        <section className="sticky top-14 z-40 border-b border-border bg-background/85 py-5 backdrop-blur-xl">
          <div className="container flex gap-2 overflow-x-auto scrollbar-hide">
            <button onClick={() => setActiveCategory(null)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all ${!activeCategory ? "bg-[#0071E3] text-white" : "bg-accent text-muted-foreground hover:text-foreground"}`}>Todas</button>
            {categories.map((category) => (
              <button key={category} onClick={() => setActiveCategory(category)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all ${activeCategory === category ? "bg-[#0071E3] text-white" : "bg-accent text-muted-foreground hover:text-foreground"}`}>{category}</button>
            ))}
          </div>
        </section>

        <section className="py-12 md:py-20">
          <div className="container mx-auto max-w-3xl">
            <motion.div key={activeCategory || "all"} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bento-card !p-6 md:!p-8">
              {filteredItems.map((item, index) => (
                <AccordionItem key={`${item.category}-${item.question}`} item={item} isOpen={openIndex === index} onToggle={() => setOpenIndex(openIndex === index ? null : index)} />
              ))}
            </motion.div>

            <div className="mt-12 bento-card !p-8 text-center">
              <HelpCircle className="mx-auto mb-4 h-10 w-10 text-[#58a9ff]" />
              <h2 className="text-lg font-semibold text-foreground">Quer avaliar o Ampler no seu ambiente?</h2>
              <p className="mx-auto mb-6 mt-2 max-w-lg text-sm text-muted-foreground">Nossa equipe prepara uma demonstração direcionada aos aplicativos, usuários e padrões da sua organização.</p>
              <Link href="/b2b?produto=ampler" className="apple-btn apple-btn-primary px-6 py-3">Solicitar demonstração</Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

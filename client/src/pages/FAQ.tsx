import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqItems: FAQItem[] = [
  {
    category: "Licenciamento",
    question: "Como funciona o licenciamento de software?",
    answer: "Ao adquirir um software na NexxusTECH, você recebe uma licença digital que é ativada imediatamente após a confirmação do pagamento. As licenças são perpétuas (uso vitalício) ou por assinatura, dependendo do produto. Todas as informações de ativação ficam disponíveis na sua Área do Cliente.",
  },
  {
    category: "Licenciamento",
    question: "Posso usar a mesma licença em vários dispositivos?",
    answer: "Depende do tipo de licença adquirida. Licenças individuais geralmente permitem instalação em 1 a 3 dispositivos do mesmo usuário. Para uso em múltiplos dispositivos ou equipes, recomendamos o licenciamento em volume através da nossa seção B2B.",
  },
  {
    category: "Licenciamento",
    question: "O que é o licenciamento em volume para empresas?",
    answer: "O licenciamento em volume é uma modalidade especial para empresas que precisam de múltiplas licenças. Oferecemos preços progressivos, gestão centralizada de licenças, suporte dedicado e emissão de nota fiscal. Entre em contato pela seção Empresas para um orçamento personalizado.",
  },
  {
    category: "Pagamentos",
    question: "Quais formas de pagamento são aceitas?",
    answer: "Aceitamos cartão de crédito (Visa, Mastercard, American Express) e cartão de débito através do Stripe, nosso processador de pagamentos. Todas as transações são criptografadas e seguras.",
  },
  {
    category: "Pagamentos",
    question: "Posso parcelar minha compra?",
    answer: "Sim, compras com cartão de crédito podem ser parceladas em até 12x, dependendo do valor e da bandeira do cartão. O parcelamento é processado diretamente pelo Stripe com total segurança.",
  },
  {
    category: "Pagamentos",
    question: "Como solicitar reembolso?",
    answer: "Oferecemos garantia de satisfação de 7 dias para todos os produtos. Caso não esteja satisfeito, entre em contato pelo chatbot ou pela seção de contato e processaremos o reembolso integral em até 5 dias úteis.",
  },
  {
    category: "Cursos",
    question: "Como acesso os cursos após a compra?",
    answer: "Após a confirmação do pagamento, o acesso ao curso é liberado imediatamente na sua Área do Cliente. Você pode assistir às aulas quantas vezes quiser, sem limite de tempo.",
  },
  {
    category: "Cursos",
    question: "Os cursos oferecem certificado?",
    answer: "Sim, todos os cursos da NexxusTECH oferecem certificado de conclusão digital após completar todos os módulos e avaliações. O certificado pode ser compartilhado no LinkedIn e em outras plataformas profissionais.",
  },
  {
    category: "Suporte",
    question: "Como entrar em contato com o suporte técnico?",
    answer: "Você pode usar nosso chatbot inteligente disponível 24/7 para dúvidas rápidas, ou entrar em contato pela seção Empresas para suporte dedicado. Clientes B2B têm acesso a um canal exclusivo de atendimento com SLA garantido.",
  },
  {
    category: "Suporte",
    question: "Qual o prazo de resposta do suporte?",
    answer: "Para clientes individuais, o prazo é de até 24 horas úteis. Clientes B2B com plano de suporte dedicado têm SLA de 4 horas para questões críticas e 8 horas para questões gerais.",
  },
];

const categories = Array.from(new Set(faqItems.map((item) => item.category)));

function AccordionItem({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-5 px-1 text-left group"
      >
        <span className="text-sm md:text-base font-medium text-foreground pr-4 group-hover:text-[#0071E3] transition-colors">
          {item.question}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform duration-300 ${
            isOpen ? "rotate-180 text-[#0071E3]" : ""
          }`}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden"
          >
            <p className="text-sm text-muted-foreground leading-relaxed pb-5 px-1">
              {item.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredItems = activeCategory
    ? faqItems.filter((item) => item.category === activeCategory)
    : faqItems;

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="pt-24 md:pt-32 pb-10 md:pb-16 bg-secondary">
        <div className="container">
          <Breadcrumbs items={[{ label: "FAQ" }]} />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-headline text-foreground mb-4">Perguntas Frequentes</h1>
            <p className="text-body-large text-muted-foreground max-w-2xl mx-auto">
              Encontre respostas para as dúvidas mais comuns sobre nossos produtos e serviços.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-6 bg-background border-b border-border sticky top-14 z-40 glass">
        <div className="container">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                !activeCategory
                  ? "bg-[#0071E3] text-white"
                  : "bg-accent text-muted-foreground hover:text-foreground"
              }`}
            >
              Todas
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeCategory === cat
                    ? "bg-[#0071E3] text-white"
                    : "bg-accent text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Items */}
      <section className="py-10 md:py-16 bg-background">
        <div className="container max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bento-card !p-6 md:!p-8"
          >
            {filteredItems.map((item, index) => (
              <AccordionItem
                key={`${activeCategory}-${index}`}
                item={item}
                isOpen={openIndex === index}
                onToggle={() => handleToggle(index)}
              />
            ))}
          </motion.div>

          {/* Contact CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center mt-12"
          >
            <div className="bento-card !p-8 text-center">
              <HelpCircle className="w-10 h-10 text-[#0071E3] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Não encontrou sua resposta?
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Use nosso chatbot inteligente ou entre em contato com nossa equipe.
              </p>
              <a href="/b2b" className="apple-btn apple-btn-primary">
                Falar com a Equipe
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Shield, Code, Palette, BarChart3, ArrowRight, Zap, Globe, Award } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import AnimatedCounter from "@/components/AnimatedCounter";
import Testimonials from "@/components/Testimonials";

const categoryIcons: Record<string, React.ReactNode> = {
  Shield: <Shield className="w-6 h-6" />,
  Code: <Code className="w-6 h-6" />,
  Palette: <Palette className="w-6 h-6" />,
  BarChart3: <BarChart3 className="w-6 h-6" />,
};

// Reusable animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 40, filter: "blur(10px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

const fadeInScale = {
  hidden: { opacity: 0, scale: 0.92, filter: "blur(8px)" },
  visible: { opacity: 1, scale: 1, filter: "blur(0px)" },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 30, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] },
  },
};

export default function Home() {
  const categoriesQuery = trpc.categories.list.useQuery();
  const productsQuery = trpc.products.list.useQuery();
  const categories = categoriesQuery.data || [];
  const products = (productsQuery.data || []).slice(0, 6);

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"] as any,
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 60]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section - Apple Style with parallax */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-14">
        {/* Background gradient */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background dark:from-[#0a0a0a] dark:via-[#1D1D1F] dark:to-[#1D1D1F]" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#0071E3]/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#0071E3]/5 rounded-full blur-[80px]" />
        </div>

        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
          className="container relative z-10 text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 40, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
            className="max-w-4xl mx-auto"
          >
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-[#0071E3] text-sm font-medium tracking-wide uppercase mb-6"
            >
              Plataforma Premium de Tecnologia
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="text-display text-foreground mb-6"
            >
              Softwares e cursos
              <br />
              <span className="bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent">
                que transformam negócios.
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="text-body-large text-muted-foreground max-w-2xl mx-auto mb-10"
            >
              Descubra as melhores soluções em infraestrutura, desenvolvimento, design e análise de dados. Para profissionais e empresas que exigem excelência.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link href="/softwares">
                <span className="apple-btn apple-btn-primary text-base px-8 py-3.5">
                  Explorar Soluções
                </span>
              </Link>
              <Link href="/b2b">
                <span className="apple-btn apple-btn-secondary text-base text-[#0071E3]">
                  Soluções Corporativas <ArrowRight className="w-4 h-4 inline ml-1" />
                </span>
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Categories - Bento Grid with staggered scroll animations */}
      <section className="py-16 md:py-24 bg-secondary">
        <div className="container">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
            className="text-center mb-10 md:mb-16"
          >
            <h2 className="text-headline text-foreground mb-4">
              Nossas Categorias
            </h2>
            <p className="text-body-large text-muted-foreground max-w-xl mx-auto">
              Soluções organizadas para atender cada necessidade do seu negócio.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {categories.map((cat) => (
              <motion.div
                key={cat.id}
                variants={staggerItem}
              >
                <Link href={`/categoria/${cat.slug}`}>
                  <div className="bento-card group cursor-pointer h-full">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#0071E3]/10 flex items-center justify-center text-[#0071E3] group-hover:bg-[#0071E3]/20 transition-colors">
                        {categoryIcons[cat.icon || "Shield"]}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-[#0071E3] transition-colors">
                          {cat.name}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {cat.description}
                        </p>
                        <span className="inline-flex items-center gap-1 text-sm text-[#0071E3] mt-4 font-medium">
                          Explorar <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Products with staggered scroll animations */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
            className="text-center mb-10 md:mb-16"
          >
            <h2 className="text-headline text-foreground mb-4">
              Soluções em Destaque
            </h2>
            <p className="text-body-large text-muted-foreground max-w-xl mx-auto">
              Os softwares mais procurados por profissionais e empresas.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {products.map((product) => (
              <motion.div
                key={product.id}
                variants={fadeInScale}
                transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              >
                <Link href={`/produto/${product.slug}`}>
                  <div className="bento-card group cursor-pointer h-full flex flex-col">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                          product.type === "course"
                            ? "bg-green-500/10 text-green-400"
                            : "bg-[#0071E3]/10 text-[#0071E3]"
                        }`}>
                          {product.type === "course" ? "Curso" : "Software"}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-foreground mb-2 group-hover:text-[#0071E3] transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                        {product.shortDescription}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
                      <span className="text-lg font-bold text-foreground">
                        R$ {parseFloat(product.price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-sm text-[#0071E3] font-medium flex items-center gap-1">
                        Ver mais <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center mt-12"
          >
            <Link href="/softwares">
              <span className="apple-btn apple-btn-primary">
                Ver Todos os Produtos
              </span>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Trust Section with staggered animations */}
      <section className="py-16 md:py-24 bg-secondary">
        <div className="container">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
            className="text-center mb-10 md:mb-16"
          >
            <h2 className="text-headline text-foreground mb-4">
              Por que escolher a NexxusTECH?
            </h2>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              {
                icon: <Zap className="w-6 h-6" />,
                title: "Entrega Instantânea",
                description: "Acesso imediato às licenças e cursos após a confirmação do pagamento.",
              },
              {
                icon: <Globe className="w-6 h-6" />,
                title: "Suporte Especializado",
                description: "Equipe técnica dedicada para ajudar na implementação e uso das soluções.",
              },
              {
                icon: <Award className="w-6 h-6" />,
                title: "Parceiros Oficiais",
                description: "Revendedores autorizados dos principais fabricantes de software do mercado.",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                variants={fadeInScale}
                transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                className="text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#0071E3]/10 flex items-center justify-center text-[#0071E3] mx-auto mb-5">
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats Section with animated counters */}
      <section className="py-12 md:py-20 bg-background border-y border-border">
        <div className="container">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {[
              { end: 500, suffix: "+", label: "Clientes Ativos" },
              { end: 16, suffix: "", label: "Soluções Disponíveis" },
              { end: 99, suffix: "%", label: "Satisfação" },
              { end: 24, suffix: "/7", label: "Suporte" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                variants={fadeInScale}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <p className="text-3xl md:text-4xl font-bold text-foreground mb-1">
                  <AnimatedCounter end={stat.end} duration={2000} suffix={stat.suffix} />
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <Testimonials />

      {/* CTA Section */}
      <section className="py-24 bg-background relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#0071E3]/5 rounded-full blur-[100px]" />
        </div>
        <div className="container relative z-10 text-center">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          >
            <h2 className="text-headline text-foreground mb-4">
              Pronto para transformar seu negócio?
            </h2>
            <p className="text-body-large text-muted-foreground max-w-xl mx-auto mb-10">
              Converse com nossa equipe e descubra as melhores soluções para sua empresa.
            </p>
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link href="/b2b">
                <span className="apple-btn apple-btn-primary text-base px-8 py-3.5">
                  Solicitar Orçamento
                </span>
              </Link>
              <Link href="/softwares">
                <span className="apple-btn apple-btn-secondary text-base text-[#0071E3]">
                  Ver Soluções <ArrowRight className="w-4 h-4 inline ml-1" />
                </span>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

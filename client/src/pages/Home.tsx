import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Shield, Code, Palette, BarChart3, ArrowRight, Zap, Globe, Award } from "lucide-react";
import { motion } from "framer-motion";

const categoryIcons: Record<string, React.ReactNode> = {
  Shield: <Shield className="w-6 h-6" />,
  Code: <Code className="w-6 h-6" />,
  Palette: <Palette className="w-6 h-6" />,
  BarChart3: <BarChart3 className="w-6 h-6" />,
};

export default function Home() {
  const categoriesQuery = trpc.categories.list.useQuery();
  const productsQuery = trpc.products.list.useQuery();
  const categories = categoriesQuery.data || [];
  const products = (productsQuery.data || []).slice(0, 6);

  return (
    <div className="min-h-screen bg-[#1D1D1F]">
      <Navbar />

      {/* Hero Section - Apple Style */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-14">
        {/* Background gradient */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#1D1D1F] to-[#1D1D1F]" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#0071E3]/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#0071E3]/5 rounded-full blur-[80px]" />
        </div>

        <div className="container relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="max-w-4xl mx-auto"
          >
            <p className="text-[#0071E3] text-sm font-medium tracking-wide uppercase mb-6">
              Plataforma Premium de Tecnologia
            </p>
            <h1 className="text-display text-white mb-6">
              Softwares e cursos
              <br />
              <span className="bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent">
                que transformam negócios.
              </span>
            </h1>
            <p className="text-body-large text-white/60 max-w-2xl mx-auto mb-10">
              Descubra as melhores soluções em infraestrutura, desenvolvimento, design e análise de dados. Para profissionais e empresas que exigem excelência.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories - Bento Grid */}
      <section className="py-24 bg-[#0a0a0a]">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-headline text-white mb-4">
              Nossas Categorias
            </h2>
            <p className="text-body-large text-white/50 max-w-xl mx-auto">
              Soluções organizadas para atender cada necessidade do seu negócio.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categories.map((cat, index) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link href={`/categoria/${cat.slug}`}>
                  <div className="bento-card group cursor-pointer h-full">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#0071E3]/10 flex items-center justify-center text-[#0071E3] group-hover:bg-[#0071E3]/20 transition-colors">
                        {categoryIcons[cat.icon || "Shield"]}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-[#0071E3] transition-colors">
                          {cat.name}
                        </h3>
                        <p className="text-sm text-white/50 leading-relaxed">
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
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 bg-[#1D1D1F]">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-headline text-white mb-4">
              Soluções em Destaque
            </h2>
            <p className="text-body-large text-white/50 max-w-xl mx-auto">
              Os softwares mais procurados por profissionais e empresas.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
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
                      <h3 className="text-base font-semibold text-white mb-2 group-hover:text-[#0071E3] transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-sm text-white/50 leading-relaxed line-clamp-2">
                        {product.shortDescription}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
                      <span className="text-lg font-bold text-white">
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
          </div>

          <div className="text-center mt-12">
            <Link href="/softwares">
              <span className="apple-btn apple-btn-primary">
                Ver Todos os Produtos
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-24 bg-[#0a0a0a]">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-headline text-white mb-4">
              Por que escolher a NexxusTECH?
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#0071E3]/10 flex items-center justify-center text-[#0071E3] mx-auto mb-5">
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-[#1D1D1F] relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#0071E3]/5 rounded-full blur-[100px]" />
        </div>
        <div className="container relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-headline text-white mb-4">
              Pronto para transformar seu negócio?
            </h2>
            <p className="text-body-large text-white/50 max-w-xl mx-auto mb-10">
              Converse com nossa equipe e descubra as melhores soluções para sua empresa.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

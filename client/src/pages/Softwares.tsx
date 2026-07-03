import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { ArrowRight, Shield, Code, Palette, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";

const categoryIcons: Record<string, React.ReactNode> = {
  Shield: <Shield className="w-5 h-5" />,
  Code: <Code className="w-5 h-5" />,
  Palette: <Palette className="w-5 h-5" />,
  BarChart3: <BarChart3 className="w-5 h-5" />,
};

const fadeInUp = {
  hidden: { opacity: 0, y: 40, filter: "blur(10px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const cardReveal = {
  hidden: { opacity: 0, y: 30, scale: 0.95, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] },
  },
};

export default function Softwares() {
  const productsQuery = trpc.products.byType.useQuery({ type: "software" });
  const categoriesQuery = trpc.categories.list.useQuery();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const products = productsQuery.data || [];
  const categories = categoriesQuery.data || [];

  const filteredProducts = useMemo(() => {
    if (!selectedCategory) return products;
    return products.filter((p) => p.categoryId === selectedCategory);
  }, [products, selectedCategory]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="pt-24 md:pt-32 pb-10 md:pb-16 bg-secondary">
        <div className="container text-center">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] }}
          >
            <h1 className="text-headline text-foreground mb-4">Catálogo de Softwares</h1>
            <p className="text-body-large text-muted-foreground max-w-2xl mx-auto">
              Encontre as melhores soluções de software para cada necessidade do seu negócio.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 bg-background border-b border-border sticky top-14 z-40 glass">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="flex items-center gap-2 md:gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1.5 px-1.5"
          >
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                !selectedCategory
                  ? "bg-[#0071E3] text-white"
                  : "bg-accent text-muted-foreground hover:text-foreground hover:bg-white/10"
              }`}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                  selectedCategory === cat.id
                    ? "bg-[#0071E3] text-white"
                    : "bg-accent text-muted-foreground hover:text-foreground hover:bg-white/10"
                }`}
              >
                {categoryIcons[cat.icon || "Shield"]}
                {cat.name}
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-10 md:py-16 bg-background">
        <div className="container">
          <motion.div
            key={selectedCategory || "all"}
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                variants={cardReveal}
              >
                <Link href={`/produto/${product.slug}`}>
                  <div className="bento-card group cursor-pointer h-full flex flex-col">
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-foreground mb-2 group-hover:text-[#0071E3] transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-4">
                        {product.shortDescription}
                      </p>
                      {product.features && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {product.features.split(",").slice(0, 3).map((f, i) => (
                            <span key={i} className="text-xs px-2 py-1 rounded-lg bg-accent text-muted-foreground">
                              {f.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <span className="text-lg font-bold text-foreground">
                        R$ {parseFloat(product.price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-sm text-[#0071E3] font-medium flex items-center gap-1">
                        Detalhes <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {filteredProducts.length === 0 && !productsQuery.isLoading && (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">Nenhum produto encontrado nesta categoria.</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

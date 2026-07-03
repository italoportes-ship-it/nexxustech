import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import PullToRefresh from "@/components/PullToRefresh";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";
import { trpc } from "@/lib/trpc";
import { Link, useParams } from "wouter";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

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

export default function Category() {
  const params = useParams<{ slug: string }>();
  const categoryQuery = trpc.categories.getBySlug.useQuery({ slug: params.slug || "" });
  const productsQuery = trpc.products.list.useQuery();

  const category = categoryQuery.data;
  const products = (productsQuery.data || []).filter(
    (p) => category && p.categoryId === category.id
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="pt-24 md:pt-32 pb-10 md:pb-16 bg-secondary">
        <div className="container">
          <Breadcrumbs items={[
            { label: "Softwares", href: "/softwares" },
            { label: category?.name || "Categoria" },
          ]} />
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] }}
          >
            <h1 className="text-headline text-foreground mb-4">{category?.name || "Categoria"}</h1>
            <p className="text-body-large text-muted-foreground max-w-2xl">
              {category?.description}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Products */}
      <PullToRefresh onRefresh={async () => { await productsQuery.refetch(); }}>
      <section className="py-10 md:py-16 bg-background">
        <div className="container">
          {productsQuery.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ProductCardSkeleton count={6} />
            </div>
          ) : (
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
                variants={cardReveal}
              >
                <Link href={`/produto/${product.slug}`}>
                  <div className="bento-card group cursor-pointer h-full flex flex-col">
                    <div className="flex-1">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full mb-3 inline-block ${
                        product.type === "course"
                          ? "bg-green-500/10 text-green-400"
                          : "bg-[#0071E3]/10 text-[#0071E3]"
                      }`}>
                        {product.type === "course" ? "Curso" : "Software"}
                      </span>
                      <h3 className="text-base font-semibold text-foreground mb-2 group-hover:text-[#0071E3] transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-4">
                        {product.shortDescription}
                      </p>
                      {product.features && (
                        <div className="flex flex-wrap gap-1.5">
                          {product.features.split(",").slice(0, 3).map((f, i) => (
                            <span key={i} className="text-xs px-2 py-1 rounded-lg bg-accent text-muted-foreground">
                              {f.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
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
          )}
        </div>
      </section>
      </PullToRefresh>

      <Footer />
    </div>
  );
}

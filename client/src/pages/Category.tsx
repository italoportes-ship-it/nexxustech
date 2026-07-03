import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { Link, useParams } from "wouter";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function Category() {
  const params = useParams<{ slug: string }>();
  const categoryQuery = trpc.categories.getBySlug.useQuery({ slug: params.slug || "" });
  const productsQuery = trpc.products.list.useQuery();

  const category = categoryQuery.data;
  const products = (productsQuery.data || []).filter(
    (p) => category && p.categoryId === category.id
  );

  return (
    <div className="min-h-screen bg-[#1D1D1F]">
      <Navbar />

      {/* Header */}
      <section className="pt-32 pb-16 bg-[#0a0a0a]">
        <div className="container">
          <Link href="/softwares" className="inline-flex items-center gap-2 text-sm text-[#0071E3] mb-6 hover:underline">
            <ArrowLeft className="w-4 h-4" /> Voltar ao catálogo
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-headline text-white mb-4">{category?.name || "Categoria"}</h1>
            <p className="text-body-large text-white/50 max-w-2xl">
              {category?.description}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Products */}
      <section className="py-16 bg-[#1D1D1F]">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
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
                      <h3 className="text-base font-semibold text-white mb-2 group-hover:text-[#0071E3] transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-sm text-white/50 leading-relaxed line-clamp-3 mb-4">
                        {product.shortDescription}
                      </p>
                      {product.features && (
                        <div className="flex flex-wrap gap-1.5">
                          {product.features.split(",").slice(0, 3).map((f, i) => (
                            <span key={i} className="text-xs px-2 py-1 rounded-lg bg-white/5 text-white/40">
                              {f.trim()}
                            </span>
                          ))}
                        </div>
                      )}
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
        </div>
      </section>

      <Footer />
    </div>
  );
}

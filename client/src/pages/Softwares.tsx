import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Seo from "@/components/Seo";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Check, Loader2, Presentation } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

export default function Softwares() {
  const productsQuery = trpc.products.byType.useQuery({ type: "software" });
  const product = productsQuery.data?.[0];

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Ampler | Software de produtividade para Microsoft Office | NexxusTECH"
        description="Explore o Ampler para PowerPoint, Excel, Word e Outlook. Biblioteca corporativa, gráficos, Scan & Fix e ferramentas de produtividade."
        canonicalPath="/softwares"
        image={product?.imageUrl || "/manus-storage/ampler-hero_2ba32fe5.png"}
      />
      <Navbar />

      <main className="pt-24 md:pt-32">
        <section className="pb-16 md:pb-24">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mx-auto max-w-3xl text-center"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#58a9ff]">Solução exclusiva NexxusTECH</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-white md:text-6xl">Ampler para Microsoft Office</h1>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                Uma única plataforma para acelerar apresentações, planilhas e documentos e manter o padrão de conteúdo da sua organização.
              </p>
            </motion.div>

            {productsQuery.isLoading && (
              <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#58a9ff]" /></div>
            )}

            {product && (
              <motion.article
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.1 }}
                className="mt-14 overflow-hidden rounded-[2rem] border border-white/8 bg-gradient-to-br from-white/[0.05] to-white/[0.015]"
              >
                <div className="grid items-stretch lg:grid-cols-2">
                  <div className="relative min-h-[320px] overflow-hidden bg-[#07131e]">
                    <img
                      src={product.imageUrl || "/manus-storage/ampler-hero_2ba32fe5.png"}
                      alt="Ampler para produtividade no Microsoft Office"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#07131e]/80 via-transparent to-transparent" />
                  </div>

                  <div className="p-7 md:p-10 lg:p-12">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0071E3]/10 text-[#58a9ff]">
                      <Presentation className="h-5 w-5" />
                    </div>
                    <h2 className="mt-6 text-3xl font-semibold tracking-tight text-white">{product.name}</h2>
                    <p className="mt-4 text-base leading-relaxed text-muted-foreground">{product.shortDescription}</p>

                    <div className="mt-7 grid gap-3 sm:grid-cols-2">
                      {(product.features || "").split(",").slice(0, 6).map((feature) => (
                        <div key={feature} className="flex items-start gap-2.5 text-sm text-foreground/70">
                          <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#54d6c7]/10">
                            <Check className="h-3 w-3 text-[#54d6c7]" />
                          </span>
                          {feature.trim()}
                        </div>
                      ))}
                    </div>

                    <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                      <Link href={`/produto/${product.slug}`} className="apple-btn apple-btn-primary justify-center px-6 py-3">
                        Conhecer o Ampler <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                      <Link href="/b2b?produto=ampler" className="apple-btn apple-btn-secondary justify-center px-6 py-3">
                        Solicitar demonstração
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.article>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

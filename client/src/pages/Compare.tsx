import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { X, Plus, Check, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function Compare() {
  const productsQuery = trpc.products.byType.useQuery({ type: "software" });
  const products = productsQuery.data || [];
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showSelector, setShowSelector] = useState(false);

  const selectedProducts = useMemo(
    () => products.filter((p) => selectedIds.includes(p.id)),
    [products, selectedIds]
  );

  const addProduct = (id: number) => {
    if (selectedIds.length < 3 && !selectedIds.includes(id)) {
      setSelectedIds([...selectedIds, id]);
    }
    setShowSelector(false);
  };

  const removeProduct = (id: number) => {
    setSelectedIds(selectedIds.filter((i) => i !== id));
  };

  const availableProducts = products.filter((p) => !selectedIds.includes(p.id));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-24 md:pt-32 pb-10 md:pb-16 bg-secondary">
        <div className="container">
          <Breadcrumbs items={[{ label: "Softwares", href: "/softwares" }, { label: "Comparar" }]} />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-headline text-foreground mb-4">Comparar Produtos</h1>
            <p className="text-body-large text-muted-foreground max-w-2xl mx-auto">
              Selecione até 3 softwares para comparar recursos, preços e funcionalidades.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-10 md:py-16 bg-background">
        <div className="container">
          {/* Product Selector */}
          <div className="flex flex-wrap gap-4 mb-10 justify-center">
            {selectedProducts.map((product) => (
              <div key={product.id} className="bento-card !p-4 flex items-center gap-3 min-w-[200px]">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground">R$ {parseFloat(product.price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                </div>
                <button onClick={() => removeProduct(product.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {selectedIds.length < 3 && (
              <button
                onClick={() => setShowSelector(!showSelector)}
                className="bento-card !p-4 flex items-center gap-2 text-muted-foreground hover:text-foreground hover:border-[#0071E3]/30 transition-colors min-w-[200px] justify-center"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">Adicionar produto</span>
              </button>
            )}
          </div>

          {/* Dropdown selector */}
          {showSelector && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bento-card !p-4 max-w-md mx-auto mb-10 max-h-[300px] overflow-y-auto"
            >
              {availableProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addProduct(product.id)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-foreground/70 hover:text-foreground hover:bg-accent rounded-xl transition-colors"
                >
                  <span>{product.name}</span>
                  <span className="text-xs text-muted-foreground">R$ {parseFloat(product.price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </button>
              ))}
            </motion.div>
          )}

          {/* Comparison Table */}
          {selectedProducts.length >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="overflow-x-auto"
            >
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left text-sm font-medium text-muted-foreground p-4 border-b border-border w-40">Recurso</th>
                    {selectedProducts.map((p) => (
                      <th key={p.id} className="text-center text-sm font-semibold text-foreground p-4 border-b border-border min-w-[180px]">
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="text-sm text-muted-foreground p-4 border-b border-border">Preço</td>
                    {selectedProducts.map((p) => (
                      <td key={p.id} className="text-center text-sm font-bold text-foreground p-4 border-b border-border">
                        R$ {parseFloat(p.price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="text-sm text-muted-foreground p-4 border-b border-border">Tipo</td>
                    {selectedProducts.map((p) => (
                      <td key={p.id} className="text-center text-sm text-foreground p-4 border-b border-border capitalize">
                        {p.type}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="text-sm text-muted-foreground p-4 border-b border-border">Descrição</td>
                    {selectedProducts.map((p) => (
                      <td key={p.id} className="text-sm text-muted-foreground p-4 border-b border-border text-center">
                        {p.shortDescription}
                      </td>
                    ))}
                  </tr>
                  {/* Features comparison */}
                  {(() => {
                    const allFeatures = Array.from(new Set(
                      selectedProducts.flatMap((p) => (p.features || "").split(",").map((f) => f.trim())).filter(Boolean)
                    ));
                    return allFeatures.map((feature) => (
                      <tr key={feature}>
                        <td className="text-sm text-muted-foreground p-4 border-b border-border">{feature}</td>
                        {selectedProducts.map((p) => {
                          const hasFeature = (p.features || "").split(",").map((f) => f.trim()).includes(feature);
                          return (
                            <td key={p.id} className="text-center p-4 border-b border-border">
                              {hasFeature ? (
                                <Check className="w-5 h-5 text-[#0071E3] mx-auto" />
                              ) : (
                                <span className="text-muted-foreground/30">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ));
                  })()}
                  {/* CTA row */}
                  <tr>
                    <td className="p-4"></td>
                    {selectedProducts.map((p) => (
                      <td key={p.id} className="text-center p-4">
                        <Link href={`/produto/${p.slug}`}>
                          <span className="apple-btn apple-btn-primary text-sm py-2 px-4">
                            Ver Detalhes <ArrowRight className="w-3.5 h-3.5 ml-1" />
                          </span>
                        </Link>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </motion.div>
          )}

          {selectedProducts.length < 2 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground">Selecione pelo menos 2 produtos para comparar.</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

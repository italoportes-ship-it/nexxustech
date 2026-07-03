import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Link, useParams } from "wouter";
import { Check, ShoppingCart, BookOpen, Signal } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const levelLabels: Record<string, string> = {
  beginner: "Iniciante",
  intermediate: "Intermediário",
  advanced: "Avançado",
};

export default function ProductDetail() {
  const params = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();
  const productQuery = trpc.products.bySlug.useQuery({ slug: params.slug || "" });
  const addToCartMutation = trpc.cart.add.useMutation();
  const utils = trpc.useUtils();

  const product = productQuery.data;

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    if (!product) return;
    addToCartMutation.mutate(
      { productId: product.id },
      {
        onSuccess: () => {
          toast.success("Produto adicionado ao carrinho!");
          utils.cart.list.invalidate();
        },
        onError: () => {
          toast.error("Erro ao adicionar ao carrinho.");
        },
      }
    );
  };

  if (!product && !productQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground0">Produto não encontrado.</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 container">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-accent rounded-xl w-1/3" />
            <div className="h-4 bg-accent rounded-xl w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  const features = product.features?.split(",") || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-24 md:pt-32 pb-16 md:pb-24">
        <div className="container">
          <Breadcrumbs items={[
            { label: product.type === "course" ? "Cursos" : "Softwares", href: product.type === "course" ? "/cursos" : "/softwares" },
            { label: product.name },
          ]} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16">
            {/* Left - Product Visual */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-[#0071E3]/20 via-[#0a0a0a] to-[#1D1D1F] border border-border flex items-center justify-center p-12">
                <div className="text-center">
                  <div className="w-24 h-24 rounded-3xl bg-[#0071E3]/10 flex items-center justify-center mx-auto mb-6">
                    {product.type === "course" ? (
                      <BookOpen className="w-12 h-12 text-[#0071E3]" />
                    ) : (
                      <ShoppingCart className="w-12 h-12 text-[#0071E3]" />
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-foreground">{product.name}</h3>
                </div>
              </div>
            </motion.div>

            {/* Right - Product Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex flex-col"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${
                  product.type === "course"
                    ? "bg-green-500/10 text-green-400"
                    : "bg-[#0071E3]/10 text-[#0071E3]"
                }`}>
                  {product.type === "course" ? "Curso Digital" : "Software"}
                </span>
                {product.level && (
                  <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-accent text-muted-foreground">
                    <Signal className="w-3 h-3 inline mr-1" />
                    {levelLabels[product.level]}
                  </span>
                )}
              </div>

              <h1 className="text-title text-white mb-4">{product.name}</h1>
              <p className="text-base text-muted-foreground leading-relaxed mb-8">
                {product.description}
              </p>

              {/* Features */}
              {features.length > 0 && (
                <div className="mb-8">
                  <h4 className="text-sm font-semibold text-foreground/80 mb-4 uppercase tracking-wide">Recursos incluídos</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-[#0071E3]/10 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-[#0071E3]" />
                        </div>
                        <span className="text-sm text-muted-foreground">{feature.trim()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Price & CTA */}
              <div className="mt-auto pt-8 border-t border-border">
                <div className="flex items-end gap-2 mb-6">
                  <span className="text-3xl font-bold text-foreground">
                    R$ {parseFloat(product.price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                  {product.type === "software" && (
                    <span className="text-sm text-foreground/40 mb-1">/licença</span>
                  )}
                </div>
                <button
                  onClick={handleAddToCart}
                  disabled={addToCartMutation.isPending}
                  className="apple-btn apple-btn-primary w-full text-base py-4 disabled:opacity-50"
                >
                  {addToCartMutation.isPending ? "Adicionando..." : (
                    <>
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Adicionar ao Carrinho
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

import Breadcrumbs from "@/components/Breadcrumbs";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Seo from "@/components/Seo";
import { trpc } from "@/lib/trpc";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Building2,
  Check,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Layers3,
  Mail,
  MonitorCheck,
  PlayCircle,
  Presentation,
  Quote,
  ScanSearch,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link, useParams } from "wouter";

const AMPLER_LOGO = "/manus-storage/ampler-logo-official_40fe246e.webp";
const FALLBACK_IMAGE = "/manus-storage/ampler-hero_2ba32fe5.png";

type FaqItem = { question: string; answer: string };

function parseFaqs(raw: string | null): FaqItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is FaqItem => typeof item?.question === "string" && typeof item?.answer === "string")
      : [];
  } catch {
    return [];
  }
}

export default function ProductDetail() {
  const params = useParams<{ slug: string }>();
  const productQuery = trpc.products.bySlug.useQuery({ slug: params.slug || "" });
  const product = productQuery.data;
  const mediaQuery = trpc.productResources.media.useQuery({ productId: product?.id || 1 }, { enabled: Boolean(product) });
  const pricesQuery = trpc.productResources.publishedPrices.useQuery({ productId: product?.id || 1 }, { enabled: Boolean(product) });

  if (!product && productQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container pt-32">
          <div className="animate-pulse space-y-4"><div className="h-8 w-1/3 rounded-xl bg-accent" /><div className="h-4 w-2/3 rounded-xl bg-accent" /></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container flex min-h-[70vh] flex-col items-center justify-center text-center">
          <p className="text-sm uppercase tracking-[0.18em] text-[#58a9ff]">Catálogo atualizado</p>
          <h1 className="mt-4 text-3xl font-semibold text-white">Produto não disponível</h1>
          <p className="mt-3 max-w-md text-muted-foreground">O catálogo NexxusTECH agora é dedicado exclusivamente ao Ampler.</p>
          <Link href="/produto/ampler" className="mt-7 apple-btn apple-btn-primary px-6 py-3">Conhecer o Ampler</Link>
        </main>
        <Footer />
      </div>
    );
  }

  const features = (product.features || "").split(",").filter(Boolean);
  const faqs = parseFaqs(product.faqs);
  const image = product.imageUrl || FALLBACK_IMAGE;
  const media = mediaQuery.data || [];
  const officialCases = media.filter((item) => item.mediaType === "case");
  const officialVideos = media.filter((item) => item.mediaType === "video" && item.embedUrl);
  const publishedPrices = pricesQuery.data || [];
  const firstPublishedPrice = publishedPrices.find((price) => price.approvedPriceBrl);
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: product.name,
      applicationCategory: "BusinessApplication",
      operatingSystem: product.requirements || "Windows / Microsoft Office",
      description: product.seoDescription || product.description,
      image: new URL(image, window.location.origin).toString(),
      url: `${window.location.origin}/produto/ampler`,
      author: { "@type": "Organization", name: product.manufacturer || "Ampler" },
      offers: {
        "@type": "Offer",
        price: firstPublishedPrice?.approvedPriceBrl || "0",
        priceCurrency: "BRL",
        description: firstPublishedPrice ? "Preço homologado pela NexxusTECH." : "Preço sob consulta conforme módulos e quantidade de usuários.",
        availability: "https://schema.org/InStock",
      },
    },
    ...(faqs.length > 0
      ? [{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: { "@type": "Answer", text: faq.answer },
          })),
        }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title={product.seoTitle || `${product.name} | NexxusTECH`}
        description={product.seoDescription || product.shortDescription || product.description || "Conheça o Ampler."}
        canonicalPath={`/produto/${product.slug}`}
        image={image}
        keywords={product.seoKeywords || undefined}
        schema={schema}
      />
      <Navbar />

      <main>
        <section className="relative overflow-hidden pt-24 pb-16 md:pt-32 md:pb-24">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(0,113,227,0.18),transparent_36%)]" />
          <div className="container relative z-10">
            <Breadcrumbs items={[{ label: "Ampler", href: "/softwares" }, { label: product.name }]} />

            <div className="grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <div className="mb-6 inline-flex rounded-full border border-[#58a9ff]/20 bg-[#58a9ff]/8 px-3 py-1.5 text-xs font-medium text-[#58a9ff]">
                  Plataforma de produtividade Microsoft Office
                </div>
                <img src={AMPLER_LOGO} alt="Ampler" className="mb-7 h-auto w-40 md:w-52" />
                <h1 className="text-4xl font-semibold tracking-[-0.04em] text-white md:text-6xl">Transforme o Office em um ambiente de trabalho mais inteligente.</h1>
                <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">{product.description}</p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link href="/b2b?produto=ampler" className="apple-btn apple-btn-primary justify-center px-7 py-3.5 text-base">
                    Solicitar demonstração <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                  {product.officialUrl && (
                    <a href={product.officialUrl} target="_blank" rel="noreferrer" className="apple-btn apple-btn-secondary justify-center px-7 py-3.5 text-base">
                      Site do fabricante <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  )}
                </div>

                <div className="mt-8 grid gap-3 text-sm text-foreground/65 sm:grid-cols-2">
                  <span className="flex items-center gap-2"><Check className="h-4 w-4 text-[#54d6c7]" /> {product.licensing || "Licenciamento sob consulta"}</span>
                  <span className="flex items-center gap-2"><Check className="h-4 w-4 text-[#54d6c7]" /> Teste oficial de 30 dias</span>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.1 }}>
                <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] p-2 shadow-2xl">
                  <img src={image} alt="Ampler para apresentações, gráficos e produtividade no Microsoft Office" className="aspect-video w-full rounded-[1.55rem] object-cover" />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="border-y border-white/5 bg-secondary py-8">
          <div className="container grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Presentation, label: "PowerPoint", detail: "Slides, charts e consistência" },
              { icon: FileSpreadsheet, label: "Excel", detail: "Modelos e produtividade" },
              { icon: FileText, label: "Word", detail: "Documentos padronizados" },
              { icon: Mail, label: "Outlook", detail: "Assinaturas e organização" },
            ].map(({ icon: Icon, label, detail }) => (
              <div key={label} className="flex items-center gap-3 rounded-2xl border border-white/5 bg-background/50 p-4">
                <Icon className="h-5 w-5 text-[#58a9ff]" />
                <div><p className="text-sm font-semibold text-white">{label}</p><p className="text-xs text-muted-foreground">{detail}</p></div>
              </div>
            ))}
          </div>
        </section>

        <section className="py-20 md:py-28">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#58a9ff]">Recursos incluídos</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-white md:text-5xl">Ferramentas para produzir melhor, não apenas mais rápido.</h2>
            </div>

            <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => {
                const icons = [Sparkles, Layers3, ScanSearch, BookOpenCheck, BarChart3, MonitorCheck];
                const Icon = icons[index % icons.length];
                return (
                  <article key={feature} className="rounded-3xl border border-white/7 bg-white/[0.025] p-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0071E3]/10 text-[#58a9ff]"><Icon className="h-5 w-5" /></div>
                    <h3 className="mt-5 text-lg font-semibold text-white">{feature.trim()}</h3>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-secondary py-20 md:py-24">
          <div className="container grid gap-8 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/8 bg-background/60 p-7 md:p-9">
              <MonitorCheck className="h-7 w-7 text-[#54d6c7]" />
              <h2 className="mt-6 text-2xl font-semibold text-white">Requisitos confirmados</h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">{product.requirements || "Windows e Microsoft Office"}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">O instalador oficial adiciona o Ampler como uma guia própria no Office. Os detalhes de implantação corporativa são definidos durante o diagnóstico.</p>
            </div>
            <div className="rounded-3xl border border-white/8 bg-background/60 p-7 md:p-9">
              <Building2 className="h-7 w-7 text-[#ec70b9]" />
              <h2 className="mt-6 text-2xl font-semibold text-white">Contratação consultiva</h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">A NexxusTECH dimensiona aplicativos, usuários, biblioteca corporativa e necessidades de implantação antes de apresentar o orçamento.</p>
              <Link href="/b2b?produto=ampler" className="mt-6 inline-flex items-center text-sm font-semibold text-[#58a9ff]">Falar com um especialista <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </div>
          </div>
        </section>

        {publishedPrices.length > 0 && (
          <section className="py-20 md:py-24">
            <div className="container">
              <div className="mx-auto max-w-3xl text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#54d6c7]">Valores homologados</p>
                <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-white md:text-5xl">Planos publicados para contratação no Brasil.</h2>
                <p className="mt-4 text-sm text-muted-foreground">Os valores abaixo foram revisados e aprovados administrativamente. Custos, impostos e margens permanecem restritos.</p>
              </div>
              <div className="mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-2 lg:grid-cols-3">
                {publishedPrices.map((price) => (
                  <div key={price.id} className="rounded-3xl border border-[#54d6c7]/15 bg-[#54d6c7]/[0.035] p-6">
                    <p className="text-sm font-semibold text-white">{price.planName}</p>
                    <p className="mt-5 text-3xl font-semibold text-white">R$ {Number(price.approvedPriceBrl).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{price.billingPeriod === "monthly" ? "por mês" : price.billingPeriod === "annual" ? "por ano" : "condição personalizada"} · a partir de {price.minSeats} assento(s)</p>
                    <Link href={`/checkout/novo?productId=${product.id}&quantity=${price.minSeats}`} className="mt-6 inline-flex text-sm font-semibold text-[#54d6c7]">Comprar com segurança <ArrowRight className="ml-2 h-4 w-4" /></Link>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {officialCases.length > 0 && (
          <section className="py-20 md:py-28">
            <div className="container">
              <div className="mx-auto max-w-3xl text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#58a9ff]">Histórias oficiais de clientes</p>
                <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-white md:text-5xl">Resultados publicados pelo fabricante.</h2>
                <p className="mt-4 text-sm text-muted-foreground">Cada resumo abaixo aponta para o case completo no site oficial do Ampler.</p>
              </div>
              <div className="mt-12 grid gap-5 md:grid-cols-2">
                {officialCases.map((item) => (
                  <a key={item.id} href={item.sourceUrl} target="_blank" rel="noreferrer" className="group rounded-3xl border border-white/7 bg-white/[0.025] p-6 transition-colors hover:border-[#58a9ff]/30">
                    <Quote className="h-6 w-6 text-[#58a9ff]" />
                    <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-[#58a9ff]">{item.customerName}</p>
                    <h3 className="mt-2 text-xl font-semibold text-white">{item.title}</h3>
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{item.summary}</p>
                    {item.resultText && <p className="mt-4 text-sm font-medium leading-relaxed text-foreground/80">{item.resultText}</p>}
                    <span className="mt-6 inline-flex items-center text-sm font-semibold text-[#58a9ff]">Ler case oficial <ExternalLink className="ml-2 h-4 w-4" /></span>
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        {officialVideos.length > 0 && (
          <section className="bg-secondary py-20 md:py-28">
            <div className="container">
              <div className="flex items-center gap-3"><PlayCircle className="h-6 w-6 text-[#ec70b9]" /><p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#ec70b9]">Vídeos oficiais</p></div>
              <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-[-0.03em] text-white md:text-5xl">Veja o Ampler em ação.</h2>
              <div className="mt-12 grid gap-6 lg:grid-cols-2">
                {officialVideos.map((item) => (
                  <article key={item.id} className="overflow-hidden rounded-3xl border border-white/8 bg-background/60">
                    <iframe
                      src={item.embedUrl || undefined}
                      title={item.title}
                      loading="lazy"
                      className="aspect-video w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    />
                    <div className="p-5"><h3 className="font-semibold text-white">{item.title}</h3><p className="mt-2 text-sm text-muted-foreground">{item.summary}</p></div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {faqs.length > 0 && (
          <section className="py-20 md:py-28">
            <div className="container max-w-4xl">
              <div className="text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#58a9ff]">Perguntas frequentes</p>
                <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-white md:text-5xl">O que sua equipe precisa saber.</h2>
              </div>
              <div className="mt-12 space-y-4">
                {faqs.map((faq) => (
                  <details key={faq.question} className="group rounded-2xl border border-white/7 bg-white/[0.02] px-6 py-5">
                    <summary className="cursor-pointer list-none pr-8 text-base font-semibold text-white">{faq.question}</summary>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="pb-20 md:pb-28">
          <div className="container">
            <div className="rounded-[2rem] border border-[#58a9ff]/20 bg-gradient-to-br from-[#0b2034] via-[#101923] to-[#251428] px-6 py-14 text-center md:px-12 md:py-20">
              <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white md:text-5xl">Pronto para ver o Ampler no seu padrão corporativo?</h2>
              <p className="mx-auto mt-5 max-w-2xl text-base text-white/60">Solicite uma demonstração e receba uma recomendação de módulos e licenciamento para sua equipe.</p>
              <Link href="/b2b?produto=ampler" className="mt-8 inline-flex apple-btn apple-btn-primary px-7 py-3.5 text-base">Solicitar demonstração</Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

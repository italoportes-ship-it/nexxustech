import Breadcrumbs from "@/components/Breadcrumbs";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Seo from "@/components/Seo";
import { ArrowRight, Check, HelpCircle, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

const rows = [
  {
    criterion: "Abrangência no Microsoft Office",
    ampler: "PowerPoint, Excel, Word e Outlook",
    manual: "Ferramentas e arquivos separados",
    thinkcell: "Pendente de validação na fonte do concorrente",
  },
  {
    criterion: "Biblioteca corporativa",
    ampler: "Slides, formas, layouts, imagens e ícones",
    manual: "Pastas e apresentações dispersas",
    thinkcell: "Pendente de validação",
  },
  {
    criterion: "Agenda e Storyboard",
    ampler: "Incluídos no Ampler para PowerPoint",
    manual: "Montagem e atualização manual",
    thinkcell: "Pendente de validação",
  },
  {
    criterion: "Scan & Fix",
    ampler: "Verificação e correção de inconsistências",
    manual: "Revisão visual manual",
    thinkcell: "Pendente de validação",
  },
  {
    criterion: "Gráficos",
    ampler: "Ampler Charts, Gantt e layouts reutilizáveis",
    manual: "Recursos nativos e ajustes manuais",
    thinkcell: "Conhecido por gráficos; escopo deve ser confirmado",
  },
  {
    criterion: "Conteúdo em nuvem corporativa",
    ampler: "Integrações com SharePoint, OneDrive e Google Drive",
    manual: "Depende da organização interna",
    thinkcell: "Pendente de validação",
  },
  {
    criterion: "Preço final no Brasil",
    ampler: "Sob consulta NexxusTECH",
    manual: "Custo oculto de tempo e retrabalho",
    thinkcell: "Não comparar sem cotação homologada",
  },
];

function StatusIcon({ text }: { text: string }) {
  if (/pendente|não comparar|deve ser confirmado/i.test(text)) return <HelpCircle className="h-4 w-4 flex-shrink-0 text-amber-400" />;
  if (/manual|separad|dispers|depende|oculto/i.test(text)) return <Minus className="h-4 w-4 flex-shrink-0 text-white/30" />;
  return <Check className="h-4 w-4 flex-shrink-0 text-[#54d6c7]" />;
}

export default function Compare() {
  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Ampler vs processo manual e Think-cell | Comparação responsável | NexxusTECH"
        description="Compare o Ampler com processos manuais e critérios a validar do Think-cell, sem alegações de preço ou superioridade não comprovadas."
        canonicalPath="/comparar"
        image="/manus-storage/ampler-hero_2ba32fe5.png"
      />
      <Navbar />

      <main>
        <section className="bg-secondary pt-24 pb-12 md:pt-32 md:pb-16">
          <div className="container">
            <Breadcrumbs items={[{ label: "Ampler", href: "/produto/ampler" }, { label: "Comparar abordagens" }]} />
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#58a9ff]">Decisão informada</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-white md:text-6xl">Compare o que está comprovado.</h1>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                Uma visão funcional do Ampler frente ao processo manual e aos pontos que ainda precisam ser homologados em relação ao Think-cell.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-14 md:py-20">
          <div className="container">
            <div className="overflow-x-auto rounded-3xl border border-white/8 bg-white/[0.02]">
              <table className="w-full min-w-[860px] border-collapse">
                <thead>
                  <tr className="border-b border-white/8">
                    <th className="w-[24%] p-5 text-left text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Critério</th>
                    <th className="w-[27%] bg-[#58a9ff]/7 p-5 text-left text-sm font-semibold text-white">Ampler</th>
                    <th className="w-[24%] p-5 text-left text-sm font-semibold text-white/70">Processo manual</th>
                    <th className="w-[25%] p-5 text-left text-sm font-semibold text-white/70">Think-cell</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.criterion} className="border-b border-white/6 last:border-0">
                      <td className="p-5 text-sm font-medium text-white">{row.criterion}</td>
                      <td className="bg-[#58a9ff]/[0.035] p-5">
                        <div className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground/75"><StatusIcon text={row.ampler} />{row.ampler}</div>
                      </td>
                      <td className="p-5"><div className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground"><StatusIcon text={row.manual} />{row.manual}</div></td>
                      <td className="p-5"><div className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground"><StatusIcon text={row.thinkcell} />{row.thinkcell}</div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8 rounded-2xl border border-amber-400/15 bg-amber-400/[0.04] p-5 text-sm leading-relaxed text-amber-100/70">
              Esta comparação não publica preço, economia percentual ou superioridade técnica sem fonte homologada. Critérios do Think-cell marcados como pendentes devem ser confirmados na documentação oficial ou em cotação equivalente.
            </div>

            <div className="mt-12 flex flex-col items-center justify-between gap-6 rounded-3xl border border-white/8 bg-secondary p-7 text-center md:flex-row md:text-left">
              <div>
                <h2 className="text-2xl font-semibold text-white">Compare com o seu processo real.</h2>
                <p className="mt-2 text-sm text-muted-foreground">A NexxusTECH demonstra o Ampler usando seus templates, conteúdos e necessidades de governança.</p>
              </div>
              <Link href="/b2b?produto=ampler" className="apple-btn apple-btn-primary flex-shrink-0 px-6 py-3">
                Solicitar demonstração <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

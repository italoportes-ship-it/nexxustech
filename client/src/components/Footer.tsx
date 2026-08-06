import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";

export default function Footer() {
  const [email, setEmail] = useState("");
  const subscribeMutation = trpc.newsletter.subscribe.useMutation();

  const handleSubscribe = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    subscribeMutation.mutate({ email }, {
      onSuccess: (data) => {
        toast.success(data.message);
        setEmail("");
      },
      onError: () => toast.error("Erro ao inscrever. Verifique o e-mail e tente novamente."),
    });
  };

  return (
    <footer className="border-t border-border bg-secondary">
      <div className="container py-12 md:py-16">
        <div className="mb-12 border-b border-border pb-10 text-center md:mb-16 md:pb-12">
          <h3 className="text-lg font-semibold text-foreground md:text-xl">Conteúdo sobre produtividade no Microsoft Office</h3>
          <p className="mx-auto mb-6 mt-2 max-w-lg text-sm text-muted-foreground">
            Receba novidades do Ampler, práticas para apresentações profissionais e atualizações para equipes corporativas.
          </p>
          <form onSubmit={handleSubscribe} className="mx-auto flex max-w-sm gap-2">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="seu@email.com"
              required
              className="flex-1 rounded-full border border-border bg-accent px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#0071E3] focus:outline-none"
            />
            <button type="submit" disabled={subscribeMutation.isPending} className="apple-btn apple-btn-primary px-5 py-2.5 disabled:opacity-50" aria-label="Inscrever e-mail">
              {subscribeMutation.isPending ? "..." : <Send className="h-4 w-4" />}
            </button>
          </form>
        </div>

        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-12">
          <div className="col-span-2 space-y-4 md:col-span-1">
            <span className="text-lg font-bold tracking-tight text-foreground">
              Nexxus<span className="text-[#0071E3]">TECH</span>
            </span>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Especialista em Ampler para empresas que desejam elevar produtividade, consistência e governança de conteúdo no Microsoft Office.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Ampler</h4>
            <div className="space-y-2.5">
              <Link href="/produto/ampler" className="block text-sm text-muted-foreground transition-colors hover:text-foreground">Visão geral</Link>
              <a href="/#recursos" className="block text-sm text-muted-foreground transition-colors hover:text-foreground">Recursos</a>
              <Link href="/comparar" className="block text-sm text-muted-foreground transition-colors hover:text-foreground">Comparar abordagens</Link>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Aplicativos</h4>
            <div className="space-y-2.5 text-sm text-muted-foreground">
              <p>PowerPoint</p>
              <p>Excel</p>
              <p>Word</p>
              <p>Outlook</p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Contratação</h4>
            <div className="space-y-2.5">
              <Link href="/b2b?produto=ampler" className="block text-sm text-muted-foreground transition-colors hover:text-foreground">Solicitar demonstração</Link>
              <Link href="/faq" className="block text-sm text-muted-foreground transition-colors hover:text-foreground">Perguntas frequentes</Link>
              <Link href="/protocolo" className="block text-sm text-muted-foreground transition-colors hover:text-foreground">Consultar solicitação</Link>
              <p className="text-sm text-muted-foreground">contato@nexxustech.com</p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 md:mt-16 md:flex-row md:pt-8">
          <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} NexxusTECH. Todos os direitos reservados.</p>
          <p className="text-xs text-muted-foreground">Ampler é uma marca de seu respectivo fabricante.</p>
        </div>
      </div>
    </footer>
  );
}

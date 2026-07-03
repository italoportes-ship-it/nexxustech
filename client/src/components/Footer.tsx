import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-secondary">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <span className="text-lg font-bold tracking-tight text-foreground">
              Nexxus<span className="text-[#0071E3]">TECH</span>
            </span>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Plataforma premium de softwares e cursos digitais para empresas e profissionais que buscam excelência.
            </p>
          </div>

          {/* Soluções */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Soluções</h4>
            <div className="space-y-2.5">
              <Link href="/categoria/infraestrutura-seguranca" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Infraestrutura e Segurança
              </Link>
              <Link href="/categoria/desenvolvimento-devops" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Desenvolvimento e DevOps
              </Link>
              <Link href="/categoria/design-produtividade" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Design e Produtividade
              </Link>
              <Link href="/categoria/analise-dados-estatistica" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Análise de Dados
              </Link>
            </div>
          </div>

          {/* Recursos */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Recursos</h4>
            <div className="space-y-2.5">
              <Link href="/cursos" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Cursos Digitais
              </Link>
              <Link href="/b2b" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Soluções Corporativas
              </Link>
              <Link href="/conta" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Área do Cliente
              </Link>
              <Link href="/faq" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                FAQ
              </Link>
            </div>
          </div>

          {/* Contato */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Contato</h4>
            <div className="space-y-2.5">
              <Link href="/b2b" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Fale com Vendas
              </Link>
              <p className="text-sm text-muted-foreground">contato@nexxustech.com</p>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 md:mt-16 pt-6 md:pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} NexxusTECH. Todos os direitos reservados.
          </p>
          <div className="flex gap-6">
            <span className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Termos de Uso</span>
            <span className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Privacidade</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

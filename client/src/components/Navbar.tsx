import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { ShoppingCart, User, Menu, X, ChevronDown, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import SearchCommand from "./SearchCommand";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [location] = useLocation();
  const { theme, toggleTheme, switchable } = useTheme();

  const cartQuery = trpc.cart.list.useQuery(undefined, { enabled: isAuthenticated });
  const cartCount = cartQuery.data?.length || 0;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const categories = [
    { name: "Infraestrutura", slug: "infraestrutura-seguranca" },
    { name: "Desenvolvimento", slug: "desenvolvimento-devops" },
    { name: "Produtividade", slug: "design-produtividade" },
    { name: "Dados", slug: "analise-dados-estatistica" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? "glass border-b border-white/10 shadow-lg dark:glass"
          : "bg-transparent"
      }`}
      style={{ backdropFilter: isScrolled ? "saturate(180%) blur(20px)" : "none" }}
    >
      <div className="container">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight text-foreground">
              Nexxus<span className="text-[#0071E3]">TECH</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/softwares" className="text-sm text-foreground/70 hover:text-foreground transition-colors">
              Softwares
            </Link>
            <Link href="/cursos" className="text-sm text-foreground/70 hover:text-foreground transition-colors">
              Cursos
            </Link>
            <div
              className="relative"
              onMouseEnter={() => setSolutionsOpen(true)}
              onMouseLeave={() => setSolutionsOpen(false)}
            >
              <button className="text-sm text-foreground/70 hover:text-foreground transition-colors flex items-center gap-1">
                Soluções <ChevronDown className="w-3 h-3" />
              </button>
              {solutionsOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-card/95 backdrop-blur-xl rounded-2xl border border-border p-4 shadow-xl">
                  {categories.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/categoria/${cat.slug}`}
                      className="block px-3 py-2.5 text-sm text-foreground/70 hover:text-foreground hover:bg-accent rounded-xl transition-colors"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <Link href="/b2b" className="text-sm text-foreground/70 hover:text-foreground transition-colors">
              Empresas
            </Link>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <SearchCommand />

            {/* Theme Toggle */}
            {switchable && toggleTheme && (
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl text-foreground/60 hover:text-foreground hover:bg-accent transition-colors"
                aria-label="Alternar tema"
              >
                {theme === "dark" ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
              </button>
            )}

            {isAuthenticated && (
              <Link href="/carrinho" className="relative p-2 text-foreground/70 hover:text-foreground transition-colors">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#0071E3] rounded-full text-[10px] font-medium flex items-center justify-center text-white">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}
            {isAuthenticated ? (
              <Link href="/conta" className="p-2 text-foreground/70 hover:text-foreground transition-colors">
                <User className="w-5 h-5" />
              </Link>
            ) : (
              <a href={getLoginUrl()} className="apple-btn apple-btn-primary text-sm py-2 px-4">
                Entrar
              </a>
            )}
            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 text-foreground/70 hover:text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-card/95 backdrop-blur-xl border-t border-border">
          <div className="container py-4 space-y-2">
            <Link href="/softwares" className="block px-3 py-2.5 text-sm text-foreground/70 hover:text-foreground rounded-xl">
              Softwares
            </Link>
            <Link href="/cursos" className="block px-3 py-2.5 text-sm text-foreground/70 hover:text-foreground rounded-xl">
              Cursos
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/categoria/${cat.slug}`}
                className="block px-3 py-2.5 text-sm text-foreground/50 hover:text-foreground rounded-xl pl-6"
              >
                {cat.name}
              </Link>
            ))}
            <Link href="/b2b" className="block px-3 py-2.5 text-sm text-foreground/70 hover:text-foreground rounded-xl">
              Empresas
            </Link>
            {switchable && toggleTheme && (
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 px-3 py-2.5 text-sm text-foreground/70 hover:text-foreground rounded-xl w-full"
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {theme === "dark" ? "Modo Claro" : "Modo Escuro"}
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

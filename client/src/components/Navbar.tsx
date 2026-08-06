import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Menu, Moon, Sun, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import SearchCommand from "./SearchCommand";

export default function Navbar() {
  const { isAuthenticated } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { theme, toggleTheme, switchable } = useTheme();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => setMobileMenuOpen(false), [location]);

  const navLinks = [
    { label: "Ampler", href: "/produto/ampler" },
    { label: "Recursos", href: "/#recursos" },
    { label: "Comparar", href: "/comparar" },
    { label: "Para empresas", href: "/b2b?produto=ampler" },
  ];

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        isScrolled ? "glass border-b border-border shadow-lg" : "bg-transparent"
      }`}
      style={{ backdropFilter: isScrolled ? "saturate(180%) blur(20px)" : "none" }}
    >
      <div className="container">
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="flex flex-shrink-0 items-center gap-2">
            <span className="text-lg font-bold tracking-tight text-foreground">
              Nexxus<span className="text-[#0071E3]">TECH</span>
            </span>
          </Link>

          <div className="hidden items-center gap-7 lg:flex">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="text-sm text-foreground/70 transition-colors hover:text-foreground">
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <div className="hidden md:block">
              <SearchCommand />
            </div>

            {switchable && toggleTheme && (
              <button
                onClick={toggleTheme}
                className="rounded-xl p-2 text-foreground/60 transition-colors hover:bg-accent hover:text-foreground"
                aria-label="Alternar tema"
              >
                {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
              </button>
            )}

            {isAuthenticated ? (
              <Link href="/conta" className="p-2 text-foreground/70 transition-colors hover:text-foreground" aria-label="Área do cliente">
                <User className="h-[18px] w-[18px]" />
              </Link>
            ) : (
              <a href={getLoginUrl()} className="hidden text-sm text-foreground/65 transition-colors hover:text-foreground sm:inline-flex">
                Entrar
              </a>
            )}

            <Link href="/b2b?produto=ampler" className="hidden apple-btn apple-btn-primary px-4 py-2 text-sm sm:inline-flex">
              Solicitar demo
            </Link>

            <button
              className="p-2 text-foreground/70 hover:text-foreground lg:hidden"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label="Abrir menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-border bg-card/95 backdrop-blur-xl lg:hidden">
          <div className="container space-y-1 py-4">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="block rounded-xl px-4 py-3 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-foreground">
                {link.label}
              </a>
            ))}
            <Link href="/b2b?produto=ampler" className="mt-3 block apple-btn apple-btn-primary py-3 text-center text-sm">
              Solicitar demonstração
            </Link>
            {!isAuthenticated && (
              <a href={getLoginUrl()} className="block px-4 py-3 text-center text-sm text-foreground/65">
                Entrar na conta
              </a>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

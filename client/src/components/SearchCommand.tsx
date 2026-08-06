import { useEffect, useState } from "react";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { ArrowLeftRight, BriefcaseBusiness, Package, Search, Sparkles } from "lucide-react";

export default function SearchCommand() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const productsQuery = trpc.products.list.useQuery();
  const product = productsQuery.data?.[0];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const navigate = (path: string) => {
    setOpen(false);
    setLocation(path);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/40 transition-colors hover:bg-white/10 hover:text-white/60 md:flex"
        aria-label="Buscar no site"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Buscar Ampler</span>
        <kbd className="ml-1 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium">⌘K</kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command className="rounded-2xl border border-white/10 bg-[#1a1a1c] shadow-2xl">
          <CommandInput placeholder="Buscar recursos do Ampler..." className="text-white" />
          <CommandList className="max-h-[400px]">
            <CommandEmpty className="py-6 text-center text-sm text-white/40">Nenhum resultado encontrado.</CommandEmpty>

            {product && (
              <CommandGroup heading="Produto" className="text-white/30">
                <CommandItem
                  value={`Ampler ${product.shortDescription || "Microsoft Office"}`}
                  onSelect={() => navigate(`/produto/${product.slug}`)}
                  className="cursor-pointer text-white/70 hover:text-white"
                >
                  <Package className="h-4 w-4 text-[#58a9ff]" />
                  <span className="ml-2 flex-1">Ampler</span>
                  <span className="text-xs text-white/30">Visão geral</span>
                </CommandItem>
              </CommandGroup>
            )}

            <CommandGroup heading="Atalhos" className="text-white/30">
              <CommandItem value="recursos ferramentas library scan fix" onSelect={() => navigate("/#recursos")} className="cursor-pointer text-white/70 hover:text-white">
                <Sparkles className="h-4 w-4 text-[#54d6c7]" />
                <span className="ml-2">Recursos e funcionalidades</span>
              </CommandItem>
              <CommandItem value="comparar think-cell processo manual" onSelect={() => navigate("/comparar")} className="cursor-pointer text-white/70 hover:text-white">
                <ArrowLeftRight className="h-4 w-4 text-[#ec70b9]" />
                <span className="ml-2">Comparar abordagens</span>
              </CommandItem>
              <CommandItem value="demonstração orçamento empresa" onSelect={() => navigate("/b2b?produto=ampler")} className="cursor-pointer text-white/70 hover:text-white">
                <BriefcaseBusiness className="h-4 w-4 text-[#58a9ff]" />
                <span className="ml-2">Solicitar demonstração</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}

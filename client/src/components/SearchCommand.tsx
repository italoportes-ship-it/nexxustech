import { useEffect, useState, useMemo } from "react";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Search, Package, BookOpen, Shield, Code, Palette, BarChart3 } from "lucide-react";

const categoryIcons: Record<number, React.ReactNode> = {
  1: <Shield className="w-4 h-4 text-white/40" />,
  2: <Code className="w-4 h-4 text-white/40" />,
  3: <Palette className="w-4 h-4 text-white/40" />,
  4: <BarChart3 className="w-4 h-4 text-white/40" />,
};

export default function SearchCommand() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const productsQuery = trpc.products.list.useQuery();
  const categoriesQuery = trpc.categories.list.useQuery();

  const products = productsQuery.data || [];
  const categories = categoriesQuery.data || [];

  // Listen for Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const softwares = useMemo(() => products.filter((p) => p.type === "software"), [products]);
  const courses = useMemo(() => products.filter((p) => p.type === "course"), [products]);

  const handleSelect = (slug: string) => {
    setOpen(false);
    setLocation(`/produto/${slug}`);
  };

  const handleCategorySelect = (slug: string) => {
    setOpen(false);
    setLocation(`/categoria/${slug}`);
  };

  return (
    <>
      {/* Trigger button in navbar */}
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/40 text-sm hover:bg-white/10 hover:text-white/60 transition-colors"
      >
        <Search className="w-3.5 h-3.5" />
        <span>Buscar...</span>
        <kbd className="ml-2 text-[10px] font-medium bg-white/5 border border-white/10 rounded px-1.5 py-0.5">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command className="rounded-2xl border border-white/10 bg-[#1a1a1c] shadow-2xl">
          <CommandInput placeholder="Buscar softwares, cursos, categorias..." className="text-white" />
          <CommandList className="max-h-[400px]">
            <CommandEmpty className="text-white/40 text-sm py-6 text-center">
              Nenhum resultado encontrado.
            </CommandEmpty>

            {categories.length > 0 && (
              <CommandGroup heading="Categorias" className="text-white/30">
                {categories.map((cat) => (
                  <CommandItem
                    key={`cat-${cat.id}`}
                    value={cat.name}
                    onSelect={() => handleCategorySelect(cat.slug)}
                    className="text-white/70 hover:text-white cursor-pointer"
                  >
                    {categoryIcons[cat.id] || <Package className="w-4 h-4 text-white/40" />}
                    <span className="ml-2">{cat.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {softwares.length > 0 && (
              <CommandGroup heading="Softwares" className="text-white/30">
                {softwares.map((product) => (
                  <CommandItem
                    key={`sw-${product.id}`}
                    value={`${product.name} ${product.shortDescription}`}
                    onSelect={() => handleSelect(product.slug)}
                    className="text-white/70 hover:text-white cursor-pointer"
                  >
                    <Package className="w-4 h-4 text-[#0071E3]" />
                    <span className="ml-2 flex-1">{product.name}</span>
                    <span className="text-xs text-white/30">
                      R$ {parseFloat(product.price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {courses.length > 0 && (
              <CommandGroup heading="Cursos" className="text-white/30">
                {courses.map((course) => (
                  <CommandItem
                    key={`cr-${course.id}`}
                    value={`${course.name} ${course.shortDescription}`}
                    onSelect={() => handleSelect(course.slug)}
                    className="text-white/70 hover:text-white cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4 text-green-400" />
                    <span className="ml-2 flex-1">{course.name}</span>
                    <span className="text-xs text-white/30">
                      R$ {parseFloat(course.price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}

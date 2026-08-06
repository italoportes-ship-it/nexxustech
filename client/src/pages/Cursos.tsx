import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";

export default function Cursos() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation("/produto/ampler", { replace: true });
  }, [setLocation]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#58a9ff]" />
        <p className="mt-3 text-sm text-muted-foreground">Abrindo o Ampler...</p>
      </div>
    </div>
  );
}

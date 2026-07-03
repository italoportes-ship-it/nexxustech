import { useEffect, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

export default function WelcomeToast() {
  const { user, isAuthenticated } = useAuth();
  const prevAuthRef = useRef(false);

  useEffect(() => {
    // Detect transition from unauthenticated to authenticated (actual login)
    if (isAuthenticated && user && !prevAuthRef.current) {
      const firstName = user.name?.split(" ")[0] || "usuário";
      // Small delay to ensure page has rendered
      setTimeout(() => {
        toast.success(`Bem-vindo de volta, ${firstName}!`, {
          description: "Explore nossas soluções e cursos digitais.",
          duration: 4000,
        });
      }, 500);
    }
    prevAuthRef.current = isAuthenticated;
  }, [isAuthenticated, user]);

  return null;
}

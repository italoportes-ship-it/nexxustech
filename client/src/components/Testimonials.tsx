import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";

const testimonials = [
  {
    name: "Carlos Mendes",
    role: "CTO, TechVision",
    content: "A NexxusTECH transformou nossa infraestrutura de segurança. O suporte técnico é excepcional e a entrega foi imediata.",
    rating: 5,
  },
  {
    name: "Ana Beatriz",
    role: "Gerente de TI, Grupo Innovare",
    content: "Licenciamento em volume com preços competitivos. O processo de compra é fluido e o atendimento B2B é diferenciado.",
    rating: 5,
  },
  {
    name: "Ricardo Oliveira",
    role: "Dev Lead, StartupFlow",
    content: "O DevPipeline Pro revolucionou nosso CI/CD. Integração perfeita com GitHub e deploy automatizado sem dor de cabeça.",
    rating: 5,
  },
  {
    name: "Mariana Costa",
    role: "Data Scientist, DataPulse",
    content: "O curso de Data Science é completo e prático. Consegui aplicar os conhecimentos no dia seguinte no meu trabalho.",
    rating: 5,
  },
  {
    name: "Fernando Alves",
    role: "Designer, CreativeHub",
    content: "DesignStudio Pro é a melhor ferramenta de UI/UX que já usei. A colaboração em tempo real mudou nosso workflow.",
    rating: 5,
  },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 30, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAutoplay = () => {
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 4000);
  };

  const stopAutoplay = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  useEffect(() => {
    startAutoplay();
    return () => stopAutoplay();
  }, []);

  const goTo = (index: number) => {
    stopAutoplay();
    setCurrentIndex(index);
    startAutoplay();
  };

  const prev = () => goTo((currentIndex - 1 + testimonials.length) % testimonials.length);
  const next = () => goTo((currentIndex + 1) % testimonials.length);

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
          className="text-center mb-10 md:mb-16"
        >
          <h2 className="text-headline text-foreground mb-4">
            O que nossos clientes dizem
          </h2>
          <p className="text-body-large text-muted-foreground max-w-xl mx-auto">
            Empresas e profissionais que confiam na NexxusTECH.
          </p>
        </motion.div>

        {/* Carousel - single card on mobile, 3 on desktop */}
        <div className="relative">
          {/* Mobile: single card */}
          <div className="md:hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className="bento-card !p-6"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonials[currentIndex].rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#0071E3] text-[#0071E3]" />
                  ))}
                </div>
                <p className="text-sm text-foreground/70 leading-relaxed mb-6">
                  "{testimonials[currentIndex].content}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#0071E3]/10 flex items-center justify-center text-[#0071E3] text-sm font-semibold">
                    {testimonials[currentIndex].name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{testimonials[currentIndex].name}</p>
                    <p className="text-xs text-muted-foreground">{testimonials[currentIndex].role}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Desktop: 3 cards */}
          <div className="hidden md:grid md:grid-cols-3 gap-6">
            {[0, 1, 2].map((offset) => {
              const idx = (currentIndex + offset) % testimonials.length;
              const testimonial = testimonials[idx];
              return (
                <motion.div
                  key={`${currentIndex}-${offset}`}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.5, delay: offset * 0.1, ease: [0.23, 1, 0.32, 1] }}
                  className="bento-card !p-6"
                >
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#0071E3] text-[#0071E3]" />
                    ))}
                  </div>
                  <p className="text-sm text-foreground/70 leading-relaxed mb-6">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#0071E3]/10 flex items-center justify-center text-[#0071E3] text-sm font-semibold">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Navigation dots */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={prev}
              className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-foreground/50 hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex gap-1.5">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === currentIndex
                      ? "bg-[#0071E3] w-5"
                      : "bg-foreground/20 hover:bg-foreground/40 w-2"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={next}
              className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-foreground/50 hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

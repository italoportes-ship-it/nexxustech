import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
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

  // Show 3 testimonials at a time on desktop
  const getVisibleTestimonials = () => {
    const items = [];
    for (let i = 0; i < 3; i++) {
      items.push(testimonials[(currentIndex + i) % testimonials.length]);
    }
    return items;
  };

  return (
    <section className="py-24 bg-background">
      <div className="container">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
          className="text-center mb-16"
        >
          <h2 className="text-headline text-foreground mb-4">
            O que nossos clientes dizem
          </h2>
          <p className="text-body-large text-muted-foreground max-w-xl mx-auto">
            Empresas e profissionais que confiam na NexxusTECH.
          </p>
        </motion.div>

        {/* Carousel */}
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {getVisibleTestimonials().map((testimonial, index) => (
              <motion.div
                key={`${currentIndex}-${index}`}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1, ease: [0.23, 1, 0.32, 1] }}
                className="bento-card !p-6"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#0071E3] text-[#0071E3]" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-sm text-foreground/70 leading-relaxed mb-6">
                  "{testimonial.content}"
                </p>

                {/* Author */}
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
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-10">
            <button
              onClick={prev}
              className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-foreground/50 hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i === currentIndex
                      ? "bg-[#0071E3] w-6"
                      : "bg-foreground/20 hover:bg-foreground/40"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={next}
              className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-foreground/50 hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { ArrowRight, BookOpen, Clock, Signal } from "lucide-react";
import { motion } from "framer-motion";

const levelLabels: Record<string, string> = {
  beginner: "Iniciante",
  intermediate: "Intermediário",
  advanced: "Avançado",
};

const levelColors: Record<string, string> = {
  beginner: "bg-green-500/10 text-green-400",
  intermediate: "bg-yellow-500/10 text-yellow-400",
  advanced: "bg-red-500/10 text-red-400",
};

export default function Cursos() {
  const coursesQuery = trpc.products.byType.useQuery({ type: "course" });
  const courses = coursesQuery.data || [];

  return (
    <div className="min-h-screen bg-[#1D1D1F]">
      <Navbar />

      {/* Header */}
      <section className="pt-32 pb-16 bg-[#0a0a0a]">
        <div className="container text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-headline text-white mb-4">Cursos Digitais</h1>
            <p className="text-body-large text-white/50 max-w-2xl mx-auto">
              Capacitação profissional com os melhores cursos em tecnologia. Do iniciante ao avançado.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Courses Grid */}
      <section className="py-16 bg-[#1D1D1F]">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {courses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
              >
                <Link href={`/produto/${course.slug}`}>
                  <div className="bento-card group cursor-pointer h-full">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#0071E3]/10 text-[#0071E3]">
                        <BookOpen className="w-3 h-3 inline mr-1" />
                        Curso
                      </span>
                      {course.level && (
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${levelColors[course.level]}`}>
                          <Signal className="w-3 h-3 inline mr-1" />
                          {levelLabels[course.level]}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-semibold text-white mb-3 group-hover:text-[#0071E3] transition-colors">
                      {course.name}
                    </h3>
                    <p className="text-sm text-white/50 leading-relaxed mb-4">
                      {course.shortDescription}
                    </p>

                    {course.features && (
                      <div className="flex flex-wrap gap-1.5 mb-6">
                        {course.features.split(",").map((f, i) => (
                          <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-white/5 text-white/40">
                            {f.trim()}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <span className="text-xl font-bold text-white">
                        R$ {parseFloat(course.price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                      <span className="apple-btn apple-btn-primary text-sm py-2 px-4">
                        Matricular-se
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {courses.length === 0 && !coursesQuery.isLoading && (
            <div className="text-center py-20">
              <p className="text-white/40 text-lg">Nenhum curso disponível no momento.</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

import { FeatureGrid } from '@/components/home';
import { HeroSection } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { BookOpen } from 'lucide-react';

export default function HomePage() {
  return (
    <>
      {/* Hero principal */}
      <HeroSection
        title="CompiMC"
        subtitle="Sistema Educativo de Análisis de Compiladores"
        description="Herramienta interactiva para el aprendizaje y simulación de análisis léxico, sintáctico y generación de código. Visualiza autómatas, árboles de derivación y tablas de parsing en tiempo real."
        showHistoryButton={true}
      />

      {/* Hero secundario */}
      <div className="bg-linear-to-b from-background to-muted/30 py-12 sm:py-16">
        <div className="container mx-auto px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-balance font-bold text-2xl sm:text-3xl lg:text-4xl">
            Aprende Compiladores de Forma Interactiva
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-muted-foreground">
            Explora cada fase de la compilación con visualizaciones detalladas,
            análisis paso a paso y ejemplos prácticos. Ideal para estudiantes y
            profesionales.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <a href="/general">
                Comenzar con el Compilador General
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="/analizador-lexico">
                <BookOpen className="mr-2" />
                Explorar Analizador Léxico
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Grid de características */}
      <FeatureGrid />

      {/* Sección de características adicionales */}
      <div className="border-t border-border bg-muted/30 py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-balance text-center font-bold text-2xl sm:text-3xl">
            Características Principales
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2 text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <svg
                  className="size-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold">Visualización Interactiva</h3>
              <p className="text-muted-foreground text-sm">
                Grafos de autómatas y árboles sintácticos
              </p>
            </div>
            <div className="space-y-2 text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-lg bg-green-500/10 text-green-600 dark:text-green-400">
                <svg
                  className="size-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold">Análisis en Tiempo Real</h3>
              <p className="text-muted-foreground text-sm">
                Resultados instantáneos con validación y mensajes de error
              </p>
            </div>
            <div className="space-y-2 text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <svg
                  className="size-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h3 className="font-semibold">Historial Persistente</h3>
              <p className="text-muted-foreground text-sm">
                Guarda automáticamente tus análisis en el navegador
              </p>
            </div>
            <div className="space-y-2 text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
                <svg
                  className="size-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold">Mobile-First</h3>
              <p className="text-muted-foreground text-sm">
                Diseño responsivo con modo claro y oscuro completo
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
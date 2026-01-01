import { HeroSection } from '@/components/layout';
import { FeatureCard } from '@/components/home';
import { Code2, GitBranch, Workflow, CheckCircle } from 'lucide-react';

export default function AnalizadorLexicoPage() {
  return (
    <>
      <HeroSection
        title="Analizador Léxico"
        subtitle="Explora y construye autómatas finitos"
        description="Herramientas interactivas para el análisis léxico: construcción de autómatas finitos, conversión entre expresiones regulares y autómatas, y reconocimiento de cadenas."
      />

      {/* Grid de opciones */}
      <section className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2">
          <FeatureCard
            title="Construir ER de AF"
            description="Convertir un Autómata Finito (AF) en una Expresión Regular (ER) usando el Lemma de Arden"
            href="/analizador-lexico/af-to-er"
            icon={GitBranch}
            gradient="from-blue-500 to-cyan-500"
          />
          
          <FeatureCard
            title="Construir AFD full"
            description="Construir AFD completo mediante el método de subconjuntos con todas las transiciones"
            href="/analizador-lexico/afd-full"
            icon={Workflow}
            gradient="from-purple-500 to-pink-500"
          />
          
          <FeatureCard
            title="Construir AFD short"
            description="Construir AFD óptimo directamente desde ER usando árbol sintáctico y algoritmo directo"
            href="/analizador-lexico/afd-short"
            icon={Code2}
            gradient="from-green-500 to-emerald-500"
          />
          
          <FeatureCard
            title="Reconocer cadena"
            description="Validar si una cadena pertenece al lenguaje definido mostrando transiciones paso a paso"
            href="/analizador-lexico/reconocer"
            icon={CheckCircle}
            gradient="from-orange-500 to-red-500"
          />
        </div>
      </section>

      {/* mas contenido de la tematica */}
      <section className="border-t border-border bg-muted/30 py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-balance font-bold text-2xl sm:text-3xl mb-6">
              Sobre el Analizador Léxico
            </h2>
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <p className="text-muted-foreground">
                El análisis léxico es la primera fase de un compilador. Su función principal
                es leer el código fuente carácter por carácter y agruparlo en tokens (unidades
                léxicas con significado).
              </p>
              <p className="text-muted-foreground mt-4">
                Los autómatas finitos son la base teórica del análisis léxico. Un autómata
                finito determinista (AFD) puede reconocer patrones definidos por expresiones
                regulares de manera eficiente.
              </p>
              <p className="text-muted-foreground mt-4">
                Esta sección te permite experimentar con diferentes algoritmos y técnicas
                de construcción de autómatas: Thompson para AFN, subconjuntos para AFD,
                y métodos directos con árbol sintáctico.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

'use client';

/**
 * Grid de características para la página home
 */

import { FeatureCard } from './feature-card';
import { Layers, Type, GitBranch, TrendingUp } from 'lucide-react';

const features = [
  {
    title: 'Compilador General',
    description:
      'Análisis completo desde el código fuente hasta el código objeto. Incluye análisis léxico, sintáctico, generación de código intermedio y optimización.',
    href: '/general',
    icon: Layers,
    gradient: 'from-orange-500 to-red-500',
  },
  {
    title: 'Analizador Léxico',
    description:
      'Construcción de autómatas finitos (AFN/AFD), conversión entre expresiones regulares y autómatas, y reconocimiento de cadenas con visualización paso a paso.',
    href: '/analizador-lexico',
    icon: Type,
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    title: 'Análisis Sintáctico Descendente',
    description:
      'Parsing LL(1) con cálculo de conjuntos First y Follow, construcción de tabla M de parsing, y análisis paso a paso de cadenas de entrada.',
    href: '/asd',
    icon: GitBranch,
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    title: 'Análisis Sintáctico Ascendente',
    description:
      'Parsing LR con precedencia de operadores, construcción manual y automática de tablas, análisis con pila y detección de mangos.',
    href: '/asa',
    icon: TrendingUp,
    gradient: 'from-purple-500 to-pink-500',
  },
];

export function FeatureGrid() {
  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-6 sm:grid-cols-2 lg:gap-8">
        {features.map((feature) => (
          <FeatureCard key={feature.href} {...feature} />
        ))}
      </div>
    </div>
  );
}

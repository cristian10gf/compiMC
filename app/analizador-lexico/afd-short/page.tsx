import { HeroSection } from '@/components/layout';
import AFDShortClientPage from './page-client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AFD Short - Analizador Léxico - CompiMC',
  description: 'Construir Autómata Finito Determinista Óptimo con árbol sintáctico y funciones firstpos, lastpos.',
};

export default function AFDShortPage() {

  return (
    <>
      <HeroSection
        title="Construir AFD short"
        description="Construye un AFD óptimo (mínimo) directamente desde la expresión regular usando el método del árbol sintáctico con funciones anulable, primeros, últimos y siguientes."
      />

      <section className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <AFDShortClientPage />
      </section>
    </>
  );
}

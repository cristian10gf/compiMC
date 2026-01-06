import { Suspense } from 'react';
import { HeroSection } from '@/components/layout';
import { Metadata } from 'next';
import ERtoAFClientPage from './page-client';

export const metadata: Metadata = {
  title: 'AFD Full - Analizador Léxico - CompiMC',
  description: 'Construir Autómata Finito Determinista completo mediante el método de subconjuntos.',
};

export default function ERtoAFPage() {
  return (
    <>
      <HeroSection
        title="Construir AFD full"
        description="Construye un Autómata Finito Determinista completo mediante el método de subconjuntos desde una expresión regular. Muestra todas las transiciones y estados resultantes."
      />

      <section className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="flex items-center justify-center p-8">Cargando...</div>}>
          <ERtoAFClientPage />
        </Suspense>
      </section>
    </>
  );
}

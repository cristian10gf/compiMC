'use client';

import { HeroSection } from '@/components/layout';
import ERtoAFClientPage from './page-client';
import { useState } from 'react';

export default function ERtoAFPage() {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <>
      <HeroSection
        title="Construir AFD full"
        description="Construye un Autómata Finito Determinista completo mediante el método de subconjuntos desde una expresión regular. Muestra todas las transiciones y estados resultantes."
        showHistoryButton={true}
        onHistoryToggle={() => setShowHistory(!showHistory)}
      />

      <section className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <ERtoAFClientPage />
      </section>
    </>
  );
}

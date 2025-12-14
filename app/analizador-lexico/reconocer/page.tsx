'use client';

import { HeroSection } from '@/components/layout';
import ReconocerClientPage from './page-client';
import { useState } from 'react';

export default function ReconocerPage() {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <>
      <HeroSection
        title="Reconocer cadena"
        description="Valida si una cadena pertenece al lenguaje definido por una expresión regular. Visualiza el proceso de reconocimiento paso a paso con las transiciones del AFD."
        showHistoryButton={true}
        onHistoryToggle={() => setShowHistory(!showHistory)}
      />

      <section className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <ReconocerClientPage />
      </section>
    </>
  );
}

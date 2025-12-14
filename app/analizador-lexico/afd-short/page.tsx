'use client';

import { HeroSection } from '@/components/layout';
import AFDShortClientPage from './page-client';
import { useState } from 'react';

export default function AFDShortPage() {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <>
      <HeroSection
        title="Construir AFD short"
        description="Construye un AFD óptimo (mínimo) directamente desde la expresión regular usando el método del árbol sintáctico con funciones anulable, primeros, últimos y siguientes."
        showHistoryButton={true}
        onHistoryToggle={() => setShowHistory(!showHistory)}
      />

      <section className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <AFDShortClientPage />
      </section>
    </>
  );
}

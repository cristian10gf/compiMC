'use client';

import { HeroSection } from '@/components/layout';
import AFtoERClientPage from './page-client';
import { useState } from 'react';

export default function AFtoERPage() {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <>
      <HeroSection
        title="Construir ER de AF"
        description="Convierte un autómata finito determinista o no determinista a su expresión regular equivalente. Utiliza el método de eliminación de estados de Arden."
        showHistoryButton={true}
        onHistoryToggle={() => setShowHistory(!showHistory)}
      />

      <section className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <AFtoERClientPage />
      </section>
    </>
  );
}

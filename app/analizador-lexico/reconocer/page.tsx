import { HeroSection } from '@/components/layout';
import ReconocerClientPage from './page-client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reconocer Cadena - Analizador Léxico - CompiMC',
  description: 'Validar cadenas con AFD mostrando el proceso de reconocimiento paso a paso con transiciones.',
};

export default function ReconocerPage() {

  return (
    <>
      <HeroSection
        title="Reconocer cadena"
        description="Valida si una cadena pertenece al lenguaje definido por una expresión regular. Visualiza el proceso de reconocimiento paso a paso con las transiciones del AFD."
      />

      <section className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <ReconocerClientPage />
      </section>
    </>
  );
}

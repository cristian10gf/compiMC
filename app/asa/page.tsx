import { Metadata } from 'next';
import ASAClientPage from './page-client';

export const metadata: Metadata = {
  title: 'Análisis Sintáctico Ascendente - CompiMC',
  description: 'Analizador sintáctico LR con tabla de precedencia de operadores, conjuntos de items LR y traza de análisis.',
};

export default function ASAPage() {
  return (
    <>
      <section className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-balance font-bold text-3xl sm:text-4xl mb-2 text-center sm:flex sm:flex-row-reverse sm:text-left">
            Análisis Sintáctico Ascendente (LR)
          </h1>
          <p className="text-pretty text-muted-foreground">
            Analizador sintáctico por desplazamiento-reducción (bottom-up) con construcción de tabla
            de precedencia de operadores, conjuntos de items LR y traza del análisis.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-8 sm:px-6 lg:px-8">
        <ASAClientPage />
      </section>
    </>
  );
}

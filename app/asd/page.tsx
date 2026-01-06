import { Metadata } from 'next';
import ASDClientPage from './page-client';

export const metadata: Metadata = {
  title: 'Análisis Sintáctico Descendente - CompiMC',
  description: 'Analizador sintáctico predictivo LL(1) con construcción de tabla M, conjuntos FIRST y FOLLOW.',
};

export default function ASDPage() {
  return (
    <>
      <section className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-balance font-bold text-3xl sm:text-4xl mb-2 text-center sm:flex sm:flex-row-reverse sm:text-left">
            Análisis Sintáctico Descendente (LL)
          </h1>
          <p className="text-pretty text-muted-foreground">
            Analizador sintáctico predictivo (top-down) que construye la tabla M de análisis LL(1),
            calcula los conjuntos FIRST y FOLLOW, y muestra la traza del análisis paso a paso.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-8 sm:px-6 lg:px-8">
        <ASDClientPage />
      </section>
    </>
  );
}

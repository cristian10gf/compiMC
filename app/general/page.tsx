import { Metadata } from 'next';
import GeneralClientPage from './page-client';

export const metadata: Metadata = {
  title: 'Compilador General - CompiMC',
  description: 'Pipeline completo de compilación: análisis léxico, sintáctico, semántico, generación de código intermedio, optimización y código objeto.',
};

export default function GeneralPage() {
  return (
    <>
      <section className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-balance font-bold text-3xl sm:text-4xl mb-2 flex sm:justify-center-safe flex-row-reverse sm:text-left">
            Compilador General
          </h1>
          <p className="text-pretty text-muted-foreground">
            Pipeline completo de compilación desde código fuente hasta código objeto.
            Incluye análisis léxico, sintáctico y semántico, generación de código intermedio,
            optimización y generación de código ensamblador.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-8 sm:px-6 lg:px-8">
        <GeneralClientPage />
      </section>
    </>
  );
}

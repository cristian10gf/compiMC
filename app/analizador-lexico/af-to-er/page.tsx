import { Suspense } from 'react';
import AFtoERClientPage from './page-client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AF a ER - Analizador Léxico - CompiMC',
  description: 'Convierte un autómata finito (AFN o AFD) a su expresión regular equivalente mediante el método de eliminación de estados.',
};

export default function AFtoERPage() {

  return (
    <>
      <section className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="flex items-center justify-center p-8">Cargando...</div>}>
          <AFtoERClientPage />
        </Suspense>
      </section>
    </>
  );
}

import { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'AF a ER - Analizador Léxico - CompiMC',
  description: 'Convierte un autómata finito (AFN o AFD) a su expresión regular equivalente mediante el método de eliminación de estados.',
};

export default function AFtoERLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}

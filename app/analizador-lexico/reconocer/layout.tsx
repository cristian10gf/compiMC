import { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Reconocer Cadena - Analizador Léxico - CompiMC',
  description: 'Validar cadenas con AFD mostrando el proceso de reconocimiento paso a paso con transiciones.',
};

export default function ReconocerLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}

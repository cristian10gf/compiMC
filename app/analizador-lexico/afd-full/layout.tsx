import { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'AFD Full - Analizador Léxico - CompiMC',
  description: 'Construir Autómata Finito Determinista completo mediante el método de subconjuntos.',
};

export default function AFDFullLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}

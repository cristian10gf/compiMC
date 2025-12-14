import { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'AFD Short - Analizador Léxico - CompiMC',
  description: 'Construir Autómata Finito Determinista Óptimo con árbol sintáctico y funciones firstpos, lastpos.',
};

export default function AFDShortLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}

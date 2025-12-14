import { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Analizador Léxico - CompiMC',
  description: 'Herramientas para análisis léxico: construcción de autómatas, conversión ER↔AF y reconocimiento de cadenas.',
};

export default function AnalizadorLexicoLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}

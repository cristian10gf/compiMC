/**
 * Footer global de la aplicación
 */

import Link from 'next/link';
import { Github, Mail, ExternalLink } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30 mt-auto">
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* About */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Sobre CompiMC</h3>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Sistema web educativo para el análisis y simulación de compiladores.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Enlaces Rápidos</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/general"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Compilador General
                </Link>
              </li>
              <li>
                <Link
                  href="/analizador-lexico"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Analizador Léxico
                </Link>
              </li>
              <li>
                <Link
                  href="/asd"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Análisis Descendente
                </Link>
              </li>
              <li>
                <Link
                  href="/asa"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Análisis Ascendente
                </Link>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Características</h3>
            <ul className="space-y-2 text-xs">
              <li className="text-muted-foreground">
                ✓ Construcción de Autómatas
              </li>
              <li className="text-muted-foreground">
                ✓ Análisis Sintáctico LL/LR
              </li>
              <li className="text-muted-foreground">
                ✓ Generación de Código
              </li>
              <li className="text-muted-foreground">
                ✓ Visualización Interactiva
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Contacto</h3>
            <div className="flex flex-col gap-2">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground text-xs transition-colors hover:text-foreground"
              >
                <Github className="size-4" />
                <span>GitHub</span>
                <ExternalLink className="size-3" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6">
          <p className="text-center text-muted-foreground text-xs">
            © {new Date().getFullYear()} CompiMC. Sistema de análisis de
            compiladores educativo.
          </p>
        </div>
      </div>
    </footer>
  );
}

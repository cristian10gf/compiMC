'use client';

/**
 * Sidebar principal de navegación
 * Incluye logo, links a las secciones principales y toggle del historial
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Menu,
  X,
  Home,
  Layers,
  Type,
  GitBranch,
  TrendingUp,
  History,
} from 'lucide-react';
import { useState } from 'react';

const ThemeToggle = dynamic(
  () => import('./theme-toggle').then((module) => module.ThemeToggle),
  { ssr: false }
);

const navigationItems = [
  {
    name: 'Inicio',
    href: '/',
    icon: Home,
  },
  {
    name: 'General',
    href: '/general',
    icon: Layers,
  },
  {
    name: 'Analizador Léxico',
    href: '/analizador-lexico',
    icon: Type,
  },
  {
    name: 'ASD (LL)',
    href: '/asd',
    icon: GitBranch,
  },
  {
    name: 'ASA (LR)',
    href: '/asa',
    icon: TrendingUp,
  },
];

interface MainSidebarProps {
  onHistoryToggle?: () => void;
  historyOpen?: boolean;
}

export function MainSidebar({ onHistoryToggle, historyOpen }: MainSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const toggleMobile = () => setMobileOpen(!mobileOpen);

  return (
    <>
      {/* Mobile toggle button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-50 md:hidden"
        onClick={toggleMobile}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X /> : <Menu />}
      </Button>

      {/* Backdrop para mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={toggleMobile}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-background transition-transform duration-300',
          'md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Navegación principal"
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <header className="flex h-16 items-center justify-center border-b border-border px-6">
            <Link
              href="/"
              className="flex items-center gap-2 font-bold text-lg"
              onClick={() => setMobileOpen(false)}
            >
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                C
              </div>
              <span className="text-foreground">CompiMC</span>
            </Link>
          </header>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto p-4" aria-label="Secciones principales">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="size-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            <Separator className="my-4" />

            {/* Historial toggle */}
            <Button
              variant={historyOpen ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => {
                onHistoryToggle?.();
                setMobileOpen(false);
              }}
            >
              <History className="mr-3 size-5" />
              <span>Historial</span>
            </Button>
          </nav>

          {/* Footer del sidebar */}
          <div className="border-t border-border p-4">
            <ThemeToggle />
            <p className="mt-3 text-center text-xs text-muted-foreground">
              CompiMC v1.0
              <br />
              Sistema de Análisis de Compiladores
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

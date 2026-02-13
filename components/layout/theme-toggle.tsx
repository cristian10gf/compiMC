'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  if (resolvedTheme !== 'light' && resolvedTheme !== 'dark') {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-full justify-start border-primary/30 bg-primary/5"
        disabled
        aria-label="Cargando tema"
      >
        Tema
      </Button>
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full justify-start border-primary/30 bg-primary/5 hover:border-primary hover:bg-primary/10"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      {isDark ? <Sun className="mr-2 size-4" /> : <Moon className="mr-2 size-4" />}
      {isDark ? 'Modo claro' : 'Modo oscuro'}
    </Button>
  );
}

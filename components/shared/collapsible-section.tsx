'use client';

/**
 * Sección colapsable reutilizable
 * Se usa para mostrar/ocultar contenido en las páginas de análisis
 */

import { ReactNode, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  icon?: ReactNode;
  badge?: ReactNode;
  className?: string;
}

export function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  icon,
  badge,
  className,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn('rounded-lg border border-border bg-card', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-primary/10"
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {icon && <div className="shrink-0 text-muted-foreground">{icon}</div>}
          <h3 className="font-semibold text-base sm:text-lg truncate">{title}</h3>
          {badge && <div className="shrink-0">{badge}</div>}
        </div>
        <ChevronDown
          className={cn(
            'size-5 shrink-0 text-muted-foreground transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <div className="border-t border-border p-4 animate-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );
}

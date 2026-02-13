'use client';

/**
 * Sección colapsable mejorada con Accordion de shadcn
 * Se usa para mostrar/ocultar contenido en las páginas de análisis
 * Mejoras: Usa Accordion para mejor semántica, animaciones y accesibilidad
 */

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  icon?: ReactNode;
  badge?: ReactNode;
  className?: string;
  value?: string;
}

export function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  icon,
  badge,
  className,
  value = 'item-1',
}: CollapsibleSectionProps) {
  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={defaultOpen ? value : undefined}
      className={cn('rounded-lg border border-border bg-card', className)}
    >
      <AccordionItem value={value} className="border-none">
        <AccordionTrigger className="px-4 hover:no-underline hover:bg-primary/10">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {icon && <div className="shrink-0 text-muted-foreground">{icon}</div>}
            <h3 className="font-semibold text-base sm:text-lg truncate">{title}</h3>
            {badge && <div className="shrink-0">{badge}</div>}
          </div>
        </AccordionTrigger>
        <AccordionContent className="border-t border-border px-4 pb-4">
          {children}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

// Variante multi-sección para usar con múltiples items
interface MultiCollapsibleSectionProps {
  type?: 'single' | 'multiple';
  className?: string;
  children: ReactNode;
  defaultValue?: string | string[];
}

export function MultiCollapsibleSection({
  type = 'single',
  className,
  children,
  defaultValue,
}: MultiCollapsibleSectionProps) {
  if (type === 'multiple') {
    return (
      <Accordion
        type="multiple"
        defaultValue={defaultValue as string[]}
        className={cn('space-y-2', className)}
      >
        {children}
      </Accordion>
    );
  }

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={defaultValue as string}
      className={cn('space-y-2', className)}
    >
      {children}
    </Accordion>
  );
}

// Item individual para usar con MultiCollapsibleSection
interface CollapsibleItemProps {
  value: string;
  title: string;
  children: ReactNode;
  icon?: ReactNode;
  badge?: ReactNode;
  className?: string;
}

export function CollapsibleItem({
  value,
  title,
  children,
  icon,
  badge,
  className,
}: CollapsibleItemProps) {
  return (
    <AccordionItem
      value={value}
      className={cn('rounded-lg border border-border bg-card', className)}
    >
      <AccordionTrigger className="px-4 hover:no-underline hover:bg-primary/10">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {icon && <div className="shrink-0 text-muted-foreground">{icon}</div>}
          <h3 className="font-semibold text-base sm:text-lg truncate">{title}</h3>
          {badge && <div className="shrink-0">{badge}</div>}
        </div>
      </AccordionTrigger>
      <AccordionContent className="border-t border-border px-4 pb-4">
        {children}
      </AccordionContent>
    </AccordionItem>
  );
}

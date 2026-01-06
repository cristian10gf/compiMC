'use client';

/**
 * Hero Section reutilizable
 * Se usa en todas las páginas para mostrar título, subtítulo y acciones
 */

import { Button } from '@/components/ui/button';
import { ReactNode } from 'react';

interface HeroSectionProps {
  title: string;
  subtitle?: string;
  description?: string;
  actions?: ReactNode;
  onHistoryToggle?: () => void;
  showHistoryButton?: boolean;
}

export function HeroSection({
  title,
  subtitle,
  description,
  actions,
  onHistoryToggle,
  showHistoryButton = true,
}: HeroSectionProps) {
  return (
    <div className="border-b border-border bg-muted/30 py-4 sm:py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 space-y-3">
            <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl text-center sm:flex sm:flex-row-reverse sm:text-left">
              {title}
            </h1>
            {subtitle && (
              <p className="text-pretty text-lg text-muted-foreground sm:text-xl">
                {subtitle}
              </p>
            )}
            {description && (
              <p className="text-pretty text-sm text-muted-foreground max-w-2xl">
                {description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {showHistoryButton && onHistoryToggle && (
              <Button
                variant="outline"
                size="default"
                onClick={onHistoryToggle}
                className="sm:min-w-30"
              >
                Historial
              </Button>
            )}
            {actions}
          </div>
        </div>
      </div>
    </div>
  );
}

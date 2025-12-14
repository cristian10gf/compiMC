'use client';

/**
 * Componente para mostrar el estado del resultado
 * Muestra si una cadena fue aceptada o rechazada
 */

import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface ResultStatusProps {
  accepted: boolean;
  message?: string;
  className?: string;
}

export function ResultStatus({ accepted, message, className }: ResultStatusProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border p-4',
        accepted
          ? 'border-green-500/20 bg-green-500/10'
          : 'border-red-500/20 bg-red-500/10',
        className
      )}
    >
      {accepted ? (
        <CheckCircle2 className="size-6 shrink-0 text-green-600 dark:text-green-400" />
      ) : (
        <XCircle className="size-6 shrink-0 text-red-600 dark:text-red-400" />
      )}
      <div className="min-w-0 flex-1">
        <Badge
          variant="secondary"
          className={cn(
            'text-sm',
            accepted
              ? 'bg-green-500/20 text-green-700 dark:text-green-400'
              : 'bg-red-500/20 text-red-700 dark:text-red-400'
          )}
        >
          {accepted ? 'ACEPTADA' : 'RECHAZADA'}
        </Badge>
        {message && (
          <p className="mt-2 text-sm text-foreground">{message}</p>
        )}
      </div>
    </div>
  );
}

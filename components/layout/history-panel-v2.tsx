'use client';

/**
 * Panel de historial mejorado con Sheet de shadcn
 * Muestra el historial de análisis guardados en localStorage
 * Mejoras: Usa Sheet para mejor semántica y animaciones
 */

import { useHistory } from '@/lib/context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface HistoryPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const typeLabels = {
  lexical: 'Léxico',
  'syntax-ll': 'Sint. LL',
  'syntax-lr': 'Sint. LR',
  compiler: 'Compilador',
};

const typeColors = {
  lexical: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  'syntax-ll': 'bg-green-500/10 text-green-700 dark:text-green-400',
  'syntax-lr': 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
  compiler: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
};

export function HistoryPanel({ open, onOpenChange }: HistoryPanelProps) {
  const { filteredHistory, removeEntry, clearHistory, stats, setFilter, clearFilter } = useHistory();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term.trim()) {
      setFilter({ searchTerm: term });
    } else {
      clearFilter();
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full p-0 sm:w-96 sm:max-w-96">
        <SheetHeader className="border-b border-border px-4 py-4">
          <SheetTitle>Historial</SheetTitle>
          <SheetDescription>
            {stats.totalEntries} {stats.totalEntries === 1 ? 'entrada' : 'entradas'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex h-[calc(100vh-8rem)] flex-col">
          {/* Search */}
          <div className="border-b border-border p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar en historial..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="border-b border-border p-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted p-3">
                <p className="text-muted-foreground text-xs">Tasa de éxito</p>
                <p className="font-semibold text-lg">
                  {stats.successRate.toFixed(0)}%
                </p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-muted-foreground text-xs">Promedio</p>
                <p className="font-semibold text-lg">
                  {stats.averageDuration
                    ? `${stats.averageDuration.toFixed(0)}ms`
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* History list */}
          <div className="flex-1 space-y-2 overflow-y-auto p-4">
            {filteredHistory.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <Clock className="size-12 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">No hay historial</p>
                  <p className="text-muted-foreground text-xs">
                    {searchTerm
                      ? 'No se encontraron resultados'
                      : 'Comienza a usar CompiMC para ver tu historial'}
                  </p>
                </div>
              </div>
            ) : (
              filteredHistory.map((entry) => (
                <Card key={entry.id} className="p-3 transition-colors hover:bg-muted/50">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1 space-y-1.5">
                      {/* Type and status */}
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={cn(
                            'text-xs',
                            typeColors[entry.type as keyof typeof typeColors]
                          )}
                        >
                          {typeLabels[entry.type as keyof typeof typeLabels]}
                        </Badge>
                        {entry.metadata?.success ? (
                          <CheckCircle2 className="size-3.5 text-green-600 dark:text-green-400" />
                        ) : (
                          <XCircle className="size-3.5 text-red-600 dark:text-red-400" />
                        )}
                      </div>

                      {/* Input preview */}
                      <p className="truncate font-mono text-xs text-foreground">
                        {entry.input}
                      </p>

                      {/* Metadata */}
                      <div className="flex items-center gap-3 text-muted-foreground text-xs">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {formatDate(entry.timestamp)}
                        </span>
                        {entry.metadata?.duration && (
                          <span>{entry.metadata.duration}ms</span>
                        )}
                      </div>
                    </div>

                    {/* Delete button */}
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => removeEntry(entry.id)}
                      className="shrink-0"
                      aria-label="Eliminar entrada"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Footer actions */}
          {filteredHistory.length > 0 && (
            <>
              <Separator />
              <div className="p-4">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={clearHistory}
                >
                  <Trash2 className="mr-2" />
                  Limpiar historial
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

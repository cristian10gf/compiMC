'use client';

/**
 * Tabla de estados del AFD mostrando los elementos constituyentes del AFN
 * Muestra la correspondencia entre estados del AFD y sus estados AFN componentes
 */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Automaton, SubsetState } from '@/lib/types/automata';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { CopyButton } from '@/components/shared/copy-button';
import { cn } from '@/lib/utils';

interface SubsetStatesTableProps {
  automaton: Automaton;
  highlightedStates?: string[]; // Estados a resaltar (ej: estados unificados)
  title?: string;
  className?: string;
}

export function SubsetStatesTable({
  automaton,
  highlightedStates = [],
  title = 'Estados y Elementos del AFN',
  className,
}: SubsetStatesTableProps) {
  const subsetStates = automaton.subsetStates || [];

  // Ordenar estados: primero por si es inicial, luego alfabéticamente
  const sortedSubsets = [...subsetStates].sort((a, b) => {
    const stateA = automaton.states.find(s => s.id === a.id);
    const stateB = automaton.states.find(s => s.id === b.id);
    
    if (stateA?.isInitial) return -1;
    if (stateB?.isInitial) return 1;
    return a.id.localeCompare(b.id);
  });

  const handleExport = () => {
    let csv = 'Estado,Elementos AFN\n';
    sortedSubsets.forEach((subset) => {
      const state = automaton.states.find(s => s.id === subset.id);
      const prefix = state?.isInitial ? '→' : state?.isFinal ? '*' : '';
      const elements = Array.from(subset.constituentStates).sort().join(', ');
      csv += `${prefix}${subset.id},"{${elements}}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `subset-states-${automaton.id}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (subsetStates.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No hay información de estados subconjuntos disponible.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <div className="flex gap-2">
            <CopyButton
              content={JSON.stringify(
                sortedSubsets.map(s => ({
                  estado: s.id,
                  elementos: Array.from(s.constituentStates),
                })),
                null,
                2
              )}
            />
            <Button size="sm" variant="outline" onClick={handleExport}>
              <Download className="mr-1" />
              Exportar CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold">Estado</TableHead>
                <TableHead className="font-bold">Elementos del AFN</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSubsets.map((subset) => {
                const state = automaton.states.find(s => s.id === subset.id);
                const isHighlighted = highlightedStates.includes(subset.id);
                const elements = Array.from(subset.constituentStates).sort();

                return (
                  <TableRow
                    key={subset.id}
                    className={cn(
                      'transition-colors',
                      isHighlighted && 'bg-yellow-100 dark:bg-yellow-900/30'
                    )}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {state?.isInitial && (
                          <span className="text-green-600 font-bold">→</span>
                        )}
                        {state?.isFinal && (
                          <span className="text-red-600 font-bold">*</span>
                        )}
                        <span className={cn(
                          isHighlighted && 'font-bold text-yellow-700 dark:text-yellow-400'
                        )}>
                          {subset.id}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">
                        {'{'}
                        {elements.map((el, idx) => (
                          <span key={el}>
                            {idx > 0 && ', '}
                            <span className="text-blue-600 dark:text-blue-400">{el}</span>
                          </span>
                        ))}
                        {'}'}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Leyenda */}
        <div className="mt-4 text-xs text-muted-foreground border-t pt-3">
          <div className="font-medium mb-1">Leyenda:</div>
          <div className="flex flex-wrap gap-3">
            <span>→ Estado inicial</span>
            <span>* Estado final</span>
            {highlightedStates.length > 0 && (
              <span className="bg-yellow-100 dark:bg-yellow-900/30 px-1 rounded">
                Resaltado = Estados unificados
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

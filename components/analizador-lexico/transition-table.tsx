'use client';

/**
 * Tabla de transiciones de estados del autómata
 * Muestra la tabla Estado x Símbolo con las transiciones
 */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Automaton, State } from '@/lib/types/automata';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { CopyButton } from '@/components/shared/copy-button';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface TransitionTableProps {
  automaton: Automaton;
  highlightState?: string; // Estado a resaltar
  onStateClick?: (stateId: string) => void;
  className?: string;
  itemsPerPage?: number;
}

interface TransitionTable {
  [stateId: string]: {
    [symbol: string]: string[]; // Lista de estados destino
  };
}

export function TransitionTable({
  automaton,
  highlightState,
  onStateClick,
  className,
  itemsPerPage = 10,
}: TransitionTableProps) {
  const [currentPage, setCurrentPage] = useState(0);

  // Construir la tabla de transiciones
  const transitionTable = useMemo(() => {
    const table: TransitionTable = {};

    // Inicializar tabla
    automaton.states.forEach((state) => {
      table[state.id] = {};
      automaton.alphabet.forEach((symbol) => {
        table[state.id][symbol] = [];
      });
    });

    // Llenar con transiciones
    automaton.transitions.forEach((trans) => {
      if (!table[trans.from][trans.symbol]) {
        table[trans.from][trans.symbol] = [];
      }
      table[trans.from][trans.symbol].push(trans.to);
    });

    return table;
  }, [automaton]);

  // Ordenar estados: inicial primero, luego normales, 
  const sortedStates = useMemo(() => {
    return [...automaton.states].sort((a, b) => {
      return a.id.localeCompare(b.id);
    });
  }, [automaton.states]);

  // Paginación
  const totalPages = Math.ceil(sortedStates.length / itemsPerPage);
  const paginatedStates = sortedStates.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const handleExport = () => {
    let csv = 'Estado,' + automaton.alphabet.join(',') + '\n';
    sortedStates.forEach((state) => {
      const prefix = state.isInitial ? '→' : state.isFinal ? '*' : '';
      csv += `${prefix}${state.label},`;
      csv += automaton.alphabet
        .map((symbol) => {
          const destinations = transitionTable[state.id][symbol];
          return destinations.length > 0 ? destinations.join('/') : '-';
        })
        .join(',');
      csv += '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transition-table-${automaton.id}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Tabla de Transiciones</CardTitle>
          <div className="flex gap-2">
            <CopyButton
              content={JSON.stringify(transitionTable, null, 2)}
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
                {automaton.alphabet.map((symbol) => (
                  <TableHead key={symbol} className="text-center font-bold">
                    {symbol}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedStates.map((state) => (
                <TableRow
                  key={state.id}
                  className={cn(
                    'cursor-pointer hover:bg-muted/50 transition-colors',
                    highlightState === state.id && 'bg-primary/10'
                  )}
                  onClick={() => onStateClick?.(state.id)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {state.isInitial && (
                        <span className="text-green-600 font-bold">→</span>
                      )}
                      {state.isFinal && (
                        <span className="text-red-600 font-bold">*</span>
                      )}
                      <span>{state.label}</span>
                    </div>
                  </TableCell>
                  {automaton.alphabet.map((symbol) => {
                    const destinations = transitionTable[state.id][symbol];
                    return (
                      <TableCell key={symbol} className="text-center">
                        {destinations.length > 0 ? (
                          <span className="font-mono text-sm">
                            {destinations.join(', ')}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Página {currentPage + 1} de {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
              >
                <ChevronLeft />
                Anterior
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage === totalPages - 1}
              >
                Siguiente
                <ChevronRight />
              </Button>
            </div>
          </div>
        )}

        {/* Leyenda */}
        <div className="mt-4 text-xs text-muted-foreground border-t pt-3">
          <div className="font-medium mb-1">Leyenda:</div>
          <div className="flex flex-wrap gap-3">
            <span>→ Estado inicial</span>
            <span>* Estado final</span>
            <span>- Sin transición</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

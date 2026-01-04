'use client';

/**
 * Tabla M de parsing para análisis sintáctico descendente (LL)
 * Muestra las producciones a aplicar para cada combinación de no terminal y terminal
 */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ParsingTable as ParsingTableType } from '@/lib/types/grammar';
import { CopyButton } from '@/components/shared/copy-button';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ParsingTableProps {
  table: ParsingTableType;
  highlightCell?: { nonTerminal: string; terminal: string };
  onCellClick?: (nonTerminal: string, terminal: string, production: string | null) => void;
  className?: string;
  itemsPerPage?: number;
  nonTerminalOrder?: string[]; // Orden de los no terminales según las producciones
}

export function ParsingTable({
  table,
  highlightCell,
  onCellClick,
  className,
  itemsPerPage = 10,
  nonTerminalOrder,
}: ParsingTableProps) {
  const [currentPage, setCurrentPage] = useState(0);

  // Obtener no terminales en orden de aparición en entries, o usar el orden proporcionado
  const uniqueNonTerminals = Array.from(new Set(table.entries.map((e: { nonTerminal: string }) => e.nonTerminal)));
  
  // Si se proporciona un orden, usarlo; de lo contrario mantener el orden de entries
  const nonTerminals = nonTerminalOrder 
    ? nonTerminalOrder.filter(nt => uniqueNonTerminals.includes(nt))
    : uniqueNonTerminals;
    
  const terminals = Array.from(new Set(table.entries.map((e: { terminal: string }) => e.terminal)));

  // Paginación por no terminales
  const totalPages = Math.ceil(nonTerminals.length / itemsPerPage);
  const paginatedNonTerminals = nonTerminals.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const getProduction = (nonTerminal: string, terminal: string): string | null => {
    const entry = table.entries.find(
      (e: { nonTerminal: string; terminal: string }) => e.nonTerminal === nonTerminal && e.terminal === terminal
    );
    return entry?.production || null;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Tabla M de Parsing (LL)</CardTitle>
          <CopyButton content={JSON.stringify(table, null, 2)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold bg-muted sticky left-0">
                  No Terminal
                </TableHead>
                {terminals.map((terminal: string) => (
                  <TableHead key={terminal} className="text-center font-bold bg-muted min-w-25">
                    {terminal}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedNonTerminals.map((nonTerminal: string) => (
                <TableRow key={nonTerminal}>
                  <TableCell className="font-medium bg-muted sticky left-0 flex justify-center content-center">
                    {nonTerminal}
                  </TableCell>
                  {terminals.map((terminal: string) => {
                    const production = getProduction(nonTerminal, terminal);
                    const isHighlighted =
                      highlightCell?.nonTerminal === nonTerminal &&
                      highlightCell?.terminal === terminal;

                    return (
                      <TableCell
                        key={terminal}
                        className={cn(
                          'text-center cursor-pointer transition-all text-sm',
                          production && 'bg-primary/10 dark:bg-primary/20',
                          isHighlighted && 'ring-2 ring-primary ring-offset-2',
                          !production && 'text-muted-foreground bg-muted/30'
                        )}
                        onClick={() => onCellClick?.(nonTerminal as string, terminal as string, production)}
                      >
                        {production ? (
                          <code className="font-mono text-xs text-primary">{production}</code>
                        ) : (
                          '-'
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

        {/* Información */}
        <div className="mt-4 text-xs text-muted-foreground border-t pt-3">
          <div>Total de no terminales: {nonTerminals.length}</div>
          <div>Total de terminales: {terminals.length}</div>
          <div>Entradas definidas: {table.entries.filter((e: { production: string | null }) => e.production).length}</div>
        </div>
      </CardContent>
    </Card>
  );
}

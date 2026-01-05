'use client';

/**
 * Tabla de análisis sintáctico LR (Action/Goto)
 * Muestra las acciones (shift, reduce, accept) y transiciones goto
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
import { Badge } from '@/components/ui/badge';
import { CopyButton } from '@/components/shared/copy-button';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import type { ActionTable, ActionTableEntry, GotoTable, Grammar } from '@/lib/types/grammar';
import type { LRConflict } from '@/lib/types/syntax-analysis';

interface LRParsingTableProps {
  actionTable: ActionTable;
  gotoTable: GotoTable;
  grammar: Grammar;
  conflicts?: LRConflict[];
  title?: string;
  className?: string;
  statesPerPage?: number;
}

/**
 * Formatea una acción para mostrar
 */
function formatAction(action: ActionTableEntry): string {
  switch (action.action) {
    case 'shift':
      return `d${action.value}`;
    case 'reduce':
      // value puede ser número o Production
      const prodNum = typeof action.value === 'number' 
        ? action.value 
        : (action.value as any)?.number ?? '?';
      return `r${prodNum}`;
    case 'accept':
      return 'acc';
    default:
      return '';
  }
}

/**
 * Obtiene el color de fondo según la acción
 */
function getActionColor(action: string): string {
  switch (action) {
    case 'shift':
      return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
    case 'reduce':
      return 'bg-amber-500/10 text-amber-700 dark:text-amber-400';
    case 'accept':
      return 'bg-green-500/10 text-green-700 dark:text-green-400';
    default:
      return '';
  }
}

/**
 * Genera texto para copiar la tabla
 */
function generateCopyText(
  actionTable: ActionTable,
  gotoTable: GotoTable,
  terminals: string[],
  nonTerminals: string[]
): string {
  const states = Object.keys(actionTable).map(Number).sort((a, b) => a - b);
  const header = `Estado\t${terminals.join('\t')}\t${nonTerminals.join('\t')}`;
  
  const rows = states.map(state => {
    const actionCells = terminals.map(t => {
      const action = actionTable[state]?.[t];
      return action ? formatAction(action) : '';
    });
    const gotoCells = nonTerminals.map(nt => gotoTable[state]?.[nt] || '');
    return `${state}\t${actionCells.join('\t')}\t${gotoCells.join('\t')}`;
  });
  
  return `${header}\n${rows.join('\n')}`;
}

export function LRParsingTable({
  actionTable,
  gotoTable,
  grammar,
  conflicts = [],
  title = 'Tabla de Análisis Sintáctico',
  className,
  statesPerPage = 20,
}: LRParsingTableProps) {
  const [currentPage, setCurrentPage] = useState(0);
  
  // Obtener terminales y no terminales
  const terminals = [...grammar.terminals, '$'];
  const nonTerminals = grammar.nonTerminals.filter(nt => !nt.endsWith("'"));
  
  // Obtener estados ordenados
  const states = Object.keys(actionTable).map(Number).sort((a, b) => a - b);
  const totalPages = Math.ceil(states.length / statesPerPage);
  const paginatedStates = states.slice(
    currentPage * statesPerPage,
    (currentPage + 1) * statesPerPage
  );
  
  // Verificar si hay conflicto en una celda
  const hasConflict = (state: number, symbol: string): boolean => {
    return conflicts.some(c => c.state === state && c.symbol === symbol);
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">{title}</CardTitle>
            {conflicts.length > 0 && (
              <Badge variant="destructive" className="text-xs">
                {conflicts.length} conflicto{conflicts.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <CopyButton content={generateCopyText(actionTable, gotoTable, terminals, nonTerminals)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold bg-muted sticky left-0 z-10 w-16 text-center">
                  Estado
                </TableHead>
                {/* Columnas de acción (terminales) */}
                <TableHead 
                  colSpan={terminals.length} 
                  className="text-center bg-blue-500/10 border-x border-border font-semibold"
                >
                  acción
                </TableHead>
                {/* Columnas de ir_a (no terminales) */}
                <TableHead 
                  colSpan={nonTerminals.length} 
                  className="text-center bg-amber-500/10 font-semibold"
                >
                  ir_a
                </TableHead>
              </TableRow>
              <TableRow>
                <TableHead className="font-bold bg-muted sticky left-0 z-10"></TableHead>
                {terminals.map(t => (
                  <TableHead key={t} className="text-center font-mono text-xs min-w-12 bg-blue-500/5">
                    {t}
                  </TableHead>
                ))}
                {nonTerminals.map(nt => (
                  <TableHead key={nt} className="text-center font-mono text-xs min-w-12 bg-amber-500/5">
                    {nt}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedStates.map(state => (
                <TableRow key={state}>
                  <TableCell className="font-medium bg-muted sticky left-0 z-10 text-center">
                    {state}
                  </TableCell>
                  {/* Celdas de acción */}
                  {terminals.map(t => {
                    const action = actionTable[state]?.[t];
                    const conflict = hasConflict(state, t);
                    
                    return (
                      <TableCell
                        key={t}
                        className={cn(
                          'text-center font-mono text-xs',
                          action && getActionColor(action.action),
                          conflict && 'ring-2 ring-destructive ring-inset'
                        )}
                      >
                        {action ? formatAction(action) : ''}
                      </TableCell>
                    );
                  })}
                  {/* Celdas de ir_a */}
                  {nonTerminals.map(nt => {
                    const goto = gotoTable[state]?.[nt];
                    
                    return (
                      <TableCell
                        key={nt}
                        className={cn(
                          'text-center font-mono text-xs',
                          goto && 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                        )}
                      >
                        {goto || ''}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Leyenda */}
        <div className="flex flex-wrap gap-4 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-blue-500/20"></span>
            <span>d# = desplazar</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-amber-500/20"></span>
            <span>r# = reducir</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-green-500/20"></span>
            <span>acc = aceptar</span>
          </div>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Estados {currentPage * statesPerPage + 1}-
              {Math.min((currentPage + 1) * statesPerPage, states.length)} de {states.length}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage === totalPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Lista de conflictos */}
        {conflicts.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="font-semibold text-sm mb-2 text-destructive">Conflictos detectados:</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {conflicts.map((c, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Badge variant="destructive" className="text-xs shrink-0">
                    {c.type}
                  </Badge>
                  <span>{c.description}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

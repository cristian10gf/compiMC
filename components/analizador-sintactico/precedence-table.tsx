'use client';

/**
 * Tabla de precedencia de operadores para análisis sintáctico ascendente
 * Muestra las relaciones <, >, =, · entre terminales
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
import { PrecedenceTable as PrecedenceTableType } from '@/lib/types/grammar';
import { CopyButton } from '@/components/shared/copy-button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface PrecedenceTableProps {
  table: PrecedenceTableType;
  highlightCell?: { row: string; col: string };
  onCellClick?: (row: string, col: string, relation: string) => void;
  className?: string;
}

const relationColors = {
  '<': 'text-blue-600 bg-blue-50 dark:bg-blue-950',
  '>': 'text-green-600 bg-green-50 dark:bg-green-950',
  '=': 'text-orange-600 bg-orange-50 dark:bg-orange-950',
  '·': 'text-gray-600 bg-gray-50 dark:bg-gray-950',
};

export function PrecedenceTable({
  table,
  highlightCell,
  onCellClick,
  className,
}: PrecedenceTableProps) {
  const symbols = table.symbols;

  const getRelation = (row: string, col: string): string => {
    return table.relations.get(row)?.get(col) || '·';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Tabla de Precedencia</CardTitle>
          <CopyButton
            content={JSON.stringify(
              {
                symbols,
                relations: Array.from(table.relations.entries()).map(([k, v]) => [
                  k,
                  Array.from(v.entries()),
                ]),
              },
              null,
              2
            )}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold bg-muted text-center">Terminal</TableHead>
                {symbols.map((symbol) => (
                  <TableHead key={symbol} className="text-center font-bold bg-muted">
                    {symbol}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {symbols.map((rowSymbol) => (
                <TableRow key={rowSymbol}>
                  <TableCell className="text-center font-medium bg-muted">{rowSymbol}</TableCell>
                  {symbols.map((colSymbol) => {
                    const relation = getRelation(rowSymbol, colSymbol);
                    const isHighlighted =
                      highlightCell?.row === rowSymbol && highlightCell?.col === colSymbol;

                    return (
                      <TableCell
                        key={colSymbol}
                        className={cn(
                          'text-center cursor-pointer transition-all',
                          relationColors[relation as keyof typeof relationColors],
                          isHighlighted && 'ring-2 ring-primary ring-offset-2'
                        )}
                        onClick={() => onCellClick?.(rowSymbol, colSymbol, relation)}
                      >
                        <span className="font-bold text-base">{relation}</span>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Leyenda */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
          {Object.entries(relationColors).map(([symbol, color]) => (
            <div key={symbol} className="flex items-center gap-2">
              <Badge className={cn('font-mono', color)}>{symbol}</Badge>
              <span className="text-xs text-muted-foreground">
                {symbol === '<' && 'Menor precedencia'}
                {symbol === '>' && 'Mayor precedencia'}
                {symbol === '=' && 'Igual precedencia'}
                {symbol === '·' && 'Sin relación'}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

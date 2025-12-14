'use client';

/**
 * Tabla de tokens generados en el análisis léxico
 * Muestra Token, Lexema y Tipo
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
import { Token } from '@/lib/types/token';
import { CopyButton } from '@/components/shared/copy-button';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface TokensTableProps {
  tokens: Token[];
  className?: string;
  itemsPerPage?: number;
}

export function TokensTable({ tokens, className, itemsPerPage = 18 }: TokensTableProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<'type' | 'lexeme' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Filtrar tokens
  const filteredTokens = useMemo(() => {
    if (!searchTerm) return tokens;
    
    return tokens.filter(
      (token) =>
        token.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.lexeme.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tokens, searchTerm]);

  // Ordenar tokens
  const sortedTokens = useMemo(() => {
    if (!sortColumn) return filteredTokens;

    return [...filteredTokens].sort((a, b) => {
      let compareValue = 0;
      
      if (sortColumn === 'type') {
        compareValue = a.type.localeCompare(b.type);
      } else if (sortColumn === 'lexeme') {
        compareValue = a.lexeme.localeCompare(b.lexeme);
      }

      return sortDirection === 'asc' ? compareValue : -compareValue;
    });
  }, [filteredTokens, sortColumn, sortDirection]);

  // Paginación
  const totalPages = Math.ceil(sortedTokens.length / itemsPerPage);
  const paginatedTokens = sortedTokens.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const handleSort = (column: 'type' | 'lexeme') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleExport = () => {
    let csv = 'Token,Lexema,Tipo\n';
    sortedTokens.forEach((token) => {
      csv += `${token.type},"${token.lexeme}",${token.value || '-'}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'tokens.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const tokenTypeColors: Record<string, string> = {
    KEYWORD: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    IDENTIFIER: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    NUMBER: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    OPERATOR: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    DELIMITER: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    STRING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <CardTitle>Tabla de Tokens</CardTitle>
            <div className="flex gap-2">
              <CopyButton
                content={sortedTokens
                  .map((t) => `${t.type}\t${t.lexeme}\t${t.value || '-'}`)
                  .join('\n')}
              />
              <Button size="sm" variant="outline" onClick={handleExport}>
                <Download className="mr-1" />
                Exportar
              </Button>
            </div>
          </div>
          
          {/* Búsqueda */}
          <Input
            placeholder="Buscar por tipo o lexema..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(0);
            }}
            className="max-w-sm"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('type')}
                >
                  Token {sortColumn === 'type' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('lexeme')}
                >
                  Lexema {sortColumn === 'lexeme' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead>Tipo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTokens.map((token, index) => {
                const globalIndex = currentPage * itemsPerPage + index;
                // Determinar el color según la categoría
                const categoryColor = 
                  token.category === 'identificador' 
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : token.category === 'numero'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';

                return (
                  <TableRow key={globalIndex}>
                    <TableCell className="text-muted-foreground">
                      {globalIndex + 1}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={categoryColor}
                      >
                        {token.numberedType || token.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                        {token.lexeme}
                      </code>
                    </TableCell>
                    <TableCell className="text-sm">
                      <code className="font-mono">
                        {token.category}
                      </code>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Mostrando {paginatedTokens.length} de {sortedTokens.length} tokens (Página{' '}
              {currentPage + 1} de {totalPages})
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

        {/* Estadísticas */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground border-t pt-3">
          <div>
            <span className="font-medium">Total:</span> {tokens.length}
          </div>
          <div>
            <span className="font-medium">Únicos:</span>{' '}
            {new Set(tokens.map((t) => t.type)).size} tipos
          </div>
          <div>
            <span className="font-medium">Filtrados:</span> {filteredTokens.length}
          </div>
          <div>
            <span className="font-medium">Página:</span> {paginatedTokens.length} items
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

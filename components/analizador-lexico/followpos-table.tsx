'use client';

/**
 * Tabla de Posiciones y Función Siguiente
 * Muestra la tabla con posición, símbolo, primerapos, ultimapos y siguiente(i) para cada posición
 */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SyntaxTree, TreeNode } from '@/lib/types/automata';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { CopyButton } from '@/components/shared/copy-button';

interface FollowposTableProps {
  tree: SyntaxTree;
  className?: string;
}

/**
 * Busca un nodo por su posición en el árbol
 */
function findNodeByPosition(node: TreeNode, position: number): TreeNode | null {
  if (node.position === position) {
    return node;
  }
  
  if (node.children) {
    for (const child of node.children) {
      const found = findNodeByPosition(child, position);
      if (found) return found;
    }
  }
  
  return null;
}

export function FollowposTable({ tree, className }: FollowposTableProps) {
  // Convertir Map a array ordenado
  const positionsArray = Array.from(tree.positions.entries()).sort((a, b) => a[0] - b[0]);
  
  const handleExport = () => {
    let csv = 'Posición,Símbolo,Primera Pos,Última Pos,Siguiente(i)\n';
    positionsArray.forEach(([pos, symbol]) => {
      const node = findNodeByPosition(tree.root, pos);
      const primerosStr = node?.firstpos ? Array.from(node.firstpos).sort((a, b) => a - b).join(', ') : '-';
      const ultimosStr = node?.lastpos ? Array.from(node.lastpos).sort((a, b) => a - b).join(', ') : '-';
      const siguientes = tree.siguientes.get(pos);
      const siguientesStr = siguientes ? Array.from(siguientes).sort((a, b) => a - b).join(', ') : '-';
      csv += `${pos},${symbol},"{${primerosStr}}","{${ultimosStr}}","${siguientesStr}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `followpos-table.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Preparar datos para copiar
  const copyData = positionsArray.map(([pos, symbol]) => {
    const node = findNodeByPosition(tree.root, pos);
    const siguientes = tree.siguientes.get(pos);
    return {
      posicion: pos,
      simbolo: symbol,
      primeros: node?.firstpos ? Array.from(node.firstpos) : [],
      ultimos: node?.lastpos ? Array.from(node.lastpos) : [],
      siguientes: siguientes ? Array.from(siguientes) : [],
    };
  });

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Tabla de Posiciones y Siguiente(i)</CardTitle>
          <div className="flex gap-2">
            <CopyButton content={JSON.stringify(copyData, null, 2)} />
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
                <TableHead className="font-bold text-center w-20">Posición</TableHead>
                <TableHead className="font-bold text-center w-20">Símbolo</TableHead>
                <TableHead className="font-bold text-center text-blue-600 dark:text-blue-400">Primera Pos</TableHead>
                <TableHead className="font-bold text-center text-red-600 dark:text-red-400">Última Pos</TableHead>
                <TableHead className="font-bold text-center text-green-600 dark:text-green-400">Siguiente(i)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positionsArray.map(([pos, symbol]) => {
                const node = findNodeByPosition(tree.root, pos);
                const primerosStr = node?.firstpos 
                  ? Array.from(node.firstpos).sort((a, b) => a - b).join(', ')
                  : '';
                const ultimosStr = node?.lastpos 
                  ? Array.from(node.lastpos).sort((a, b) => a - b).join(', ')
                  : '';
                const siguientes = tree.siguientes.get(pos);
                const siguientesStr = siguientes 
                  ? Array.from(siguientes).sort((a, b) => a - b).join(', ')
                  : '';
                
                // El símbolo # es especial (marcador de fin)
                const isEndMarker = symbol === '#';
                
                return (
                  <TableRow key={pos} className={isEndMarker ? 'bg-muted/30' : ''}>
                    <TableCell className="text-center font-mono font-medium">
                      {pos}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`font-mono font-bold ${isEndMarker ? 'text-muted-foreground' : 'text-purple-600 dark:text-purple-400'}`}>
                        {symbol}
                      </span>
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {primerosStr ? (
                        <span className="text-blue-600 dark:text-blue-400">
                          {'{' + primerosStr + '}'}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">∅</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {ultimosStr ? (
                        <span className="text-red-600 dark:text-red-400">
                          {'{' + ultimosStr + '}'}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">∅</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {siguientesStr ? (
                        <span className="text-green-600 dark:text-green-400">
                          {'{' + siguientesStr + '}'}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">∅</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Información adicional */}
        <div className="mt-4 text-xs text-muted-foreground border-t pt-3 space-y-1">
          <div>
            <span className="font-medium">Primeros(raíz):</span>{' '}
            <span className="font-mono text-blue-600 dark:text-blue-400">
              {'{' + Array.from(tree.primeros).sort((a, b) => a - b).join(', ') + '}'}
            </span>
          </div>
          <div>
            <span className="font-medium">Últimos(raíz):</span>{' '}
            <span className="font-mono text-red-600 dark:text-red-400">
              {'{' + Array.from(tree.ultimos).sort((a, b) => a - b).join(', ') + '}'}
            </span>
          </div>
          <div>
            <span className="font-medium">Anulable(raíz):</span>{' '}
            <span className={`font-mono ${tree.anulable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {tree.anulable ? 'true' : 'false'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

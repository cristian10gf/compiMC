'use client';

/**
 * Tabla de optimización de código
 * Muestra el número de instrucción, la instrucción y la acción realizada
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
import { CopyButton } from '@/components/shared/copy-button';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface OptimizationStep {
  instruction: string;
  action: 'eliminado' | 'editado' | 'conservado';
  reason?: string;
  originalInstruction?: string;
}

interface OptimizationTableProps {
  steps: OptimizationStep[];
  rulesApplied?: string; // Texto explicativo de las reglas
  className?: string;
  itemsPerPage?: number;
}

const actionColors = {
  eliminado: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  editado: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  conservado: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

export function OptimizationTable({
  steps,
  rulesApplied,
  className,
  itemsPerPage = 18,
}: OptimizationTableProps) {
  const [currentPage, setCurrentPage] = useState(0);

  const totalPages = Math.ceil(steps.length / itemsPerPage);
  const paginatedSteps = steps.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const stats = {
    eliminado: steps.filter((s) => s.action === 'eliminado').length,
    editado: steps.filter((s) => s.action === 'editado').length,
    conservado: steps.filter((s) => s.action === 'conservado').length,
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <CardTitle>Optimización de Código</CardTitle>
            <CopyButton
              content={steps
                .map(
                  (step, i) =>
                    `${i + 1}. ${step.instruction} - ${step.action}${step.reason ? ` (${step.reason})` : ''}`
                )
                .join('\n')}
            />
          </div>

          {/* Reglas aplicadas */}
          {rulesApplied && (
            <div className="bg-muted/50 rounded-md p-3 text-sm">
              <div className="font-medium mb-1">Reglas de optimización aplicadas:</div>
              <p className="text-muted-foreground">{rulesApplied}</p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Estadísticas */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950 rounded-md">
            <Badge variant="outline" className={actionColors.eliminado}>
              Eliminadas
            </Badge>
            <span className="font-bold">{stats.eliminado}</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-950 rounded-md">
            <Badge variant="outline" className={actionColors.editado}>
              Editadas
            </Badge>
            <span className="font-bold">{stats.editado}</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950 rounded-md">
            <Badge variant="outline" className={actionColors.conservado}>
              Conservadas
            </Badge>
            <span className="font-bold">{stats.conservado}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20 text-center">No.</TableHead>
                <TableHead>Instrucción</TableHead>
                <TableHead className="w-32 text-center">Acción</TableHead>
                <TableHead className="w-64">Motivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedSteps.map((step, index) => {
                const globalIndex = currentPage * itemsPerPage + index;
                return (
                  <TableRow
                    key={globalIndex}
                    className={cn(
                      step.action === 'eliminado' && 'bg-red-50/50 dark:bg-red-950/20'
                    )}
                  >
                    <TableCell className="text-center font-medium text-muted-foreground">
                      {globalIndex + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <code className="text-sm font-mono">{step.instruction}</code>
                        {step.originalInstruction && step.action === 'editado' && (
                          <code className="text-xs font-mono text-muted-foreground line-through">
                            {step.originalInstruction}
                          </code>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={actionColors[step.action]}>
                        {step.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {step.reason || '-'}
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
              Instrucciones {currentPage * itemsPerPage + 1}-
              {Math.min((currentPage + 1) * itemsPerPage, steps.length)} de {steps.length}
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
      </CardContent>
    </Card>
  );
}

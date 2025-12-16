'use client';

/**
 * Componente para visualizar código intermedio y código objeto
 * Tabla con número de instrucción y la instrucción en sí
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
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface CodeInstruction {
  instruction: string;
  comment?: string;
}

interface CodeTableProps {
  title: string;
  instructions: CodeInstruction[];
  className?: string;
  itemsPerPage?: number;
}

export function CodeTable({
  title,
  instructions,
  className,
  itemsPerPage = 18,
}: CodeTableProps) {
  const [currentPage, setCurrentPage] = useState(0);

  const totalPages = Math.ceil(instructions.length / itemsPerPage);
  const paginatedInstructions = instructions.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <CopyButton
            content={instructions
              .map((inst, i) => `${i + 1}. ${inst.instruction}`)
              .join('\n')}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20 text-center">No.</TableHead>
                <TableHead>Instrucción</TableHead>
                {instructions.some((i) => i.comment) && (
                  <TableHead className="w-48">Comentario</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedInstructions.map((inst, index) => {
                const globalIndex = currentPage * itemsPerPage + index;
                return (
                  <TableRow key={globalIndex}>
                    <TableCell className="text-center font-medium text-muted-foreground">
                      {globalIndex + 1}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <code className="text-sm font-mono">{inst.instruction}</code>
                    </TableCell>
                    {instructions.some((i) => i.comment) && (
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {inst.comment || ''}
                      </TableCell>
                    )}
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
              {Math.min((currentPage + 1) * itemsPerPage, instructions.length)} de{' '}
              {instructions.length}
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

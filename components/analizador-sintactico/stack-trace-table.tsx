'use client';

/**
 * Tabla de análisis sintáctico (Pila, Entrada, Salida)
 * Muestra el proceso paso a paso del parsing
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
import { Button } from '@/components/ui/button';
import { ParseStep } from '@/lib/types/grammar';
import { CopyButton } from '@/components/shared/copy-button';
import { Play, Pause, SkipBack, SkipForward, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface StackTraceTableProps {
  steps: ParseStep[];
  className?: string;
  autoPlay?: boolean;
  stepDelay?: number;
  itemsPerPage?: number;
}

export function StackTraceTable({
  steps,
  className,
  autoPlay = false,
  stepDelay = 1000,
  itemsPerPage = 10,
}: StackTraceTableProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const totalSteps = steps.length;
  const totalPages = Math.ceil(totalSteps / itemsPerPage);

  // Sincronizar página con paso actual
  useEffect(() => {
    const targetPage = Math.floor(currentStep / itemsPerPage);
    if (targetPage !== currentPage) {
      setCurrentPage(targetPage);
    }
  }, [currentStep, itemsPerPage, currentPage]);

  const startAutoPlay = () => {
    if (intervalId) return;

    const id = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= totalSteps - 1) {
          stopAutoPlay();
          return prev;
        }
        return prev + 1;
      });
    }, stepDelay);

    setIntervalId(id);
    setIsPlaying(true);
  };

  const stopAutoPlay = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setIsPlaying(false);
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      stopAutoPlay();
    } else {
      startAutoPlay();
    }
  };

  const paginatedSteps = steps.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Traza del Análisis Sintáctico</CardTitle>
          <CopyButton
            content={steps
              .map(
                (s, i) =>
                  `${i + 1}. Pila: [${s.stack.join(', ')}] | Entrada: [${s.input.join(', ')}] | Acción: ${s.action}`
              )
              .join('\n')}
          />
        </div>
      </CardHeader>
      <CardContent>
        {/* Controles de reproducción */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              stopAutoPlay();
              setCurrentStep(0);
            }}
          >
            <SkipBack />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              stopAutoPlay();
              setCurrentStep((p) => Math.max(0, p - 1));
            }}
            disabled={currentStep === 0}
          >
            Anterior
          </Button>
          <Button size="sm" variant="default" onClick={handlePlayPause}>
            {isPlaying ? <Pause /> : <Play />}
            {isPlaying ? 'Pausar' : 'Reproducir'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              stopAutoPlay();
              setCurrentStep((p) => Math.min(totalSteps - 1, p + 1));
            }}
            disabled={currentStep === totalSteps - 1}
          >
            Siguiente
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              stopAutoPlay();
              setCurrentStep(totalSteps - 1);
            }}
          >
            <SkipForward />
          </Button>
        </div>

        {/* Indicador de progreso */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
            <span>
              Paso {currentStep + 1} de {totalSteps}
            </span>
            <span>{Math.round(((currentStep + 1) / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Tabla de pasos */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 text-center">Paso</TableHead>
                <TableHead className="min-w-50">Pila</TableHead>
                <TableHead className="min-w-50">Entrada</TableHead>
                <TableHead className="min-w-50">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedSteps.map((step, index) => {
                const globalIndex = currentPage * itemsPerPage + index;
                const isCurrentStep = globalIndex === currentStep;

                return (
                  <TableRow
                    key={globalIndex}
                    className={cn(
                      'transition-all cursor-pointer',
                      isCurrentStep && 'bg-primary/10 ring-2 ring-primary'
                    )}
                    onClick={() => {
                      stopAutoPlay();
                      setCurrentStep(globalIndex);
                    }}
                  >
                    <TableCell className="text-center font-medium">
                      {globalIndex + 1}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs font-mono">
                        [{step.stack.join(', ')}]
                      </code>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs font-mono">
                        [{step.input.join(', ')}]
                      </code>
                    </TableCell>
                    <TableCell className="text-sm">
                      {step.action}
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
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage === totalPages - 1}
              >
                <ChevronRight />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

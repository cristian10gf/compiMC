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
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { useState } from 'react';
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

  const totalSteps = steps.length;

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
        <div className="overflow-x-auto max-h-150 overflow-y-auto">
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
              {steps.map((step, index) => {
                const isCurrentStep = index === currentStep;

                return (
                  <TableRow
                    key={index}
                    className={cn(
                      'transition-all cursor-pointer',
                      isCurrentStep && 'bg-primary/10 ring-2 ring-primary'
                    )}
                    onClick={() => {
                      stopAutoPlay();
                      setCurrentStep(index);
                    }}
                  >
                    <TableCell className="text-center font-medium">
                      {index + 1}
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
      </CardContent>
    </Card>
  );
}

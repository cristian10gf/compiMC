'use client';

/**
 * Componente para reconocimiento de cadenas en análisis sintáctico ascendente
 * (Precedencia de Operadores)
 * 
 * Con tabla de evaluación animada y controles de reproducción
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { CopyButton } from '@/components/shared/copy-button';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Send,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ParseStep, ParsingResult } from '@/lib/types/grammar';

interface StringRecognitionPrecedenceProps {
  onRecognize: (input: string) => Promise<ParsingResult | null>;
  terminals?: string[];
  isProcessing?: boolean;
  className?: string;
}

/**
 * Tokeniza una cadena de entrada usando los terminales conocidos
 */
function tokenizeInput(input: string, terminals: string[]): string {
  // Si la entrada ya tiene espacios, usarlos como separadores
  if (input.includes(' ')) {
    return input;
  }

  if (!terminals || terminals.length === 0) {
    return input;
  }

  const sortedTerminals = [...terminals].sort((a, b) => b.length - a.length);
  const tokens: string[] = [];
  let remaining = input;

  while (remaining.length > 0) {
    let matched = false;

    for (const terminal of sortedTerminals) {
      if (remaining.startsWith(terminal)) {
        tokens.push(terminal);
        remaining = remaining.slice(terminal.length);
        matched = true;
        break;
      }
    }

    if (!matched) {
      tokens.push(remaining[0]);
      remaining = remaining.slice(1);
    }
  }

  return tokens.join(' ');
}

export function StringRecognitionPrecedence({
  onRecognize,
  terminals = [],
  isProcessing = false,
  className,
}: StringRecognitionPrecedenceProps) {
  const [inputString, setInputString] = useState('');
  const [result, setResult] = useState<ParsingResult | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const totalSteps = result?.steps?.length || 0;

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (tableContainerRef.current && result?.steps) {
      const currentRow = tableContainerRef.current.querySelector(`[data-step="${currentStep}"]`);
      if (currentRow) {
        currentRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentStep, result?.steps]);

  const stopPlayback = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const startPlayback = useCallback(() => {
    if (!result?.steps || currentStep >= totalSteps - 1) return;

    setIsPlaying(true);
    intervalRef.current = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= totalSteps - 1) {
          stopPlayback();
          return prev;
        }
        return prev + 1;
      });
    }, speed);
  }, [result?.steps, currentStep, totalSteps, speed, stopPlayback]);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  }, [isPlaying, stopPlayback, startPlayback]);

  const handleRecognize = useCallback(async () => {
    if (!inputString.trim()) return;

    stopPlayback();
    setResult(null);
    setCurrentStep(0);

    const tokenizedInput = tokenizeInput(inputString, terminals);
    const newResult = await onRecognize(tokenizedInput);
    setResult(newResult);
  }, [inputString, terminals, onRecognize, stopPlayback]);

  const handleReset = useCallback(() => {
    stopPlayback();
    setCurrentStep(0);
  }, [stopPlayback]);

  const handleStepChange = useCallback((step: number) => {
    stopPlayback();
    setCurrentStep(Math.max(0, Math.min(step, totalSteps - 1)));
  }, [stopPlayback, totalSteps]);

  const formatForCopy = useCallback(() => {
    if (!result?.steps) return '';
    return result.steps
      .map(
        (s, i) =>
          `${i + 1}. Pila: [${s.stack.join(', ')}] | Entrada: [${s.input.join(', ')}] | Acción: ${s.action}`
      )
      .join('\n');
  }, [result?.steps]);

  return (
    <Card className={cn('', className)}>
      <CardContent className="pt-6 space-y-6">
        {/* Input de cadena */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Cadena a Reconocer</label>
          <div className="flex gap-2">
            <Input
              value={inputString}
              onChange={(e) => setInputString(e.target.value)}
              placeholder={terminals.length > 0 ? "Ej: id+id*id o id + id * id" : "Ej: id + id * id"}
              className="font-mono flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleRecognize()}
            />
            <Button
              onClick={handleRecognize}
              disabled={isProcessing || !inputString.trim()}
            >
              {isProcessing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="ml-2 hidden sm:inline">Evaluar</span>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {terminals.length > 0 
              ? 'Puedes escribir con o sin espacios. Los terminales se detectarán automáticamente.'
              : 'Separa los símbolos con espacios. Ejemplo: id + id * id'
            }
          </p>
        </div>

        {/* Resultado */}
        {result && (
          <>
            {/* Estado del resultado */}
            <div
              className={cn(
                'flex items-center gap-2 p-3 rounded-lg',
                result.accepted
                  ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300'
                  : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300'
              )}
            >
              {result.accepted ? (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">¡Cadena aceptada!</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5" />
                  <span className="font-medium">Cadena rechazada</span>
                  {result.error && (
                    <span className="text-sm ml-2">- {result.error}</span>
                  )}
                </>
              )}
            </div>

            {/* Controles de reproducción */}
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleReset}
                  title="Ir al inicio"
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStepChange(currentStep - 1)}
                  disabled={currentStep === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">Anterior</span>
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  onClick={handlePlayPause}
                  className="min-w-28"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="h-4 w-4 mr-1" />
                      Pausar
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-1" />
                      Reproducir
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStepChange(currentStep + 1)}
                  disabled={currentStep >= totalSteps - 1}
                >
                  <span className="hidden sm:inline mr-1">Siguiente</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStepChange(totalSteps - 1)}
                  title="Ir al final"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>

              {/* Barra de progreso */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
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

              {/* Control de velocidad */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  Velocidad:
                </span>
                <Slider
                  value={[2000 - speed]}
                  onValueChange={([v]) => setSpeed(2000 - v)}
                  min={0}
                  max={1800}
                  step={100}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground w-16 text-right">
                  {speed}ms
                </span>
              </div>
            </div>

            {/* Tabla de pasos */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Tabla de Análisis Ascendente</h4>
                <CopyButton content={formatForCopy()} />
              </div>
              
              <div
                ref={tableContainerRef}
                className="border rounded-lg overflow-hidden max-h-80 overflow-y-auto"
              >
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-16 text-center font-bold">Paso</TableHead>
                      <TableHead className="font-bold min-w-40">Pila</TableHead>
                      <TableHead className="font-bold min-w-40">Entrada</TableHead>
                      <TableHead className="font-bold min-w-48">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.steps.map((step, index) => {
                      const isCurrentStep = index === currentStep;
                      const isPastStep = index < currentStep;
                      const isFutureStep = index > currentStep;

                      return (
                        <TableRow
                          key={index}
                          data-step={index}
                          className={cn(
                            'cursor-pointer transition-all duration-200',
                            isCurrentStep && 'bg-primary/10 ring-2 ring-primary ring-inset',
                            isPastStep && 'opacity-60',
                            isFutureStep && 'opacity-40'
                          )}
                          onClick={() => handleStepChange(index)}
                        >
                          <TableCell className="text-center font-medium">
                            <Badge
                              variant={isCurrentStep ? 'default' : 'outline'}
                              className="w-8 justify-center"
                            >
                              {index + 1}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                              [{step.stack.join(', ')}]
                            </code>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                              [{step.input.join(', ')}]
                            </code>
                          </TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                'text-sm',
                                step.action.includes('Error') && 'text-destructive',
                                step.action.includes('Aceptar') && 'text-green-600 dark:text-green-400 font-medium',
                                step.action.includes('Desplazar') && 'text-blue-600 dark:text-blue-400',
                                step.action.includes('Reducir') && 'text-primary font-medium'
                              )}
                            >
                              {step.action}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Salida de producciones */}
            {result.output && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Producciones Aplicadas (Reducciones)</h4>
                <div className="bg-muted/30 rounded-lg p-4 font-mono text-sm space-y-1 max-h-32 overflow-y-auto">
                  {result.output.split('\n').map((line, idx) => (
                    <div key={idx} className="text-muted-foreground">
                      {idx + 1}. {line}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

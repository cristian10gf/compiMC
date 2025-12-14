'use client';

/**
 * Componente para mostrar el reconocimiento de una cadena paso a paso
 * Muestra las transiciones: estado1 -> símbolo -> estado2
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RecognitionResult, RecognitionStep } from '@/lib/types/automata';
import { CopyButton } from '@/components/shared/copy-button';
import { CheckCircle2, XCircle, Play, Pause, SkipForward, SkipBack } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface StringRecognitionProps {
  result: RecognitionResult;
  className?: string;
  autoPlay?: boolean;
  stepDelay?: number; // ms entre pasos en modo auto
}

export function StringRecognition({
  result,
  className,
  autoPlay = false,
  stepDelay = 1000,
}: StringRecognitionProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  const steps = result.steps || [];
  const totalSteps = steps.length;

  // Control de reproducción automática
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

  const handlePrevious = () => {
    stopAutoPlay();
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    stopAutoPlay();
    setCurrentStep((prev) => Math.min(totalSteps - 1, prev + 1));
  };

  const handleReset = () => {
    stopAutoPlay();
    setCurrentStep(0);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Reconocimiento de Cadena</CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant={result.accepted ? 'default' : 'destructive'}
              className="flex items-center gap-1"
            >
              {result.accepted ? (
                <>
                  <CheckCircle2 className="size-3" />
                  Aceptada
                </>
              ) : (
                <>
                  <XCircle className="size-3" />
                  Rechazada
                </>
              )}
            </Badge>
            <CopyButton
              content={steps.map((s) => `${s.currentState} → ${s.symbol} → ${s.nextState}`).join('\n')}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Controles de reproducción */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <Button size="sm" variant="outline" onClick={handleReset}>
            <SkipBack />
          </Button>
          <Button size="sm" variant="outline" onClick={handlePrevious} disabled={currentStep === 0}>
            Anterior
          </Button>
          <Button size="sm" variant="default" onClick={handlePlayPause}>
            {isPlaying ? <Pause /> : <Play />}
            {isPlaying ? 'Pausar' : 'Reproducir'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleNext}
            disabled={currentStep === totalSteps - 1}
          >
            Siguiente
          </Button>
          <Button size="sm" variant="outline" onClick={() => setCurrentStep(totalSteps - 1)}>
            <SkipForward />
          </Button>
        </div>

        {/* Indicador de progreso */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
            <span>Paso {currentStep + 1} de {totalSteps}</span>
            <span>{Math.round(((currentStep + 1) / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Paso actual */}
        {steps.length > 0 && (
          <div className="space-y-2">
            {steps.slice(0, currentStep + 1).map((step, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border transition-all',
                  index === currentStep
                    ? 'bg-primary/10 border-primary shadow-md scale-105'
                    : 'bg-muted/30 border-border'
                )}
              >
                <Badge variant="outline" className="font-mono">
                  {index + 1}
                </Badge>
                <div className="flex items-center gap-2 flex-1 font-mono text-sm">
                  <span className="font-bold text-blue-600">{step.currentState}</span>
                  <span className="text-muted-foreground">→</span>
                  <Badge variant="secondary" className="font-mono">
                    {step.symbol}
                  </Badge>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-bold text-blue-600">{step.nextState}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mensaje final */}
        {currentStep === totalSteps - 1 && (
          <div className="mt-4 p-4 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-2 mb-2">
              {result.accepted ? (
                <CheckCircle2 className="text-green-600" />
              ) : (
                <XCircle className="text-red-600" />
              )}
              <span className="font-semibold">
                Resultado: {result.accepted ? 'Cadena aceptada' : 'Cadena rechazada'}
              </span>
            </div>
            {result.message && (
              <p className="text-sm text-muted-foreground">{result.message}</p>
            )}
          </div>
        )}

        {/* Si no hay pasos */}
        {steps.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No hay pasos de reconocimiento para mostrar
          </div>
        )}
      </CardContent>
    </Card>
  );
}

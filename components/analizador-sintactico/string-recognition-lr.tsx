'use client';

/**
 * Componente para reconocimiento de cadenas usando análisis LR
 * Permite seleccionar el tipo de análisis (SLR, LR1, LALR) y muestra la traza
 */

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SegmentedControl } from '@/components/shared';
import { StackTraceTable } from './stack-trace-table';
import { CheckCircle2, XCircle, Play, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ParsingResult } from '@/lib/types/grammar';
import type { LRAnalysisType } from '@/lib/types/syntax-analysis';

interface StringRecognitionLRProps {
  onRecognize: (input: string, type: LRAnalysisType) => Promise<ParsingResult | null>;
  terminals: string[];
  selectedType: LRAnalysisType;
  onTypeChange: (type: LRAnalysisType) => void;
  isProcessing?: boolean;
  hasSlr?: boolean;
  hasLr1?: boolean;
  hasLalr?: boolean;
  className?: string;
  value?: string; // Valor controlado desde la URL
  onChange?: (value: string) => void; // Callback para actualizar la URL
}

const LR_TYPE_OPTIONS = [
  { value: 'SLR', label: 'SLR' },
  { value: 'LALR', label: 'LALR' },
  { value: 'LR1', label: 'LR-canónico' },
];

export function StringRecognitionLR({
  onRecognize,
  terminals,
  selectedType,
  onTypeChange,
  isProcessing = false,
  hasSlr = true,
  hasLr1 = true,
  hasLalr = true,
  className,
  value = '',
  onChange,
}: StringRecognitionLRProps) {
  const [result, setResult] = useState<ParsingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Usar value directamente (controlled component)
  const input = value;

  const handleRecognize = useCallback(async () => {
    if (!input.trim()) {
      setError('Ingresa una cadena para reconocer');
      return;
    }

    setError(null);
    setResult(null);

    try {
      const recognitionResult = await onRecognize(input.trim(), selectedType);
      if (recognitionResult) {
        setResult(recognitionResult);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al reconocer la cadena');
    }
  }, [input, selectedType, onRecognize]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isProcessing) {
      handleRecognize();
    }
  };

  // Filtrar opciones disponibles
  const availableOptions = LR_TYPE_OPTIONS.filter(opt => {
    if (opt.value === 'SLR') return hasSlr;
    if (opt.value === 'LR1') return hasLr1;
    if (opt.value === 'LALR') return hasLalr;
    return true;
  });

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Reconocer Cadena</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selector de tipo de análisis */}
        <div className="flex flex-col gap-2">
          <label className="text-sm text-muted-foreground">Probar con:</label>
          <SegmentedControl
            options={availableOptions}
            value={selectedType}
            onChange={(value) => onTypeChange(value as LRAnalysisType)}
          />
        </div>

        {/* Input de cadena */}
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => onChange?.(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Cadena a reconocer (símbolos separados por espacios)"
            className="font-mono"
            disabled={isProcessing}
          />
          <Button
            onClick={handleRecognize}
            disabled={isProcessing || !input.trim()}
            className="shrink-0"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            <span className="ml-2">Enviar</span>
          </Button>
        </div>

        {/* Terminales disponibles */}
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-muted-foreground mr-1">Terminales:</span>
          {terminals.map((t, idx) => (
            <Badge
              key={idx}
              variant="outline"
              className="text-xs cursor-pointer hover:bg-primary/10 transition-colors"
              onClick={() => onChange?.(input ? `${input} ${t}` : t)}
            >
              {t}
            </Badge>
          ))}
        </div>

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Resultado */}
        {result && (
          <div className="space-y-4">
            <Alert className={cn(
              result.accepted 
                ? 'border-green-500/20 bg-green-500/10' 
                : 'border-destructive/20 bg-destructive/10'
            )}>
              {result.accepted ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive" />
              )}
              <AlertTitle className={result.accepted ? 'text-green-700 dark:text-green-400' : ''}>
                {result.accepted ? 'Cadena Aceptada' : 'Cadena Rechazada'}
              </AlertTitle>
              {result.error && (
                <AlertDescription>{result.error}</AlertDescription>
              )}
            </Alert>

            {/* Tabla de pasos */}
            {result.steps && result.steps.length > 0 && (
              <StackTraceTable steps={result.steps}/>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

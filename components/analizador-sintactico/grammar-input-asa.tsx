'use client';

/**
 * Input de gramática para análisis sintáctico ascendente (ASA)
 * 
 * Incluye:
 * - Input de tokens/terminales con validación
 * - Textarea para gramática
 * - Ejemplos predefinidos de gramáticas de operadores
 * - Validación de gramática de operadores
 */

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Sparkles, Play } from 'lucide-react';
import { HelpModal } from '@/components/shared/help-modal';
import { cn } from '@/lib/utils';

export interface GrammarInputASAProps {
  onAnalyze: (grammarText: string, terminals: string) => void;
  isProcessing?: boolean;
  className?: string;
  /** Valores iniciales para restaurar desde historial */
  initialValues?: {
    grammarText?: string;
    terminals?: string;
  };
}

// Ejemplos de gramáticas de operadores
const EXAMPLES = [
  {
    name: 'Expresiones (+, *)',
    grammar: `E -> E + E | E * E | id`,
    terminals: '+ * id',
  },
  {
    name: 'Aritmética completa',
    grammar: `E -> E + E | E - E | E * E | E / E | ( E ) | id`,
    terminals: '+ - * / ( ) id',
  },
  {
    name: 'Potencia',
    grammar: `E -> E + E | E * E | E ^ E | id`,
    terminals: '+ * ^ id',
  },
  {
    name: 'Booleanas',
    grammar: `E -> E or E | E and E | not E | ( E ) | id`,
    terminals: 'or and not ( ) id',
  },
  {
    name: 'Comparación',
    grammar: `E -> E + E | E < E | E > E | E == E | id`,
    terminals: '+ < > == id',
  },
];

export function GrammarInputASA({
  onAnalyze,
  isProcessing = false,
  className,
  initialValues,
}: GrammarInputASAProps) {
  const [grammarText, setGrammarText] = useState(initialValues?.grammarText || EXAMPLES[0].grammar);
  const [terminalsInput, setTerminalsInput] = useState(initialValues?.terminals || EXAMPLES[0].terminals);
  const [isInitialized, setIsInitialized] = useState(false);

  // Actualizar valores cuando cambian los initialValues
  useEffect(() => {
    if (isInitialized) return;
    
    if (initialValues?.grammarText) {
      setGrammarText(initialValues.grammarText);
    }
    if (initialValues?.terminals) {
      setTerminalsInput(initialValues.terminals);
    }
    
    setIsInitialized(true);
  }, [initialValues, isInitialized]);

  const loadExample = useCallback((index: number) => {
    setGrammarText(EXAMPLES[index].grammar);
    setTerminalsInput(EXAMPLES[index].terminals);
  }, []);

  const handleAnalyze = useCallback(() => {
    onAnalyze(grammarText, terminalsInput);
  }, [grammarText, terminalsInput, onAnalyze]);

  // Parsear terminales para mostrar como badges
  const parsedTerminals = terminalsInput
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length > 0);

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Definición de la Gramática
            </CardTitle>
            <CardDescription>
              Define una gramática de operadores para el análisis ascendente.
            </CardDescription>
          </div>
          <HelpModal
            title="Gramáticas de Operadores"
            description="Requisitos y formato para gramáticas de precedencia"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Requisitos de gramática de operadores:</h4>
                <ul className="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
                  <li><strong>No hay producciones ε</strong>: Ningún lado derecho puede ser vacío</li>
                  <li><strong>No hay no terminales adyacentes</strong>: Entre dos no terminales debe haber un terminal</li>
                  <li>Los operadores tienen <strong>precedencia y asociatividad</strong> definidas</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Formato:</h4>
                <ul className="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
                  <li>Usa <code className="bg-muted px-1.5 py-0.5 rounded text-xs">-&gt;</code> para separar izquierda y derecha</li>
                  <li>Usa <code className="bg-muted px-1.5 py-0.5 rounded text-xs">|</code> para alternativas</li>
                  <li>Los <strong>no terminales</strong> son letras mayúsculas (E, T, F)</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Ejemplo válido:</h4>
                <div className="bg-muted/50 rounded-lg p-3 font-mono text-xs space-y-1">
                  <p>E -&gt; E + E | E * E | id</p>
                </div>
              </div>

              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Tip:</strong> Las gramáticas de operadores son ideales para expresiones aritméticas y lógicas donde los operadores tienen precedencia clara.
                </AlertDescription>
              </Alert>
            </div>
          </HelpModal>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sección de Terminales */}
        <div className="space-y-3">
          <Label htmlFor="terminals" className="text-base font-medium">
            Símbolos Terminales
          </Label>
          <Input
            id="terminals"
            value={terminalsInput}
            onChange={(e) => setTerminalsInput(e.target.value)}
            placeholder="+ * id"
            className="font-mono"
          />
          <p className="text-sm text-muted-foreground">
            Separa los terminales por espacios. Incluye todos los operadores e identificadores.
          </p>
          
          {/* Vista previa de terminales */}
          {parsedTerminals.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {parsedTerminals.map((terminal, idx) => (
                <Badge key={idx} variant="secondary" className="font-mono text-xs">
                  {terminal}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Sección de Gramática y Ejemplos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gramática */}
          <div className="space-y-3">
            <Label htmlFor="grammar" className="text-base font-medium">
              Producciones de la Gramática
            </Label>
            <Textarea
              id="grammar"
              value={grammarText}
              onChange={(e) => setGrammarText(e.target.value)}
              placeholder="E -> E + E | E * E | id"
              className="font-mono min-h-32 text-sm leading-relaxed w-full"
            />
          </div>

          {/* Ejemplos */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Ejemplos Predefinidos</Label>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  onClick={() => loadExample(idx)}
                  className="text-xs"
                >
                  {ex.name}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Botón Analizar */}
        <Button
          onClick={handleAnalyze}
          disabled={isProcessing || !grammarText.trim()}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Analizando...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Analizar Gramática
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

'use client';

/**
 * Input de gramática mejorado para análisis sintáctico descendente
 * Incluye:
 * - Input de tokens/terminales con autodetección
 * - Textarea para gramática (símbolos sin espacios, | para alternativas)
 * - Ejemplos predefinidos
 */

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Sparkles, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GrammarInputEnhancedProps {
  onAnalyze: (grammarText: string, terminals: string, autoDetect: boolean) => void;
  isProcessing?: boolean;
  className?: string;
}

const EXAMPLES = [
  {
    name: 'Expresiones Aritméticas',
    grammar: `E -> E+T | T
T -> T*F | F
F -> (E) | id`,
    terminals: '+,*,(,),id',
  },
  {
    name: 'Aritmética Completa',
    grammar: `E -> E+T | E-T | T
T -> T*F | T/F | F
F -> (E) | id | num`,
    terminals: '+,-,*,/,(,),id,num',
  },
  {
    name: 'Expresiones Booleanas',
    grammar: `E -> E or T | T
T -> T and F | F
F -> not F | (E) | id`,
    terminals: 'or,and,not,(,),id',
  },
  {
    name: 'Listas',
    grammar: `S -> (L) | a
L -> L,S | S`,
    terminals: '(,),a,,',
  },
  {
    name: 'If-Then-Else',
    grammar: `S -> if E then S | if E then S else S | a
E -> b`,
    terminals: 'if,then,else,a,b',
  },
  {
    name: 'LL(1) Simple',
    grammar: `E -> TE'
E' -> +TE' | ε
T -> FT'
T' -> *FT' | ε
F -> (E) | id`,
    terminals: '+,*,(,),id',
  },
];

export function GrammarInputEnhanced({
  onAnalyze,
  isProcessing = false,
  className,
}: GrammarInputEnhancedProps) {
  const [grammarText, setGrammarText] = useState(EXAMPLES[0].grammar);
  const [terminalsInput, setTerminalsInput] = useState(EXAMPLES[0].terminals);
  const [autoDetect, setAutoDetect] = useState(false);

  const loadExample = useCallback((index: number) => {
    setGrammarText(EXAMPLES[index].grammar);
    setTerminalsInput(EXAMPLES[index].terminals);
  }, []);

  const handleAnalyze = useCallback(() => {
    onAnalyze(grammarText, terminalsInput, autoDetect);
  }, [grammarText, terminalsInput, autoDetect, onAnalyze]);

  // Parsear terminales para mostrar como badges
  const parsedTerminals = terminalsInput
    .split(',')
    .map(t => t.trim())
    .filter(t => t.length > 0);

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Definición de la Gramática
        </CardTitle>
        <CardDescription>
          Define los símbolos terminales y la gramática. Los no terminales son letras mayúsculas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sección de Terminales */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="terminals" className="text-base font-medium">
              Símbolos Terminales
            </Label>
            <div className="flex items-center gap-2">
              <Label htmlFor="auto-detect" className="text-sm text-muted-foreground cursor-pointer">
                Autodetección
              </Label>
              <Switch
                id="auto-detect"
                checked={autoDetect}
                onCheckedChange={setAutoDetect}
              />
            </div>
          </div>

          {!autoDetect ? (
            <>
              <Input
                id="terminals"
                value={terminalsInput}
                onChange={(e) => setTerminalsInput(e.target.value)}
                placeholder="+, *, (, ), id"
                className="font-mono"
              />
              <p className="text-sm text-muted-foreground">
                Separa los terminales por comas. Ejemplo: +, *, (, ), id
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
            </>
          ) : (
            <Alert className="bg-muted/50">
              <Lightbulb className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Los terminales se detectarán automáticamente de la gramática.
                Los símbolos que no sean letras mayúsculas (no terminales) serán considerados terminales.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Sección de Gramática */}
        <div className="space-y-3">
          <Label htmlFor="grammar" className="text-base font-medium">
            Producciones de la Gramática
          </Label>
          <Textarea
            id="grammar"
            value={grammarText}
            onChange={(e) => setGrammarText(e.target.value)}
            placeholder="E -> E+T | T&#10;T -> T*F | F&#10;F -> (E) | id"
            className="font-mono min-h-40 text-sm leading-relaxed"
          />
          
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertDescription className="text-sm space-y-1">
              <p><strong>Formato:</strong></p>
              <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                <li>Usa <code className="bg-muted px-1 rounded">-&gt;</code> o <code className="bg-muted px-1 rounded">→</code> para separar izquierda y derecha</li>
                <li>Usa <code className="bg-muted px-1 rounded">|</code> para alternativas</li>
                <li>Los <strong>no terminales</strong> son letras mayúsculas (A, B, E, T, F, E', T')</li>
                <li>Escribe los símbolos <strong>sin espacios</strong> entre ellos</li>
                <li>Usa <code className="bg-muted px-1 rounded">ε</code> para épsilon (producción vacía)</li>
              </ul>
            </AlertDescription>
          </Alert>
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

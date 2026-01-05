'use client';

/**
 * Input de gramática mejorado para análisis sintáctico descendente
 * Incluye:
 * - Input de tokens/terminales con autodetección
 * - Textarea para gramática (símbolos sin espacios, | para alternativas)
 * - Ejemplos predefinidos
 */

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Sparkles, Play } from 'lucide-react';
import { HelpModal } from '@/components/shared/help-modal';
import { cn } from '@/lib/utils';

interface GrammarInputEnhancedProps {
  onAnalyze: (grammarText: string, terminals: string, autoDetect: boolean) => void;
  isProcessing?: boolean;
  className?: string;
  /** Valores iniciales para restaurar desde historial */
  initialValues?: {
    grammarText?: string;
    terminals?: string;
    autoDetect?: boolean;
  };
}

const EXAMPLES = [
  {
    name: 'Expresiones Aritméticas',
    grammar: `E -> E+T | T
T -> T*F | F
F -> id | (E)`,
    terminals: '+ * ( ) id',
  },
  {
    name: 'Aritmética Completa',
    grammar: `E -> E+T | E-T | T
T -> T*F | T/F | F
F -> (E) | id | num`,
    terminals: '+ - * / ( ) id num',
  },
  {
    name: 'Expresiones Booleanas',
    grammar: `E -> E or T | T
T -> T and F | F
F -> not F | (E) | id`,
    terminals: 'or and not ( ) id',
  },
  {
    name: 'Listas',
    grammar: `S -> (L) | a
L -> L,S | S`,
    terminals: '( ) a ,',
  },
  {
    name: 'If-Then-Else',
    grammar: `S -> if E then S | if E then S else S | a
E -> b`,
    terminals: 'if then else a b',
  },
  {
    name: 'LL(1) Simple',
    grammar: `E -> TE'
E' -> +TE' | e
T -> FT'
T' -> *FT' | e
F -> (E) | id`,
    terminals: '+ * ( ) id',
  },
];

export function GrammarInputEnhanced({
  onAnalyze,
  isProcessing = false,
  className,
  initialValues,
}: GrammarInputEnhancedProps) {
  const [grammarText, setGrammarText] = useState(initialValues?.grammarText || EXAMPLES[0].grammar);
  const [terminalsInput, setTerminalsInput] = useState(initialValues?.terminals || EXAMPLES[0].terminals);
  const [autoDetect, setAutoDetect] = useState(initialValues?.autoDetect ?? false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Actualizar valores cuando cambian los initialValues (restaurar desde historial)
  useEffect(() => {
    if (isInitialized) return;
    
    if (initialValues?.grammarText) {
      setGrammarText(initialValues.grammarText);
    }
    if (initialValues?.terminals) {
      setTerminalsInput(initialValues.terminals);
    }
    if (initialValues?.autoDetect !== undefined) {
      setAutoDetect(initialValues.autoDetect);
    }
    
    setIsInitialized(true);
  }, [initialValues, isInitialized]);

  const loadExample = useCallback((index: number) => {
    setGrammarText(EXAMPLES[index].grammar);
    setTerminalsInput(EXAMPLES[index].terminals);
  }, []);

  const handleAnalyze = useCallback(() => {
    onAnalyze(grammarText, terminalsInput, autoDetect);
  }, [grammarText, terminalsInput, autoDetect, onAnalyze]);

  // Parsear terminales para mostrar como badges (separados por espacios)
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
              Define los símbolos terminales y la gramática. Los no terminales son letras mayúsculas.
            </CardDescription>
          </div>
          <HelpModal
            title="Formato de la Gramática"
            description="Guía para definir gramáticas correctamente"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Reglas de formato:</h4>
                <ul className="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
                  <li>Usa <code className="bg-muted px-1.5 py-0.5 rounded text-xs">-&gt;</code> o <code className="bg-muted px-1.5 py-0.5 rounded text-xs">→</code> para separar izquierda y derecha</li>
                  <li>Usa <code className="bg-muted px-1.5 py-0.5 rounded text-xs">|</code> para alternativas</li>
                  <li>Los <strong>no terminales</strong> son letras mayúsculas (A, B, E, T, F, E', T')</li>
                  <li>Escribe los símbolos <strong>sin espacios</strong> entre ellos</li>
                  <li>Usa <code className="bg-muted px-1.5 py-0.5 rounded text-xs">ε</code> o <code className="bg-muted px-1.5 py-0.5 rounded text-xs">e</code> para épsilon (producción vacía)</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Terminales:</h4>
                <p className="text-sm text-muted-foreground">
                  Separa los terminales por <strong>espacios</strong>. Ejemplo: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">+ * ( ) id</code>
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Ejemplo:</h4>
                <div className="bg-muted/50 rounded-lg p-3 font-mono text-xs space-y-1">
                  <p>E -&gt; E+T | T</p>
                  <p>T -&gt; T*F | F</p>
                  <p>F -&gt; (E) | id</p>
                </div>
              </div>

              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Tip:</strong> Si escribes <code className="bg-muted px-1 rounded">e</code> y no está definido como terminal, se convertirá automáticamente en ε (épsilon).
                </AlertDescription>
              </Alert>
            </div>
          </HelpModal>
        </div>
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
                placeholder="+ * ( ) id"
                className="font-mono"
              />
              <p className="text-sm text-muted-foreground">
                Separa los terminales por espacios. Ejemplo: + * ( ) id
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
              placeholder="E -> E+T | T&#10;T -> T*F | F&#10;F -> (E) | id"
              className="font-mono min-h-40 text-sm leading-relaxed w-full"
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

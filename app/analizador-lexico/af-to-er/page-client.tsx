'use client';

/**
 * Página de conversión de Autómata Finito a Expresión Regular
 * Implementa el método de Arden (ecuaciones) para la conversión
 */

import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  LanguageInput, 
  AutomataEditor, 
  AutomataHelpModal,
  TransitionTableEditor,
  AutomataGraphCytoscape,
} from '@/components/analizador-lexico';
import { 
  CollapsibleSection, 
  SegmentedControl, 
  CopyButton,
} from '@/components/shared';
import { afToER, createExampleAutomaton } from '@/lib/algorithms/lexical/af-to-er';
import { useHistory } from '@/lib/context';
import { Loader2, Play, RotateCcw, Sparkles, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Automaton, EquationStep } from '@/lib/types';

// Opciones para el control segmentado
const modeOptions = [
  { value: 'visual', label: 'Modo Visual' },
  { value: 'table', label: 'Modo Tabla' },
];

const alphabetOptions = [
  { value: 'auto', label: 'Auto-detectar' },
  { value: 'custom', label: 'Personalizado' },
];

export default function AFtoERClientPage() {
  // Estado del modo de entrada
  const [inputMode, setInputMode] = useState<'visual' | 'table'>('visual');
  const [alphabetMode, setAlphabetMode] = useState<'auto' | 'custom'>('auto');
  const [customAlphabet, setCustomAlphabet] = useState<string[]>([]);
  
  // Estado del autómata
  const [automaton, setAutomaton] = useState<Automaton | null>(null);
  const [resetKey, setResetKey] = useState(0);
  
  // Estado de procesamiento
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    regex: string;
    steps: EquationStep[];
    frontiers: any[];
    equations: any[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { addEntry } = useHistory();

  // Alfabeto efectivo (auto-detectado o personalizado)
  const effectiveAlphabet = useMemo(() => {
    if (alphabetMode === 'custom' && customAlphabet.length > 0) {
      return customAlphabet;
    }
    // Auto-detectar desde las transiciones del autómata
    if (automaton?.transitions) {
      const symbols = [...new Set(automaton.transitions.map(t => t.symbol))];
      return symbols.filter(s => s && s !== 'ε').sort();
    }
    return ['a', 'b']; // Default
  }, [alphabetMode, customAlphabet, automaton]);

  // Manejar cambio de autómata desde los editores
  const handleAutomatonChange = useCallback((newAutomaton: Automaton) => {
    setAutomaton(newAutomaton);
    setResult(null); // Limpiar resultado previo
    setError(null);
  }, []);

  // Cargar ejemplo
  const loadExample = useCallback(() => {
    const example = createExampleAutomaton();
    setAutomaton(example);
    setResult(null);
    setError(null);
  }, []);

  // Resetear todo
  const handleReset = useCallback(() => {
    setAutomaton(null);
    setResult(null);
    setError(null);
    setCustomAlphabet([]);
    setResetKey(prev => prev + 1);
  }, []);

  // Realizar la conversión
  const handleConvert = async () => {
    if (!automaton) {
      setError('Debes definir un autómata primero');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Validaciones
      const hasInitial = automaton.states.some(s => s.isInitial);
      const hasFinal = automaton.states.some(s => s.isFinal);

      if (!hasInitial) {
        throw new Error('El autómata debe tener un estado inicial');
      }

      if (!hasFinal) {
        throw new Error('El autómata debe tener al menos un estado final');
      }

      if (automaton.states.length === 0) {
        throw new Error('El autómata debe tener al menos un estado');
      }

      // Realizar la conversión
      const conversionResult = afToER(automaton);
      setResult(conversionResult);

      addEntry({
        type: 'lexical',
        input: `AF con ${automaton.states.length} estados → ER`,
        metadata: { 
          success: true, 
          description: `Resultado: ${conversionResult.regex}`,
          algorithm: 'arden',
        },
      });
    } catch (err: any) {
      setError(err.message || 'Error al convertir el autómata a expresión regular');
    } finally {
      setLoading(false);
    }
  };

  // Validación del autómata
  const automatonValidation = useMemo(() => {
    if (!automaton) return { valid: false, message: 'No hay autómata definido' };
    
    const hasStates = automaton.states.length > 0;
    const hasInitial = automaton.states.some(s => s.isInitial);
    const hasFinal = automaton.states.some(s => s.isFinal);
    const hasTransitions = automaton.transitions.length > 0;

    if (!hasStates) return { valid: false, message: 'Agrega al menos un estado' };
    if (!hasInitial) return { valid: false, message: 'Marca un estado como inicial' };
    if (!hasFinal) return { valid: false, message: 'Marca al menos un estado como final' };
    if (!hasTransitions) return { valid: false, message: 'Agrega al menos una transición' };

    return { valid: true, message: 'Listo para convertir' };
  }, [automaton]);

  return (
    <div className="space-y-6">
      {/* Header con descripción */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Autómata Finito → Expresión Regular</h1>
        <p className="text-muted-foreground">
          Convierte un autómata finito a su expresión regular equivalente usando el <strong>Lema de Arden</strong>.
        </p>
      </div>

      {/* Sección 1: Configuración del Alfabeto */}
      <CollapsibleSection 
        title="Configuración del Alfabeto" 
        defaultOpen={alphabetMode === 'custom'}
        badge={
          <Badge variant="outline" className="font-mono">
            Σ = {'{' + effectiveAlphabet.join(', ') + '}'}
          </Badge>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Modo de alfabeto</label>
              <SegmentedControl
                options={alphabetOptions}
                value={alphabetMode}
                onChange={(v) => setAlphabetMode(v as 'auto' | 'custom')}
              />
            </div>
          </div>

          {alphabetMode === 'custom' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Símbolos del alfabeto</label>
              <LanguageInput
                languages={customAlphabet}
                onChange={setCustomAlphabet}
                placeholder="Ej: a, b, 0, 1"
                maxLanguages={10}
              />
              <p className="text-xs text-muted-foreground">
                Define los símbolos que se usarán en las transiciones del autómata.
              </p>
            </div>
          )}

          {alphabetMode === 'auto' && (
            <p className="text-sm text-muted-foreground">
              El alfabeto se detectará automáticamente a partir de los símbolos usados en las transiciones.
            </p>
          )}
        </div>
      </CollapsibleSection>

      {/* Sección 2: Definición del Autómata */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle>Definición del Autómata</CardTitle>
              <CardDescription>
                {inputMode === 'visual' 
                  ? 'Crea el autómata arrastrando y conectando estados' 
                  : 'Define el autómata mediante su tabla de transiciones'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <SegmentedControl
                options={modeOptions}
                value={inputMode}
                onChange={(v) => setInputMode(v as 'visual' | 'table')}
              />
              <AutomataHelpModal mode={inputMode} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Editor según el modo */}
          {inputMode === 'visual' ? (
            <AutomataEditor
              key={`visual-${resetKey}`}
              onChange={handleAutomatonChange}
              initialAutomaton={automaton || undefined}
            />
          ) : (
            <TransitionTableEditor
              key={`table-${resetKey}`}
              alphabet={alphabetMode === 'custom' ? customAlphabet : undefined}
              onChange={handleAutomatonChange}
              initialAutomaton={automaton || undefined}
            />
          )}

          {/* Estado de validación */}
          <div className={cn(
            "flex items-center gap-2 p-3 rounded-lg text-sm",
            automatonValidation.valid 
              ? "bg-green-500/10 text-green-700 dark:text-green-400" 
              : "bg-muted text-muted-foreground"
          )}>
            {automatonValidation.valid ? (
              <Check className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            {automatonValidation.message}
          </div>

          {/* Botones de acción */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleConvert}
              disabled={!automatonValidation.valid || loading}
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Convirtiendo...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Convertir a ER
                </>
              )}
            </Button>

            <Button variant="outline" onClick={loadExample} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Cargar Ejemplo
            </Button>

            <Button variant="ghost" onClick={handleReset} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Reiniciar
            </Button>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vista previa del autómata */}
      {automaton && automaton.states.length > 0 && inputMode === 'table' && (
        <CollapsibleSection title="Vista Previa del Autómata" defaultOpen>
          <AutomataGraphCytoscape automaton={automaton} className="h-64" />
        </CollapsibleSection>
      )}

      {/* Resultados */}
      {result && (
        <>
          {/* Expresión Regular Final */}
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Expresión Regular Resultante
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative rounded-lg bg-background border p-4">
                <code className="text-xl sm:text-2xl font-bold text-primary font-mono break-all">
                  {result.regex}
                </code>
                <div className="absolute top-2 right-2">
                  <CopyButton content={result.regex} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ecuaciones generadas */}
          <CollapsibleSection 
            title="Sistema de Ecuaciones" 
            defaultOpen
            badge={
              <Badge variant="secondary">
                {result.equations.length} ecuaciones
              </Badge>
            }
          >
            <div className="space-y-2">
              {result.equations.map((eq: any, idx: number) => (
                <div 
                  key={idx} 
                  className={cn(
                    "rounded-md border bg-card p-3 font-mono text-sm",
                    eq.isInitial && "border-l-4 border-l-green-500",
                    eq.isFinal && "border-l-4 border-l-orange-500",
                    eq.isInitial && eq.isFinal && "border-l-4 border-l-purple-500"
                  )}
                >
                  <span className="text-muted-foreground mr-2">
                    {eq.isInitial && '→'}
                    {eq.isFinal && '*'}
                  </span>
                  <span className="font-semibold">{eq.left}</span>
                  <span className="mx-2">=</span>
                  <span>{eq.right}</span>
                </div>
              ))}
            </div>
          </CollapsibleSection>

          {/* Pasos de resolución */}
          <CollapsibleSection 
            title="Procedimiento de Resolución (Lema de Arden)" 
            defaultOpen
            badge={
              <Badge variant="secondary">
                {result.steps.length} pasos
              </Badge>
            }
          >
            <div className="space-y-4">
              {result.steps.map((step, idx) => (
                <div 
                  key={idx} 
                  className={cn(
                    "rounded-lg border bg-card overflow-hidden",
                    step.action === 'Final' && "border-primary bg-primary/5"
                  )}
                >
                  <div className={cn(
                    "flex items-center gap-2 px-4 py-2 border-b",
                    step.action === 'Arden' && "bg-yellow-500/10",
                    step.action === 'Sustitución' && "bg-blue-500/10",
                    step.action === 'Final' && "bg-green-500/10"
                  )}>
                    <Badge variant="outline" className="font-mono">
                      Paso {step.stepNumber}
                    </Badge>
                    <Badge 
                      variant="secondary"
                      className={cn(
                        step.action === 'Arden' && "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
                        step.action === 'Sustitución' && "bg-blue-500/20 text-blue-700 dark:text-blue-400",
                        step.action === 'Final' && "bg-green-500/20 text-green-700 dark:text-green-400"
                      )}
                    >
                      {step.action}
                    </Badge>
                    <span className="font-medium text-sm">{step.description}</span>
                  </div>
                  
                  <div className="p-4 space-y-3">
                    {step.explanation && (
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {step.explanation}
                      </p>
                    )}
                    
                    <div className="space-y-1.5">
                      {step.equations.map((eq: string, eqIdx: number) => (
                        <div 
                          key={eqIdx} 
                          className={cn(
                            "rounded-md bg-muted px-3 py-2 font-mono text-sm",
                            step.highlightedVariable && eq.startsWith(step.highlightedVariable) && 
                              "ring-2 ring-primary/50 bg-primary/10"
                          )}
                        >
                          {eq}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>

          {/* Fronteras calculadas */}
          {result.frontiers && result.frontiers.length > 0 && (
            <CollapsibleSection 
              title="Fronteras del Autómata" 
              defaultOpen={false}
              badge={
                <Badge variant="secondary">
                  {result.frontiers.length} fronteras
                </Badge>
              }
            >
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {result.frontiers.map((f: any, idx: number) => (
                  <div key={idx} className="rounded-md border bg-card p-3 font-mono text-sm">
                    <span className="text-muted-foreground">δ(</span>
                    <span className="font-semibold">{f.from}</span>
                    <span className="text-muted-foreground">, </span>
                    <span className="text-primary">{f.expression}</span>
                    <span className="text-muted-foreground">) = </span>
                    <span className="font-semibold">{f.to}</span>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}
        </>
      )}
    </div>
  );
}

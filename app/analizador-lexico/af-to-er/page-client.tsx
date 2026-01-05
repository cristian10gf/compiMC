'use client';

/**
 * Página de conversión de Autómata Finito a Expresión Regular
 * Implementa el método de Arden (ecuaciones) para la conversión
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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
import { createExampleAutomaton } from '@/lib/algorithms/lexical/af-to-er';
import { useHistory } from '@/lib/context';
import { useAutomata } from '@/hooks';
import { Loader2, Play, RotateCcw, Sparkles, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Automaton } from '@/lib/types';

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
  const searchParams = useSearchParams();
  
  // Usar el hook de autómata
  const { convertToER, clearAutomaton, error: hookError, isProcessing } = useAutomata();
  const { addEntry } = useHistory();
  
  // Estado del modo de entrada
  const [inputMode, setInputMode] = useState<'visual' | 'table'>('visual');
  const [alphabetMode, setAlphabetMode] = useState<'auto' | 'custom'>('auto');
  const [customAlphabet, setCustomAlphabet] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Estado del autómata
  const [automaton, setAutomaton] = useState<Automaton | null>(null);
  const [resetKey, setResetKey] = useState(0);
  
  // Estado de resultado
  const [result, setResult] = useState<{
    regex: string;
    steps: any[];
    ardenEquations: any[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Restaurar estado desde URL al montar
  useEffect(() => {
    if (isInitialized) return;
    
    const inputModeParam = searchParams.get('inputMode');
    const alphabetModeParam = searchParams.get('alphabetMode');
    const customAlphabetParam = searchParams.get('customAlphabet');
    const automatonParam = searchParams.get('automaton');
    
    if (inputModeParam === 'visual' || inputModeParam === 'table') {
      setInputMode(inputModeParam);
    }
    if (alphabetModeParam === 'auto' || alphabetModeParam === 'custom') {
      setAlphabetMode(alphabetModeParam);
    }
    if (customAlphabetParam) {
      setCustomAlphabet(customAlphabetParam.split(',').filter(Boolean));
    }
    if (automatonParam) {
      try {
        const parsedAutomaton = JSON.parse(decodeURIComponent(automatonParam));
        setAutomaton(parsedAutomaton);
      } catch {
        // Ignorar errores de parseo
      }
    }
    
    setIsInitialized(true);
  }, [searchParams, isInitialized]);

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
    clearAutomaton();
  }, [clearAutomaton]);

  // Realizar la conversión
  const handleConvert = async () => {
    if (!automaton) {
      setError('Debes definir un autómata primero');
      return;
    }

    try {
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

      // Guardar autómata temporalmente en el contexto para que el hook lo use
      // Esto es necesario porque el hook espera que el autómata esté en el contexto
      const tempAutomatonResult = {
        automatonAFD: automaton,
        automatonAFN: undefined,
        syntaxTree: undefined,
        automatonAFDNonOptimized: undefined,
      };

      // Usar el hook para convertir (pasando el autómata manualmente)
      // Como el hook usa el contexto, necesitamos una forma de pasarle el autómata
      // Por ahora, usaremos el método directo
      const { afToERByStateElimination } = await import('@/lib/algorithms/lexical/af-to-er');
      const conversionResult = afToERByStateElimination(automaton);
      setResult(conversionResult);

      addEntry({
        type: 'lexical-af-to-er',
        input: `AF con ${automaton.states.length} estados → ER`,
        metadata: { 
          success: true, 
          description: `Resultado: ${conversionResult.regex}`,
          algorithm: 'state-elimination',
          inputMode,
          alphabetMode,
          customAlphabet: customAlphabet.length > 0 ? customAlphabet : undefined,
          automatonJson: JSON.stringify(automaton),
        },
      });
    } catch (err: any) {
      setError(err.message || 'Error al convertir el autómata a expresión regular');
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
          Convierte un autómata finito a su expresión regular equivalente usando el <strong>método de eliminación de estados</strong>.
          Este método es más sistemático y eficiente que el método algebraico de Arden.
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
              disabled={!automatonValidation.valid || isProcessing}
              className="gap-2"
            >
              {isProcessing ? (
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

          {/* Ecuaciones generadas (de Arden) */}
          <CollapsibleSection 
            title="Ecuaciones de Arden (Generadas)" 
            defaultOpen
            badge={
              <Badge variant="secondary">
                {result.ardenEquations.length} ecuaciones
              </Badge>
            }
          >
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Estas ecuaciones se generan automáticamente a partir del autómata usando el método de Arden.
                Sin embargo, para la conversión se utiliza el <strong>método de eliminación de estados</strong>,
                que es más eficiente y produce expresiones más legibles.
              </p>
              <div className="space-y-2">
                {result.ardenEquations.map((eq: any, idx: number) => (
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
            </div>
          </CollapsibleSection>

          {/* Pasos de eliminación de estados */}
          <CollapsibleSection 
            title="Procedimiento de Eliminación de Estados" 
            defaultOpen
            badge={
              <Badge variant="secondary">
                {result.steps.length} pasos
              </Badge>
            }
          >
            <div className="space-y-3 mb-4">
              <p className="text-sm text-muted-foreground">
                El <strong>método de eliminación de estados</strong> es más sistemático que el método de Arden:
              </p>
              <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
                <li>Agregar nuevo estado inicial I con transición ε al estado inicial original</li>
                <li>Agregar nuevo estado final F con transiciones ε desde estados finales</li>
                <li>Eliminar estados usando: R(p→r) = R(p→q)·R(q→q)*·R(q→r) + R(p→r)</li>
                <li>La ER final es R(I→F)</li>
              </ol>
            </div>
            <div className="space-y-4">
              {result.steps.map((step, idx) => {
                // Saltar el paso 0 (ecuaciones de Arden de referencia)
                if (step.stepNumber === 0) return null;
                
                return (
                  <div 
                    key={idx} 
                    className={cn(
                      "rounded-lg border bg-card overflow-hidden",
                      step.action === 'final' && "border-primary bg-primary/5"
                    )}
                  >
                    <div className={cn(
                      "flex items-center gap-2 px-4 py-2 border-b",
                      step.action === 'eliminate' && "bg-yellow-500/10",
                      step.action === 'add-states' && "bg-blue-500/10",
                      step.action === 'final' && "bg-green-500/10"
                    )}>
                      <Badge variant="outline" className="font-mono">
                        Paso {step.stepNumber}
                      </Badge>
                      <Badge 
                        variant="secondary"
                        className={cn(
                          step.action === 'eliminate' && "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
                          step.action === 'add-states' && "bg-blue-500/20 text-blue-700 dark:text-blue-400",
                          step.action === 'final' && "bg-green-500/20 text-green-700 dark:text-green-400"
                        )}
                      >
                        {step.action === 'init' && 'Inicial'}
                        {step.action === 'add-states' && 'Agregar Estados'}
                        {step.action === 'eliminate' && 'Eliminar Estado'}
                        {step.action === 'final' && 'Final'}
                      </Badge>
                      <span className="font-medium text-sm">{step.description}</span>
                    </div>
                    
                    <div className="p-4 space-y-3">
                      {step.explanation && (
                        <p className="text-sm text-muted-foreground whitespace-pre-line">
                          {step.explanation}
                        </p>
                      )}
                      
                      {step.transitions && step.transitions.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2">Transiciones:</p>
                          <div className="space-y-1">
                            {step.transitions
                              .filter((t: any) => t.regex !== '∅')
                              .map((t: any, tIdx: number) => (
                                <div 
                                  key={tIdx}
                                  className="rounded-md bg-muted px-3 py-2 font-mono text-sm flex items-center gap-2"
                                >
                                  <span className="font-semibold">{t.from}</span>
                                  <span className="text-muted-foreground">→</span>
                                  <span className="font-semibold">{t.to}</span>
                                  <span className="text-muted-foreground">:</span>
                                  <span className="text-primary">{t.regex}</span>
                                </div>
                              ))
                            }
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CollapsibleSection>
        </>
      )}
    </div>
  );
}

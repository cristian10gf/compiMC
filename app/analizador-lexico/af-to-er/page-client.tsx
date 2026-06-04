'use client';

import dynamic from 'next/dynamic';
import { useAfToErPage } from '@/hooks/use-af-to-er-page';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LanguageInput,
  AutomataEditor,
  AutomataHelpModal,
  TransitionTableEditor,
} from '@/components/analizador-lexico';
import { CollapsibleSection, SegmentedControl, CopyButton } from '@/components/shared';
import { Loader2, Play, RotateCcw, Sparkles, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const AutomataGraphCytoscape = dynamic(
  () => import('@/components/analizador-lexico/automata-graph-cytoscape').then(m => ({ default: m.AutomataGraphCytoscape })),
  { ssr: false, loading: () => <div className="h-64 w-full rounded-lg bg-muted animate-pulse" /> }
);

const modeOptions = [
  { value: 'visual', label: 'Modo Visual' },
  { value: 'table', label: 'Modo Tabla' },
];
const alphabetOptions = [
  { value: 'auto', label: 'Auto-detectar' },
  { value: 'custom', label: 'Personalizado' },
];

export default function AFtoERClientPage() {
  const {
    inputMode,
    alphabetMode,
    customAlphabet,
    setParams,
    automaton,
    effectiveAlphabet,
    automatonValidation,
    result,
    resetKey,
    isProcessing,
    handleAutomatonChange,
    loadExample,
    handleReset,
    handleConvert,
  } = useAfToErPage();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Autómata Finito → Expresión Regular</h1>
        <p className="text-muted-foreground">
          Convierte un autómata finito a su expresión regular equivalente usando el{' '}
          <strong>método de eliminación de estados</strong>.
          Este método es más sistemático y eficiente que el método algebraico de Arden.
        </p>
      </div>

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
                onChange={(v) => setParams({ alphabetMode: v as 'auto' | 'custom' })}
              />
            </div>
          </div>
          {alphabetMode === 'custom' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Símbolos del alfabeto</label>
              <LanguageInput
                languages={customAlphabet}
                onChange={(newAlphabet) => setParams({ customAlphabet: newAlphabet })}
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
                onChange={(v) => setParams({ inputMode: v as 'visual' | 'table' })}
              />
              <AutomataHelpModal mode={inputMode} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
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

          <div
            className={cn(
              'flex items-center gap-2 p-3 rounded-lg text-sm',
              automatonValidation.valid
                ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {automatonValidation.valid ? <Check className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            {automatonValidation.message}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleConvert} disabled={!automatonValidation.valid || isProcessing} className="gap-2">
              {isProcessing ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Convirtiendo…</>
              ) : (
                <><Play className="h-4 w-4" />Convertir a ER</>
              )}
            </Button>
            <Button variant="outline" onClick={loadExample} className="gap-2">
              <Sparkles className="h-4 w-4" />Cargar Ejemplo
            </Button>
            <Button variant="ghost" onClick={handleReset} className="gap-2">
              <RotateCcw className="h-4 w-4" />Reiniciar
            </Button>
          </div>

        </CardContent>
      </Card>

      {automaton && automaton.states.length > 0 && inputMode === 'table' && (
        <CollapsibleSection title="Vista Previa del Autómata" defaultOpen>
          <AutomataGraphCytoscape automaton={automaton} className="h-64" />
        </CollapsibleSection>
      )}

      {result && (
        <>
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

          <CollapsibleSection
            title="Ecuaciones de Arden (Generadas)"
            defaultOpen
            badge={<Badge variant="secondary">{result.ardenEquations.length} ecuaciones</Badge>}
          >
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Estas ecuaciones se generan automáticamente a partir del autómata usando el método de Arden.
                Sin embargo, para la conversión se utiliza el <strong>método de eliminación de estados</strong>,
                que es más eficiente y produce expresiones más legibles.
              </p>
              <div className="space-y-2">
                {result.ardenEquations.map((eq) => (
                  <div
                    key={eq.left}
                    className={cn(
                      'rounded-md border bg-card p-3 font-mono text-sm',
                      eq.isInitial && 'border-l-4 border-l-green-500',
                      eq.isFinal && 'border-l-4 border-l-orange-500',
                      eq.isInitial && eq.isFinal && 'border-l-4 border-l-purple-500'
                    )}
                  >
                    <span className="text-muted-foreground mr-2">
                      {eq.isInitial && '→'}{eq.isFinal && '*'}
                    </span>
                    <span className="font-semibold">{eq.left}</span>
                    <span className="mx-2">=</span>
                    <span>{eq.right}</span>
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Procedimiento de Eliminación de Estados"
            defaultOpen
            badge={<Badge variant="secondary">{result.steps.length} pasos</Badge>}
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
              {result.steps.map((step) => {
                if (step.stepNumber === 0) return null;
                return (
                  <div
                    key={`step-${step.stepNumber}`}
                    className={cn(
                      'rounded-lg border bg-card overflow-hidden',
                      step.action === 'final' && 'border-primary bg-primary/5'
                    )}
                  >
                    <div className={cn(
                      'flex items-center gap-2 px-4 py-2 border-b',
                      step.action === 'eliminate' && 'bg-yellow-500/10',
                      step.action === 'add-states' && 'bg-blue-500/10',
                      step.action === 'final' && 'bg-green-500/10'
                    )}>
                      <Badge variant="outline" className="font-mono">Paso {step.stepNumber}</Badge>
                      <Badge variant="secondary" className={cn(
                        step.action === 'eliminate' && 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400',
                        step.action === 'add-states' && 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
                        step.action === 'final' && 'bg-green-500/20 text-green-700 dark:text-green-400'
                      )}>
                        {step.action === 'init' && 'Inicial'}
                        {step.action === 'add-states' && 'Agregar Estados'}
                        {step.action === 'eliminate' && 'Eliminar Estado'}
                        {step.action === 'final' && 'Final'}
                      </Badge>
                      <span className="font-medium text-sm">{step.description}</span>
                    </div>
                    <div className="p-4 space-y-3">
                      {step.explanation && (
                        <p className="text-sm text-muted-foreground whitespace-pre-line">{step.explanation}</p>
                      )}
                      {step.transitions && step.transitions.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2">Transiciones:</p>
                          <div className="space-y-1">
                            {step.transitions
                              .filter((t) => t.regex !== '∅')
                              .map((t, tIdx) => (
                                <div key={tIdx} className="rounded-md bg-muted px-3 py-2 font-mono text-sm flex items-center gap-2">
                                  <span className="font-semibold">{t.from}</span>
                                  <span className="text-muted-foreground">→</span>
                                  <span className="font-semibold">{t.to}</span>
                                  <span className="text-muted-foreground">:</span>
                                  <span className="text-primary">{t.regex}</span>
                                </div>
                              ))}
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

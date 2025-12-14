'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LanguageInput, AutomataGraph, TransitionTable } from '@/components/analizador-lexico';
import { SymbolSlider, commonSymbols, CollapsibleSection } from '@/components/shared';
import { afToER } from '@/lib/algorithms/lexical/af-to-er';
import { useHistory } from '@/lib/context';
import { Loader2 } from 'lucide-react';
import type { Automaton } from '@/lib/types';

export default function AFtoERClientPage() {
  const [states, setStates] = useState<string[]>([]);
  const [alphabet, setAlphabet] = useState<string[]>([]);
  const [initialState, setInitialState] = useState('');
  const [finalStates, setFinalStates] = useState<string[]>([]);
  const [transitions, setTransitions] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ regex: string; steps: any[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { addEntry } = useHistory();

  const parseTransitions = (text: string): any[] => {
    const lines = text.trim().split('\n').filter(Boolean);
    return lines.map(line => {
      const [from, symbol, to] = line.trim().split(/[\s,]+/);
      return { from, symbol, to };
    });
  };

  const handleConvert = async () => {
    try {
      setLoading(true);
      setError(null);

      const parsedTransitions = parseTransitions(transitions);
      
      const statesObj = states.map((id, idx) => ({
        id,
        label: id,
        isInitial: id === initialState,
        isFinal: finalStates.includes(id),
      }));

      const automaton: Automaton = {
        id: 'af-' + Date.now(),
        states: statesObj,
        alphabet,
        transitions: parsedTransitions.map((t, idx) => ({ ...t, id: `t${idx}` })),
        type: 'DFA' as const,
      };

      const conversionResult = afToER(automaton);
      setResult(conversionResult);

      addEntry({
        type: 'lexical',
        input: `AF con ${states.length} estados`,
        metadata: { success: true },
      });
    } catch (err: any) {
      setError(err.message || 'Error al convertir a expresión regular');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Definición del Autómata</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Estados (separados por comas)</label>
            <Input
              value={states.join(',')}
              onChange={(e) => setStates(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
              placeholder="Ej: q0,q1,q2"
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Alfabeto</label>
            <LanguageInput
              languages={alphabet}
              onChange={setAlphabet}
              placeholder="Símbolo del alfabeto"
              maxLanguages={10}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Estado Inicial</label>
            <Input
              value={initialState}
              onChange={(e) => setInitialState(e.target.value)}
              placeholder="Ej: q0"
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Estados Finales (separados por comas)</label>
            <Input
              value={finalStates.join(',')}
              onChange={(e) => setFinalStates(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
              placeholder="Ej: q2,q3"
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Transiciones (una por línea: estado símbolo estado)
            </label>
            <textarea
              value={transitions}
              onChange={(e) => setTransitions(e.target.value)}
              placeholder="Ej:&#10;q0 a q1&#10;q1 b q2&#10;q2 a q0"
              className="w-full min-h-32 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
            />
          </div>

          <Button
            onClick={handleConvert}
            disabled={!states.length || !alphabet.length || !initialState || !finalStates.length || !transitions || loading}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 animate-spin" />
                Convirtiendo...
              </>
            ) : (
              'Convertir a ER'
            )}
          </Button>

          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <>
          <CollapsibleSection title="Expresión Regular Resultante" defaultOpen>
            <Card>
              <CardContent className="pt-6">
                <div className="rounded-md bg-muted p-4 text-center">
                  <code className="text-xl font-bold text-foreground">{result.regex}</code>
                </div>
              </CardContent>
            </Card>
          </CollapsibleSection>

          {result.steps && result.steps.length > 0 && (
            <CollapsibleSection title="Pasos de Conversión" defaultOpen>
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {result.steps.map((step, idx) => (
                      <div key={idx} className="rounded-md border bg-card p-3 text-sm">
                        <p className="font-medium mb-1">Paso {idx + 1}</p>
                        <p className="text-muted-foreground">{step.description}</p>
                        {step.regex && (
                          <code className="mt-2 block rounded bg-muted px-2 py-1 font-mono text-xs">
                            {step.regex}
                          </code>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </CollapsibleSection>
          )}
        </>
      )}
    </div>
  );
}

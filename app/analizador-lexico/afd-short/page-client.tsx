'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LanguageInput, AutomataGraph, SyntaxTreeVisual, TransitionTable } from '@/components/analizador-lexico';
import { SymbolSlider, commonSymbols, CollapsibleSection } from '@/components/shared';
import { useAutomata } from '@/hooks';
import { useHistory } from '@/lib/context';
import { Loader2 } from 'lucide-react';

export default function AFDShortClientPage() {
  const [languages, setLanguages] = useState<string[]>([]);
  const [regex, setRegex] = useState('');
  
  const { automaton, isProcessing, error, buildAutomaton } = useAutomata();
  const { addEntry } = useHistory();

  const handleAnalyze = async () => {
    // Construir AFD óptimo usando estados significativos
    const tree = await buildAutomaton({
      regex,
      languages,
      algorithm: 'afd-short',
    });

    if (tree && !error) {
      addEntry({
        type: 'lexical',
        input: regex,
        metadata: { 
          success: true,
          algorithm: 'AFD Óptimo (Estados Significativos)',
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <LanguageInput
            languages={languages}
            onChange={setLanguages}
            placeholder="Ej: L={a,d}"
            maxLanguages={5}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium">Expresión Regular</label>
            <Input
              value={regex}
              onChange={(e) => setRegex(e.target.value)}
              placeholder="Ej: (a|b)+abb"
              className="font-mono"
            />
            <SymbolSlider
              symbols={commonSymbols.regex}
              onSelect={(symbol) => setRegex(prev => prev + symbol)}
              variant="outline"
            />
          </div>

          <Button
            onClick={handleAnalyze}
            disabled={!regex || isProcessing}
            className="w-full sm:w-auto"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 animate-spin" />
                Optimizando AFD...
              </>
            ) : (
              'Construir AFD Óptimo (Estados Significativos)'
            )}
          </Button>

          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Árbol Sintáctico */}
      {automaton && (
        <CollapsibleSection title="Árbol Sintáctico" defaultOpen>
          <SyntaxTreeVisual tree={automaton.syntaxTree} />
        </CollapsibleSection>
      )}

      {/* Autómata */}
      {automaton && (
        <>
          <CollapsibleSection title="Información del Autómata" defaultOpen>
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Tipo:</span> AFD Óptimo
                  </div>
                  <div>
                    <span className="font-medium">Estados:</span> {automaton.states.length}
                  </div>
                  <div>
                    <span className="font-medium">Transiciones:</span> {automaton.transitions.length}
                  </div>
                  <div>
                    <span className="font-medium">Alfabeto:</span> {automaton.alphabet.join(', ')}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Este AFD fue optimizado usando el algoritmo de estados significativos,
                  identificando y fusionando estados equivalentes.
                </p>
              </CardContent>
            </Card>
          </CollapsibleSection>

          <CollapsibleSection title="Tabla de Transiciones" defaultOpen>
            <TransitionTable automaton={automaton} />
          </CollapsibleSection>

          <CollapsibleSection title="Autómata Finito Determinista Óptimo" defaultOpen>
            <AutomataGraph automaton={automaton} />
          </CollapsibleSection>
        </>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LanguageInput, AutomataGraph, TransitionTable, AutomataGraphCytoscape } from '@/components/analizador-lexico';
import { SymbolSlider, commonSymbols, CollapsibleSection } from '@/components/shared';
import { useAutomata } from '@/hooks';
import { useHistory } from '@/lib/context';
import { Loader2 } from 'lucide-react';

export default function AFDFullClientPage() {
  const [languages, setLanguages] = useState<string[]>([]);
  const [regex, setRegex] = useState('');
  
  const { automaton, isProcessing, error, buildAutomaton } = useAutomata();
  const { addEntry } = useHistory();

  const handleAnalyze = async () => {
    // Construir AFD Full mediante algoritmo de subconjuntos
    const automaton = await buildAutomaton({
      regex,
      languages,
      algorithm: 'afd-full',
    });

    if (automaton && !error) {
      addEntry({
        type: 'lexical',
        input: regex,
        metadata: { 
          success: true,
          algorithm: 'AFD Full (Subconjuntos)',
        },
      });
    }

    console.log(automaton);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuración</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <LanguageInput
            languages={languages}
            onChange={setLanguages}
            placeholder="Ej: a,d,b"
            maxLanguages={5}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium">Expresión Regular</label>
            <Input
              value={regex}
              onChange={(e) => setRegex(e.target.value)}
              placeholder="Ej: (a|b)*abb"
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
                Construyendo AFD...
              </>
            ) : (
              'Construir AFD Full (Subconjuntos)'
            )}
          </Button>

          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Autómata */}
      {automaton?.automatonAFN && (
        <>
          <CollapsibleSection title="Información del Autómata" defaultOpen>
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Tipo:</span> {automaton.automatonAFN.type === 'DFA' ? 'AFD' : 'AFN'}
                  </div>
                  <div>
                    <span className="font-medium">Estados:</span> {automaton.automatonAFN.states.length}
                  </div>
                  <div>
                    <span className="font-medium">Transiciones:</span> {automaton.automatonAFN.transitions.length}
                  </div>
                  <div>
                    <span className="font-medium">Alfabeto:</span> {automaton.automatonAFN.alphabet.join(', ')}
                  </div>
                </div>
              </CardContent>
            </Card>
          </CollapsibleSection>

          {automaton.automatonAFDNonOptimized && (
            <CollapsibleSection title="Tabla de Transiciones" defaultOpen>
              <TransitionTable automaton={automaton.automatonAFDNonOptimized} />
            </CollapsibleSection>
          )}

          <CollapsibleSection title="Grafo del AFD" defaultOpen>
            <AutomataGraphCytoscape automaton={automaton.automatonAFD} />
          </CollapsibleSection>
        </>
      )}
    </div>
  );
}

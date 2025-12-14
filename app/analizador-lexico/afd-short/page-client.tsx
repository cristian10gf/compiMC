'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LanguageInput, AutomataGraph, SyntaxTreeVisual, TransitionTable } from '@/components/analizador-lexico';
import { SymbolSlider, commonSymbols, CollapsibleSection } from '@/components/shared';
import { buildSyntaxTree } from '@/lib/algorithms/lexical/regex-parser';
import { useAutomata } from '@/hooks';
import { Loader2 } from 'lucide-react';

export default function AFDShortClientPage() {
  const [languages, setLanguages] = useState<string[]>([]);
  const [regex, setRegex] = useState('');
  const [syntaxTree, setSyntaxTree] = useState<any>(null);
  
  const { automaton, isProcessing, error, buildAutomaton } = useAutomata();

  const handleAnalyze = async () => {
    // Construir árbol sintáctico
    const tree = buildSyntaxTree(regex);
    setSyntaxTree(tree);

    // Construir AFD óptimo usando el hook
    await buildAutomaton({
      regex,
      languages,
      algorithm: 'afd-short',
    });
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
                Analizando...
              </>
            ) : (
              'Construir AFD Óptimo'
            )}
          </Button>

          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {syntaxTree && (
        <CollapsibleSection title="Árbol Sintáctico" defaultOpen>
          <SyntaxTreeVisual tree={syntaxTree} showFunctions />
        </CollapsibleSection>
      )}

      {automaton && (
        <>
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

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LanguageInput, AutomataGraph, TransitionTable, SyntaxTreeVisual } from '@/components/analizador-lexico';
import { SymbolSlider, commonSymbols, CollapsibleSection } from '@/components/shared';
import { buildSyntaxTree } from '@/lib/algorithms/lexical/regex-parser';
import { buildAFDFull } from '@/lib/algorithms/lexical/afd-construction';
import { useHistory } from '@/lib/context';
import { Loader2 } from 'lucide-react';

export default function AFDFullClientPage() {
  const [languages, setLanguages] = useState<string[]>([]);
  const [regex, setRegex] = useState('');
  const [loading, setLoading] = useState(false);
  const [tree, setTree] = useState<any>(null);
  const [automaton, setAutomaton] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { addEntry } = useHistory();

  const handleAnalyze = async () => {
    try {
      setLoading(true);
      setError(null);

      // Construir AFD Full mediante subconjuntos
      const syntaxTree = buildSyntaxTree(regex);
      const afd = buildAFDFull(regex);
      setTree(syntaxTree);
      setAutomaton(afd);

      addEntry({
        type: 'lexical',
        input: regex,
        metadata: { success: true },
      });
    } catch (err: any) {
      setError(err.message || 'Error al construir el autómata');
    } finally {
      setLoading(false);
    }
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
            placeholder="Ej: L={a,d}"
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
            disabled={!regex || loading}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 animate-spin" />
                Construyendo...
              </>
            ) : (
              'Construir AFD Full'
            )}
          </Button>

          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {tree && (
        <CollapsibleSection title="Árbol Sintáctico" defaultOpen>
          <SyntaxTreeVisual tree={tree} />
        </CollapsibleSection>
      )}

      {automaton && (
        <>
          <CollapsibleSection title="Tabla de Transiciones" defaultOpen>
            <TransitionTable automaton={automaton} />
          </CollapsibleSection>

          <CollapsibleSection title="Grafo del AFD" defaultOpen>
            <AutomataGraph automaton={automaton} />
          </CollapsibleSection>
        </>
      )}
    </div>
  );
}

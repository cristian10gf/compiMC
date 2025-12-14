'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GrammarInput, PrecedenceTable, StackTraceTable } from '@/components/analizador-sintactico';
import { CollapsibleSection } from '@/components/shared';
import { analyzeAscendente } from '@/lib/algorithms/syntax/ascendente';
import { useHistory } from '@/lib/context';
import { Loader2 } from 'lucide-react';
import type { Grammar, Production } from '@/lib/types';

export default function ASAClientPage() {
  const [productions, setProductions] = useState<Production[]>([
    { id: 'prod-1', left: 'E', right: ['E', '+', 'T'] },
    { id: 'prod-2', left: 'E', right: ['T'] },
    { id: 'prod-3', left: 'T', right: ['T', '*', 'F'] },
    { id: 'prod-4', left: 'T', right: ['F'] },
    { id: 'prod-5', left: 'F', right: ['(', 'E', ')'] },
    { id: 'prod-6', left: 'F', right: ['id'] },
  ]);
  const [inputString, setInputString] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { addEntry } = useHistory();

  const handleAnalyze = async () => {
    try {
      setLoading(true);
      setError(null);

      const grammar: Grammar = {
        productions,
        startSymbol: productions[0]?.left || 'E',
        terminals: [],
        nonTerminals: [],
      };

      const analysisResult = analyzeAscendente(grammar, 'automatic');
      setResult(analysisResult);

      addEntry({
        type: 'syntax-lr',
        input: inputString,
        metadata: { success: true },
      });
    } catch (err: any) {
      setError(err.message || 'Error en el análisis sintáctico');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Definición de la Gramática</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <GrammarInput
            productions={productions}
            onChange={setProductions}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Analizar Cadena</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Cadena de Entrada</label>
            <Input
              value={inputString}
              onChange={(e) => setInputString(e.target.value)}
              placeholder="Ej: id + id * id"
              className="font-mono"
            />
          </div>

          <Button
            onClick={handleAnalyze}
            disabled={!productions.length || !inputString || loading}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 animate-spin" />
                Analizando...
              </>
            ) : (
              'Analizar (LR)'
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
        <Tabs defaultValue="precedence" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="precedence">Precedencia</TabsTrigger>
            <TabsTrigger value="trace">Traza</TabsTrigger>
            <TabsTrigger value="items">Items LR</TabsTrigger>
          </TabsList>

          <TabsContent value="precedence" className="mt-6">
            <CollapsibleSection title="Tabla de Precedencia de Operadores" defaultOpen>
              {result.precedenceTable && <PrecedenceTable table={result.precedenceTable} />}
            </CollapsibleSection>
          </TabsContent>

          <TabsContent value="trace" className="mt-6">
            <CollapsibleSection title="Traza de Análisis" defaultOpen>
              {result.steps && <StackTraceTable steps={result.steps} />}
            </CollapsibleSection>
          </TabsContent>

          <TabsContent value="items" className="mt-6">
            {result.itemSets && (
              <CollapsibleSection title="Conjuntos de Items LR" defaultOpen>
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {result.itemSets.map((itemSet: any, idx: number) => (
                        <div key={idx} className="rounded-md border bg-card p-4">
                          <h4 className="font-bold text-sm mb-2">I{idx}</h4>
                          <div className="space-y-1">
                            {itemSet.items.map((item: any, itemIdx: number) => (
                              <code key={itemIdx} className="block text-xs text-muted-foreground">
                                {item.left} → {item.right.slice(0, item.dotPosition).join(' ')}
                                <span className="text-primary font-bold"> • </span>
                                {item.right.slice(item.dotPosition).join(' ')}
                              </code>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </CollapsibleSection>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

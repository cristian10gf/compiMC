'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GrammarInput, ParsingTable, StackTraceTable } from '@/components/analizador-sintactico';
import { CollapsibleSection } from '@/components/shared';
import { analyzeDescendente } from '@/lib/algorithms/syntax/descendente';
import { useHistory } from '@/lib/context';
import { Loader2 } from 'lucide-react';
import type { Grammar, Production } from '@/lib/types';

export default function ASDClientPage() {
  const [productions, setProductions] = useState<Production[]>([
    { id: 'prod-1', left: 'S', right: ['a', 'A'] },
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
        startSymbol: productions[0]?.left || 'S',
        terminals: [],
        nonTerminals: [],
      };

      const analysisResult = analyzeDescendente(grammar);
      setResult(analysisResult);

      addEntry({
        type: 'syntax-ll',
        input: inputString,
        metadata: { success: analysisResult.isLL1 },
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
              placeholder="Ej: a + b * c"
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
              'Analizar (LL)'
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
        <Tabs defaultValue="table" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="table">Tabla M</TabsTrigger>
            <TabsTrigger value="trace">Traza</TabsTrigger>
            <TabsTrigger value="sets">Conjuntos</TabsTrigger>
          </TabsList>

          <TabsContent value="table" className="mt-6">
            <CollapsibleSection title="Tabla de Análisis LL (M)" defaultOpen>
              {result.parsingTable && <ParsingTable table={result.parsingTable} />}
            </CollapsibleSection>
          </TabsContent>

          <TabsContent value="trace" className="mt-6">
            <CollapsibleSection title="Traza de Análisis" defaultOpen>
              {result.steps && <StackTraceTable steps={result.steps} />}
            </CollapsibleSection>
          </TabsContent>

          <TabsContent value="sets" className="mt-6">
            <div className="space-y-6">
              {result.firstSets && (
                <CollapsibleSection title="Conjuntos FIRST" defaultOpen>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        {Object.entries(result.firstSets).map(([symbol, set]: [string, any]) => (
                          <div key={symbol} className="flex items-start gap-3 text-sm">
                            <code className="font-bold text-primary">{symbol}:</code>
                            <code className="text-muted-foreground">
                              {'{' + Array.from(set).join(', ') + '}'}
                            </code>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </CollapsibleSection>
              )}

              {result.followSets && (
                <CollapsibleSection title="Conjuntos FOLLOW" defaultOpen>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        {Object.entries(result.followSets).map(([symbol, set]: [string, any]) => (
                          <div key={symbol} className="flex items-start gap-3 text-sm">
                            <code className="font-bold text-primary">{symbol}:</code>
                            <code className="text-muted-foreground">
                              {'{' + Array.from(set).join(', ') + '}'}
                            </code>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </CollapsibleSection>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

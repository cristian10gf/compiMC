'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GrammarInput, ParsingTable, StackTraceTable } from '@/components/analizador-sintactico';
import { CollapsibleSection } from '@/components/shared';
import { useSyntaxAnalyzer } from '@/hooks';
import { Loader2 } from 'lucide-react';
import type { Grammar, Production } from '@/lib/types';

export default function ASDClientPage() {
  const [productions, setProductions] = useState<Production[]>([
    { id: 'prod-1', left: 'S', right: ['a', 'A'] },
  ]);
  const [inputString, setInputString] = useState('');
  
  const { 
    firstFollow, 
    parsingTable, 
    parsingResult,
    isProcessing, 
    error,
    setGrammar,
    analyzeLL,
  } = useSyntaxAnalyzer();

  const handleAnalyze = async () => {
    const grammar: Grammar = {
      productions,
      startSymbol: productions[0]?.left || 'S',
      terminals: [],
      nonTerminals: [],
    };

    setGrammar(grammar);
    await analyzeLL();
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
            disabled={!productions.length || isProcessing}
            className="w-full sm:w-auto"
          >
            {isProcessing ? (
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

      {parsingTable && (
        <Tabs defaultValue="table" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="table">Tabla M</TabsTrigger>
            <TabsTrigger value="trace">Traza</TabsTrigger>
            <TabsTrigger value="sets">Conjuntos</TabsTrigger>
          </TabsList>

          <TabsContent value="table" className="mt-6">
            <CollapsibleSection title="Tabla de Análisis LL (M)" defaultOpen>
              {parsingTable && <ParsingTable table={parsingTable} />}
            </CollapsibleSection>
          </TabsContent>

          <TabsContent value="trace" className="mt-6">
            <CollapsibleSection title="Traza de Análisis" defaultOpen>
              {parsingResult?.steps && <StackTraceTable steps={parsingResult.steps} />}
            </CollapsibleSection>
          </TabsContent>

          <TabsContent value="sets" className="mt-6">
            <div className="space-y-6">
              {firstFollow && (
                <CollapsibleSection title="Conjuntos FIRST" defaultOpen>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        {firstFollow.map((ff) => (
                          <div key={ff.nonTerminal} className="flex items-start gap-3 text-sm">
                            <code className="font-bold text-primary">{ff.nonTerminal}:</code>
                            <code className="text-muted-foreground">
                              {'{' + ff.first.join(', ') + '}'}
                            </code>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </CollapsibleSection>
              )}

              {firstFollow && (
                <CollapsibleSection title="Conjuntos FOLLOW" defaultOpen>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        {firstFollow.map((ff) => (
                          <div key={ff.nonTerminal} className="flex items-start gap-3 text-sm">
                            <code className="font-bold text-primary">{ff.nonTerminal}:</code>
                            <code className="text-muted-foreground">
                              {'{' + ff.follow.join(', ') + '}'}
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

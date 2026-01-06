'use client';

import { useQueryStates } from 'nuqs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AutomataGraphCytoscape, StringRecognitionVisualizer } from '@/components/analizador-lexico';
import { SymbolSlider, commonSymbols, CollapsibleSection } from '@/components/shared';
import { useHistory, useAutomata } from '@/hooks';
import { Loader2 } from 'lucide-react';
import { reconocerSearchParams } from '@/lib/nuqs';

export default function ReconocerClientPage() {
  // Usar nuqs para manejar el estado de la URL
  const [{ regex, testString }, setParams] = useQueryStates(reconocerSearchParams);
  
  const { 
    automaton, 
    isProcessing, 
    error,
    recognitionResult,
    buildAutomaton, 
    testString: testStringFn 
  } = useAutomata();
  
  const { addEntry } = useHistory();

  const handleBuildAutomaton = async () => {
    await buildAutomaton({
      regex,
      languages: [],
      algorithm: 'afd-short', // Método del árbol sintáctico
    });
  };

  const handleRecognize = async () => {
    if (!automaton) return;

    const result = await testStringFn(testString);
    
    if (result) {
      addEntry({
        type: 'lexical-reconocer',
        input: `${regex} | ${testString}`,
        metadata: { 
          success: result.accepted,
          regex,
          testString,
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Input de Expresión Regular */}
      <Card>
        <CardHeader>
          <CardTitle>Reconocer una Cadena</CardTitle>
          <p className="text-sm text-muted-foreground">
            Construye un AFD óptimo y reconoce cadenas paso a paso
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Expresión Regular</label>
            <Input
              value={regex}
              onChange={(e) => setParams({ regex: e.target.value })}
              placeholder="Ej: (a|b)*abb"
              className="font-mono"
            />
            <SymbolSlider
              symbols={commonSymbols.regex}
              onSelect={(symbol) => setParams({ regex: regex + symbol })}
              variant="outline"
            />
          </div>

          <Button
            onClick={handleBuildAutomaton}
            disabled={!regex || isProcessing}
            className="w-full sm:w-auto"
          >
            {isProcessing && !automaton ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Construyendo...
              </>
            ) : (
              'Construir AFD'
            )}
          </Button>

          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {automaton && (
        <>
          {/* Sección colapsable: AFD Óptimo */}
          <CollapsibleSection title="AFD Óptimo" defaultOpen>
            <AutomataGraphCytoscape 
              automaton={automaton.automatonAFD} 
              highlightedPath={recognitionResult?.steps.map((s) => s.currentState) || []} 
            />
          </CollapsibleSection>

          {/* Input de cadena a reconocer (NO colapsable) */}
          <Card>
            <CardHeader>
              <CardTitle>Cadena a Reconocer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Input
                  value={testString}
                  onChange={(e) => setParams({ testString: e.target.value })}
                  placeholder="Ej: aaabbb"
                  className="font-mono"
                />
                <SymbolSlider
                  symbols={automaton.automatonAFD.alphabet}
                  onSelect={(symbol) => setParams({ testString: testString + symbol })}
                  variant="outline"
                />
              </div>

              <Button
                onClick={handleRecognize}
                disabled={testString.length === 0 || isProcessing}
                className="w-full sm:w-auto"
              >
                {isProcessing && automaton ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Reconociendo...
                  </>
                ) : (
                  'Reconocer'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Sección final: Pasos de reconocimiento con visualización */}
          {recognitionResult && (
            <StringRecognitionVisualizer
              className='h-full rounded-lg border bg-muted/20 overflow-hidden'
              key={`${testString}-${recognitionResult.accepted}`}
              automaton={automaton.automatonAFD}
              result={recognitionResult}
            />
          )}
        </>
      )}
    </div>
  );
}

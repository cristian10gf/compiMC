'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LanguageInput, AutomataGraph, StringRecognition } from '@/components/analizador-lexico';
import { SymbolSlider, commonSymbols, CollapsibleSection } from '@/components/shared';
import { buildAFDShort } from '@/lib/algorithms/lexical/afd-construction';
import { recognizeString } from '@/lib/algorithms/lexical/string-recognition';
import { buildSyntaxTree } from '@/lib/algorithms/lexical/regex-parser';
import { useHistory } from '@/lib/context';
import { Loader2 } from 'lucide-react';

export default function ReconocerClientPage() {
  const [languages, setLanguages] = useState<string[]>([]);
  const [regex, setRegex] = useState('');
  const [inputString, setInputString] = useState('');
  const [loading, setLoading] = useState(false);
  const [automaton, setAutomaton] = useState<any>(null);
  const [recognitionResult, setRecognitionResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { addEntry } = useHistory();

  const handleBuildAutomaton = async () => {
    try {
      setLoading(true);
      setError(null);

      const afd = buildAFDShort(regex);
      setAutomaton(afd);
      setRecognitionResult(null);
    } catch (err: any) {
      setError(err.message || 'Error al construir el autómata');
    } finally {
      setLoading(false);
    }
  };

  const handleRecognize = async () => {
    if (!automaton) return;

    try {
      setLoading(true);
      setError(null);

      const result = recognizeString(automaton, inputString);
      setRecognitionResult(result);

      addEntry({
        type: 'lexical',
        input: `${regex} | ${inputString}`,
        metadata: { success: result.accepted },
      });
    } catch (err: any) {
      setError(err.message || 'Error al reconocer la cadena');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Construir Autómata</CardTitle>
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
            onClick={handleBuildAutomaton}
            disabled={!regex || loading}
            className="w-full sm:w-auto"
          >
            {loading && !automaton ? (
              <>
                <Loader2 className="mr-2 animate-spin" />
                Construyendo...
              </>
            ) : (
              'Construir AFD'
            )}
          </Button>
        </CardContent>
      </Card>

      {automaton && (
        <>
          <CollapsibleSection title="AFD Óptimo" defaultOpen>
            <AutomataGraph automaton={automaton} highlightedPath={recognitionResult?.steps.map((s: any) => s.currentState) || []} />
          </CollapsibleSection>

          <Card>
            <CardHeader>
              <CardTitle>Reconocer Cadena</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Cadena a Reconocer</label>
                <Input
                  value={inputString}
                  onChange={(e) => setInputString(e.target.value)}
                  placeholder="Ej: aaaabbbb"
                  className="font-mono"
                />
                <SymbolSlider
                  symbols={automaton.alphabet}
                  onSelect={(symbol) => setInputString(prev => prev + symbol)}
                  variant="outline"
                />
              </div>

              <Button
                onClick={handleRecognize}
                disabled={!inputString || loading}
                className="w-full sm:w-auto"
              >
                {loading && automaton ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" />
                    Reconociendo...
                  </>
                ) : (
                  'Reconocer'
                )}
              </Button>

              {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
            </CardContent>
          </Card>

          {recognitionResult && (
            <StringRecognition result={recognitionResult} autoPlay />
          )}
        </>
      )}
    </div>
  );
}

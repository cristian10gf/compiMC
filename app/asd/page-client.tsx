'use client';

import { useAsdPage } from '@/hooks/use-asd-page';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CollapsibleSection } from '@/components/shared';
import {
  GrammarInputEnhanced,
  FirstFollowTable,
  GrammarTransformations,
  ParsingTable,
  StringRecognitionLL,
} from '@/components/analizador-sintactico';
import {
  Calculator,
  GitBranch,
  Table2,
  TextSearch,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export default function ASDClientPage() {
  const {
    state,
    isProcessing,
    hasAnalysis,
    testString,
    setParams,
    initialValues,
    handleAnalyze,
    handleRecognize,
  } = useAsdPage();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <GrammarInputEnhanced
        onAnalyze={handleAnalyze}
        isProcessing={isProcessing}
        initialValues={initialValues}
      />

      {hasAnalysis && state.workingGrammar && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Resultados del Análisis</h2>
            {state.ll1Check && (
              <Badge
                variant={state.ll1Check.isLL1 ? 'default' : 'destructive'}
                className="flex items-center gap-1"
              >
                {state.ll1Check.isLL1 ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" />
                    Gramática LL(1)
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-3 w-3" />
                    No es LL(1)
                  </>
                )}
              </Badge>
            )}
          </div>

          {state.ll1Check && !state.ll1Check.isLL1 && state.ll1Check.conflicts.length > 0 && (
            <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Conflictos Detectados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 text-amber-600 dark:text-amber-400">
                  {state.ll1Check.conflicts.map((conflict) => (
                    <li key={conflict} className="font-mono text-xs">• {conflict}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {state.transformation && (
            <CollapsibleSection
              title="Gramática Sin Recursividad y Factorizada"
              icon={<GitBranch className="h-5 w-5" />}
              badge={
                state.transformation.transformationSteps.filter(s => !s.startsWith('===')).length > 0 ? (
                  <Badge variant="secondary" className="text-xs">
                    {state.transformation.transformationSteps.filter(s => s.startsWith('  ')).length} cambios
                  </Badge>
                ) : undefined
              }
              defaultOpen
            >
              <GrammarTransformations
                originalGrammar={state.transformation.originalGrammar}
                transformedGrammar={state.transformation.factorized}
                transformationSteps={state.transformation.transformationSteps}
              />
            </CollapsibleSection>
          )}

          {state.firstFollow && (
            <CollapsibleSection
              title="Valores (PRIMERO y SIGUIENTE)"
              icon={<Calculator className="h-5 w-5" />}
              badge={<Badge variant="secondary" className="text-xs">{state.firstFollow.length} no terminales</Badge>}
              defaultOpen
            >
              <FirstFollowTable data={state.firstFollow} />
            </CollapsibleSection>
          )}

          {state.parsingTable && state.workingGrammar && (
            <CollapsibleSection
              title="Tabla M de Parsing"
              icon={<Table2 className="h-5 w-5" />}
              badge={
                <Badge variant="secondary" className="text-xs">
                  {state.parsingTable.entries?.filter(e => e.production).length || 0} entradas
                </Badge>
              }
              defaultOpen
            >
              <ParsingTable table={state.parsingTable} />
            </CollapsibleSection>
          )}

          {state.parsingTable && state.workingGrammar && (
            <CollapsibleSection
              title="Reconocer Cadena"
              icon={<TextSearch className="h-5 w-5" />}
              defaultOpen
            >
              <StringRecognitionLL
                onRecognize={handleRecognize}
                terminals={state.workingGrammar.terminals}
                isProcessing={isProcessing}
                value={testString}
                onChange={(value) => setParams({ testString: value })}
              />
            </CollapsibleSection>
          )}
        </div>
      )}
    </div>
  );
}

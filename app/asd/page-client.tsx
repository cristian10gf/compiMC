'use client';

/**
 * Página cliente del Analizador Sintáctico Descendente (LL)
 * 
 * Secciones:
 * 1. Input de gramática con terminales
 * 2. Valores (PRIMERO y SIGUIENTE) con reglas de cálculo
 * 3. Gramática transformada (sin recursividad izquierda, factorizada)
 * 4. Tabla M de parsing
 * 5. Reconocimiento de cadena con animación
 */

import { useCallback, useMemo, useEffect, useRef } from 'react';
import { useQueryStates } from 'nuqs';
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
import { useDescendenteAnalysis, useHistory } from '@/hooks';
import type { ParsingResult } from '@/lib/types';
import { 
  Calculator, 
  GitBranch, 
  Table2, 
  TextSearch,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { asdSearchParams } from '@/lib/nuqs';

export default function ASDClientPage() {
  // Usar nuqs para manejar el estado de la URL
  const [{ grammar, terminals, autoDetect }, setParams] = useQueryStates(asdSearchParams);
  
  const { addEntry } = useHistory();
  
  const {
    state,
    recognition,
    isProcessing,
    error,
    analyze,
    recognizeString,
    hasAnalysis,
  } = useDescendenteAnalysis();

  // Valores iniciales para el componente de gramática (siempre pasan los valores de URL)
  const initialValues = useMemo(() => ({
    grammarText: grammar,
    terminals: terminals,
    autoDetect: autoDetect,
  }), [grammar, terminals, autoDetect]);

  // Ejecutar análisis automáticamente si hay parámetros válidos en la URL (navegación desde historial)
  const hasAutoAnalyzed = useRef(false);
  
  // Resetear el flag cuando cambien los parámetros de URL
  useEffect(() => {
    hasAutoAnalyzed.current = false;
  }, [grammar, terminals, autoDetect]);
  
  useEffect(() => {
    // Solo ejecutar una vez si hay gramática válida en la URL y no se ha analizado aún
    if (grammar && grammar.trim() && !hasAutoAnalyzed.current && !hasAnalysis) {
      hasAutoAnalyzed.current = true;
      analyze({
        grammarText: grammar,
        terminals: terminals,
        autoDetectTerminals: autoDetect,
      });
    }
  }, [grammar, terminals, autoDetect, analyze, hasAnalysis]);

  /**
   * Maneja el análisis de la gramática
   */
  const handleAnalyze = useCallback(async (
    grammarText: string,
    terminalStr: string,
    autoDetectTerminals: boolean
  ) => {
    // Actualizar los parámetros de URL con los valores actuales
    setParams({
      grammar: grammarText,
      terminals: terminalStr,
      autoDetect: autoDetectTerminals,
    });
    
    const result = await analyze({
      grammarText,
      terminals: terminalStr,
      autoDetectTerminals,
    });

    // Guardar en historial con todos los inputs
    addEntry({
      type: 'syntax-ll',
      input: grammarText.split('\n')[0] + '...',
      metadata: {
        success: !error,
        grammarText,
        terminals: terminalStr,
        autoDetectTerminals,
      },
    });
  }, [analyze, addEntry, error, setParams]);

  /**
   * Maneja el reconocimiento de una cadena
   */
  const handleRecognize = useCallback(async (input: string): Promise<ParsingResult | null> => {
    return recognizeString(input);
  }, [recognizeString]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Input de gramática */}
      <GrammarInputEnhanced
        onAnalyze={handleAnalyze}
        isProcessing={isProcessing}
        initialValues={initialValues}
      />

      {/* Error */}
      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Resultados */}
      {hasAnalysis && state.workingGrammar && (
        <div className="space-y-4">
          {/* Encabezado de resultados */}
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

          {/* Conflictos si los hay */}
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
                  {state.ll1Check.conflicts.map((conflict, idx) => (
                    <li key={idx} className="font-mono text-xs">
                      • {conflict}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Sección 1: Gramática Transformada */}
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

          {/* Sección 2: Valores (PRIMERO y SIGUIENTE) */}
          {state.firstFollow && (
            <CollapsibleSection
              title="Valores (PRIMERO y SIGUIENTE)"
              icon={<Calculator className="h-5 w-5" />}
              badge={
                <Badge variant="secondary" className="text-xs">
                  {state.firstFollow.length} no terminales
                </Badge>
              }
              defaultOpen
            >
              <FirstFollowTable data={state.firstFollow} />
            </CollapsibleSection>
          )}

          {/* Sección 3: Tabla M */}
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
              <ParsingTable 
                table={state.parsingTable}
              />
            </CollapsibleSection>
          )}

          {/* Sección 4: Reconocimiento de Cadena */}
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
              />
            </CollapsibleSection>
          )}
        </div>
      )}
    </div>
  );
}

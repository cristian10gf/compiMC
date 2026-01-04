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

import { useState, useCallback } from 'react';
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
  parseGrammarText,
  transformGrammar,
  generateFirstFollowWithRules,
  buildParsingTable,
  parseStringLL,
  isLL1,
  type FirstFollowWithRules,
  type GrammarTransformation,
} from '@/lib/algorithms/syntax/descendente';
import type { Grammar, ParsingTable as ParsingTableType, ParsingResult } from '@/lib/types';
import { 
  Calculator, 
  GitBranch, 
  Table2, 
  TextSearch,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export default function ASDClientPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estado del análisis
  const [grammar, setGrammar] = useState<Grammar | null>(null);
  const [transformation, setTransformation] = useState<GrammarTransformation | null>(null);
  const [firstFollow, setFirstFollow] = useState<FirstFollowWithRules[] | null>(null);
  const [parsingTable, setParsingTable] = useState<ParsingTableType | null>(null);
  const [isLL1Grammar, setIsLL1Grammar] = useState<{ isLL1: boolean; conflicts: string[] } | null>(null);

  /**
   * Maneja el análisis de la gramática
   */
  const handleAnalyze = useCallback(async (
    grammarText: string,
    terminals: string,
    autoDetect: boolean
  ) => {
    setIsProcessing(true);
    setError(null);

    try {
      // 1. Parsear la gramática
      const parsedGrammar = parseGrammarText(grammarText, terminals, autoDetect);
      
      if (parsedGrammar.productions.length === 0) {
        throw new Error('No se pudieron parsear las producciones. Verifica el formato.');
      }

      setGrammar(parsedGrammar);

      // 2. Transformar la gramática (eliminar recursividad, factorizar)
      const grammarTransformation = transformGrammar(parsedGrammar);
      setTransformation(grammarTransformation);

      // Usar la gramática transformada para los siguientes cálculos
      const workingGrammar = grammarTransformation.factorized;

      // 3. Calcular PRIMERO y SIGUIENTE con reglas
      const firstFollowData = generateFirstFollowWithRules(workingGrammar);
      setFirstFollow(firstFollowData);

      // 4. Construir la tabla M
      const table = buildParsingTable(workingGrammar);
      setParsingTable(table);

      // 5. Verificar si es LL(1)
      const ll1Check = isLL1(workingGrammar);
      setIsLL1Grammar(ll1Check);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al analizar la gramática';
      setError(errorMessage);
      // Limpiar estado en caso de error
      setGrammar(null);
      setTransformation(null);
      setFirstFollow(null);
      setParsingTable(null);
      setIsLL1Grammar(null);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Maneja el reconocimiento de una cadena
   */
  const handleRecognize = useCallback(async (input: string): Promise<ParsingResult | null> => {
    if (!transformation?.factorized || !parsingTable) {
      setError('Primero debes analizar una gramática');
      return null;
    }

    try {
      const result = parseStringLL(transformation.factorized, parsingTable, input);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al reconocer la cadena';
      setError(errorMessage);
      return null;
    }
  }, [transformation, parsingTable]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Input de gramática */}
      <GrammarInputEnhanced
        onAnalyze={handleAnalyze}
        isProcessing={isProcessing}
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
      {grammar && (
        <div className="space-y-4">
          {/* Encabezado de resultados */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Resultados del Análisis</h2>
            {isLL1Grammar && (
              <Badge
                variant={isLL1Grammar.isLL1 ? 'default' : 'destructive'}
                className="flex items-center gap-1"
              >
                {isLL1Grammar.isLL1 ? (
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
          {isLL1Grammar && !isLL1Grammar.isLL1 && isLL1Grammar.conflicts.length > 0 && (
            <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Conflictos Detectados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 text-amber-600 dark:text-amber-400">
                  {isLL1Grammar.conflicts.map((conflict, idx) => (
                    <li key={idx} className="font-mono text-xs">
                      • {conflict}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Sección 1: Gramática Transformada */}
          {transformation && (
            <CollapsibleSection
              title="Gramática Sin Recursividad y Factorizada"
              icon={<GitBranch className="h-5 w-5" />}
              badge={
                transformation.transformationSteps.filter(s => !s.startsWith('===')).length > 0 ? (
                  <Badge variant="secondary" className="text-xs">
                    {transformation.transformationSteps.filter(s => s.startsWith('  ')).length} cambios
                  </Badge>
                ) : undefined
              }
              defaultOpen
            >
              <GrammarTransformations
                originalGrammar={transformation.originalGrammar}
                transformedGrammar={transformation.factorized}
                transformationSteps={transformation.transformationSteps}
              />
            </CollapsibleSection>
          )}

          {/* Sección 2: Valores (PRIMERO y SIGUIENTE) */}
          {firstFollow && (
            <CollapsibleSection
              title="Valores (PRIMERO y SIGUIENTE)"
              icon={<Calculator className="h-5 w-5" />}
              badge={
                <Badge variant="secondary" className="text-xs">
                  {firstFollow.length} no terminales
                </Badge>
              }
              defaultOpen
            >
              <FirstFollowTable data={firstFollow} />
            </CollapsibleSection>
          )}

          {/* Sección 3: Tabla M */}
          {parsingTable && (
            <CollapsibleSection
              title="Tabla M de Parsing"
              icon={<Table2 className="h-5 w-5" />}
              badge={
                <Badge variant="secondary" className="text-xs">
                  {parsingTable.entries?.filter(e => e.production).length || 0} entradas
                </Badge>
              }
              defaultOpen
            >
              <ParsingTable table={parsingTable} />
            </CollapsibleSection>
          )}

          {/* Sección 4: Reconocimiento de Cadena */}
          {parsingTable && (
            <CollapsibleSection
              title="Reconocer Cadena"
              icon={<TextSearch className="h-5 w-5" />}
              defaultOpen
            >
              <StringRecognitionLL
                onRecognize={handleRecognize}
                isProcessing={isProcessing}
              />
            </CollapsibleSection>
          )}
        </div>
      )}
    </div>
  );
}

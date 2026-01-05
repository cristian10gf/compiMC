'use client';

/**
 * Página cliente del Analizador Sintáctico Ascendente (ASA)
 * 
 * Implementa análisis por precedencia de operadores y análisis LR con:
 * 1. Input de gramática con terminales
 * 2. Selector de método (LR / Precedencia)
 * 3. Para Precedencia: Validación, tabla de precedencia, reconocimiento
 * 4. Para LR: AFN, SLR, LR canónico, LALR, reconocimiento
 */

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CollapsibleSection, SegmentedControl } from '@/components/shared';
import { 
  GrammarInputASA,
  PrecedenceTable,
  PrecedenceSteps,
  StringRecognitionPrecedence,
  LRAnalysisSection,
} from '@/components/analizador-sintactico';
import { useAscendenteAnalysis, useHistory } from '@/hooks';
import type { PrecedenceStep, Grammar, PrecedenceTable as PrecedenceTableType, ParsingResult } from '@/lib/types';
import type { LRAnalysisType } from '@/lib/types/syntax-analysis';
import { 
  CheckCircle2, 
  AlertTriangle,
  Settings,
  Table2,
  TextSearch,
  ShieldCheck,
  BarChart3,
} from 'lucide-react';

// Opciones del selector de método
const METHOD_OPTIONS = [
  { value: 'precedence', label: 'Precedencia' },
  { value: 'lr', label: 'LR' },
];

export default function ASAClientPage() {
  const searchParams = useSearchParams();
  const { addEntry } = useHistory();
  
  // Estado del hook de análisis
  const {
    state,
    isProcessing,
    error,
    analyze,
    analyzeLR,
    recognizeString,
    recognizeStringLR,
    setLRType,
    updatePrecedenceTable,
    hasAnalysis,
  } = useAscendenteAnalysis();

  // Estado local para UI
  const [method, setMethod] = useState('precedence');
  const [isAutomatic, setIsAutomatic] = useState(true);
  const [testString, setTestString] = useState('');
  const [localSteps, setLocalSteps] = useState<PrecedenceStep[] | null>(null);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; errors: string[] } | null>(null);
  const [localGrammar, setLocalGrammar] = useState<Grammar | null>(null);
  
  // Estado para valores iniciales del historial
  const [initialValues, setInitialValues] = useState<{
    grammarText?: string;
    terminals?: string;
  } | undefined>(undefined);
  const [isInitialized, setIsInitialized] = useState(false);

  // Restaurar estado desde URL al montar
  useEffect(() => {
    if (isInitialized) return;
    
    const grammarParam = searchParams.get('grammar');
    const terminalsParam = searchParams.get('terminals');
    const methodParam = searchParams.get('method');
    const lrTypeParam = searchParams.get('lrType');
    
    if (grammarParam || terminalsParam) {
      setInitialValues({
        grammarText: grammarParam ? decodeURIComponent(grammarParam) : undefined,
        terminals: terminalsParam || undefined,
      });
    }
    if (methodParam === 'precedence' || methodParam === 'lr') {
      setMethod(methodParam);
    }
    if (lrTypeParam === 'SLR' || lrTypeParam === 'LR1' || lrTypeParam === 'LALR') {
      setLRType(lrTypeParam);
    }
    
    setIsInitialized(true);
  }, [searchParams, isInitialized, setLRType]);

  /**
   * Maneja el análisis inicial de la gramática
   */
  const handleAnalyze = useCallback(async (
    grammarText: string,
    terminals: string
  ) => {
    // Limpiar estados previos
    setLocalSteps(null);
    setValidationResult(null);
    setTestString('');

    if (method === 'precedence') {
      // Analizar con precedencia de operadores
      await analyze({
        grammarText,
        terminals,
        mode: 'automatic',
        autoDetectTerminals: false,
      });
      
      // Guardar en historial
      addEntry({
        type: 'syntax-precedence',
        input: grammarText.split('\n')[0] + '...',
        metadata: {
          success: !error,
          grammarText,
          terminals,
          method: 'precedence',
        },
      });
    } else {
      // Analizar con LR
      await analyzeLR({
        grammarText,
        terminals,
        autoDetectTerminals: false,
      });
      
      // Guardar en historial
      addEntry({
        type: 'syntax-lr',
        input: grammarText.split('\n')[0] + '...',
        metadata: {
          success: !error,
          grammarText,
          terminals,
          method: 'lr',
          lrType: state.lrAnalysis?.selectedType?.toLowerCase() as 'slr' | 'lr1' | 'lalr' | undefined,
        },
      });
    }
  }, [analyze, analyzeLR, method, addEntry, error, state.lrAnalysis?.selectedType]);

  /**
   * Efecto para actualizar estados locales cuando cambia el análisis
   */
  useEffect(() => {
    if (state.grammar) {
      setLocalGrammar(state.grammar);
      setValidationResult(state.operatorValidation);
    }
  }, [state.grammar, state.operatorValidation]);

  /**
   * Maneja el cambio de modo (automático/manual)
   */
  const handleModeChange = useCallback((automatic: boolean) => {
    setIsAutomatic(automatic);
    setTestString('');
    setLocalSteps(null);
  }, []);

  /**
   * Maneja la generación de pasos de precedencia
   */
  const handleGenerateSteps = useCallback((steps: PrecedenceStep[], table?: PrecedenceTableType) => {
    setLocalSteps(steps);
    if (table) {
      updatePrecedenceTable(table, steps);
    }
  }, [updatePrecedenceTable]);

  /**
   * Maneja el reconocimiento de cadenas (precedencia)
   */
  const handleRecognize = useCallback(async (input: string) => {
    return recognizeString(input, state.precedenceTable || undefined);
  }, [recognizeString, state.precedenceTable]);

  /**
   * Maneja el reconocimiento de cadenas (LR)
   */
  const handleRecognizeLR = useCallback(async (input: string, type: LRAnalysisType): Promise<ParsingResult | null> => {
    return recognizeStringLR(input, type);
  }, [recognizeStringLR]);

  /**
   * Maneja el cambio de tipo de LR
   */
  const handleLRTypeChange = useCallback((type: LRAnalysisType) => {
    setLRType(type);
  }, [setLRType]);

  // Verificar si hay análisis LR disponible
  const hasLRAnalysis = state.lrAnalysis !== null;
  const hasPrecedenceAnalysis = state.precedenceTable !== null || state.operatorValidation !== null;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Selector de método - antes del input */}
      <div className="flex justify-center">
        <SegmentedControl
          options={METHOD_OPTIONS}
          value={method}
          onChange={setMethod}
        />
      </div>

      {/* Input de gramática */}
      <GrammarInputASA
        onAnalyze={handleAnalyze}
        isProcessing={isProcessing}
        initialValues={initialValues}
      />

      {/* Error global */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Contenido según el método seleccionado */}
      {method === 'precedence' && hasPrecedenceAnalysis && (
        <div className="space-y-4">
          {/* Sección 1: Validación de Gramática de Operadores */}
          <CollapsibleSection
            title="Validación de Gramática"
            icon={<ShieldCheck className="h-5 w-5" />}
            badge={
              validationResult && (
                <Badge
                  variant={validationResult.valid ? 'default' : 'destructive'}
                  className="flex items-center gap-1"
                >
                  {validationResult.valid ? (
                    <>
                      <CheckCircle2 className="h-3 w-3" />
                      Válida
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-3 w-3" />
                      Inválida
                    </>
                  )}
                </Badge>
              )
            }
            defaultOpen
          >
            <div className="space-y-4">
              {validationResult?.valid ? (
                <Alert className="border-green-500/20 bg-green-500/10">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-700 dark:text-green-400">
                    Gramática de Operadores Válida
                  </AlertTitle>
                  <AlertDescription className="text-green-600 dark:text-green-400">
                    La gramática cumple con los requisitos para el análisis por precedencia de operadores:
                    <ul className="mt-2 list-disc list-inside text-sm">
                      <li>No hay producciones vacías (ε)</li>
                      <li>No hay no terminales adyacentes</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Gramática No Válida</AlertTitle>
                  <AlertDescription>
                    La gramática no cumple con los requisitos:
                    <ul className="mt-2 list-disc list-inside text-sm">
                      {validationResult?.errors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Información de la gramática */}
              {localGrammar && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Terminales</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1.5">
                        {localGrammar.terminals.map((t, idx) => (
                          <Badge key={idx} variant="secondary" className="font-mono">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">No Terminales</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1.5">
                        {localGrammar.nonTerminals.map((nt, idx) => (
                          <Badge key={idx} variant="outline" className="font-mono">
                            {nt}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* Sección 2: Configuración de Análisis (solo si gramática es válida) */}
          {validationResult?.valid && localGrammar && (
            <CollapsibleSection
              title="Construcción de Tabla de Precedencia"
              icon={<Settings className="h-5 w-5" />}
              badge={
                localSteps && (
                  <Badge variant="secondary" className="text-xs">
                    {localSteps.length} pasos
                  </Badge>
                )
              }
            >
              <PrecedenceSteps
                grammar={localGrammar}
                steps={localSteps}
                testString={testString}
                isAutomatic={isAutomatic}
                onModeChange={handleModeChange}
                onTestStringChange={setTestString}
                onGenerateSteps={handleGenerateSteps}
                isProcessing={isProcessing}
              />
            </CollapsibleSection>
          )}

          {/* Sección 3: Tabla de Precedencia */}
          {state.precedenceTable && (
            <CollapsibleSection
              title="Tabla de Precedencia"
              icon={<Table2 className="h-5 w-5" />}
              badge={
                <Badge variant="secondary" className="text-xs">
                  {state.precedenceTable.symbols.length}×{state.precedenceTable.symbols.length}
                </Badge>
              }
              defaultOpen
            >
              <PrecedenceTable table={state.precedenceTable} />
            </CollapsibleSection>
          )}

          {/* Sección 4: Reconocimiento de Cadenas */}
          {state.precedenceTable && localGrammar && (
            <CollapsibleSection
              title="Reconocer Cadena"
              icon={<TextSearch className="h-5 w-5" />}
              defaultOpen
            >
              <StringRecognitionPrecedence
                onRecognize={handleRecognize}
                terminals={localGrammar.terminals}
                isProcessing={isProcessing}
              />
            </CollapsibleSection>
          )}
        </div>
      )}

      {/* Contenido LR */}
      {method === 'lr' && hasLRAnalysis && state.lrAnalysis && state.grammar && (
        <LRAnalysisSection
          grammar={state.grammar}
          slr={state.lrAnalysis.slr}
          lr1={state.lrAnalysis.lr1}
          lalr={state.lrAnalysis.lalr}
          selectedType={state.lrAnalysis.selectedType}
          onTypeChange={handleLRTypeChange}
          onRecognize={handleRecognizeLR}
          isProcessing={isProcessing}
        />
      )}

      {/* Mensaje cuando no hay análisis */}
      {!hasAnalysis && !hasPrecedenceAnalysis && !hasLRAnalysis && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold">Análisis Sintáctico Ascendente</h3>
                <p className="text-muted-foreground">
                  Ingresa una gramática para comenzar el análisis.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

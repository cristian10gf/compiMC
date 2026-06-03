'use client';

import { useAsaPage } from '@/hooks/use-asa-page';
import { Card, CardContent } from '@/components/ui/card';
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
import {
  CheckCircle2,
  AlertTriangle,
  Settings,
  Table2,
  TextSearch,
  ShieldCheck,
  BarChart3,
} from 'lucide-react';

const METHOD_OPTIONS = [
  { value: 'precedence', label: 'Precedencia' },
  { value: 'lr', label: 'LR' },
];

export default function ASAClientPage() {
  const {
    state,
    isProcessing,
    error,
    hasAnalysis,
    method,
    testString,
    setParams,
    initialValues,
    isAutomatic,
    localSteps,
    localGrammar,
    validationResult,
    hasLRAnalysis,
    hasPrecedenceAnalysis,
    handleAnalyze,
    handleModeChange,
    handleGenerateSteps,
    handleRecognize,
    handleTestStringChange,
    handleRecognizeLR,
    handleLRTypeChange,
  } = useAsaPage();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex justify-center">
        <SegmentedControl
          options={METHOD_OPTIONS}
          value={method}
          onChange={(value) => setParams({ method: value as 'precedence' | 'lr' })}
        />
      </div>

      <GrammarInputASA
        key={`grammar-input-${initialValues.grammarText}-${initialValues.terminals}`}
        onAnalyze={handleAnalyze}
        isProcessing={isProcessing}
        initialValues={initialValues}
      />

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {method === 'precedence' && hasPrecedenceAnalysis && (
        <div className="space-y-4">
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
                    <><CheckCircle2 className="h-3 w-3" />Válida</>
                  ) : (
                    <><AlertTriangle className="h-3 w-3" />Inválida</>
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
                      {validationResult?.errors.map((err) => (
                        <li key={err}>{err}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {localGrammar && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="rounded-lg border bg-card p-4">
                    <p className="text-sm font-medium mb-2">Terminales</p>
                    <div className="flex flex-wrap gap-1.5">
                      {localGrammar.terminals.map((t) => (
                        <Badge key={t} variant="secondary" className="font-mono">{t}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg border bg-card p-4">
                    <p className="text-sm font-medium mb-2">No Terminales</p>
                    <div className="flex flex-wrap gap-1.5">
                      {localGrammar.nonTerminals.map((nt) => (
                        <Badge key={nt} variant="outline" className="font-mono">{nt}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CollapsibleSection>

          {validationResult?.valid && localGrammar && (
            <CollapsibleSection
              title="Construcción de Tabla de Precedencia"
              icon={<Settings className="h-5 w-5" />}
              badge={
                localSteps && (
                  <Badge variant="secondary" className="text-xs">{localSteps.length} pasos</Badge>
                )
              }
            >
              <PrecedenceSteps
                grammar={localGrammar}
                steps={localSteps}
                testString={testString}
                isAutomatic={isAutomatic}
                onModeChange={handleModeChange}
                onTestStringChange={handleTestStringChange}
                onGenerateSteps={handleGenerateSteps}
                isProcessing={isProcessing}
              />
            </CollapsibleSection>
          )}

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
                value={testString}
                onChange={(value) => setParams({ testString: value })}
              />
            </CollapsibleSection>
          )}
        </div>
      )}

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
          value={testString}
          onValueChange={(value) => setParams({ testString: value })}
        />
      )}

      {!hasAnalysis && !hasPrecedenceAnalysis && !hasLRAnalysis && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold">Análisis Sintáctico Ascendente</h3>
                <p className="text-muted-foreground">Ingresa una gramática para comenzar el análisis.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

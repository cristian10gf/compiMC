'use client';

import { useGeneralPage } from '@/hooks/use-general-page';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  TokensTable,
  CodeTable,
  OptimizationTable,
  SyntaxTreeGraph,
  CustomTokensEditor,
} from '@/components/general';
import { CollapsibleSection, SegmentedControl } from '@/components/shared';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function GeneralClientPage() {
  const {
    sourceCode,
    setSourceCode,
    result,
    isProcessing,
    error,
    activeTab,
    setActiveTab,
    customTokens,
    setCustomTokens,
    handleCompile,
  } = useGeneralPage();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Código Fuente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Expresión o Programa</label>
            <textarea
              value={sourceCode}
              onChange={(e) => setSourceCode(e.target.value)}
              placeholder="Ej: a = b + c * d"
              className="w-full min-h-12 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
            />
          </div>

          <CollapsibleSection title="Definición de Tokens Personalizados" defaultOpen={false}>
            <Card>
              <CardContent className="pt-4">
                <CustomTokensEditor tokens={customTokens} onChange={setCustomTokens} />
              </CardContent>
            </Card>
          </CollapsibleSection>

          <Button
            onClick={handleCompile}
            disabled={!sourceCode || isProcessing}
            className="w-full sm:w-auto"
          >
            {isProcessing ? (
              <><Loader2 className="mr-2 animate-spin" />Compilando…</>
            ) : (
              'Compilar'
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
        <div className="w-full space-y-6">
          <SegmentedControl
            options={[
              { value: 'analysis', label: 'Análisis' },
              { value: 'synthesis', label: 'Síntesis' },
            ]}
            value={activeTab}
            onChange={(value) => setActiveTab(value as 'analysis' | 'synthesis')}
          />

          {activeTab === 'analysis' && (
            <div className="space-y-6">
              {result.lexical?.tokens?.length > 0 && (
                <CollapsibleSection title="Análisis Léxico - Tokens" defaultOpen>
                  <TokensTable tokens={result.lexical.tokens} />
                </CollapsibleSection>
              )}

              {result.syntaxTree ? (
                <CollapsibleSection title="Análisis Sintáctico" defaultOpen>
                  <Card>
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex items-center gap-2 p-3 rounded-md bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-medium text-green-900 dark:text-green-100">
                          Se pudo crear el árbol sintáctico correctamente
                        </span>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Árbol de precedencia de operadores aritméticos
                        </p>
                        <SyntaxTreeGraph tree={result.syntaxTree} />
                      </div>
                    </CardContent>
                  </Card>
                </CollapsibleSection>
              ) : (
                result.lexical?.tokens?.length > 0 && (
                  <CollapsibleSection title="Análisis Sintáctico" defaultOpen>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                          <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                          <span className="text-sm font-medium text-red-900 dark:text-red-100">
                            No se pudo crear el árbol sintáctico
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </CollapsibleSection>
                )
              )}

              {result.semanticTree && (
                <CollapsibleSection title="Análisis Semántico" defaultOpen>
                  <Card>
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex items-center gap-2 p-3 rounded-md bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-green-900 dark:text-green-100">
                            Transformación Semántica
                          </p>
                          <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                            Conversión de números a tipo real: entReal(n) excepto exponentes
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-green-600">aplicado</span>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Árbol con transformaciones semánticas
                        </p>
                        <SyntaxTreeGraph tree={result.semanticTree} />
                      </div>
                    </CardContent>
                  </Card>
                </CollapsibleSection>
              )}

              {result.errors?.length > 0 && (
                <CollapsibleSection title="Errores de Compilación" defaultOpen>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        {result.errors.map((err: any) => (
                          <div
                            key={`${err.phase}:${err.message}`}
                            className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm"
                          >
                            <p className="font-medium text-destructive">{err.phase}: {err.severity}</p>
                            <p className="text-destructive/80 mt-1">{err.message}</p>
                            {err.line && (
                              <p className="text-destructive/60 text-xs mt-1">Línea {err.line}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </CollapsibleSection>
              )}
            </div>
          )}

          {activeTab === 'synthesis' && (
            <div className="space-y-6">
              {result.errors?.length > 0 && (
                <CollapsibleSection title="Errores de Compilación" defaultOpen>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        {result.errors.map((err: any) => (
                          <div
                            key={`${err.phase}:${err.message}`}
                            className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm"
                          >
                            <p className="font-medium text-destructive">{err.phase}: {err.severity}</p>
                            <p className="text-destructive/80 mt-1">{err.message}</p>
                            {err.line && (
                              <p className="text-destructive/60 text-xs mt-1">Línea {err.line}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </CollapsibleSection>
              )}

              {result.intermediateCode?.length > 0 && (
                <CollapsibleSection title="Generacion de Código Intermedio" defaultOpen>
                  <CodeTable
                    instructions={result.intermediateCode.map((inst: any) => ({
                      instruction: inst.instruction,
                    }))}
                    title="Código Intermedio"
                  />
                </CollapsibleSection>
              )}

              {result.optimization?.length > 0 && (
                <CollapsibleSection
                  title="Optimización"
                  defaultOpen
                  className="space-y-4 content-between"
                >
                  <OptimizationTable steps={result.optimization} />
                  <div className="mt-6">
                    <CollapsibleSection title="Código Optimizado final" defaultOpen>
                      <CodeTable
                        instructions={result.optimization
                          .filter((inst: any) => inst.action !== 'Eliminado')
                          .map((inst: any) => ({ instruction: inst.instruction }))}
                        title="Código Optimizado"
                      />
                    </CollapsibleSection>
                  </div>
                </CollapsibleSection>
              )}

              {result.objectCode?.length > 0 && (
                <CollapsibleSection title="Código Objeto (Ensamblador)" defaultOpen>
                  <CodeTable
                    instructions={result.objectCode.map((inst: any) => ({
                      instruction: inst.instruction,
                    }))}
                    title="Código Ensamblador"
                  />
                </CollapsibleSection>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

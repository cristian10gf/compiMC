'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TokensTable, CodeTable, OptimizationTable } from '@/components/general';
import { SyntaxTreeVisual } from '@/components/analizador-lexico';
import { CollapsibleSection, SegmentedControl } from '@/components/shared';
import { useCompilerFull } from '@/hooks';
import { Loader2 } from 'lucide-react';

export default function GeneralClientPage() {
  const [activeTab, setActiveTab] = useState<'analysis' | 'synthesis'>('analysis');
  
  const { 
    sourceCode,
    result, 
    isProcessing, 
    error,
    setSourceCode,
    compile: compileCode,
  } = useCompilerFull();

  const handleCompile = async () => {
    await compileCode(activeTab === 'analysis' ? 'analisis' : 'sintesis');
  };

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
              className="w-full min-h-32 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
            />
          </div>

          <Button
            onClick={handleCompile}
            disabled={!sourceCode || isProcessing}
            className="w-full sm:w-auto"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 animate-spin" />
                Compilando...
              </>
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
              { value: 'synthesis', label: 'Síntesis' }
            ]}
            value={activeTab}
            onChange={(value) => setActiveTab(value as 'analysis' | 'synthesis')}
          />

          {activeTab === 'analysis' && (
            <div className="space-y-6">
              {result.lexical && result.lexical.tokens && result.lexical.tokens.length > 0 && (
                <CollapsibleSection title="Análisis Léxico - Tokens" defaultOpen>
                  <TokensTable tokens={result.lexical.tokens} />
                </CollapsibleSection>
              )}

              {result.errors && result.errors.length > 0 && (
                <CollapsibleSection title="Errores de Compilación" defaultOpen>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        {result.errors.map((error: any, idx: number) => (
                          <div key={idx} className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm">
                            <p className="font-medium text-destructive">{error.phase}: {error.severity}</p>
                            <p className="text-destructive/80 mt-1">{error.message}</p>
                            {error.line && (
                              <p className="text-destructive/60 text-xs mt-1">Línea {error.line}</p>
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
              {result.intermediateCode && result.intermediateCode.length > 0 && (
                <CollapsibleSection title="Código Intermedio (3 Direcciones)" defaultOpen>
                  <CodeTable
                    instructions={result.intermediateCode.map((inst: any) => ({ instruction: inst.instruction }))}
                    title="Código de 3 Direcciones"
                  />
                </CollapsibleSection>
              )}

              {result.optimization && result.optimization.length > 0 && (
                <CollapsibleSection title="Optimización de Código" defaultOpen>
                  <OptimizationTable steps={result.optimization as any} />
                </CollapsibleSection>
              )}

              {result.optimization && result.optimization.length > 0 && (
                <CollapsibleSection title="Código Optimizado" defaultOpen>
                  <CodeTable
                    instructions={result.optimization.map((inst: any) => ({ instruction: inst.instruction }))}
                    title="Código Optimizado"
                  />
                </CollapsibleSection>
              )}

              {result.objectCode && result.objectCode.length > 0 && (
                <CollapsibleSection title="Código Objeto (Ensamblador)" defaultOpen>
                  <CodeTable
                    instructions={result.objectCode.map((inst: any) => ({ instruction: inst.instruction }))}
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

'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { TokensTable, CodeTable, OptimizationTable } from '@/components/general';
import { SyntaxTreeVisual } from '@/components/analizador-lexico';
import { CollapsibleSection, SegmentedControl } from '@/components/shared';
import { useCompilerFull } from '@/hooks';
import { createCustomTokenPatterns } from '@/lib/algorithms/general/compiler';
import { Loader2, Plus, X } from 'lucide-react';

interface CustomToken {
  id: string;
  symbol: string;
  regex: string;
}

export default function GeneralClientPage() {
  const [activeTab, setActiveTab] = useState<'analysis' | 'synthesis'>('analysis');
  const [customTokens, setCustomTokens] = useState<CustomToken[]>([]);
  
  const { 
    sourceCode,
    result, 
    isProcessing, 
    error,
    setSourceCode,
    compile: compileCode,
  } = useCompilerFull();

  const addCustomToken = () => {
    setCustomTokens([...customTokens, { id: Date.now().toString(), symbol: '', regex: '' }]);
  };

  const removeCustomToken = (id: string) => {
    setCustomTokens(customTokens.filter(token => token.id !== id));
  };

  // Convertir tokens personalizados a patrones
  const customPatterns = useMemo(() => {
    return createCustomTokenPatterns(customTokens);
  }, [customTokens]);

  const handleCompile = async () => {
    await compileCode(activeTab === 'analysis' ? 'analisis' : 'sintesis', customPatterns);
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
              className="w-full min-h-12 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
            />
          </div>

          <CollapsibleSection 
            title="Definición de Tokens Personalizados" 
            defaultOpen={false}
          >
            <Card>
              <CardContent className="pt-4 space-y-4">
                {/* Formulario de entrada horizontal */}
                <div className="flex items-end gap-2">
                  <div className="flex-1 space-y-1">
                    <label className="text-xs text-muted-foreground">Símbolo</label>
                    <Input
                      id="new-symbol"
                      placeholder="*"
                      className="h-8 font-mono text-xs"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          addCustomToken();
                        }
                      }}
                    />
                  </div>
                  <div className="flex-2 space-y-1">
                    <label className="text-xs text-muted-foreground">Regex (opcional)</label>
                    <Input
                      id="new-regex"
                      placeholder="Vacío = texto exacto"
                      className="h-8 font-mono text-xs"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          addCustomToken();
                        }
                      }}
                    />
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      const symbolInput = document.getElementById('new-symbol') as HTMLInputElement;
                      const regexInput = document.getElementById('new-regex') as HTMLInputElement;
                      
                      if (symbolInput?.value.trim()) {
                        setCustomTokens([...customTokens, { 
                          id: Date.now().toString(), 
                          symbol: symbolInput.value, 
                          regex: regexInput?.value || '' 
                        }]);
                        symbolInput.value = '';
                        regexInput.value = '';
                        symbolInput.focus();
                      }
                    }}
                    className="h-8"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {/* Lista de tokens como badges horizontales */}
                {customTokens.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Tokens agregados:</p>
                    <div className="flex flex-wrap gap-2">
                      {customTokens.map((token) => (
                        <div 
                          key={token.id} 
                          className="inline-flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-1.5 text-xs"
                        >
                          <code className="font-mono font-semibold">{token.symbol}</code>
                          {token.regex && (
                            <>
                              <span className="text-muted-foreground">→</span>
                              <code className="font-mono text-muted-foreground">{token.regex}</code>
                            </>
                          )}
                          <button
                            onClick={() => removeCustomToken(token.id)}
                            className="ml-1 rounded-sm hover:bg-muted p-0.5 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {customTokens.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    Sin regex, el token detecta el texto exacto del símbolo
                  </p>
                )}
              </CardContent>
            </Card>
          </CollapsibleSection>

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

'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQueryStates } from 'nuqs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { TokensTable, CodeTable, OptimizationTable, SyntaxTreeGraph } from '@/components/general';
import { CollapsibleSection, SegmentedControl } from '@/components/shared';
import { useCompilerFull, useHistory } from '@/hooks';
import { createCustomTokenPatterns } from '@/lib/algorithms/general/compiler';
import { Loader2, Plus, X, CheckCircle2, XCircle } from 'lucide-react';
import { compilerSearchParams } from '@/lib/nuqs';

interface CustomToken {
  id: string;
  symbol: string;
  regex: string;
}

export default function GeneralClientPage() {
  // Usar nuqs para manejar el estado de la URL
  const [{ code, tokens: tokensJson }, setParams] = useQueryStates(compilerSearchParams);
  
  const { addEntry } = useHistory();
  
  const [activeTab, setActiveTab] = useState<'analysis' | 'synthesis'>('analysis');
  
  // Parsear tokens desde JSON
  const [customTokens, setCustomTokens] = useState<CustomToken[]>([]);
  
  // Sincronizar customTokens desde URL al montar
  useEffect(() => {
    if (tokensJson) {
      try {
        const parsedTokens = JSON.parse(tokensJson);
        setCustomTokens(parsedTokens.map((t: { symbol: string; regex: string }, idx: number) => ({
          id: `${Date.now()}-${idx}`,
          symbol: t.symbol,
          regex: t.regex,
        })));
      } catch {
        // Ignorar errores de parseo
      }
    }
  }, []); // Solo al montar
  
  const { 
    sourceCode,
    result, 
    isProcessing, 
    error,
    setSourceCode,
    compile: compileCode,
  } = useCompilerFull();

  // Sincronizar code desde URL al montar
  useEffect(() => {
    if (code) {
      setSourceCode(code);
    }
  }, []); // Solo al montar

  const addCustomToken = () => {
    const newTokens = [...customTokens, { id: Date.now().toString(), symbol: '', regex: '' }];
    setCustomTokens(newTokens);
  };

  const removeCustomToken = (id: string) => {
    const newTokens = customTokens.filter(token => token.id !== id);
    setCustomTokens(newTokens);
  };

  // Convertir tokens personalizados a patrones
  const customPatterns = useMemo(() => {
    return createCustomTokenPatterns(customTokens);
  }, [customTokens]);

  const handleCompile = async () => {
    // Actualizar URL con los valores actuales
    setParams({
      code: sourceCode,
      tokens: customTokens.length > 0 
        ? JSON.stringify(customTokens.map(t => ({ symbol: t.symbol, regex: t.regex })))
        : null,
    });
    
    await compileCode(customPatterns);
    
    // Guardar en historial
    addEntry({
      type: 'compiler',
      input: sourceCode.substring(0, 50) + (sourceCode.length > 50 ? '...' : ''),
      metadata: {
        success: !error,
        sourceCode,
        customTokens: customTokens.length > 0 
          ? customTokens.map(t => ({ symbol: t.symbol, regex: t.regex }))
          : undefined,
      },
    });
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

              {/* Análisis Sintáctico */}
              {result.syntaxTree && (
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
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground">
                            Árbol de precedencia de operadores aritméticos
                          </p>
                        </div>
                        <SyntaxTreeGraph tree={result.syntaxTree} />
                      </div>
                    </CardContent>
                  </Card>
                </CollapsibleSection>
              )}

              {/* Si no se pudo crear el árbol */}
              {!result.syntaxTree && result.lexical.tokens.length > 0 && (
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
              )}

              {/* Análisis Semántico */}
              {result.semanticTree && (
                <CollapsibleSection title="Análisis Semántico" defaultOpen>
                  <Card>
                    <CardContent className="pt-6 space-y-4">
                      <div className="space-y-2">
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
              {/* Mostrar errores también en síntesis */}
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

              {result.intermediateCode && result.intermediateCode.length > 0 && (
                <CollapsibleSection title="Generacion de Código Intermedio" defaultOpen>
                  <CodeTable
                    instructions={result.intermediateCode.map((inst: any) => ({ instruction: inst.instruction }))}
                    title="Código Intermedio"
                  />
                </CollapsibleSection>
              )}

              {result.optimization && result.optimization.length > 0 && (
                <CollapsibleSection 
                  title="Optimización" defaultOpen
                  className='space-y-4 content-between'
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

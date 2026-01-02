'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  LanguageInput, 
  AutomataGraphCytoscape, 
  TransitionTable,
  SubsetStatesTable 
} from '@/components/analizador-lexico';
import { SymbolSlider, commonSymbols, CollapsibleSection } from '@/components/shared';
import { useAutomata, useHistory } from '@/hooks';
import { Loader2, GitBranch, Layers, Minimize2 } from 'lucide-react';

export default function AFDFullClientPage() {
  const [languages, setLanguages] = useState<string[]>([]);
  const [regex, setRegex] = useState('');
  
  const { automaton, isProcessing, error, buildAutomaton } = useAutomata();
  const { addEntry } = useHistory();

  // Calcular estados unificados (los que cambiaron del AFD no óptimo al óptimo)
  const unifiedStates = useMemo(() => {
    if (!automaton?.automatonAFDNonOptimized || !automaton?.automatonAFD) {
      return [];
    }
    
    const nonOptStates = new Set(automaton.automatonAFDNonOptimized.states.map(s => s.id));
    const optStates = new Set(automaton.automatonAFD.states.map(s => s.label));
    
    // Estados que existen en el no óptimo pero no aparecen como label en el óptimo
    const removed: string[] = [];
    nonOptStates.forEach(stateId => {
      if (!optStates.has(stateId)) {
        removed.push(stateId);
      }
    });
    
    return removed;
  }, [automaton]);

  const handleAnalyze = async () => {
    // Construir AFD Full mediante algoritmo de subconjuntos
    const result = await buildAutomaton({
      regex,
      languages,
      algorithm: 'afd-full',
    });

    if (result && !error) {
      addEntry({
        type: 'lexical',
        input: regex,
        metadata: { 
          success: true,
          algorithm: 'AFD Full (Subconjuntos)',
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuración */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración</CardTitle>
          <CardDescription>
            Ingrese una expresión regular para construir el AFD mediante Thompson + Subconjuntos + Estados Significativos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <LanguageInput
            languages={languages}
            onChange={setLanguages}
            placeholder="Ej: a,d,b"
            maxLanguages={5}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium">Expresión Regular</label>
            <Input
              value={regex}
              onChange={(e) => setRegex(e.target.value)}
              placeholder="Ej: (a|b)*abb"
              className="font-mono"
            />
            <SymbolSlider
              symbols={commonSymbols.regex}
              onSelect={(symbol) => setRegex(prev => prev + symbol)}
              variant="outline"
            />
          </div>

          <Button
            onClick={handleAnalyze}
            disabled={!regex || isProcessing}
            className="w-full sm:w-auto"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 animate-spin" />
                Construyendo AFD...
              </>
            ) : (
              'Construir AFD Full'
            )}
          </Button>

          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resultados */}
      {automaton?.automatonAFN && (
        <div className="space-y-6">
          
          {/* ============================================= */}
          {/* SECCIÓN 1: Método de Thompson (AFN) */}
          {/* ============================================= */}
          <CollapsibleSection
            title="Método de Thompson (AFN)"
            icon={<GitBranch className="h-5 w-5 text-blue-500" />}
            defaultOpen
          >
            <div className="space-y-4">
              {/* Info del AFN */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-muted/50 rounded-lg p-3">
                  <span className="text-muted-foreground block">Tipo</span>
                  <span className="font-medium">
                    {automaton.automatonAFN.type === 'NFA' ? 'AFN' : 
                     automaton.automatonAFN.type === 'EPSILON_NFA' ? 'AFN-ε' : 'AFD'}
                  </span>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <span className="text-muted-foreground block">Estados</span>
                  <span className="font-medium">{automaton.automatonAFN.states.length}</span>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <span className="text-muted-foreground block">Transiciones</span>
                  <span className="font-medium">{automaton.automatonAFN.transitions.length}</span>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <span className="text-muted-foreground block">Alfabeto</span>
                  <span className="font-medium font-mono">
                    {'{' + automaton.automatonAFN.alphabet.join(', ') + '}'}
                  </span>
                </div>
              </div>

              {/* Grafo del AFN */}
              <CollapsibleSection title="Grafo del AFN" defaultOpen>
                <AutomataGraphCytoscape automaton={automaton.automatonAFN} />
              </CollapsibleSection>

              {/* Tabla de transiciones del AFN */}
              <CollapsibleSection title="Tabla de Transiciones del AFN" defaultOpen={false}>
                <TransitionTable automaton={automaton.automatonAFN} />
              </CollapsibleSection>
            </div>
          </CollapsibleSection>

          {/* ============================================= */}
          {/* SECCIÓN 2: Método de Subconjuntos (AFD no óptimo) */}
          {/* ============================================= */}
          {automaton.automatonAFDNonOptimized && (
            <CollapsibleSection
              title="Método de Subconjuntos (AFD no óptimo)"
              icon={<Layers className="h-5 w-5 text-orange-500" />}
              defaultOpen
            >
              <div className="space-y-4">
                {/* Info del AFD no óptimo */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <span className="text-muted-foreground block">Tipo</span>
                    <span className="font-medium">AFD</span>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <span className="text-muted-foreground block">Estados</span>
                    <span className="font-medium">{automaton.automatonAFDNonOptimized.states.length}</span>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <span className="text-muted-foreground block">Transiciones</span>
                    <span className="font-medium">{automaton.automatonAFDNonOptimized.transitions.length}</span>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <span className="text-muted-foreground block">Alfabeto</span>
                    <span className="font-medium font-mono">
                      {'{' + automaton.automatonAFDNonOptimized.alphabet.join(', ') + '}'}
                    </span>
                  </div>
                </div>

                {/* Grafo del AFD no óptimo */}
                <CollapsibleSection title="Grafo del AFD (no óptimo)" defaultOpen>
                  <AutomataGraphCytoscape automaton={automaton.automatonAFDNonOptimized} />
                </CollapsibleSection>

                {/* Tabla de transiciones del AFD no óptimo */}
                <CollapsibleSection title="Tabla de Transiciones (Estado × Símbolo)" defaultOpen>
                  <TransitionTable automaton={automaton.automatonAFDNonOptimized} />
                </CollapsibleSection>

                {/* Tabla de estados con elementos del AFN */}
                <CollapsibleSection title="Tabla de Estados con Elementos del AFN" defaultOpen>
                  <SubsetStatesTable 
                    automaton={automaton.automatonAFDNonOptimized}
                    highlightedStates={unifiedStates}
                    title="Estados del AFD y sus Elementos del AFN"
                  />
                </CollapsibleSection>
              </div>
            </CollapsibleSection>
          )}

          {/* ============================================= */}
          {/* SECCIÓN 3: AFD Óptimo (Estados Significativos) */}
          {/* ============================================= */}
          <CollapsibleSection
            title="Método de Estados Significativos (AFD óptimo)"
            icon={<Minimize2 className="h-5 w-5 text-green-500" />}
            defaultOpen
          >
            <div className="space-y-4">
              {/* Resumen de optimización */}
              {automaton.automatonAFDNonOptimized && (
                <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20 p-4">
                  <h4 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-3">
                    Resumen de Optimización
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
                      <span className="text-muted-foreground block">Estados Originales</span>
                      <span className="font-medium">{automaton.automatonAFDNonOptimized.states.length}</span>
                    </div>
                    <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
                      <span className="text-muted-foreground block">Estados Finales</span>
                      <span className="font-medium">{automaton.automatonAFD.states.length}</span>
                    </div>
                    <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
                      <span className="text-muted-foreground block">Estados Reducidos</span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        {automaton.automatonAFDNonOptimized.states.length - automaton.automatonAFD.states.length}
                      </span>
                    </div>
                    <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
                      <span className="text-muted-foreground block">Estados Unificados</span>
                      <span className="font-medium font-mono text-yellow-600 dark:text-yellow-400">
                        {unifiedStates.length > 0 ? unifiedStates.join(', ') : 'Ninguno'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Info del AFD óptimo */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-muted/50 rounded-lg p-3">
                  <span className="text-muted-foreground block">Tipo</span>
                  <span className="font-medium">AFD Minimizado</span>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <span className="text-muted-foreground block">Estados</span>
                  <span className="font-medium">{automaton.automatonAFD.states.length}</span>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <span className="text-muted-foreground block">Transiciones</span>
                  <span className="font-medium">{automaton.automatonAFD.transitions.length}</span>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <span className="text-muted-foreground block">Alfabeto</span>
                  <span className="font-medium font-mono">
                    {'{' + automaton.automatonAFD.alphabet.join(', ') + '}'}
                  </span>
                </div>
              </div>

              {/* Grafo del AFD óptimo */}
              <CollapsibleSection title="Grafo del AFD Óptimo" defaultOpen>
                <AutomataGraphCytoscape automaton={automaton.automatonAFD} />
              </CollapsibleSection>

              {/* Tabla de transiciones del AFD óptimo */}
              <CollapsibleSection title="Tabla de Transiciones (Estado x Símbolo)" defaultOpen>
                <TransitionTable automaton={automaton.automatonAFD} />
              </CollapsibleSection>

              {/* Mapeo de estados unificados */}
              {unifiedStates.length > 0 && (
                <div className="rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-950/20 p-4">
                  <h4 className="text-sm font-semibold text-yellow-700 dark:text-yellow-400 mb-3">
                    Estados Unificados
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Los siguientes estados del AFD no óptimo fueron unificados por tener los mismos estados significativos:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {unifiedStates.map((state) => (
                      <span 
                        key={state}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-700"
                      >
                        {state} → fusionado
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CollapsibleSection>

        </div>
      )}
    </div>
  );
}

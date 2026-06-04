'use client';

import { useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useQueryStates } from 'nuqs';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  LanguageInput,
  TransitionTable,
  SubsetStatesTable
} from '@/components/analizador-lexico';
const AutomataGraphCytoscape = dynamic(
  () => import('@/components/analizador-lexico/automata-graph-cytoscape').then(m => ({ default: m.AutomataGraphCytoscape })),
  { ssr: false, loading: () => <div className="h-64 w-full rounded-lg bg-muted animate-pulse" /> }
);
import { SymbolSlider, commonSymbols, CollapsibleSection, MetricGrid } from '@/components/shared';
import { useAutomata, useHistory } from '@/hooks';
import { Loader2, GitBranch, Layers, Minimize2 } from 'lucide-react';
import { afdFullSearchParams } from '@/lib/nuqs';

export default function AFDFullClientPage() {
  // Usar nuqs para manejar el estado de la URL
  const [{ regex, languages }, setParams] = useQueryStates(afdFullSearchParams);
  
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

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const handleAnalyze = async () => {
    // Construir AFD Full mediante algoritmo de subconjuntos
    const result = await buildAutomaton({
      regex,
      languages,
      algorithm: 'afd-full',
    });

    if (result && !error) {
      addEntry({
        type: 'lexical-afd-full',
        input: regex,
        metadata: { 
          success: true,
          algorithm: 'AFD Full (Subconjuntos)',
          regex,
          languages,
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
            onChange={(newLangs) => setParams({ languages: newLangs })}
            placeholder="Ej: a,d,b"
            maxLanguages={5}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium">Expresión Regular</label>
            <Input
              value={regex}
              onChange={(e) => setParams({ regex: e.target.value })}
              placeholder="Ej: (a|b)*abb"
              className="font-mono"
            />
            <SymbolSlider
              symbols={commonSymbols.regex}
              onSelect={(symbol) => setParams({ regex: regex + symbol })}
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
                Construyendo AFD…
              </>
            ) : (
              'Construir AFD Full'
            )}
          </Button>

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
              <MetricGrid items={[
                { label: 'Tipo', value: automaton.automatonAFN.type === 'NFA' ? 'AFN' : automaton.automatonAFN.type === 'EPSILON_NFA' ? 'AFN-ε' : 'AFD' },
                { label: 'Estados', value: automaton.automatonAFN.states.length },
                { label: 'Transiciones', value: automaton.automatonAFN.transitions.length },
                { label: 'Alfabeto', value: <span className="font-mono">{'{' + automaton.automatonAFN.alphabet.join(', ') + '}'}</span> },
              ]} />

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
                <MetricGrid items={[
                  { label: 'Tipo', value: 'AFD' },
                  { label: 'Estados', value: automaton.automatonAFDNonOptimized.states.length },
                  { label: 'Transiciones', value: automaton.automatonAFDNonOptimized.transitions.length },
                  { label: 'Alfabeto', value: <span className="font-mono">{'{' + automaton.automatonAFDNonOptimized.alphabet.join(', ') + '}'}</span> },
                ]} />

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
                  <MetricGrid
                    items={[
                      { label: 'Estados Originales', value: automaton.automatonAFDNonOptimized.states.length, className: 'bg-white/50 dark:bg-black/20' },
                      { label: 'Estados Finales', value: automaton.automatonAFD.states.length, className: 'bg-white/50 dark:bg-black/20' },
                      { label: 'Estados Reducidos', value: <span className="text-green-600 dark:text-green-400">{automaton.automatonAFDNonOptimized.states.length - automaton.automatonAFD.states.length}</span>, className: 'bg-white/50 dark:bg-black/20' },
                      { label: 'Estados Unificados', value: <span className="font-mono text-yellow-600 dark:text-yellow-400">{unifiedStates.length > 0 ? unifiedStates.join(', ') : 'Ninguno'}</span>, className: 'bg-white/50 dark:bg-black/20' },
                    ]}
                  />
                </div>
              )}

              {/* Info del AFD óptimo */}
              <MetricGrid items={[
                { label: 'Tipo', value: 'AFD Minimizado' },
                { label: 'Estados', value: automaton.automatonAFD.states.length },
                { label: 'Transiciones', value: automaton.automatonAFD.transitions.length },
                { label: 'Alfabeto', value: <span className="font-mono">{'{' + automaton.automatonAFD.alphabet.join(', ') + '}'}</span> },
              ]} />

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

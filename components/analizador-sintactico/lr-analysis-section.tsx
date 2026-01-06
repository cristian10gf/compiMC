'use client';

/**
 * Sección completa de análisis LR
 * Agrupa AFN, SLR, LR canónico, LALR y reconocimiento de cadenas
 */

import { useState, useCallback } from 'react';
import { CollapsibleSection } from '@/components/shared/collapsible-section';
import { LRCanonicalSets } from './lr-canonical-sets';
import { LRParsingTable } from './lr-parsing-table';
import { LRAutomatonGraph } from './lr-automaton-graph';
import { StringRecognitionLR } from './string-recognition-lr';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { Grammar, ParsingResult } from '@/lib/types/grammar';
import type { LRAnalysisResult, LRAnalysisType } from '@/lib/types/syntax-analysis';

interface LRAnalysisSectionProps {
  grammar: Grammar;
  slr: LRAnalysisResult | null;
  lr1: LRAnalysisResult | null;
  lalr: LRAnalysisResult | null;
  selectedType: LRAnalysisType;
  onTypeChange: (type: LRAnalysisType) => void;
  onRecognize: (input: string, type: LRAnalysisType) => Promise<ParsingResult | null>;
  isProcessing?: boolean;
  className?: string;
  value?: string; // Valor controlado desde la URL
  onValueChange?: (value: string) => void; // Callback para actualizar la URL
}

export function LRAnalysisSection({
  grammar,
  slr,
  lr1,
  lalr,
  selectedType,
  onTypeChange,
  onRecognize,
  isProcessing = false,
  className,
  value = '',
  onValueChange,
}: LRAnalysisSectionProps) {
  // Estado para controlar qué autómata mostrar en las secciones colapsables de grafos
  const [showSlrGraph, setShowSlrGraph] = useState(false);
  const [showLr1Graph, setShowLr1Graph] = useState(false);
  const [showLalrGraph, setShowLalrGraph] = useState(false);

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* 1. AFN LR(0) */}
        {slr && slr.afn && (
          <CollapsibleSection
            title="AFN de Elementos LR(0)"
            badge={
              <Badge variant="secondary" className="text-xs">
                {slr.afn.states.length} estados
              </Badge>
            }
          >
            <LRAutomatonGraph
              automaton={slr.afn}
              showItemsInNodes={true}
              className="min-h-100"
            />
          </CollapsibleSection>
        )}

        {/* 2. SLR */}
        {slr && (
          <CollapsibleSection
            title="SLR"
            badge={
              <div className="flex gap-2">
                <Badge variant="secondary" className="text-xs">
                  {slr.canonicalSets.length} estados
                </Badge>
                {slr.conflicts.length > 0 ? (
                  <Badge variant="destructive" className="text-xs">
                    {slr.conflicts.length} conflicto{slr.conflicts.length > 1 ? 's' : ''}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs text-green-600 border-green-500/50">
                    Sin conflictos
                  </Badge>
                )}
              </div>
            }
            defaultOpen
          >
            <div className="space-y-4">
              {/* Conjuntos canónicos LR(0) */}
              <LRCanonicalSets
                canonicalSets={slr.canonicalSets}
                title="Conjuntos Canónicos LR(0)"
                compactMode
              />
              
              {/* Tabla de análisis SLR */}
              <LRParsingTable
                actionTable={slr.actionTable}
                gotoTable={slr.gotoTable}
                grammar={slr.augmentedGrammar}
                conflicts={slr.conflicts}
                title="Tabla de Análisis Sintáctico SLR"
              />

              {/* Autómata colapsable */}
              <CollapsibleSection
                title="Autómata de Conjuntos Canónicos"
                badge={
                  <Badge variant="outline" className="text-xs">
                    AFD
                  </Badge>
                }
              >
                <LRAutomatonGraph
                  canonicalSets={slr.canonicalSets}
                  showItemsInNodes
                  className="min-h-100"
                />
              </CollapsibleSection>
            </div>
          </CollapsibleSection>
        )}

        {/* 3. LR Canónico */}
        {lr1 && (
          <CollapsibleSection
            title="LR-canónico"
            badge={
              <div className="flex gap-2">
                <Badge variant="secondary" className="text-xs">
                  {lr1.canonicalSets.length} estados
                </Badge>
                {lr1.conflicts.length > 0 ? (
                  <Badge variant="destructive" className="text-xs">
                    {lr1.conflicts.length} conflicto{lr1.conflicts.length > 1 ? 's' : ''}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs text-green-600 border-green-500/50">
                    Sin conflictos
                  </Badge>
                )}
              </div>
            }
          >
            <div className="space-y-4">
              {/* Conjuntos canónicos LR(1) */}
              <LRCanonicalSets
                canonicalSets={lr1.canonicalSets}
                title="Conjuntos Canónicos LR(1)"
                compactMode
              />
              
              {/* Tabla de análisis LR(1) */}
              <LRParsingTable
                actionTable={lr1.actionTable}
                gotoTable={lr1.gotoTable}
                grammar={lr1.augmentedGrammar}
                conflicts={lr1.conflicts}
                title="Tabla de Análisis Sintáctico LR(1)"
              />

              {/* Autómata colapsable */}
              <CollapsibleSection
                title="Autómata de Conjuntos Canónicos"
                badge={
                  <Badge variant="outline" className="text-xs">
                    AFD
                  </Badge>
                }
              >
                <LRAutomatonGraph
                  canonicalSets={lr1.canonicalSets}
                  showItemsInNodes
                  className="min-h-100"
                />
              </CollapsibleSection>
            </div>
          </CollapsibleSection>
        )}

        {/* 4. LALR */}
        {lalr && (
          <CollapsibleSection
            title="LALR"
            badge={
              <div className="flex gap-2">
                <Badge variant="secondary" className="text-xs">
                  {lalr.canonicalSets.length} estados
                </Badge>
                {lalr.conflicts.length > 0 ? (
                  <Badge variant="destructive" className="text-xs">
                    {lalr.conflicts.length} conflicto{lalr.conflicts.length > 1 ? 's' : ''}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs text-green-600 border-green-500/50">
                    Sin conflictos
                  </Badge>
                )}
              </div>
            }
          >
            <div className="space-y-4">
              {/* Conjuntos canónicos comprimidos */}
              <LRCanonicalSets
                canonicalSets={lalr.canonicalSets}
                title="Conjuntos Canónicos Comprimidos"
                compactMode
              />
              
              {/* Tabla de análisis LALR */}
              <LRParsingTable
                actionTable={lalr.actionTable}
                gotoTable={lalr.gotoTable}
                grammar={lalr.augmentedGrammar}
                conflicts={lalr.conflicts}
                title="Tabla de Análisis Sintáctico LALR"
              />

              {/* Autómata colapsable */}
              <CollapsibleSection
                title="Autómata de Conjuntos Canónicos"
                badge={
                  <Badge variant="outline" className="text-xs">
                    AFD
                  </Badge>
                }
              >
                <LRAutomatonGraph
                  canonicalSets={lalr.canonicalSets}
                  showItemsInNodes
                  className="min-h-100"
                />
              </CollapsibleSection>
            </div>
          </CollapsibleSection>
        )}

        {/* 5. Reconocer cadena */}
        {(slr || lr1 || lalr) && (
          <CollapsibleSection
            title="Reconocer Cadena"
            defaultOpen
          >
            <StringRecognitionLR
              onRecognize={onRecognize}
              terminals={grammar.terminals}
              selectedType={selectedType}
              onTypeChange={onTypeChange}
              isProcessing={isProcessing}
              hasSlr={!!slr && slr.conflicts.length === 0}
              hasLr1={!!lr1 && lr1.conflicts.length === 0}
              hasLalr={!!lalr && lalr.conflicts.length === 0}
              value={value}
              onChange={onValueChange}
            />
          </CollapsibleSection>
        )}
      </div>
    </div>
  );
}

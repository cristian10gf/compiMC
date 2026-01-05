'use client';

/**
 * Componente para mostrar los conjuntos canónicos LR
 * Visualiza los estados (conjuntos de items) en formato grid
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CopyButton } from '@/components/shared/copy-button';
import { cn } from '@/lib/utils';
import type { LRStateSet } from '@/lib/types/syntax-analysis';

interface LRCanonicalSetsProps {
  canonicalSets: LRStateSet[];
  title?: string;
  className?: string;
  compactMode?: boolean;
}

/**
 * Formatea un item LR para mostrar con lookahead resaltado
 */
function formatItem(item: LRStateSet['items'][0], showLookahead: boolean = true): React.ReactNode {
  const { production, dotPosition, lookahead } = item;
  const right = [...production.right];
  right.splice(dotPosition, 0, '•');
  
  if (showLookahead && lookahead) {
    return (
      <span>
        [{production.left} → {right.join(' ')}, <span className="text-amber-500 font-semibold">{lookahead}</span>]
      </span>
    );
  }
  
  return `[${production.left} → ${right.join(' ')}]`;
}

/**
 * Formatea un item como string para copiar
 */
function formatItemString(item: LRStateSet['items'][0]): string {
  const { production, dotPosition, lookahead } = item;
  const right = [...production.right];
  right.splice(dotPosition, 0, '•');
  const la = lookahead ? `, ${lookahead}` : '';
  return `[${production.left} → ${right.join(' ')}${la}]`;
}

/**
 * Genera texto para copiar
 */
function generateCopyText(canonicalSets: LRStateSet[]): string {
  return canonicalSets.map(set => {
    const header = `I${set.id}:`;
    const items = set.items.map(item => `  ${formatItemString(item)}`).join('\n');
    const transitions = Array.from(set.transitions.entries())
      .map(([symbol, target]) => `  ${symbol} → I${target}`)
      .join('\n');
    return `${header}\n${items}${transitions ? '\nTransiciones:\n' + transitions : ''}`;
  }).join('\n\n');
}

export function LRCanonicalSets({
  canonicalSets,
  title = 'Conjuntos Canónicos',
  className,
  compactMode = false,
}: LRCanonicalSetsProps) {
  // Detectar si hay lookaheads (LR(1) o LALR)
  const hasLookaheads = canonicalSets.some(set => 
    set.items.some(item => item.lookahead)
  );

  /**
   * Calcula el tamaño apropiado para una celda basado en su contenido
   */
  const getCellSize = (set: LRStateSet): { rowSpan: number; colSpan: number } => {
    const numItems = set.items.length;
    const maxProdLength = Math.max(
      ...set.items.map(item => {
        const prodString = `${item.production.left} → ${item.production.right.join(' ')}`;
        const lookaheadStr = item.lookahead ? `, ${item.lookahead}` : '';
        return prodString.length + lookaheadStr.length;
      })
    );

    // Calcular rowSpan basado en número de items
    let rowSpan = 1;
    if (numItems > 8) rowSpan = 3;
    else if (numItems > 4) rowSpan = 2;

    // Calcular colSpan basado en longitud de producciones
    let colSpan = 1;
    if (maxProdLength > 50) colSpan = 3;
    else if (maxProdLength > 30) colSpan = 2;

    return { rowSpan, colSpan };
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {canonicalSets.length} estados
            </Badge>
            <CopyButton content={generateCopyText(canonicalSets)} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3" style={{
          gridTemplateColumns: compactMode 
            ? 'repeat(auto-fill, minmax(280px, 1fr))'
            : 'repeat(auto-fill, minmax(320px, 1fr))'
        }}>
          {canonicalSets.map((set) => {
            const isInitial = set.id === 0;
            const hasAccept = set.items.some(
              item => item.production.left.endsWith("'") && 
                      item.dotPosition === item.production.right.length
            );
            const { rowSpan, colSpan } = getCellSize(set);
            
            return (
              <div
                key={set.id}
                className={cn(
                  'rounded-lg border p-3 transition-colors',
                  isInitial && 'border-green-500/50 bg-green-500/5',
                  hasAccept && !isInitial && 'border-amber-500/50 bg-amber-500/5',
                  !isInitial && !hasAccept && 'border-border bg-card'
                )}
                style={{
                  gridRow: `span ${rowSpan}`,
                  gridColumn: `span ${colSpan}`,
                  minHeight: `${80 + (set.items.length * 20)}px`
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm">I{set.id}</span>
                  <div className="flex gap-1">
                    {isInitial && (
                      <Badge variant="outline" className="text-xs text-green-600 border-green-500/50">
                        Inicial
                      </Badge>
                    )}
                    {hasAccept && (
                      <Badge variant="outline" className="text-xs text-amber-600 border-amber-500/50">
                        Acepta
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="space-y-0.5">
                  {/* Mostrar TODOS los items sin límite */}
                  {set.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="font-mono text-xs text-muted-foreground"
                      title={formatItemString(item)}
                    >
                      {formatItem(item, hasLookaheads)}
                    </div>
                  ))}
                </div>
                {set.transitions.size > 0 && !compactMode && (
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <div className="text-xs text-muted-foreground">
                      {Array.from(set.transitions.entries()).map(([symbol, target], idx) => (
                        <span key={idx} className="mr-2">
                          <span className="text-primary">{symbol}</span>→I{target}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

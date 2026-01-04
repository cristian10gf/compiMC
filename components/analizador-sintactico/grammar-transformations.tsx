'use client';

/**
 * Visualizador de transformaciones de gramática
 * Muestra la gramática sin recursividad izquierda y factorizada
 */

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CopyButton } from '@/components/shared/copy-button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Grammar } from '@/lib/types/grammar';

interface GrammarTransformationsProps {
  originalGrammar: Grammar;
  transformedGrammar: Grammar;
  transformationSteps: string[];
  className?: string;
}

function GrammarDisplay({ grammar, title }: { grammar: Grammar; title: string }) {
  // Agrupar producciones por no terminal
  const productionsByNT = new Map<string, string[][]>();

  for (const prod of grammar.productions) {
    if (!productionsByNT.has(prod.left)) {
      productionsByNT.set(prod.left, []);
    }
    productionsByNT.get(prod.left)!.push(prod.right);
  }

  const formatProduction = (right: string[]) => {
    return right.map((symbol, idx) => {
      const isNonTerminal = grammar.nonTerminals.includes(symbol);
      const isEpsilon = symbol === 'ε';
      
      return (
        <span
          key={idx}
          className={cn(
            'font-mono',
            isNonTerminal && 'text-primary font-bold',
            isEpsilon && 'text-muted-foreground italic',
            !isNonTerminal && !isEpsilon && 'text-foreground'
          )}
        >
          {symbol}
        </span>
      );
    });
  };

  const grammarText = Array.from(productionsByNT.entries())
    .map(([nt, rights]) => `${nt} → ${rights.map(r => r.join('')).join(' | ')}`)
    .join('\n');

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">{title}</h4>
        <CopyButton content={grammarText} />
      </div>
      
      <div className="bg-muted/30 rounded-lg p-3 space-y-1.5 font-mono text-sm">
        {Array.from(productionsByNT.entries()).map(([nonTerminal, rights]) => (
          <div key={nonTerminal} className="flex items-start gap-2">
            <span className="text-primary font-bold min-w-8">{nonTerminal}</span>
            <span className="text-muted-foreground">→</span>
            <div className="flex flex-wrap items-center gap-x-2">
              {rights.map((right, idx) => (
                <span key={idx} className="flex items-center">
                  {idx > 0 && <span className="text-muted-foreground mx-1">|</span>}
                  {formatProduction(right)}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Info de la gramática */}
      <div className="flex flex-wrap gap-2 text-xs">
        <Badge variant="outline">
          {grammar.nonTerminals.length} no terminales
        </Badge>
        <Badge variant="outline">
          {grammar.terminals.length} terminales
        </Badge>
        <Badge variant="outline">
          {grammar.productions.length} producciones
        </Badge>
      </div>
    </div>
  );
}

export function GrammarTransformations({
  originalGrammar,
  transformedGrammar,
  transformationSteps,
  className,
}: GrammarTransformationsProps) {
  const hasChanges = 
    originalGrammar.productions.length !== transformedGrammar.productions.length ||
    originalGrammar.nonTerminals.length !== transformedGrammar.nonTerminals.length;

  return (
    <Card className={cn('', className)}>
      <CardContent className="pt-4 space-y-4">
        {/* Comparación de gramáticas */}
        <div className="flex flex-col md:flex-row items-stretch gap-3">
          <div className="flex-1">
            <GrammarDisplay grammar={originalGrammar} title="Gramática Original" />
          </div>
          
          <div className="hidden md:flex items-center justify-center px-2">
            <ArrowRight className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="md:hidden flex items-center justify-center py-1">
            <ArrowRight className="h-5 w-5 text-muted-foreground rotate-90" />
          </div>

          <div className="flex-1">
            <GrammarDisplay grammar={transformedGrammar} title="Gramática Transformada" />
          </div>
        </div>

        {/* Estado de la transformación */}
        <div className={cn(
          'flex items-center gap-2 p-3 rounded-lg',
          hasChanges ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300' : 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300'
        )}>
          {hasChanges ? (
            <>
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">
                La gramática fue transformada para eliminar recursividad izquierda y/o factorizar.
              </span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm">
                La gramática no requiere transformaciones (ya está en forma adecuada para LL).
              </span>
            </>
          )}
        </div>

        {/* Pasos de transformación */}
        {transformationSteps.length > 0 && (
          <Accordion type="single" collapsible>
            <AccordionItem value="steps">
              <AccordionTrigger className="text-sm font-medium">
                Ver pasos de transformación
              </AccordionTrigger>
              <AccordionContent>
                <div className="bg-muted/30 rounded-lg p-4 font-mono text-xs space-y-1 max-h-64 overflow-y-auto">
                  {transformationSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        step.startsWith('===') && 'font-bold text-primary mt-2 first:mt-0',
                        step.startsWith('  ') && 'text-muted-foreground ml-4'
                      )}
                    >
                      {step}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {/* Leyenda de transformaciones */}
        <div className="pt-4 border-t text-xs text-muted-foreground space-y-2">
          <p><strong>Eliminación de Recursividad por Izquierda:</strong></p>
          <p className="ml-2">
            A → Aα | β se transforma en: A → βA' y A' → αA' | ε
          </p>
          <p className="mt-2"><strong>Factorización por Izquierda:</strong></p>
          <p className="ml-2">
            A → αβ₁ | αβ₂ se transforma en: A → αA' y A' → β₁ | β₂
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

/**
 * Tabla de Primeros y Siguientes con reglas de cálculo
 * Muestra los valores calculados y las reglas aplicadas para cada no terminal
 */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { CopyButton } from '@/components/shared/copy-button';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FirstFollowWithRules } from '@/lib/types/syntax-analysis';

interface FirstFollowTableProps {
  data: FirstFollowWithRules[];
  className?: string;
}

export function FirstFollowTable({ data, className }: FirstFollowTableProps) {
  // Formatear para copiar
  const formatForCopy = () => {
    const lines = data.map(
      (item) =>
        `${item.nonTerminal}: PRIMERO={${item.first.join(', ')}} SIGUIENTE={${item.follow.join(', ')}}`
    );
    return lines.join('\n');
  };

  return (
    <Card className={cn('', className)}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Conjuntos Primeros y Siguientes</h3>
          <CopyButton content={formatForCopy()} />
        </div>

        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-bold w-32">No Terminal</TableHead>
                <TableHead className="font-bold">
                  <div className="flex items-center gap-2">
                    PRIMERO
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-xs">
                            Conjunto de terminales que pueden aparecer al inicio de una derivación.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableHead>
                <TableHead className="font-bold">
                  <div className="flex items-center gap-2">
                    SIGUIENTE
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-xs">
                            Conjunto de terminales que pueden aparecer inmediatamente después del no terminal.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.nonTerminal}>
                  <TableCell className="font-mono font-bold text-primary">
                    {item.nonTerminal}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {item.first.length > 0 ? (
                        item.first.map((symbol, idx) => (
                          <Badge
                            key={idx}
                            variant={symbol === 'ε' ? 'outline' : 'secondary'}
                            className="font-mono text-xs"
                          >
                            {symbol}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm">∅</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {item.follow.length > 0 ? (
                        item.follow.map((symbol, idx) => (
                          <Badge
                            key={idx}
                            variant={symbol === '$' ? 'default' : 'secondary'}
                            className="font-mono text-xs"
                          >
                            {symbol}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm">∅</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Reglas de cálculo detalladas */}
        <Accordion type="single" collapsible className="mt-4">
          <AccordionItem value="rules">
            <AccordionTrigger className="text-sm font-medium">
              Ver reglas de cálculo aplicadas
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                {data.map((item) => (
                  <div key={item.nonTerminal} className="space-y-2">
                    <h4 className="font-mono font-bold text-sm text-primary">
                      {item.nonTerminal}
                    </h4>
                    
                    {/* Reglas PRIMERO */}
                    {item.firstRules && item.firstRules.length > 0 && (
                      <div className="ml-4 space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">PRIMERO:</p>
                        {item.firstRules.map((rule, idx) => (
                          <div
                            key={idx}
                            className="text-xs bg-muted/30 p-2 rounded flex items-start gap-2"
                          >
                            <code className="text-primary shrink-0">{rule.rule}</code>
                            <span className="text-muted-foreground">→</span>
                            <span>{rule.explanation}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reglas SIGUIENTE */}
                    {item.followRules && item.followRules.length > 0 && (
                      <div className="ml-4 space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">SIGUIENTE:</p>
                        {item.followRules.map((rule, idx) => (
                          <div
                            key={idx}
                            className="text-xs bg-muted/30 p-2 rounded flex items-start gap-2"
                          >
                            <code className="text-primary shrink-0">{rule.rule}</code>
                            <span className="text-muted-foreground">→</span>
                            <span>{rule.explanation}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Leyenda */}
        <div className="mt-4 pt-4 border-t text-xs text-muted-foreground space-y-1">
          <p><strong>Reglas para PRIMERO:</strong></p>
          <ol className="list-decimal list-inside ml-2 space-y-0.5">
            <li>Si X es terminal, PRIMERO(X) = {'{X}'}</li>
            <li>Si X → ε, agregar ε a PRIMERO(X)</li>
            <li>Si X → Y₁Y₂...Yₖ, agregar PRIMERO(Y₁) a PRIMERO(X). Si ε ∈ PRIMERO(Y₁), agregar PRIMERO(Y₂), etc.</li>
          </ol>
          <p className="mt-2"><strong>Reglas para SIGUIENTE:</strong></p>
          <ol className="list-decimal list-inside ml-2 space-y-0.5">
            <li>Agregar $ a SIGUIENTE(S), donde S es el símbolo inicial</li>
            <li>Si A → αBβ, agregar PRIMERO(β) - {'{ε}'} a SIGUIENTE(B)</li>
            <li>Si A → αB o A → αBβ donde ε ∈ PRIMERO(β), agregar SIGUIENTE(A) a SIGUIENTE(B)</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

/**
 * Componente para mostrar los pasos de construcción de la tabla de precedencia
 * basado en derivaciones.
 * 
 * Modo manual: El usuario hace clic en producciones para derivar paso a paso,
 *              y en cada paso se muestran las relaciones de precedencia encontradas.
 * 
 * Modo automático: Simula el proceso manual generando derivaciones automáticas
 *                  que cubren todas las producciones de la gramática.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CopyButton } from '@/components/shared/copy-button';
import { Play, RefreshCw, Lightbulb, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PrecedenceStep, Production, Grammar, DerivationStep, PrecedenceRelation, PrecedenceTable as PrecedenceTableType } from '@/lib/types/grammar';
import {
  analyzeDerivationStep,
  applyDerivation,
  generateAutomaticDerivations,
  getTestStringFromDerivations,
  derivationsToPrecedenceSteps,
  buildPrecedenceTableFromSteps,
  calculatePrecedenceAutomatic,
} from '@/lib/algorithms/syntax/ascendente';

interface PrecedenceStepsProps {
  grammar: Grammar;
  steps: PrecedenceStep[] | null;
  testString: string;
  isAutomatic: boolean;
  onModeChange: (isAutomatic: boolean) => void;
  onTestStringChange: (testString: string) => void;
  onGenerateSteps: (steps: PrecedenceStep[], table?: PrecedenceTableType) => void;
  isProcessing?: boolean;
  className?: string;
}

// Colores para las relaciones
const relationColors = {
  '<': 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  '>': 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  '=': 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
  '·': 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const relationDescriptions = {
  '<': 'cede precedencia a',
  '>': 'tiene más precedencia que',
  '=': 'tiene igual precedencia que',
  '·': 'sin relación con',
};

export function PrecedenceSteps({
  grammar,
  steps,
  testString,
  isAutomatic,
  onModeChange,
  onTestStringChange,
  onGenerateSteps,
  isProcessing = false,
  className,
}: PrecedenceStepsProps) {
  const [showAllRelations, setShowAllRelations] = useState(false);
  
  // Estado para las derivaciones (modo manual y automático)
  const [derivationSteps, setDerivationSteps] = useState<DerivationStep[]>([{
    stepNumber: 1,
    sententialForm: [grammar.startSymbol],
    productionUsed: null,
    positionExpanded: -1,
    relations: [],
    explanation: `Inicio con símbolo inicial: ${grammar.startSymbol}`,
  }]);

  // Resetear derivaciones cuando cambia la gramática
  useEffect(() => {
    setDerivationSteps([{
      stepNumber: 1,
      sententialForm: [grammar.startSymbol],
      productionUsed: null,
      positionExpanded: -1,
      relations: [],
      explanation: `Inicio con símbolo inicial: ${grammar.startSymbol}`,
    }]);
  }, [grammar.startSymbol]);

  // Generar automáticamente cuando se activa el modo automático
  useEffect(() => {
    if (isAutomatic) {
      // Generar derivaciones automáticas
      const autoSteps = generateAutomaticDerivations(grammar);
      setDerivationSteps(autoSteps);
      
      const testStr = getTestStringFromDerivations(grammar, autoSteps);
      onTestStringChange(testStr);
      
      // Generar tabla usando el método automático correcto
      const table = calculatePrecedenceAutomatic(grammar);
      const precedenceSteps = derivationsToPrecedenceSteps(autoSteps);
      onGenerateSteps(precedenceSteps, table);
    }
  }, [isAutomatic, grammar, onTestStringChange, onGenerateSteps]);

  // Forma sentencial actual (último paso)
  const currentForm = useMemo(() => {
    return derivationSteps[derivationSteps.length - 1].sententialForm;
  }, [derivationSteps]);

  // Formatear las producciones de la gramática para mostrar
  const formatProduction = (prod: Production): string => {
    return `${prod.left} → ${prod.right.join(' ')}`;
  };

  // Formatear derivaciones para copiar
  const formatDerivationsForCopy = useCallback(() => {
    return derivationSteps.map((step, idx) => {
      const form = step.sententialForm.join(' ');
      const prod = step.productionUsed ? formatProduction(step.productionUsed) : 'Inicio';
      const relations = step.relations
        .map(r => `${r.symbol1} ${r.relation} ${r.symbol2}`)
        .join(', ');
      return `Paso ${idx + 1}: ${form}\n  Producción: ${prod}\n  Relaciones: ${relations || 'Ninguna'}`;
    }).join('\n\n');
  }, [derivationSteps]);

  // Obtener los no terminales que pueden ser expandidos en la forma actual
  const expandablePositions = useMemo(() => {
    const positions: { index: number; symbol: string; productions: Production[] }[] = [];
    
    currentForm.forEach((symbol, index) => {
      if (grammar.nonTerminals.includes(symbol)) {
        const prods = grammar.productions.filter(p => p.left === symbol);
        if (prods.length > 0) {
          positions.push({ index, symbol, productions: prods });
        }
      }
    });
    
    return positions;
  }, [currentForm, grammar]);

  // Manejar clic en una producción (modo manual)
  const handleProductionClick = useCallback((prod: Production, position: number) => {
    const prevForm = currentForm; // Forma sentencial anterior (antes de la derivación)
    const newForm = applyDerivation(currentForm, position, prod);
    
    // Pasar la forma anterior para análisis correcto de relaciones
    const relations = analyzeDerivationStep(grammar, newForm, prod, prevForm);
    
    const newStep: DerivationStep = {
      stepNumber: derivationSteps.length + 1,
      sententialForm: newForm,
      productionUsed: prod,
      positionExpanded: position,
      relations,
      explanation: `${currentForm[position]} → ${prod.right.join(' ')}`,
    };
    
    setDerivationSteps(prev => [...prev, newStep]);
    
    // Actualizar la cadena de prueba con los terminales actuales
    const terminals = newForm.filter(s => grammar.terminals.includes(s));
    onTestStringChange(terminals.join(' '));
  }, [currentForm, grammar, derivationSteps.length, onTestStringChange]);

  // Reiniciar derivación manual
  const resetDerivation = useCallback(() => {
    setDerivationSteps([{
      stepNumber: 1,
      sententialForm: [grammar.startSymbol],
      productionUsed: null,
      positionExpanded: -1,
      relations: [],
      explanation: `Inicio con símbolo inicial: ${grammar.startSymbol}`,
    }]);
    onTestStringChange('');
  }, [grammar.startSymbol, onTestStringChange]);

  // Verificar si la derivación actual solo tiene terminales
  const isDerivationComplete = useMemo(() => {
    return currentForm.every(s => grammar.terminals.includes(s));
  }, [currentForm, grammar.terminals]);

  // Generar derivaciones automáticamente
  const handleGenerateAutomatic = useCallback(() => {
    const autoSteps = generateAutomaticDerivations(grammar);
    setDerivationSteps(autoSteps);
    
    const testStr = getTestStringFromDerivations(grammar, autoSteps);
    onTestStringChange(testStr);
    
    // Generar tabla usando el método automático correcto
    const table = calculatePrecedenceAutomatic(grammar);
    const precedenceSteps = derivationsToPrecedenceSteps(autoSteps);
    onGenerateSteps(precedenceSteps, table);
  }, [grammar, onTestStringChange, onGenerateSteps]);

  // Analizar derivaciones manuales
  const handleAnalyzeManual = useCallback(() => {
    const precedenceSteps = derivationsToPrecedenceSteps(derivationSteps);
    const table = buildPrecedenceTableFromSteps(grammar, precedenceSteps);
    onGenerateSteps(precedenceSteps, table);
  }, [derivationSteps, grammar, onGenerateSteps]);

  // Manejar cambio de modo
  const handleModeChange = useCallback((automatic: boolean) => {
    resetDerivation();
    onModeChange(automatic);
  }, [onModeChange, resetDerivation]);

  // Todas las relaciones encontradas hasta ahora
  const allRelationsFound = useMemo(() => {
    const relMap = new Map<string, PrecedenceRelation>();
    for (const step of derivationSteps) {
      for (const rel of step.relations) {
        const key = `${rel.symbol1}-${rel.symbol2}`;
        if (!relMap.has(key)) {
          relMap.set(key, rel);
        }
      }
    }
    return Array.from(relMap.values());
  }, [derivationSteps]);

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Construcción de Precedencia</CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label 
                htmlFor="mode-switch" 
                className={cn(
                  "text-sm transition-colors",
                  !isAutomatic && "text-primary font-medium"
                )}
              >
                Manual
              </Label>
              <Switch
                id="mode-switch"
                checked={isAutomatic}
                onCheckedChange={handleModeChange}
              />
              <Label 
                htmlFor="mode-switch"
                className={cn(
                  "text-sm transition-colors",
                  isAutomatic && "text-primary font-medium"
                )}
              >
                Automático
              </Label>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Modo Automático */}
        {isAutomatic && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Modo Automático</p>
                  <p>
                    Se generarán derivaciones automáticamente partiendo del símbolo inicial,
                    alternando todas las producciones para encontrar todas las relaciones de precedencia.
                  </p>
                </div>
              </div>
            </div>

            {/* Botón para generar */}
            <Button
              onClick={handleGenerateAutomatic}
              disabled={isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Generando derivaciones...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Generar Derivaciones Automáticas
                </>
              )}
            </Button>
          </div>
        )}

        {/* Modo Manual */}
        {!isAutomatic && (
          <div className="space-y-4">
            {/* Derivación actual */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Derivación Actual</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetDerivation}
                  className="h-7 text-xs"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reiniciar
                </Button>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="flex flex-wrap items-center gap-1">
                  {currentForm.map((symbol, idx) => {
                    const isNonTerminal = grammar.nonTerminals.includes(symbol);
                    return (
                      <Badge
                        key={idx}
                        variant={isNonTerminal ? 'default' : 'secondary'}
                        className={cn(
                          'font-mono text-sm',
                          isNonTerminal && 'bg-primary/80'
                        )}
                      >
                        {symbol}
                      </Badge>
                    );
                  })}
                </div>
                {isDerivationComplete && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                    ✓ Derivación completa (solo terminales)
                  </p>
                )}
              </div>
            </div>

            {/* Producciones clickeables */}
            {!isDerivationComplete && expandablePositions.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Selecciona una producción para expandir
                </Label>
                <div className="space-y-3">
                  {expandablePositions.map((pos) => (
                    <div key={pos.index} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="font-mono">
                          {pos.symbol}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          en posición {pos.index + 1}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {pos.productions.map((prod, prodIdx) => (
                          <Button
                            key={prod.id || prodIdx}
                            variant="outline"
                            size="sm"
                            onClick={() => handleProductionClick(prod, pos.index)}
                            className="font-mono text-xs h-8 hover:bg-primary hover:text-primary-foreground"
                          >
                            {prod.left} → {prod.right.join(' ')}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cadena resultante */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Cadena de Prueba Resultante</Label>
              <div className="rounded-lg border bg-muted/30 p-3">
                <code className="font-mono text-sm">
                  {testString || '(Construye la derivación usando las producciones)'}
                </code>
              </div>
            </div>

            {/* Botón para analizar */}
            <Button
              onClick={handleAnalyzeManual}
              disabled={isProcessing || derivationSteps.length <= 1}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Generar Tabla de Precedencia
                </>
              )}
            </Button>
          </div>
        )}

        {/* Pasos de derivación */}
        {derivationSteps.length > 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Pasos de Derivación</h4>
              <div className="flex items-center gap-2">
                <Label htmlFor="show-all" className="text-xs text-muted-foreground">
                  Mostrar todas
                </Label>
                <Switch
                  id="show-all"
                  checked={showAllRelations}
                  onCheckedChange={setShowAllRelations}
                />
                <CopyButton content={formatDerivationsForCopy()} />
              </div>
            </div>

            <div className="max-h-75 overflow-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-12 text-center sticky top-0 bg-muted">#</TableHead>
                    <TableHead className="sticky top-0 bg-muted">Forma Sentencial</TableHead>
                    <TableHead className="w-32 sticky top-0 bg-muted">Producción</TableHead>
                    <TableHead className="min-w-40 sticky top-0 bg-muted">Relaciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {derivationSteps.map((step, idx) => (
                    <TableRow key={idx} className={idx === derivationSteps.length - 1 ? 'bg-primary/5' : ''}>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-xs">
                          {step.stepNumber}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1">
                          {step.sententialForm.map((symbol, sIdx) => {
                            const isNonTerminal = grammar.nonTerminals.includes(symbol);
                            return (
                              <Badge
                                key={sIdx}
                                variant={isNonTerminal ? 'default' : 'secondary'}
                                className={cn(
                                  'font-mono text-xs',
                                  isNonTerminal && 'bg-primary/70'
                                )}
                              >
                                {symbol}
                              </Badge>
                            );
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {step.productionUsed ? (
                          <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                            {formatProduction(step.productionUsed)}
                          </code>
                        ) : (
                          <span className="text-xs text-muted-foreground">Inicio</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {step.relations.length > 0 ? (
                            (showAllRelations ? step.relations : step.relations.slice(0, 3)).map((rel, relIdx) => (
                              <Badge
                                key={relIdx}
                                variant="outline"
                                className={cn(
                                  'font-mono text-xs',
                                  relationColors[rel.relation]
                                )}
                              >
                                {rel.symbol1} {rel.relation} {rel.symbol2}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                          {!showAllRelations && step.relations.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{step.relations.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Resumen de relaciones encontradas */}
            {allRelationsFound.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Relaciones Encontradas ({allRelationsFound.length})
                </Label>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="flex flex-wrap gap-1.5">
                    {allRelationsFound.map((rel, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className={cn(
                          'font-mono text-xs',
                          relationColors[rel.relation]
                        )}
                      >
                        {rel.symbol1} {rel.relation} {rel.symbol2}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Leyenda de relaciones */}
            <div className="flex flex-wrap gap-4 text-xs pt-2 border-t">
              <span className="text-muted-foreground">Leyenda:</span>
              {Object.entries(relationDescriptions).filter(([k]) => k !== '·').map(([symbol, desc]) => (
                <div key={symbol} className="flex items-center gap-1">
                  <Badge
                    variant="outline"
                    className={cn('font-mono', relationColors[symbol as keyof typeof relationColors])}
                  >
                    a {symbol} b
                  </Badge>
                  <span className="text-muted-foreground">= "{desc}"</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

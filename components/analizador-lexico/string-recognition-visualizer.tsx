'use client';

/**
 * Componente para mostrar el reconocimiento de una cadena paso a paso
 * con visualización sincronizada del autómata
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Automaton, RecognitionResult, RecognitionStep } from '@/lib/types/automata';
import { CopyButton } from '@/components/shared/copy-button';
import { CheckCircle2, XCircle, Play, Pause, SkipForward, SkipBack, RotateCcw } from 'lucide-react';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
// @ts-expect-error - No hay tipos disponibles para este módulo
import coseBilkent from 'cytoscape-cose-bilkent';

// Registrar la extensión solo una vez
if (!(cytoscape as any).coseBilkentRegistered) {
  cytoscape.use(coseBilkent);
  (cytoscape as any).coseBilkentRegistered = true;
}

interface StringRecognitionVisualizerProps {
  automaton: Automaton;
  result: RecognitionResult;
  className?: string;
  stepDelay?: number;
}

/**
 * Convierte el autómata a formato Cytoscape
 */
function automatonToCytoscape(automaton: Automaton) {
  const elements: any[] = [];
  
  automaton.states.forEach((state) => {
    const classes = [];
    if (state.isInitial) classes.push('initial');
    if (state.isFinal) classes.push('final');
    if (!state.isInitial && !state.isFinal) classes.push('normal');
    
    elements.push({
      data: { 
        id: state.id, 
        label: state.label,
        isInitial: state.isInitial,
        isFinal: state.isFinal,
      },
      classes: classes.join(' '),
    });
  });
  
  automaton.transitions.forEach((trans, index) => {
    const isSelfLoop = trans.from === trans.to;
    
    elements.push({
      data: {
        id: `edge-${trans.from}-${trans.to}-${trans.symbol}-${index}`,
        source: trans.from,
        target: trans.to,
        label: trans.symbol,
        isSelfLoop,
      },
      classes: isSelfLoop ? 'selfloop' : '',
    });
  });
  
  return elements;
}

/**
 * Genera los estilos de Cytoscape adaptados al tema
 */
function getStylesheet(isDarkMode: boolean): any[] {
  const colors = isDarkMode ? {
    nodeBg: '#1f2937',
    nodeBorder: '#6b7280',
    nodeText: '#f9fafb',
    initialBorder: '#22c55e',
    finalBorder: '#f97316',
    edgeLine: '#4b5563',
    edgeText: '#f9fafb',
    edgeLabelBg: '#374151',
    highlightNode: '#fbbf24',
    highlightNodeBg: '#78350f',
    highlightEdge: '#fbbf24',
    currentNode: '#22c55e',
    currentNodeBg: '#14532d',
  } : {
    nodeBg: '#ffffff',
    nodeBorder: '#9ca3af',
    nodeText: '#111827',
    initialBorder: '#16a34a',
    finalBorder: '#ea580c',
    edgeLine: '#9ca3af',
    edgeText: '#111827',
    edgeLabelBg: '#f3f4f6',
    highlightNode: '#d97706',
    highlightNodeBg: '#fef3c7',
    highlightEdge: '#d97706',
    currentNode: '#16a34a',
    currentNodeBg: '#dcfce7',
  };

  return [
    {
      selector: 'node',
      style: {
        'background-color': colors.nodeBg,
        'border-width': 2,
        'border-color': colors.nodeBorder,
        'label': 'data(label)',
        'text-valign': 'center',
        'text-halign': 'center',
        'color': colors.nodeText,
        'font-size': '14px',
        'font-weight': 'bold',
        'font-family': 'ui-monospace, monospace',
        'width': 45,
        'height': 45,
        'transition-property': 'background-color, border-color, border-width',
        'transition-duration': '0.3s',
      },
    },
    {
      selector: 'node.initial',
      style: {
        'border-width': 3,
        'border-color': colors.initialBorder,
      },
    },
    {
      selector: 'node.final',
      style: {
        'border-width': 3,
        'border-color': colors.finalBorder,
        'border-style': 'double',
      },
    },
    {
      selector: 'node.initial.final',
      style: {
        'border-width': 4,
        'border-color': colors.finalBorder,
        'border-style': 'double',
      },
    },
    {
      selector: 'edge',
      style: {
        'width': 2,
        'line-color': colors.edgeLine,
        'target-arrow-color': colors.edgeLine,
        'target-arrow-shape': 'triangle',
        'arrow-scale': 1,
        'curve-style': 'bezier',
        'label': 'data(label)',
        'text-background-color': colors.edgeLabelBg,
        'text-background-opacity': 1,
        'text-background-padding': '3px',
        'text-background-shape': 'roundrectangle',
        'color': colors.edgeText,
        'font-size': '12px',
        'font-weight': 'bold',
        'font-family': 'ui-monospace, monospace',
        'text-margin-y': -8,
        'text-rotation': 'autorotate',
        'source-distance-from-node': 3,
        'target-distance-from-node': 3,
        'transition-property': 'line-color, target-arrow-color, width',
        'transition-duration': '0.3s',
      },
    },
    {
      selector: 'edge.selfloop',
      style: {
        'curve-style': 'bezier',
        'loop-direction': '-45deg',
        'loop-sweep': '-90deg',
        'control-point-step-size': 50,
        'text-rotation': '0deg',
        'text-margin-y': -12,
      },
    },
    // Estado actual (donde estamos)
    {
      selector: 'node.current',
      style: {
        'border-color': colors.currentNode,
        'border-width': 5,
        'background-color': colors.currentNodeBg,
      },
    },
    // Estado actual con animación de pulso
    {
      selector: 'node.pulse',
      style: {
        'border-color': colors.currentNode,
        'border-width': 6,
        'background-color': colors.currentNodeBg,
        'width': 55,
        'height': 55,
      },
    },
    // Transición activa
    {
      selector: 'edge.active',
      style: {
        'line-color': colors.highlightEdge,
        'target-arrow-color': colors.highlightEdge,
        'width': 4,
        'z-index': 999,
      },
    },
    // Transición con animación de pulso
    {
      selector: 'edge.pulse',
      style: {
        'line-color': colors.highlightEdge,
        'target-arrow-color': colors.highlightEdge,
        'width': 6,
        'z-index': 999,
      },
    },
    // Nodos visitados
    {
      selector: 'node.visited',
      style: {
        'border-color': colors.highlightNode,
        'background-color': colors.highlightNodeBg,
      },
    },
    // Aristas ya recorridas
    {
      selector: 'edge.traversed',
      style: {
        'line-color': colors.highlightNode,
        'target-arrow-color': colors.highlightNode,
        'width': 3,
      },
    },
  ];
}

export function StringRecognitionVisualizer({
  automaton,
  result,
  className,
  stepDelay = 1000,
}: StringRecognitionVisualizerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  
  const steps = result.steps || [];
  const totalSteps = steps.length;

  // Detectar modo oscuro
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();
    
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    
    return () => observer.disconnect();
  }, []);

  // Convertir autómata a elementos
  const elements = useMemo(() => automatonToCytoscape(automaton), [automaton]);
  
  // Obtener estilos según el tema
  const stylesheet = useMemo(() => getStylesheet(isDarkMode), [isDarkMode]);

  // Limpiar intervalo al desmontar
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Control de reproducción
  const stopAutoPlay = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const startAutoPlay = useCallback(() => {
    if (intervalRef.current) return;
    
    const id = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= totalSteps - 1) {
          stopAutoPlay();
          return prev;
        }
        return prev + 1;
      });
    }, stepDelay);
    
    intervalRef.current = id;
    setIsPlaying(true);
  }, [totalSteps, stepDelay, stopAutoPlay]);

  const handlePlayPause = () => {
    if (isPlaying) {
      stopAutoPlay();
    } else {
      startAutoPlay();
    }
  };

  const handlePrevious = () => {
    stopAutoPlay();
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    stopAutoPlay();
    setCurrentStep((prev) => Math.min(totalSteps - 1, prev + 1));
  };

  const handleReset = () => {
    stopAutoPlay();
    setCurrentStep(0);
  };

  // Aplicar highlight al autómata según el paso actual
  useEffect(() => {
    if (!cyRef.current || steps.length === 0) return;
    
    const cy = cyRef.current;
    
    // Limpiar todos los highlights
    cy.elements().removeClass('current visited active traversed pulse');
    
    // Obtener el paso actual
    const step = steps[currentStep];
    if (!step) return;

    // Marcar nodos visitados (todos los nextState de pasos anteriores)
    const visitedStates = new Set<string>();
    for (let i = 0; i <= currentStep; i++) {
      const prevStep = steps[i];
      // El estado al que llegamos en cada paso es nextState
      const state = automaton.states.find(s => s.label === prevStep.nextState);
      if (state && i < currentStep) {
        visitedStates.add(state.id);
      }
    }
    visitedStates.forEach(stateId => {
      cy.getElementById(stateId).addClass('visited');
    });

    // Marcar aristas ya recorridas (todas las transiciones de pasos anteriores)
    for (let i = 1; i <= currentStep; i++) {
      const prevStep = steps[i];
      const sourceState = automaton.states.find(s => s.label === prevStep.currentState);
      const targetState = automaton.states.find(s => s.label === prevStep.nextState);
      
      if (sourceState && targetState && prevStep.symbol) {
        cy.edges().forEach((edge) => {
          if (
            edge.data('source') === sourceState.id && 
            edge.data('target') === targetState.id &&
            edge.data('label') === prevStep.symbol
          ) {
            // Si es el paso actual, marcar como activa con pulso
            if (i === currentStep) {
              edge.addClass('active pulse');
            } else {
              edge.addClass('traversed');
            }
          }
        });
      }
    }

    // Marcar el estado actual (nextState del paso actual)
    const currentState = automaton.states.find(s => s.label === step.nextState);
    if (currentState) {
      cy.getElementById(currentState.id).addClass('current pulse');
      
      // Remover la clase pulse después de 300ms para crear el efecto de animación
      setTimeout(() => {
        if (cyRef.current) {
          cyRef.current.getElementById(currentState.id).removeClass('pulse');
          cyRef.current.edges('.pulse').removeClass('pulse');
        }
      }, 300);
    }
  }, [currentStep, steps, automaton]);

  // Aplicar layout cuando los elementos cambien
  useEffect(() => {
    if (cyRef.current && elements.length > 0) {
      setTimeout(() => {
        cyRef.current?.layout({
          name: 'cose-bilkent',
          quality: 'proof',
          nodeRepulsion: 5000,
          idealEdgeLength: 100,
          edgeElasticity: 0.45,
          gravity: 0.25,
          gravityRange: 3.8,
          randomize: true,
          fit: true,
          padding: 40,
          animate: true,
          animationDuration: 600,
          animationEasing: 'ease-out-cubic',
          numIter: 2500,
        } as any).run();
      }, 100);
    }
  }, [elements]);

  // Actualizar estilos cuando cambia el tema
  useEffect(() => {
    if (cyRef.current) {
      cyRef.current.style(stylesheet);
    }
  }, [stylesheet]);

  const handleCy = (cy: cytoscape.Core) => {
    cyRef.current = cy;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Reconocimiento de Cadena</CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant={result.accepted ? 'default' : 'destructive'}
              className="flex items-center gap-1"
            >
              {result.accepted ? (
                <>
                  <CheckCircle2 className="size-3" />
                  Aceptada
                </>
              ) : (
                <>
                  <XCircle className="size-3" />
                  Rechazada
                </>
              )}
            </Badge>
            <CopyButton
              content={steps.map((s) => `${s.currentState} → ${s.symbol} → ${s.nextState}`).join('\n')}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controles de reproducción */}
        <div className="flex items-center justify-center gap-2">
          <Button size="sm" variant="outline" onClick={handleReset} title="Reiniciar">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={handlePrevious} disabled={currentStep === 0}>
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="default" onClick={handlePlayPause} className="min-w-24">
            {isPlaying ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
            {isPlaying ? 'Pausar' : 'Reproducir'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleNext}
            disabled={currentStep === totalSteps - 1}
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Indicador de progreso */}
        <div>
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
            <span>Paso {currentStep + 1} de {totalSteps}</span>
            <span>{Math.round(((currentStep + 1) / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Visualización del autómata */}
        <div className="relative w-full h-96 rounded-lg border bg-muted/20 overflow-hidden">
          <CytoscapeComponent
            elements={elements}
            style={{ width: '100%', height: '100%' }}
            stylesheet={stylesheet}
            cy={handleCy}
            layout={{ name: 'preset' }}
            minZoom={0.5}
            maxZoom={2}
            wheelSensitivity={0.2}
            boxSelectionEnabled={false}
            autounselectify={true}
            userPanningEnabled={true}
            userZoomingEnabled={true}
          />
          
          {/* Leyenda compacta */}
          <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-sm rounded-md border px-2 py-1.5 shadow-sm text-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full border-2 border-green-500 bg-green-100 dark:bg-green-900" />
                <span>Actual</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full border-2 border-amber-500 bg-amber-100 dark:bg-amber-900" />
                <span>Visitado</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de pasos */}
        {steps.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {steps.slice(0, currentStep + 1).map((step, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-center gap-3 p-2.5 rounded-lg border transition-all',
                  index === currentStep
                    ? 'bg-primary/10 border-primary shadow-md'
                    : 'bg-muted/30 border-border'
                )}
              >
                <Badge variant="outline" className="font-mono text-xs">
                  {index + 1}
                </Badge>
                <div className="flex items-center gap-2 flex-1 font-mono text-sm">
                  <span className={cn(
                    "font-bold",
                    index === currentStep ? "text-primary" : "text-blue-600 dark:text-blue-400"
                  )}>
                    {step.currentState}
                  </span>
                  <span className="text-muted-foreground">→</span>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {step.symbol || 'ε'}
                  </Badge>
                  <span className="text-muted-foreground">→</span>
                  <span className={cn(
                    "font-bold",
                    index === currentStep ? "text-primary" : "text-blue-600 dark:text-blue-400"
                  )}>
                    {step.nextState}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mensaje final */}
        {currentStep === totalSteps - 1 && (
          <div className={cn(
            "p-4 rounded-lg border",
            result.accepted 
              ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800" 
              : "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
          )}>
            <div className="flex items-center gap-2 mb-1">
              {result.accepted ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              )}
              <span className="font-semibold">
                {result.accepted ? 'Cadena aceptada' : 'Cadena rechazada'}
              </span>
            </div>
            {result.message && (
              <p className="text-sm text-muted-foreground ml-7">{result.message}</p>
            )}
          </div>
        )}

        {/* Si no hay pasos */}
        {steps.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No hay pasos de reconocimiento para mostrar
          </div>
        )}
      </CardContent>
    </Card>
  );
}

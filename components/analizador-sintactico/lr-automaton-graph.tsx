'use client';

/**
 * Componente para visualizar autómatas LR usando Cytoscape.js
 * 
 * Visualiza el AFD de conjuntos canónicos o AFN de elementos LR(0)
 * con opciones para mostrar los items completos dentro de cada nodo.
 */

import { useEffect, useRef, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Download, ZoomIn, ZoomOut, Maximize2, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import coseBilkent from 'cytoscape-cose-bilkent';
import type { LRStateSet } from '@/lib/types/syntax-analysis';
import type { LRAutomaton } from '@/lib/types/grammar';

// Registrar la extensión solo una vez
if (!(cytoscape as any).coseBilkentRegistered) {
  cytoscape.use(coseBilkent);
  (cytoscape as any).coseBilkentRegistered = true;
}

interface LRAutomatonGraphProps {
  /** Conjuntos canónicos (AFD) - para SLR, LR(1), LALR */
  canonicalSets?: LRStateSet[];
  /** Autómata LR(0) (AFN) - para AFN de elementos */
  automaton?: LRAutomaton;
  className?: string;
  /** Si es true, muestra todos los items dentro de cada nodo */
  showItemsInNodes?: boolean;
}

/**
 * Formatea un item LR para mostrar en nodo
 */
function formatItemForNode(item: LRStateSet['items'][0]): string {
  const { production, dotPosition, lookahead } = item;
  const right = [...production.right];
  right.splice(dotPosition, 0, '•');
  const la = lookahead ? `, ${lookahead}` : '';
  return `${production.left}→${right.join(' ')}${la}`;
}

/**
 * Convierte un AFN (LRAutomaton) a formato Cytoscape
 */
function afnToCytoscape(automaton: LRAutomaton, showItemsInNodes: boolean) {
  const elements: any[] = [];
  
  // Crear nodos para cada estado del AFN
  for (const state of automaton.states) {
    const isInitial = state.id === automaton.startState;
    const classes = [];
    if (isInitial) classes.push('initial');
    
    // Para el AFN, cada estado tiene exactamente 1 item
    const item = state.items[0];
    const hasAccept = item.production.left.endsWith("'") && 
                     item.dotPosition === item.production.right.length;
    if (hasAccept) classes.push('accepting');
    
    // Crear etiqueta - mostrar la producción
    let label = state.id;
    if (showItemsInNodes && item) {
      const right = [...item.production.right];
      right.splice(item.dotPosition, 0, '•');
      label = `${item.production.left}→${right.join(' ')}`;
    }
    
    elements.push({
      data: {
        id: state.id,
        label,
      },
      classes: classes.join(' '),
    });
  }
  
  // Crear transiciones
  for (const state of automaton.states) {
    for (const [symbol, targetIds] of state.transitions) {
      // Manejar múltiples destinos (transiciones ε)
      const targets = targetIds.includes(',') ? targetIds.split(',') : [targetIds];
      for (const targetId of targets) {
        elements.push({
          data: {
            id: `edge-${state.id}-${targetId}-${symbol}`,
            source: state.id,
            target: targetId,
            label: symbol === 'ε' ? 'ε' : symbol,
          },
          classes: symbol === 'ε' ? 'epsilon' : '',
        });
      }
    }
  }
  
  return elements;
}

/**
 * Convierte los conjuntos canónicos a formato Cytoscape
 */
function canonicalSetsToCytoscape(
  canonicalSets: LRStateSet[],
  showItemsInNodes: boolean
) {
  const elements: any[] = [];
  
  // Crear nodos para cada conjunto canónico
  for (const set of canonicalSets) {
    const isInitial = set.id === 0;
    const hasAccept = set.items.some(
      item => item.production.left.endsWith("'") && 
              item.dotPosition === item.production.right.length
    );
    
    const classes = [];
    if (isInitial) classes.push('initial');
    if (hasAccept) classes.push('accepting');
    
    // Crear etiqueta del nodo - mostrar TODOS los items
    let label = `I${set.id}`;
    if (showItemsInNodes) {
      const itemsStr = set.items.map(item => formatItemForNode(item)).join('\n');
      label = `I${set.id}\n${itemsStr}`;
    }
    
    elements.push({
      data: {
        id: `I${set.id}`,
        label,
        itemCount: set.items.length,
      },
      classes: classes.join(' '),
    });
  }
  
  // Crear transiciones entre conjuntos
  for (const set of canonicalSets) {
    for (const [symbol, targetId] of set.transitions) {
      elements.push({
        data: {
          id: `edge-${set.id}-${targetId}-${symbol}`,
          source: `I${set.id}`,
          target: `I${targetId}`,
          label: symbol,
        },
      });
    }
  }
  
  return elements;
}

/**
 * Genera los estilos de Cytoscape adaptados al tema
 */
function getStylesheet(isDarkMode: boolean, showItemsInNodes: boolean): any[] {
  const colors = isDarkMode ? {
    nodeBg: '#1f2937',
    nodeBorder: '#fbbf24',
    nodeText: '#f9fafb',
    initialBorder: '#22c55e',
    acceptBorder: '#f97316',
    edgeLine: '#60a5fa',
    edgeText: '#f9fafb',
    edgeLabelBg: '#374151',
  } : {
    nodeBg: '#ffffff',
    nodeBorder: '#d97706',
    nodeText: '#111827',
    initialBorder: '#16a34a',
    acceptBorder: '#ea580c',
    edgeLine: '#3b82f6',
    edgeText: '#111827',
    edgeLabelBg: '#f3f4f6',
  };

  // Tamaño dinámico basado en si mostramos items
  const nodeWidth = showItemsInNodes ? 180 : 50;
  const fontSize = showItemsInNodes ? '9px' : '14px';

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
        'font-size': fontSize,
        'font-weight': 'bold',
        'font-family': 'ui-monospace, monospace',
        'text-wrap': 'wrap',
        'text-max-width': showItemsInNodes ? '170px' : '45px',
        'shape': showItemsInNodes ? 'roundrectangle' : 'ellipse',
        'width': nodeWidth,
        'height': showItemsInNodes ? 'label' : 50,
        'padding': showItemsInNodes ? '8px' : '0px',
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
      selector: 'node.accepting',
      style: {
        'border-width': 3,
        'border-color': colors.acceptBorder,
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
        'font-size': '11px',
        'font-weight': 'bold',
        'font-family': 'ui-monospace, monospace',
        'text-margin-y': -8,
        'text-rotation': 'autorotate',
        'source-distance-from-node': 5,
        'target-distance-from-node': 5,
      },
    },
    {
      selector: 'edge.epsilon',
      style: {
        'line-style': 'dashed',
        'width': 1.5,
      },
    },
    {
      selector: 'edge[source = target]',
      style: {
        'curve-style': 'bezier',
        'loop-direction': '-45deg',
        'loop-sweep': '-90deg',
        'control-point-step-size': 60,
      },
    },
  ];
}

export function LRAutomatonGraph({
  canonicalSets,
  automaton,
  className,
  showItemsInNodes = false,
}: LRAutomatonGraphProps) {
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Validar que se proporcione al menos uno
  if (!canonicalSets && !automaton) {
    return <div className="text-destructive">Error: Se requiere canonicalSets o automaton</div>;
  }
  
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
  
  // Convertir a elementos Cytoscape
  const elements = useMemo(() => {
    if (automaton) {
      return afnToCytoscape(automaton, showItemsInNodes);
    } else if (canonicalSets) {
      return canonicalSetsToCytoscape(canonicalSets, showItemsInNodes);
    }
    return [];
  }, [canonicalSets, automaton, showItemsInNodes]);
  
  // Obtener estilos según el tema
  const stylesheet = useMemo(
    () => getStylesheet(isDarkMode, showItemsInNodes),
    [isDarkMode, showItemsInNodes]
  );
  
  // Aplicar layout cuando los elementos cambien
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (cyRef.current && elements.length > 0) {
      timeoutId = setTimeout(() => {
        const cy = cyRef.current;
        if (cy && !cy.destroyed()) {
          try {
            cy.layout({
              name: 'cose-bilkent',
              quality: 'proof',
              nodeRepulsion: showItemsInNodes ? 15000 : 8000,
              idealEdgeLength: showItemsInNodes ? 250 : 120,
              edgeElasticity: 0.45,
              gravity: 0.15,
              gravityRange: 3.8,
              randomize: true,
              fit: true,
              padding: 50,
              animate: true,
              animationDuration: 800,
              animationEasing: 'ease-out-cubic',
              numIter: 2500,
            } as any).run();
          } catch (e) {
            console.debug('Layout cancelled - component unmounted');
          }
        }
      }, 100);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [elements, showItemsInNodes]);
  
  // Actualizar estilos cuando cambia el tema
  useEffect(() => {
    if (cyRef.current) {
      cyRef.current.style(stylesheet);
    }
  }, [stylesheet]);
  
  const handleCy = (cy: cytoscape.Core) => {
    cyRef.current = cy;
  };
  
  const handleZoomIn = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 1.2);
      cyRef.current.center();
    }
  };
  
  const handleZoomOut = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() / 1.2);
      cyRef.current.center();
    }
  };
  
  const handleFit = () => {
    if (cyRef.current) {
      cyRef.current.fit(undefined, 40);
    }
  };
  
  const handleExport = () => {
    if (cyRef.current) {
      const png = cyRef.current.png({
        full: true,
        scale: 2,
        bg: isDarkMode ? '#1f2937' : '#ffffff',
      });
      const link = document.createElement('a');
      link.href = png;
      link.download = `lr-automaton-${Date.now()}.png`;
      link.click();
    }
  };
  
  const handleCopyImage = async () => {
    if (cyRef.current) {
      try {
        const png = cyRef.current.png({
          full: true,
          scale: 2,
          bg: isDarkMode ? '#1f2937' : '#ffffff',
        });
        
        const response = await fetch(png);
        const blob = await response.blob();
        
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
      } catch (err) {
        console.error('Error al copiar imagen:', err);
      }
    }
  };
  
  return (
    <div className={cn('relative w-full rounded-lg border bg-muted/20 overflow-hidden', className)}>
      <div className="w-full h-125">
        <CytoscapeComponent
          elements={elements}
          style={{ width: '100%', height: '100%' }}
          stylesheet={stylesheet}
          cy={handleCy}
          layout={{ name: 'breadthfirst', avoidOverlap: true }}
          minZoom={0.1}
          maxZoom={3}
          wheelSensitivity={0.2}
          boxSelectionEnabled={false}
          autounselectify={false}
          
        />
      </div>
      
      {/* Controles */}
      <div className="absolute top-2 right-2 flex gap-1 z-10">
        <Button size="sm" variant="secondary" onClick={handleZoomIn} className="shadow-md h-8 w-8 p-0" title="Acercar">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="secondary" onClick={handleZoomOut} className="shadow-md h-8 w-8 p-0" title="Alejar">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="secondary" onClick={handleFit} className="shadow-md h-8 w-8 p-0" title="Ajustar vista">
          <Maximize2 className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="secondary" onClick={handleCopyImage} className="shadow-md h-8 w-8 p-0" title="Copiar imagen">
          <Copy className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="secondary" onClick={handleExport} className="shadow-md" title="Exportar imagen">
          <Download className="h-4 w-4 mr-1" />
          PNG
        </Button>
      </div>
      
      {/* Leyenda */}
      <div className="absolute bottom-2 left-2 bg-background/95 backdrop-blur-sm rounded-md border p-3 shadow-md z-10">
        <div className="text-xs font-medium mb-2 text-foreground">Leyenda:</div>
        <div className="flex flex-col gap-1.5 text-xs text-foreground">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full border-[3px] border-green-500 bg-background" />
            <span>Estado inicial</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full border-[3px] border-orange-500 bg-background flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full border-2 border-orange-500" />
            </div>
            <span>Estado de aceptación</span>
          </div>
        </div>
      </div>
    </div>
  );
}

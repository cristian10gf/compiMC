'use client';

/**
 * Componente para visualizar autómatas finitos usando Cytoscape.js
 * Soporta AFN, AFD y visualización de transiciones
 * 
 * Características:
 * - Compatible con SSR (Next.js)
 * - Soporte para modo oscuro y claro
 * - Visualización de autómatas con etiquetas en las aristas
 * - Exportación a PNG
 */

import { useEffect, useRef, useState, useMemo } from 'react';
import { Automaton, Transition } from '@/lib/types/automata';
import { Button } from '@/components/ui/button';
import { Download, ZoomIn, ZoomOut, Maximize2, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import coseBilkent from 'cytoscape-cose-bilkent';

// Registrar la extensión solo una vez
if (!(cytoscape as any).coseBilkentRegistered) {
  cytoscape.use(coseBilkent);
  (cytoscape as any).coseBilkentRegistered = true;
}

interface AutomataGraphCytoscapeProps {
  automaton: Automaton;
  highlightedPath?: string[];
  onNodeClick?: (stateId: string) => void;
  onEdgeClick?: (transition: Transition) => void;
  className?: string;
}

/**
 * Convierte el autómata a formato Cytoscape
 */
function automatonToCytoscape(automaton: Automaton) {
  const elements: any[] = [];
  
  // Convertir nodos
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
  
  // Convertir cada transición como una arista separada
  automaton.transitions.forEach((trans, index) => {
    const isSelfLoop = trans.from === trans.to;
    
    elements.push({
      data: {
        id: `edge-${trans.from}-${trans.to}-${index}`,
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
    nodeBorder: '#fbbf24',
    nodeText: '#f9fafb',
    initialBorder: '#22c55e',
    finalBorder: '#f97316',
    edgeLine: '#60a5fa',
    edgeText: '#f9fafb',
    edgeLabelBg: '#374151',
    highlightBorder: '#22c55e',
    highlightBg: '#065f46',
    selectedBorder: '#3b82f6',
  } : {
    nodeBg: '#ffffff',
    nodeBorder: '#d97706',
    nodeText: '#111827',
    initialBorder: '#16a34a',
    finalBorder: '#ea580c',
    edgeLine: '#3b82f6',
    edgeText: '#111827',
    edgeLabelBg: '#f3f4f6',
    highlightBorder: '#16a34a',
    highlightBg: '#dcfce7',
    selectedBorder: '#2563eb',
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
        'font-size': '16px',
        'font-weight': 'bold',
        'font-family': 'ui-monospace, monospace',
        'width': 50,
        'height': 50,
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
        'text-background-padding': '4px',
        'text-background-shape': 'roundrectangle',
        'color': colors.edgeText,
        'font-size': '14px',
        'font-weight': 'bold',
        'font-family': 'ui-monospace, monospace',
        'text-margin-y': -8,
        'text-rotation': 'autorotate',
        'source-distance-from-node': 3,
        'target-distance-from-node': 3,
      },
    },
    {
      selector: 'edge.selfloop',
      style: {
        'curve-style': 'bezier',
        'loop-direction': '-45deg',
        'loop-sweep': '-90deg',
        'control-point-step-size': 60,
        'text-rotation': '0deg',
        'text-margin-y': -15,
      },
    },
    {
      selector: 'node:selected',
      style: {
        'border-color': colors.selectedBorder,
        'border-width': 4,
      },
    },
    {
      selector: 'edge:selected',
      style: {
        'line-color': colors.selectedBorder,
        'target-arrow-color': colors.selectedBorder,
        'width': 3,
      },
    },
    {
      selector: 'node.highlighted',
      style: {
        'border-color': colors.highlightBorder,
        'border-width': 5,
        'background-color': colors.highlightBg,
      },
    },
    {
      selector: 'edge.highlighted',
      style: {
        'line-color': colors.highlightBorder,
        'target-arrow-color': colors.highlightBorder,
        'width': 4,
        'z-index': 999,
      },
    },
  ];
}

export function AutomataGraphCytoscape({
  automaton,
  highlightedPath = [],
  onNodeClick,
  onEdgeClick,
  className,
}: AutomataGraphCytoscapeProps) {
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
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
  
  // Aplicar layout cuando los elementos cambien
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (cyRef.current && elements.length > 0) {
      timeoutId = setTimeout(() => {
        // Verificar que cy sigue existiendo y no ha sido destruido
        const cy = cyRef.current;
        if (cy && !cy.destroyed()) {
          try {
            cy.layout({
              name: 'cose-bilkent',
              quality: 'proof',
              nodeRepulsion: 6000,
              idealEdgeLength: 120,
              edgeElasticity: 0.45,
              gravity: 0.25,
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
            // Ignorar errores si el componente se desmontó
            console.debug('Layout cancelled - component unmounted');
          }
        }
      }, 100);
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [elements]);
  
  // Aplicar highlight
  useEffect(() => {
    if (!cyRef.current) return;
    
    const cy = cyRef.current;
    cy.elements().removeClass('highlighted');
    
    if (highlightedPath.length > 0) {
      highlightedPath.forEach(id => {
        cy.getElementById(id).addClass('highlighted');
      });
      
      for (let i = 0; i < highlightedPath.length - 1; i++) {
        const sourceId = highlightedPath[i];
        const targetId = highlightedPath[i + 1];
        cy.edges().forEach((edge) => {
          if (edge.data('source') === sourceId && edge.data('target') === targetId) {
            edge.addClass('highlighted');
          }
        });
      }
    }
  }, [highlightedPath]);
  
  // Actualizar estilos cuando cambia el tema
  useEffect(() => {
    if (cyRef.current) {
      cyRef.current.style(stylesheet);
    }
  }, [stylesheet]);
  
  // Configurar event handlers
  const handleCy = (cy: cytoscape.Core) => {
    cyRef.current = cy;
    
    cy.on('tap', 'node', (evt) => {
      onNodeClick?.(evt.target.id());
    });
    
    cy.on('tap', 'edge', (evt) => {
      const edge = evt.target;
      const transition = automaton.transitions.find(
        t => t.from === edge.data('source') && t.to === edge.data('target')
      );
      if (transition) {
        onEdgeClick?.(transition);
      }
    });
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
      link.download = `automaton-${automaton.id}-${Date.now()}.png`;
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
          layout={{ name: 'preset' }}
          minZoom={0.3}
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
            <span>Estado final</span>
          </div>
        </div>
      </div>
    </div>
  );
}

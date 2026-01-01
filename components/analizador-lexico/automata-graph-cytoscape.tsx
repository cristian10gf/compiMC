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

import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { Automaton, Transition } from '@/lib/types/automata';
import { Button } from '@/components/ui/button';
import { Download, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Importación dinámica de Cytoscape para evitar errores de SSR
import dynamic from 'next/dynamic';

// Importar cytoscape y extensiones solo en el cliente
let cytoscape: any = null;
let coseBilkent: any = null;

if (typeof window !== 'undefined') {
  cytoscape = require('cytoscape');
  coseBilkent = require('cytoscape-cose-bilkent');
  
  // Registrar la extensión solo una vez
  if (cytoscape && coseBilkent && !(cytoscape as any).coseBilkentRegistered) {
    cytoscape.use(coseBilkent);
    (cytoscape as any).coseBilkentRegistered = true;
  }
}

interface AutomataGraphCytoscapeProps {
  automaton: Automaton;
  highlightedPath?: string[]; // IDs de estados a resaltar
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
  
  // Convertir cada transición como una arista separada (sin agrupar)
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
  // Colores adaptados al tema
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
    // Nodos base
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
        'text-outline-width': 0,
      },
    },
    // Estado inicial
    {
      selector: 'node.initial',
      style: {
        'border-width': 3,
        'border-color': colors.initialBorder,
      },
    },
    // Estado final (doble borde)
    {
      selector: 'node.final',
      style: {
        'border-width': 3,
        'border-color': colors.finalBorder,
        'border-style': 'double',
        'padding': '4px',
      },
    },
    // Estado inicial y final
    {
      selector: 'node.initial.final',
      style: {
        'border-width': 4,
        'border-color': colors.finalBorder,
        'border-style': 'double',
      },
    },
    // Aristas base
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
    // Self-loops
    {
      selector: 'edge.selfloop',
      style: {
        'curve-style': 'bezier',
        'loop-direction': '-45deg',
        'loop-sweep': '-90deg',
        'control-point-step-size': 60,
        'text-rotation': '0deg',
        'text-margin-y': -15,
        'text-margin-x': 0,
      },
    },
    // Nodo seleccionado
    {
      selector: 'node:selected',
      style: {
        'border-color': colors.selectedBorder,
        'border-width': 4,
      },
    },
    // Arista seleccionada
    {
      selector: 'edge:selected',
      style: {
        'line-color': colors.selectedBorder,
        'target-arrow-color': colors.selectedBorder,
        'width': 3,
      },
    },
    // Nodo resaltado
    {
      selector: 'node.highlighted',
      style: {
        'border-color': colors.highlightBorder,
        'border-width': 5,
        'background-color': colors.highlightBg,
        'transition-property': 'border-width, border-color, background-color',
        'transition-duration': '0.3s',
      },
    },
    // Arista resaltada
    {
      selector: 'edge.highlighted',
      style: {
        'line-color': colors.highlightBorder,
        'target-arrow-color': colors.highlightBorder,
        'width': 4,
        'z-index': 999,
        'transition-property': 'width, line-color',
        'transition-duration': '0.3s',
      },
    },
  ];
}

function AutomataGraphCytoscapeInner({
  automaton,
  highlightedPath = [],
  onNodeClick,
  onEdgeClick,
  className,
}: AutomataGraphCytoscapeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Detectar si estamos en el cliente
  useEffect(() => {
    setIsClient(true);
    // Detectar modo oscuro
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();
    
    // Observar cambios en el tema
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    
    return () => observer.disconnect();
  }, []);
  
  const elements = useMemo(
    () => automatonToCytoscape(automaton),
    [automaton]
  );
  
  const stylesheet = useMemo(
    () => getStylesheet(isDarkMode),
    [isDarkMode]
  );
  
  // Inicializar Cytoscape
  useEffect(() => {
    if (!isClient || !containerRef.current || !cytoscape) return;
    
    // Limpiar instancia anterior
    if (cyRef.current) {
      cyRef.current.destroy();
    }
    
    // Crear nueva instancia de Cytoscape
    const cy = cytoscape({
      container: containerRef.current,
      elements: elements,
      style: stylesheet,
      layout: { name: 'preset' }, // Usaremos layout manual después
      wheelSensitivity: 0.2,
      minZoom: 0.3,
      maxZoom: 3,
      boxSelectionEnabled: false,
      autounselectify: false,
    });
    
    cyRef.current = cy;
    
    // Aplicar layout
    const layout = cy.layout({
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
      animate: 'end',
      animationDuration: 800,
      animationEasing: 'ease-out-cubic',
      numIter: 2500,
      tile: false,
      nestingFactor: 0.1,
    } as any);
    
    layout.run();
    
    // Ajustar vista cuando termine el layout
    cy.one('layoutstop', () => {
      cy.fit(undefined, 40);
    });
    
    // Event handlers
    cy.on('tap', 'node', (evt: any) => {
      const node = evt.target;
      onNodeClick?.(node.id());
    });
    
    cy.on('tap', 'edge', (evt: any) => {
      const edge = evt.target;
      if (edge.id() !== 'initial-arrow') {
        const transition = automaton.transitions.find(
          t => t.from === edge.data('source') && t.to === edge.data('target')
        );
        if (transition) {
          onEdgeClick?.(transition);
        }
      }
    });
    
    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [isClient, elements, stylesheet, onNodeClick, onEdgeClick, automaton]);
  
  // Aplicar highlight
  useEffect(() => {
    if (!cyRef.current) return;
    
    const cy = cyRef.current;
    cy.elements().removeClass('highlighted');
    
    if (highlightedPath.length > 0) {
      highlightedPath.forEach(id => {
        cy.getElementById(id).addClass('highlighted');
      });
      
      // Highlight edges conectados (buscar por source y target)
      for (let i = 0; i < highlightedPath.length - 1; i++) {
        const sourceId = highlightedPath[i];
        const targetId = highlightedPath[i + 1];
        cy.edges().forEach((edge: any) => {
          if (edge.data('source') === sourceId && edge.data('target') === targetId) {
            edge.addClass('highlighted');
          }
        });
      }
    }
  }, [highlightedPath]);
  
  // Actualizar estilos cuando cambia el tema
  useEffect(() => {
    if (cyRef.current && isClient) {
      cyRef.current.style(stylesheet);
    }
  }, [stylesheet, isClient]);
  
  const handleExport = useCallback(() => {
    if (!cyRef.current) return;
    
    const bgColor = isDarkMode ? '#1f2937' : '#ffffff';
    
    const png = cyRef.current.png({
      output: 'blob',
      bg: bgColor,
      full: true,
      scale: 3,
    });
    
    const url = URL.createObjectURL(png as Blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `automaton-${automaton.id}-${Date.now()}.png`;
    link.click();
    URL.revokeObjectURL(url);
  }, [automaton.id, isDarkMode]);
  
  const handleZoomIn = useCallback(() => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 1.2);
      cyRef.current.center();
    }
  }, []);
  
  const handleZoomOut = useCallback(() => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() / 1.2);
      cyRef.current.center();
    }
  }, []);
  
  const handleFit = useCallback(() => {
    if (cyRef.current) {
      cyRef.current.fit(undefined, 40);
    }
  }, []);
  
  if (!isClient) {
    return (
      <div className={cn('relative w-full rounded-lg border bg-muted/20', className)}>
        <div className="h-125 flex items-center justify-center">
          <div className="text-muted-foreground">Cargando visualización...</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={cn('relative w-full rounded-lg border bg-muted/20 overflow-hidden', className)}>
      <div 
        ref={containerRef}
        className="w-full h-125"
      />
      
      {/* Controles de zoom */}
      <div className="absolute top-2 right-2 flex gap-1 z-10">
        <Button
          size="sm"
          variant="secondary"
          onClick={handleZoomIn}
          className="shadow-md h-8 w-8 p-0"
          title="Acercar"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleZoomOut}
          className="shadow-md h-8 w-8 p-0"
          title="Alejar"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleFit}
          className="shadow-md h-8 w-8 p-0"
          title="Ajustar vista"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleExport}
          className="shadow-md"
          title="Exportar imagen"
        >
          <Download className="h-4 w-4 mr-1" />
          Exportar
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

// Exportar el componente con carga dinámica para evitar SSR
export const AutomataGraphCytoscape = dynamic(
  () => Promise.resolve(AutomataGraphCytoscapeInner),
  { 
    ssr: false,
    loading: () => (
      <div className="relative w-full rounded-lg border bg-muted/20">
        <div className="h-125 flex items-center justify-center">
          <div className="text-muted-foreground animate-pulse">Cargando visualización del autómata...</div>
        </div>
      </div>
    ),
  }
);

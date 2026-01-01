'use client';

/**
 * Componente para visualizar autómatas finitos usando Cytoscape.js
 * Soporta AFN, AFD y visualización de transiciones
 */

import { useEffect, useRef, useCallback, useMemo } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import coseBilkent from 'cytoscape-cose-bilkent';
import edgeEditing from 'cytoscape-edge-editing';
import { Automaton, Transition } from '@/lib/types/automata';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { cn } from '@/lib/utils';

// Registrar extensiones de Cytoscape
if (typeof cytoscape !== 'undefined') {
  cytoscape.use(coseBilkent);
  cytoscape.use(edgeEditing);
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
    elements.push({
      data: { 
        id: state.id, 
        label: state.label,
        isInitial: state.isInitial,
        isFinal: state.isFinal,
      },
      classes: [
        state.isInitial ? 'initial' : '',
        state.isFinal ? 'final' : '',
        !state.isInitial && !state.isFinal ? 'normal' : '',
      ].filter(Boolean).join(' '),
    });
  });
  
  // Agrupar transiciones con el mismo origen y destino
  const transitionGroups = new Map<string, Transition[]>();
  
  automaton.transitions.forEach((trans) => {
    const key = `${trans.from}-${trans.to}`;
    if (!transitionGroups.has(key)) {
      transitionGroups.set(key, []);
    }
    transitionGroups.get(key)!.push(trans);
  });
  
  // Convertir edges
  transitionGroups.forEach((transitions, key) => {
    const labels = transitions.map((t) => t.symbol).join(', ');
    const [from, to] = key.split('-');
    
    elements.push({
      data: {
        id: key,
        source: from,
        target: to,
        label: labels,
        isSelfLoop: from === to,
        // Puntos de control para curvas editables
        controlPointDistances: from === to ? [40] : [50],
        controlPointWeights: from === to ? [0.5] : [0.5],
      },
      classes: from === to ? 'selfloop' : '',
    });
  });
  
  return elements;
}

export function AutomataGraphCytoscape({
  automaton,
  highlightedPath = [],
  onNodeClick,
  onEdgeClick,
  className,
}: AutomataGraphCytoscapeProps) {
  const cyRef = useRef<cytoscape.Core | null>(null);
  
  const elements = useMemo(
    () => automatonToCytoscape(automaton),
    [automaton]
  );
  
  // Estilos de Cytoscape
  const stylesheet: any[] = [
    {
      selector: 'node',
      style: {
        'background-color': '#1f2937',
        'border-width': 2,
        'border-color': '#eab308',
        'label': 'data(label)',
        'text-valign': 'center',
        'text-halign': 'center',
        'color': '#f3f4f6',
        'font-size': '14px',
        'font-weight': 'bold',
        'width': 56,
        'height': 56,
      } as any,
    },
    {
      selector: 'node.initial',
      style: {
        'border-width': 3,
        'border-color': '#22c55e',
      } as any,
    },
    {
      selector: 'node.final',
      style: {
        'border-width': 6,
        'border-color': '#f97316',
        'border-style': 'double',
      } as any,
    },
    {
      selector: 'edge',
      style: {
        'width': 3,
        'line-color': '#60a5fa',
        'target-arrow-color': '#60a5fa',
        'target-arrow-shape': 'triangle',
        'curve-style': 'unbundled-bezier', // Permite curvas más flexibles
        'control-point-distances': [40, -40], // Puntos de control para curvas
        'control-point-weights': [0.25, 0.75],
        'label': 'data(label)',
        'text-background-color': '#1f2937',
        'text-background-opacity': 0.95,
        'text-background-padding': '6px',
        'text-background-shape': 'roundrectangle',
        'text-border-color': '#60a5fa',
        'text-border-width': 2,
        'text-border-opacity': 1,
        'color': '#f3f4f6',
        'font-size': '14px',
        'font-weight': 'bold',
        'text-rotation': 'autorotate',
        'text-margin-y': -10,
      } as any,
    },
    {
      selector: 'edge.selfloop',
      style: {
        'curve-style': 'unbundled-bezier',
        'control-point-distances': [40],
        'control-point-weights': [0.5],
        'loop-direction': '-45deg',
        'loop-sweep': '-90deg',
      } as any,
    },
    {
      selector: 'node:selected',
      style: {
        'border-color': '#3b82f6',
        'border-width': 4,
      } as any,
    },
    {
      selector: 'edge:selected',
      style: {
        'line-color': '#3b82f6',
        'target-arrow-color': '#3b82f6',
        'width': 4,
      } as any,
    },
    {
      selector: 'node.highlighted',
      style: {
        'border-color': '#22c55e',
        'border-width': 5,
        'background-color': '#065f46',
        'transition-property': 'border-width, border-color, background-color',
        'transition-duration': '0.3s',
      } as any,
    },
    {
      selector: 'edge.highlighted',
      style: {
        'line-color': '#22c55e',
        'target-arrow-color': '#22c55e',
        'width': 5,
        'z-index': 999,
        'transition-property': 'width, line-color',
        'transition-duration': '0.3s',
      } as any,
    },
  ];
  
  // Aplicar highlight
  useEffect(() => {
    if (cyRef.current && highlightedPath.length > 0) {
      cyRef.current.elements().removeClass('highlighted');
      
      highlightedPath.forEach(id => {
        cyRef.current?.getElementById(id).addClass('highlighted');
      });
      
      // Highlight edges conectados
      for (let i = 0; i < highlightedPath.length - 1; i++) {
        const edgeId = `${highlightedPath[i]}-${highlightedPath[i + 1]}`;
        cyRef.current?.getElementById(edgeId).addClass('highlighted');
      }
    } else if (cyRef.current) {
      cyRef.current.elements().removeClass('highlighted');
    }
  }, [highlightedPath]);
  
  const handleExport = useCallback(() => {
    if (!cyRef.current) return;
    
    // Exportar como imagen PNG
    const png = cyRef.current.png({
      output: 'blob',
      bg: '#1f2937',
      full: true,
      scale: 3,
    });
    
    // Crear enlace de descarga
    const url = URL.createObjectURL(png as Blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `automaton-${automaton.id}-${Date.now()}.png`;
    link.click();
    URL.revokeObjectURL(url);
  }, [automaton]);
  
  const handleCyInit = useCallback((cy: cytoscape.Core) => {
    cyRef.current = cy;
    
    // Aplicar layout cose-bilkent (excelente para grafos dirigidos con ciclos)
    cy.layout({
      
      name: 'cose-bilkent',
      // Calidad del layout
      quality: 'proof', // 'draft' (rápido) | 'default' | 'proof' (mejor calidad, más lento)
      rankDir: 'LR', // Dirección del grafo: TB (top-bottom), LR (left-right), BT, RL
      // Fuerzas de atracción/repulsión
      nodeRepulsion: 8000, // Repulsión entre nodos
      idealEdgeLength: 100, // Longitud ideal de las aristas
      edgeElasticity: 0.45, // Elasticidad de las aristas (0-1)
      
      // Gravedad y distribución
      gravity: 0.25, // Fuerza hacia el centro
      gravityRange: 3.8, // Rango de la gravedad
      
      // Configuración general
      randomize: false, // Usar posiciones existentes como punto de partida
      fit: true, // Ajustar al viewport
      padding: 60,
      
      // Animación
      animate: true,
      animationDuration: 1000,
      animationEasing: 'ease-out',
      
      // Opciones avanzadas para ciclos
      numIter: 2500, // Iteraciones (más = mejor calidad)
      tile: false, // No forzar disposición en cuadrícula
      tilingPaddingVertical: 10,
      tilingPaddingHorizontal: 10,
      
      // Mejoras para grafos direccionales
      nestingFactor: 0.1, // Factor de anidamiento
      initialEnergyOnIncremental: 0.3, // Energía inicial en layout incremental
    } as any).run();
    
    // Inicializar edición de curvas de aristas
    const edgeEditingApi = (cy as any).edgeEditing({
      // Opciones de visualización
      bendRemovalSensitivity: 8, // Sensibilidad para eliminar curvas
      initAnchorsAutomatically: false, // No crear anclas automáticamente
      useDefaultAnchors: false,
      
      // Estilo de las anclas/manijas de control
      anchorShapeSizeFactor: 2,
      
      // Habilitar edición
      enableMultipleAnchorRemovalOption: true,
      
      // Eventos
      undoable: false, // No usar sistema de deshacer
    });
    
    // Activar/desactivar modo de edición con doble click en arista
    cy.on('dbltap', 'edge', function(evt) {
      const edge = evt.target;
      
      // Alternar puntos de control
      if (edge.hasClass('edgeEditing-hasBendPoints')) {
        edgeEditingApi.deleteSelectedAnchor(edge);
      } else {
        // Agregar punto de control en el medio
        edgeEditingApi.addBendPoint();
      }
    });
    
    // Event handlers
    cy.on('tap', 'node', function(evt) {
      const node = evt.target;
      onNodeClick?.(node.id());
    });
    
    cy.on('tap', 'edge', function(evt) {
      const edge = evt.target;
      const transition = automaton.transitions.find(
        t => t.from === edge.data('source') && t.to === edge.data('target')
      );
      if (transition) {
        onEdgeClick?.(transition);
      }
    });
  }, [onNodeClick, onEdgeClick, automaton]);
  
  return (
    <div className={cn('relative w-full h-125 rounded-lg border bg-muted/20', className)}>
      <CytoscapeComponent
        elements={elements}
        style={{ width: '100%', height: '500px' }}
        stylesheet={stylesheet}
        cy={handleCyInit}
        className="rounded-lg"
        wheelSensitivity={0.2}
      />
      
      {/* Controles adicionales */}
      <div className="absolute top-2 right-2 flex gap-2 z-10">
        <Button
          size="sm"
          variant="secondary"
          onClick={handleExport}
          className="shadow-md"
        >
          <Download className="mr-1" />
          Exportar
        </Button>
      </div>
      
      {/* Leyenda */}
      <div className="absolute bottom-2 left-2 bg-background/90 rounded-md border p-3 shadow-md z-10">
        <div className="text-xs font-medium mb-2">Leyenda:</div>
        <div className="flex flex-col gap-1.5 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full border-4 border-green-500 bg-background" />
            <span>Estado inicial</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full border-4 border-orange-500 bg-background">
              <div className="w-full h-full rounded-full border-2 border-orange-500" />
            </div>
            <span>Estado final</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full border-2 border-yellow-500 bg-background" />
            <span>Estado normal</span>
          </div>
        </div>
      </div>
    </div>
  );
}

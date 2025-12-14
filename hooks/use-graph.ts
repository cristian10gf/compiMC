/**
 * Hook personalizado para manejar la visualización de grafos
 * 
 * Proporciona funcionalidades para:
 * - Convertir autómatas a formato de grafo (React Flow / Cytoscape)
 * - Resaltar nodos y caminos
 * - Manejar la selección de elementos
 * - Animar transiciones
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Automaton, RecognitionResult } from '@/lib/types';
import type { Node as FlowNode, Edge as FlowEdge } from '@xyflow/react';

export interface UseGraphReturn {
  // Estado
  nodes: FlowNode[];
  edges: FlowEdge[];
  selectedNode: string | null;
  highlightedPath: string[];
  
  // Funciones
  setSelectedNode: (nodeId: string | null) => void;
  highlightPath: (path: string[]) => void;
  highlightRecognitionPath: (result: RecognitionResult) => void;
  resetHighlight: () => void;
  centerOnNode: (nodeId: string) => void;
}

/**
 * Convierte un autómata a formato React Flow
 */
function convertAutomatonToReactFlow(automaton: Automaton): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const nodes: FlowNode[] = automaton.states.map((state, index) => {
    // Calcular posición automática en forma horizontal
    const x = index * 200;
    const y = 100;

    return {
      id: state.id,
      type: state.isFinal ? 'output' : state.isInitial ? 'input' : 'default',
      position: state.position || { x, y },
      data: { 
        label: state.label,
        isInitial: state.isInitial,
        isFinal: state.isFinal,
      },
      style: {
        backgroundColor: state.isFinal ? '#48bb78' : state.isInitial ? '#4299e1' : '#667eea',
        color: 'white',
        border: state.isFinal ? '4px double white' : state.isInitial ? '3px solid white' : '2px solid white',
        borderRadius: '50%',
        width: 60,
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
      },
    };
  });

  // Agrupar transiciones múltiples
  const edgeMap = new Map<string, { symbols: string[]; from: string; to: string }>();

  automaton.transitions.forEach(transition => {
    const key = `${transition.from}-${transition.to}`;
    if (edgeMap.has(key)) {
      edgeMap.get(key)!.symbols.push(transition.symbol);
    } else {
      edgeMap.set(key, {
        symbols: [transition.symbol],
        from: transition.from,
        to: transition.to,
      });
    }
  });

  const edges: FlowEdge[] = Array.from(edgeMap.values()).map((edge, index) => ({
    id: `${edge.from}-${edge.to}-${index}`,
    source: edge.from,
    target: edge.to,
    label: edge.symbols.join(', '),
    type: 'smoothstep',
    animated: false,
    style: {
      stroke: '#667eea',
      strokeWidth: 2,
    },
    labelStyle: {
      fill: '#2d3748',
      fontWeight: 600,
      fontSize: 14,
    },
  }));

  return { nodes, edges };
}

/**
 * Hook de grafo
 */
export function useGraph(automaton: Automaton | null): UseGraphReturn {
  const [selectedNode, setSelectedNodeState] = useState<string | null>(null);
  const [highlightedPath, setHighlightedPath] = useState<string[]>([]);

  // Convertir autómata a formato de grafo
  const { nodes: baseNodes, edges: baseEdges } = useMemo(() => {
    if (!automaton) {
      return { nodes: [], edges: [] };
    }
    return convertAutomatonToReactFlow(automaton);
  }, [automaton]);

  // Aplicar highlighting a los nodos
  const nodes = useMemo(() => {
    return baseNodes.map(node => ({
      ...node,
      style: {
        ...node.style,
        opacity: highlightedPath.length > 0 
          ? (highlightedPath.includes(node.id) ? 1 : 0.3)
          : 1,
        transform: selectedNode === node.id ? 'scale(1.2)' : 'scale(1)',
        transition: 'all 0.3s ease',
      },
    }));
  }, [baseNodes, highlightedPath, selectedNode]);

  // Aplicar highlighting a las aristas
  const edges = useMemo(() => {
    if (highlightedPath.length < 2) return baseEdges;

    return baseEdges.map(edge => {
      // Verificar si esta arista está en el camino
      const isInPath = highlightedPath.some((nodeId, index) => {
        if (index === highlightedPath.length - 1) return false;
        const nextNodeId = highlightedPath[index + 1];
        return edge.source === nodeId && edge.target === nextNodeId;
      });

      return {
        ...edge,
        animated: isInPath,
        style: {
          ...edge.style,
          stroke: isInPath ? '#48bb78' : '#667eea',
          strokeWidth: isInPath ? 3 : 2,
          opacity: highlightedPath.length > 0 ? (isInPath ? 1 : 0.3) : 1,
        },
      };
    });
  }, [baseEdges, highlightedPath]);

  /**
   * Establece el nodo seleccionado
   */
  const setSelectedNode = useCallback((nodeId: string | null) => {
    setSelectedNodeState(nodeId);
  }, []);

  /**
   * Resalta un camino de nodos
   */
  const highlightPath = useCallback((path: string[]) => {
    setHighlightedPath(path);
  }, []);

  /**
   * Resalta el camino de un resultado de reconocimiento
   */
  const highlightRecognitionPath = useCallback((result: RecognitionResult) => {
    if (!automaton) return;

    // Extraer el camino de estados del resultado
    const path: string[] = [];
    
    // Agregar estado inicial
    const initialState = automaton.states.find(s => s.isInitial);
    if (initialState) {
      path.push(initialState.id);
    }

    // Agregar estados intermedios
    result.transitions.forEach(transition => {
      const state = automaton.states.find(s => s.label === transition.to);
      if (state && !path.includes(state.id)) {
        path.push(state.id);
      }
    });

    setHighlightedPath(path);
  }, [automaton]);

  /**
   * Resetea el highlighting
   */
  const resetHighlight = useCallback(() => {
    setHighlightedPath([]);
    setSelectedNodeState(null);
  }, []);

  /**
   * Centra la vista en un nodo específico
   */
  const centerOnNode = useCallback((nodeId: string) => {
    setSelectedNodeState(nodeId);
    // La implementación real del centrado se haría en el componente
    // que use React Flow con el método fitView()
  }, []);

  // Limpiar highlighting cuando cambia el autómata
  useEffect(() => {
    resetHighlight();
  }, [automaton, resetHighlight]);

  return {
    nodes,
    edges,
    selectedNode,
    highlightedPath,
    setSelectedNode,
    highlightPath,
    highlightRecognitionPath,
    resetHighlight,
    centerOnNode,
  };
}

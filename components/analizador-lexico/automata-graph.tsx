'use client';

/**
 * Componente para visualizar autómatas finitos usando React Flow
 * Soporta AFN, AFD y visualización de transiciones
 */

import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Automaton, State, Transition } from '@/lib/types/automata';
import { Button } from '@/components/ui/button';
import { Download, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGraph } from '@/hooks';

interface AutomataGraphProps {
  automaton: Automaton;
  highlightedPath?: string[]; // IDs de estados a resaltar
  onNodeClick?: (stateId: string) => void;
  onEdgeClick?: (transition: Transition) => void;
  className?: string;
}

/**
 * Componente personalizado para nodos de estado
 */
function StateNode({ data }: { data: State }) {
  const isInitial = data.isInitial;
  const isFinal = data.isFinal;

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full border-2 bg-background transition-all',
        'hover:shadow-lg hover:scale-105',
        isInitial && 'border-green-500 border-4',
        isFinal && 'border-4',
        !isInitial && !isFinal && 'border-primary',
      )}
      style={{
        width: isFinal ? 56 : 48,
        height: isFinal ? 56 : 48,
      }}
    >
      <div
        className={cn(
          'flex items-center justify-center rounded-full',
          'text-sm font-semibold',
          isFinal && 'border-2 border-primary w-11 h-11',
        )}
      >
        {data.label}
      </div>
    </div>
  );
}

const nodeTypes = {
  state: StateNode,
};

/**
 * Convierte el autómata a formato React Flow (mantener para compatibilidad temporal)
 */
function automatonToFlow(automaton: Automaton) {
  const nodes: Node[] = automaton.states.map((state, index) => ({
    id: state.id,
    type: 'state',
    data: state as any,
    position: state.position || {
      x: (index % 4) * 200 + 100,
      y: Math.floor(index / 4) * 150 + 100,
    },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  }));

  // Agrupar transiciones con el mismo origen y destino
  const transitionGroups = new Map<string, Transition[]>();
  
  automaton.transitions.forEach((trans) => {
    const key = `${trans.from}-${trans.to}`;
    if (!transitionGroups.has(key)) {
      transitionGroups.set(key, []);
    }
    transitionGroups.get(key)!.push(trans);
  });

  const edges: Edge[] = Array.from(transitionGroups.entries()).map(([key, transitions]) => {
    const labels = transitions.map((t) => t.symbol).join(', ');
    const [from, to] = key.split('-');
    
    return {
      id: key,
      source: from,
      target: to,
      label: labels,
      type: from === to ? 'smoothstep' : 'default',
      animated: false,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
      },
      style: {
        strokeWidth: 2,
      },
      labelStyle: {
        fill: 'hsl(var(--foreground))',
        fontWeight: 600,
        fontSize: 12,
      },
      labelBgStyle: {
        fill: 'hsl(var(--background))',
        fillOpacity: 0.9,
      },
    };
  });

  return { nodes, edges };
}

export function AutomataGraph({
  automaton,
  highlightedPath = [],
  onNodeClick,
  onEdgeClick,
  className,
}: AutomataGraphProps) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => automatonToFlow(automaton),
    [automaton]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Aplicar highlight a los nodos del camino
  const highlightedNodes = useMemo(() => {
    return nodes.map((node) => ({
      ...node,
      style: {
        ...node.style,
        opacity: highlightedPath.length === 0 || highlightedPath.includes(node.id) ? 1 : 0.3,
      },
    }));
  }, [nodes, highlightedPath]);

  // Aplicar highlight a las aristas del camino
  const highlightedEdges = useMemo(() => {
    return edges.map((edge) => {
      const isHighlighted =
        highlightedPath.length === 0 ||
        (highlightedPath.includes(edge.source) && highlightedPath.includes(edge.target));
      
      return {
        ...edge,
        animated: isHighlighted,
        style: {
          ...edge.style,
          strokeWidth: isHighlighted ? 3 : 2,
          opacity: isHighlighted ? 1 : 0.3,
        },
      };
    });
  }, [edges, highlightedPath]);

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onNodeClick?.(node.id);
    },
    [onNodeClick]
  );

  const handleExport = useCallback(() => {
    // Exportar como imagen o JSON
    const data = { automaton, nodes, edges };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `automaton-${automaton.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [automaton, nodes, edges]);

  return (
    <div className={cn('relative w-full h-[500px] rounded-lg border bg-muted/20', className)}>
      <ReactFlow
        nodes={highlightedNodes}
        edges={highlightedEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
        className="rounded-lg"
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const state = node.data as unknown as State;
            if (state.isInitial) return '#22c55e';
            if (state.isFinal) return '#ef4444';
            return '#3b82f6';
          }}
          maskColor="rgb(0, 0, 0, 0.1)"
        />
      </ReactFlow>

      {/* Controles adicionales */}
      <div className="absolute top-2 right-2 flex gap-2">
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
      <div className="absolute bottom-2 left-2 bg-background/90 rounded-md border p-3 shadow-md">
        <div className="text-xs font-medium mb-2">Leyenda:</div>
        <div className="flex flex-col gap-1.5 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full border-4 border-green-500 bg-background" />
            <span>Estado inicial</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full border-4 border-primary bg-background">
              <div className="w-full h-full rounded-full border-2 border-primary" />
            </div>
            <span>Estado final</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full border-2 border-primary bg-background" />
            <span>Estado normal</span>
          </div>
        </div>
      </div>
    </div>
  );
}

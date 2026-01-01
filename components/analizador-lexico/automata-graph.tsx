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
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
  getBezierPath,
  EdgeProps,
  BaseEdge,
  EdgeLabelRenderer,
  Handle,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Automaton, State, Transition } from '@/lib/types/automata';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    <div className="relative">
      {/* Handles distribuidos alrededor del círculo para múltiples conexiones */}
      {/* Target handles (entrada) */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#555', opacity: 0, left: '0%' }}
      />
      <Handle
        id="target-top"
        type="target"
        position={Position.Top}
        style={{ background: '#555', opacity: 0, top: '0%' }}
      />
      <Handle
        id="target-bottom"
        type="target"
        position={Position.Bottom}
        style={{ background: '#555', opacity: 0, bottom: '0%' }}
      />
      <Handle
        id="target-top-left"
        type="target"
        position={Position.Left}
        style={{ background: '#555', opacity: 0, left: '15%', top: '15%' }}
      />
      <Handle
        id="target-bottom-left"
        type="target"
        position={Position.Left}
        style={{ background: '#555', opacity: 0, left: '15%', bottom: '15%' }}
      />
      
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-background transition-all',
          'hover:shadow-lg hover:scale-105',
          isInitial && 'border-[3px] border-green-500',
          isFinal && 'border-[3px] border-orange-500',
          !isInitial && !isFinal && 'border-2 border-yellow-500',
        )}
        style={{
          width: 56,
          height: 56,
        }}
      >
        {/* Círculo interno para estados finales (doble círculo) */}
        {isFinal && (
          <div className="absolute inset-1.5 rounded-full border-2 border-orange-500" />
        )}
        <div className="text-sm font-bold text-foreground z-10">
          {data.label}
        </div>
      </div>
      
      {/* Source handles (salida) */}
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#555', opacity: 0, right: '0%' }}
      />
      <Handle
        id="source-top"
        type="source"
        position={Position.Top}
        style={{ background: '#555', opacity: 0, top: '0%' }}
      />
      <Handle
        id="source-bottom"
        type="source"
        position={Position.Bottom}
        style={{ background: '#555', opacity: 0, bottom: '0%' }}
      />
      <Handle
        id="source-top-right"
        type="source"
        position={Position.Right}
        style={{ background: '#555', opacity: 0, right: '15%', top: '15%' }}
      />
      <Handle
        id="source-bottom-right"
        type="source"
        position={Position.Right}
        style={{ background: '#555', opacity: 0, right: '15%', bottom: '15%' }}
      />
      <Handle
        id="source-loop-left"
        type="source"
        position={Position.Top}
        style={{ background: '#555', opacity: 0, left: '30%' }}
      />
      <Handle
        id="target-loop-right"
        type="target"
        position={Position.Top}
        style={{ background: '#555', opacity: 0, right: '30%' }}
      />
    </div>
  );
}

/**
 * Componente personalizado para self-loops (bucles)
 */
function SelfLoopEdge({
  id,
  sourceX,
  sourceY,
  label,
  markerEnd,
  style,
}: EdgeProps) {
  // Crear un loop arriba del nodo
  const loopSize = 40;
  const path = `
    M ${sourceX - 15} ${sourceY - 10}
    Q ${sourceX - 20} ${sourceY - loopSize} ${sourceX} ${sourceY - loopSize - 5}
    Q ${sourceX + 20} ${sourceY - loopSize} ${sourceX + 15} ${sourceY - 10}
  `;

  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${sourceX}px,${sourceY - loopSize - 10}px)`,
            pointerEvents: 'all',
          }}
          className="px-2 py-1 bg-background border-2 border-blue-400 rounded text-xs font-bold shadow-lg text-foreground"
        >
          {label}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

/**
 * Componente personalizado para aristas con etiquetas mejoradas
 */
function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  markerEnd,
  style,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="px-2 py-1 bg-background border-2 border-blue-400 rounded text-xs font-bold shadow-lg text-foreground"
        >
          {label}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

const nodeTypes = {
  state: StateNode,
};

const edgeTypes = {
  custom: CustomEdge,
  selfloop: SelfLoopEdge,
};

/**
 * Calcula posiciones óptimas para los nodos usando layout horizontal
 */
function calculateNodePositions(states: State[], transitions: Transition[]): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  
  // Encontrar el estado inicial
  const initialState = states.find(s => s.isInitial);
  if (!initialState) return positions;
  
  // BFS para ordenar estados por niveles desde el inicial
  const visited = new Set<string>();
  const levels = new Map<string, number>();
  const queue: Array<{ id: string; level: number }> = [{ id: initialState.id, level: 0 }];
  
  visited.add(initialState.id);
  levels.set(initialState.id, 0);
  
  while (queue.length > 0) {
    const { id, level } = queue.shift()!;
    
    // Encontrar estados conectados
    const connectedStates = transitions
      .filter(t => t.from === id && !visited.has(t.to))
      .map(t => t.to);
    
    for (const nextId of connectedStates) {
      if (!visited.has(nextId)) {
        visited.add(nextId);
        levels.set(nextId, level + 1);
        queue.push({ id: nextId, level: level + 1 });
      }
    }
  }
  
  // Asignar estados no visitados
  states.forEach(state => {
    if (!levels.has(state.id)) {
      levels.set(state.id, states.length);
    }
  });
  
  // Agrupar por nivel
  const levelGroups = new Map<number, string[]>();
  levels.forEach((level, id) => {
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level)!.push(id);
  });
  
  // Calcular posiciones: horizontal con espaciado
  const horizontalSpacing = 250;
  const verticalSpacing = 120;
  
  levelGroups.forEach((stateIds, level) => {
    const yOffset = (stateIds.length - 1) * verticalSpacing / 2;
    
    stateIds.forEach((id, index) => {
      positions.set(id, {
        x: level * horizontalSpacing + 100,
        y: index * verticalSpacing - yOffset + 200,
      });
    });
  });
  
  return positions;
}

/**
 * Convierte el autómata a formato React Flow
 */
function automatonToFlow(automaton: Automaton) {
  // Calcular posiciones optimizadas
  const positions = calculateNodePositions(automaton.states, automaton.transitions);
  
  const nodes: Node[] = automaton.states.map((state) => ({
    id: state.id,
    type: 'state',
    data: state as any,
    position: state.position || positions.get(state.id) || { x: 0, y: 0 },
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
    
    // Detectar self-loops y transiciones inversas
    const isSelfLoop = from === to;
    const hasReverseEdge = transitionGroups.has(`${to}-${from}`);
    
    // Para self-loops, usar handles especiales
    if (isSelfLoop) {
      return {
        id: key,
        source: from,
        target: to,
        label: labels,
        type: 'selfloop',
        sourceHandle: 'source-loop-left',
        targetHandle: 'target-loop-right',
        animated: false,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: '#60a5fa',
        },
        style: {
          strokeWidth: 3,
          stroke: '#60a5fa',
        },
      };
    }
    
    // Calcular posición relativa para elegir handles
    const sourceNode = nodes.find(n => n.id === from);
    const targetNode = nodes.find(n => n.id === to);
    
    let sourceHandle = undefined;
    let targetHandle = undefined;
    
    if (sourceNode && targetNode) {
      const dx = targetNode.position.x - sourceNode.position.x;
      const dy = targetNode.position.y - sourceNode.position.y;
      
      // Si hay edge reverso, usar handles superiores/inferiores para evitar superposición
      if (hasReverseEdge) {
        if (from < to) {
          // Edge de ida: usar handles superiores
          sourceHandle = dy > 50 ? 'source-bottom-right' : (dy < -50 ? 'source-top-right' : 'source-top');
          targetHandle = dy > 50 ? 'target-bottom-left' : (dy < -50 ? 'target-top-left' : 'target-top');
        } else {
          // Edge de vuelta: usar handles inferiores
          sourceHandle = dy > 50 ? 'source-bottom-right' : (dy < -50 ? 'source-top-right' : 'source-bottom');
          targetHandle = dy > 50 ? 'target-bottom-left' : (dy < -50 ? 'target-top-left' : 'target-bottom');
        }
      } else {
        // Sin edge reverso: elegir handle según dirección
        if (Math.abs(dy) > Math.abs(dx) / 2) {
          // Conexión más vertical
          sourceHandle = dy > 0 ? 'source-bottom' : 'source-top';
          targetHandle = dy > 0 ? 'target-top' : 'target-bottom';
        } else if (dy > 30) {
          sourceHandle = 'source-bottom-right';
          targetHandle = 'target-top-left';
        } else if (dy < -30) {
          sourceHandle = 'source-top-right';
          targetHandle = 'target-bottom-left';
        }
      }
    }
    
    return {
      id: key,
      source: from,
      target: to,
      label: labels,
      type: 'custom',
      animated: false,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: '#60a5fa',
      },
      style: {
        strokeWidth: 3,
        stroke: '#60a5fa',
      },
      ...(sourceHandle ? { sourceHandle } : {}),
      ...(targetHandle ? { targetHandle } : {}),
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
          strokeWidth: isHighlighted ? 4 : 3,
          stroke: '#60a5fa',
        },
        markerEnd: edge.markerEnd ? {
          ...edge.markerEnd,
          color: '#60a5fa',
        } : undefined,
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
    <div className={cn('relative w-full h-125 rounded-lg border bg-muted/20', className)}>
      <ReactFlow
        nodes={highlightedNodes}
        edges={highlightedEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        fitView
        fitViewOptions={{
          padding: 0.2,
          minZoom: 0.5,
          maxZoom: 1.5,
        }}
        attributionPosition="bottom-right"
        className="rounded-lg"
        defaultEdgeOptions={{
          type: 'custom',
          animated: false,
        }}
        snapToGrid={true}
        snapGrid={[15, 15]}
      >
        <Background gap={16} size={1} color="hsl(var(--muted-foreground) / 0.2)" />
        <Controls showInteractive={false} />
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

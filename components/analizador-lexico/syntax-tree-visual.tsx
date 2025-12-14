'use client';

/**
 * Componente para visualizar el árbol sintáctico de una expresión regular
 * Usa React Flow para renderizar el árbol de forma interactiva
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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TreeNode, SyntaxTree } from '@/lib/types/automata';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface SyntaxTreeVisualProps {
  tree: SyntaxTree;
  showFunctions?: boolean; // Mostrar primeros, últimos, anulable
  onNodeClick?: (node: TreeNode) => void;
  className?: string;
}

/**
 * Componente personalizado para nodos del árbol
 */
function TreeNodeComponent({ data }: { data: TreeNode & { showFunctions: boolean } }) {
  const isOperator = ['*', '+', '|', '.', '?'].includes(data.value);
  const isLeaf = !isOperator;

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn(
          'flex items-center justify-center rounded-lg border-2 bg-background transition-all',
          'hover:shadow-lg hover:scale-105 min-w-12 px-3 py-2',
          isOperator && 'border-purple-500 bg-purple-50 dark:bg-purple-950',
          isLeaf && 'border-blue-500 bg-blue-50 dark:bg-blue-950',
        )}
      >
        <span className="text-sm font-bold">{data.value}</span>
        {data.position !== undefined && (
          <span className="ml-1 text-xs text-muted-foreground">
            ({data.position})
          </span>
        )}
      </div>
      
      {data.showFunctions && (
        <div className="flex flex-col gap-0.5 text-xs">
          {data.nullable !== undefined && (
            <Badge variant="outline" className="text-[10px] py-0">
              ε: {data.nullable ? '✓' : '✗'}
            </Badge>
          )}
          {data.firstpos && data.firstpos.size > 0 && (
            <Badge variant="outline" className="text-[10px] py-0">
              P: {Array.from(data.firstpos).join(',')}
            </Badge>
          )}
          {data.lastpos && data.lastpos.size > 0 && (
            <Badge variant="outline" className="text-[10px] py-0">
              U: {Array.from(data.lastpos).join(',')}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

const nodeTypes = {
  treeNode: TreeNodeComponent,
};

/**
 * Convierte el árbol sintáctico a formato React Flow
 */
function treeToFlow(tree: SyntaxTree, showFunctions: boolean) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let nodeIndex = 0;

  function traverse(node: TreeNode | null, level: number, parentId?: string, childIndex?: number): string | null {
    if (!node) return null;

    const nodeId = `node-${nodeIndex++}`;
    const x = (childIndex ?? 0) * 120 - ((node.children.length === 2) ? 60 : 0);
    const y = level * 100;

    nodes.push({
      id: nodeId,
      type: 'treeNode',
      data: { ...node, showFunctions },
      position: { x, y },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    });

    if (parentId) {
      edges.push({
        id: `edge-${parentId}-${nodeId}`,
        source: parentId,
        target: nodeId,
        type: 'smoothstep',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 15,
          height: 15,
        },
        style: {
          strokeWidth: 2,
        },
      });
    }

    // Recorrer hijos
    if (node.children && node.children.length > 0) {
      node.children.forEach((child, idx) => {
        traverse(child, level + 1, nodeId, (childIndex ?? 0) * 2 + idx);
      });
    }

    return nodeId;
  }

  traverse(tree.root, 0);

  return { nodes, edges };
}

export function SyntaxTreeVisual({
  tree,
  showFunctions = false,
  onNodeClick,
  className,
}: SyntaxTreeVisualProps) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => treeToFlow(tree, showFunctions),
    [tree, showFunctions]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onNodeClick?.(node.data as unknown as TreeNode);
    },
    [onNodeClick]
  );

  const handleExport = useCallback(() => {
    const data = { tree, nodes, edges };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `syntax-tree.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [tree, nodes, edges]);

  return (
    <div className={cn('relative w-full h-125 rounded-lg border bg-muted/20', className)}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
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

      {/* Información del árbol */}
      <div className="absolute bottom-2 left-2 bg-background/90 rounded-md border p-3 shadow-md">
        <div className="text-xs font-medium mb-2">Información:</div>
        <div className="flex flex-col gap-1 text-xs">
          <div>Alfabeto: {tree.alphabet.join(', ')}</div>
          {tree.anulable !== undefined && (
            <div>Anulable: {tree.anulable ? 'Sí' : 'No'}</div>
          )}
          {showFunctions && (
            <>
              {tree.primeros && tree.primeros.size > 0 && (
                <div>Primeros: {Array.from(tree.primeros).join(', ')}</div>
              )}
              {tree.ultimos && tree.ultimos.size > 0 && (
                <div>Últimos: {Array.from(tree.ultimos).join(', ')}</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

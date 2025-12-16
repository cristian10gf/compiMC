'use client';

/**
 * Componente para visualizar el árbol sintáctico de expresiones aritméticas
 * Usa Cytoscape.js para renderizar el árbol con precedencia de operadores
 */

import { useEffect, useRef, useState } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import { ASTNode } from '@/lib/types/analysis';
import { Button } from '@/components/ui/button';
import { Copy, Download } from 'lucide-react';
import { Card } from '@/components/ui/card';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';

cytoscape.use( dagre );

interface SyntaxTreeGraphProps {
  tree: ASTNode | null;
  className?: string;
}

// Convertir el AST a formato Cytoscape
function astToCytoscape(node: ASTNode | null, parentId?: string): any[] {
  if (!node) return [];

  const elements: any[] = [];
  const nodeId = node.id;

  // Determinar el label del nodo
  let label = '';
  if (node.type === 'Number') {
    label = node.value?.toString() || '';
  } else if (node.type === 'Identifier') {
    label = node.name || '';
  } else if (node.type === 'entReal') {
    label = `entReal(${node.value})`;
  } else if (node.type === 'BinaryOp' || node.type === 'assignment') {
    label = node.operator || '';
  }

  // Agregar el nodo
  elements.push({
    data: { 
      id: nodeId, 
      label,
      type: node.type,
    }
  });

  // Agregar arista si tiene padre
  if (parentId) {
    elements.push({
      data: {
        id: `edge-${parentId}-${nodeId}`,
        source: parentId,
        target: nodeId,
      }
    });
  }

  // Procesar hijos
  if (node.left) {
    elements.push(...astToCytoscape(node.left, nodeId));
  }
  if (node.right) {
    elements.push(...astToCytoscape(node.right, nodeId));
  }

  return elements;
}

export function SyntaxTreeGraph({ tree, className }: SyntaxTreeGraphProps) {
  const cyRef = useRef<any>(null);
  const [elements, setElements] = useState<any[]>([]);

  useEffect(() => {
    if (tree) {
      const els = astToCytoscape(tree);
      setElements(els);
    }
  }, [tree]);

  useEffect(() => {
    if (cyRef.current && elements.length > 0) {
      // Aplicar layout después de que los elementos se hayan agregado
      setTimeout(() => {
        cyRef.current.layout({
          name: 'dagre',
          directed: true,
          spacingFactor: 1.5,
          padding: 30,
          avoidOverlap: true,
          animationDuration: 500,
          animationEasing: 'ease-in-out',
          animate: true,
        }).run();
      }, 100);
    }
  }, [elements]);

  const handleExport = () => {
    if (cyRef.current) {
      const png = cyRef.current.png({ 
        full: true, 
        scale: 2,
        bg: 'white' 
      });
      const link = document.createElement('a');
      link.href = png;
      link.download = 'arbol-sintactico.png';
      link.click();
    }
  };

  const handleCopyImage = async () => {
    if (cyRef.current) {
      try {
        const png = cyRef.current.png({ 
          full: true, 
          scale: 2,
          bg: 'white' 
        });
        
        // Convertir base64 a blob
        const response = await fetch(png);
        const blob = await response.blob();
        
        // Copiar al clipboard
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob
          })
        ]);
        
        alert('Imagen copiada al portapapeles');
      } catch (err) {
        console.error('Error al copiar imagen:', err);
        alert('Error al copiar imagen');
      }
    }
  };

  if (!tree) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        No se pudo construir el árbol sintáctico
      </Card>
    );
  }

  const stylesheet: any = [
    {
      selector: 'node',
      style: {
        'background-color': '#fff',
        'border-width': 2,
        'border-color': '#6366f1',
        'label': 'data(label)',
        'text-valign': 'center',
        'text-halign': 'center',
        'color': '#000',
        'font-size': '14px',
        'font-weight': 'bold',
        'width': 40,
        'height': 40,
      }
    },
    {
      selector: 'node[type="BinaryOp"]',
      style: {
        'background-color': '#e0e7ff',
        'border-color': '#818cf8',
      }
    },
    {
      selector: 'node[type="assignment"]',
      style: {
        'background-color': '#fce7f3',
        'border-color': '#ec4899',
      }
    },
    {
      selector: 'node[type="Number"]',
      style: {
        'background-color': '#dbeafe',
        'border-color': '#60a5fa',
      }
    },
    {
      selector: 'node[type="entReal"]',
      style: {
        'background-color': '#dcfce7',
        'border-color': '#22c55e',
        'width': 60,
        'height': 40,
        'padding': '10px',
        'text-wrap': 'none',
      }
    },
    {
      selector: 'node[type="Identifier"]',
      style: {
        'background-color': '#fef3c7',
        'border-color': '#fbbf24',
      }
    },
    {
      selector: 'edge',
      style: {
        'width': 2,
        'line-color': '#94a3b8',
        'target-arrow-color': '#94a3b8',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
      }
    }
  ];

  return (
    <div className={className}>
      <div className="relative w-full h-125 rounded-lg border bg-background">
        <CytoscapeComponent
          elements={elements}
          style={{ width: '100%', height: '100%' }}
          stylesheet={stylesheet}
          cy={(cy) => { cyRef.current = cy; }}
          layout={{ name: 'dagre' }}
        />

        {/* Controles */}
        <div className="absolute top-2 right-2 flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleCopyImage}
            className="shadow-md"
            title="Copiar imagen al portapapeles"
          >
            <Copy className="h-4 w-4 mr-1" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleExport}
            className="shadow-md"
          >
            <Download className="h-4 w-4 mr-1" />
            Descargar
          </Button>
        </div>
      </div>
    </div>
  );
}

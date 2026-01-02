'use client';

/**
 * Componente para visualizar el árbol sintáctico usando Cytoscape.js con layout dagre
 * Muestra los 4 valores en estructura circular: símbolo, anulable, primerapos, ultimapos
 */

import { useEffect, useRef, useState } from 'react';
import { TreeNode, SyntaxTree } from '@/lib/types/automata';
import { Button } from '@/components/ui/button';
import { Download, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateAnulable, calculatePrimeros, calculateUltimos } from '@/lib/algorithms/lexical/regex-parser';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';

cytoscape.use(dagre);

interface SyntaxTreeCytoscapeProps {
  tree: SyntaxTree;
  className?: string;
}

/**
 * Calcula los valores del árbol y los asigna a los nodos
 */
function calculateTreeValues(node: TreeNode): void {
  // Calcular para hijos primero (postorden)
  if (node.children && node.children.length > 0) {
    node.children.forEach(child => calculateTreeValues(child));
  }
  
  // Calcular anulable
  node.nullable = calculateAnulable(node);
  
  // Calcular primeros
  node.firstpos = calculatePrimeros(node);
  
  // Calcular últimos
  node.lastpos = calculateUltimos(node);
}

/**
 * Convierte el árbol sintáctico a formato Cytoscape
 */
function syntaxTreeToCytoscape(tree: SyntaxTree) {
  const elements: any[] = [];
  let nodeIndex = 0;
  
  // Calcular valores del árbol
  calculateTreeValues(tree.root);
  
  function traverse(node: TreeNode, parentId?: string): string {
    const nodeId = `node-${nodeIndex++}`;
    
    // Determinar tipo de nodo para estilo
    const isOperator = ['CONCAT', 'UNION', 'STAR', 'PLUS', 'OPTIONAL'].includes(node.type);
    const isSymbol = node.type === 'SYMBOL';
    
    // Formatear valores para mostrar
    const anulable = node.nullable ? 'V' : 'F';
    const primeros = node.firstpos ? Array.from(node.firstpos).sort((a, b) => a - b).join(',') : '';
    const ultimos = node.lastpos ? Array.from(node.lastpos).sort((a, b) => a - b).join(',') : '';
    
    // Label del nodo - símbolo principal
    let symbol = node.value;
    if (node.type === 'CONCAT') symbol = '•';
    if (node.type === 'UNION') symbol = '|';
    
    // Posición para símbolos
    const posLabel = node.position !== undefined ? node.position.toString() : '';
    
    // Construir el label - estructura circular según la imagen:
    // Arriba: Valor del nodo (símbolo con posición si existe)
    // Centro-abajo: anulable
    // Izquierda-abajo: primera pos
    // Derecha-abajo: ultima pos
    let topLabel = symbol;
    if (posLabel) {
      topLabel = `${symbol}₍${posLabel}₎`;
    }
    
    // Label formateado para mostrar en el nodo
    // Formato: símbolo\nanulable\n{primeros} {ultimos}
    const fullLabel = `${topLabel}\n${anulable}\n{${primeros}} {${ultimos}}`;
    
    elements.push({
      data: {
        id: nodeId,
        label: fullLabel,
        symbol,
        topLabel,
        type: node.type,
        position: posLabel,
        anulable,
        primeros: `{${primeros}}`,
        ultimos: `{${ultimos}}`,
        isOperator,
        isSymbol,
      },
      classes: isOperator ? 'operator' : isSymbol ? 'symbol' : 'other',
    });
    
    // Crear arista al padre
    if (parentId) {
      elements.push({
        data: {
          id: `edge-${parentId}-${nodeId}`,
          source: parentId,
          target: nodeId,
        },
      });
    }
    
    // Procesar hijos
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        traverse(child, nodeId);
      });
    }
    
    return nodeId;
  }
  
  traverse(tree.root);
  
  return elements;
}

/**
 * Genera los estilos de Cytoscape para nodos circulares con información estructurada
 */
function getStylesheet(isDarkMode: boolean): any[] {
  const colors = isDarkMode ? {
    operatorBg: '#581c87',
    operatorBorder: '#a855f7',
    symbolBg: '#1e3a8a',
    symbolBorder: '#3b82f6',
    textColor: '#f9fafb',
    edgeColor: '#9ca3af',
  } : {
    operatorBg: '#f3e8ff',
    operatorBorder: '#a855f7',
    symbolBg: '#dbeafe',
    symbolBorder: '#3b82f6',
    textColor: '#1f2937',
    edgeColor: '#6b7280',
  };

  return [
    {
      selector: 'node',
      style: {
        'shape': 'ellipse',
        'width': 110,
        'height': 110,
        'background-color': colors.symbolBg,
        'border-width': 3,
        'border-color': colors.symbolBorder,
        'label': 'data(label)',
        'text-valign': 'center',
        'text-halign': 'center',
        'font-size': 12,
        'font-weight': 'bold',
        'color': colors.textColor,
        'text-wrap': 'wrap',
        'text-max-width': 100,
        'line-height': 1.4,
      },
    },
    {
      selector: 'node.operator',
      style: {
        'background-color': colors.operatorBg,
        'border-color': colors.operatorBorder,
      },
    },
    {
      selector: 'node.symbol',
      style: {
        'background-color': colors.symbolBg,
        'border-color': colors.symbolBorder,
      },
    },
    {
      selector: 'edge',
      style: {
        'width': 2,
        'line-color': colors.edgeColor,
        'target-arrow-color': colors.edgeColor,
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        'arrow-scale': 0.8,
      },
    },
  ];
}

export function SyntaxTreeCytoscape({ tree, className }: SyntaxTreeCytoscapeProps) {
  const cyRef = useRef<any>(null);
  const [elements, setElements] = useState<any[]>([]);
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

  // Convertir árbol a elementos de Cytoscape
  useEffect(() => {
    if (tree) {
      const els = syntaxTreeToCytoscape(tree);
      setElements(els);
    }
  }, [tree]);

  // Aplicar layout cuando los elementos cambien
  useEffect(() => {
    if (cyRef.current && elements.length > 0) {
      setTimeout(() => {
        cyRef.current.layout({
          name: 'dagre',
          directed: true,
          spacingFactor: 1.8,
          padding: 30,
          avoidOverlap: true,
          animationDuration: 500,
          animationEasing: 'ease-in-out',
          animate: true,
          rankDir: 'TB',
          nodeSep: 70,
          rankSep: 90,
        }).run();
        
        // Actualizar estilos cuando cambie el modo
        cyRef.current.style(getStylesheet(isDarkMode));
      }, 100);
    }
  }, [elements, isDarkMode]);

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
      cyRef.current.fit();
      cyRef.current.center();
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
      link.download = `syntax-tree-${Date.now()}.png`;
      link.click();
    }
  };

  if (!tree) {
    return (
      <div className="flex items-center justify-center h-125 bg-muted/20 rounded-lg border">
        <div className="text-muted-foreground">No hay árbol para mostrar</div>
      </div>
    );
  }

  return (
    <div className={cn('relative rounded-lg border bg-card', className)}>
      {/* Toolbar */}
      <div className="absolute top-2 right-2 z-10 flex gap-1">
        <Button size="sm" variant="outline" onClick={handleZoomIn} title="Acercar">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={handleZoomOut} title="Alejar">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={handleFit} title="Ajustar">
          <Maximize2 className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={handleExport} title="Exportar PNG">
          <Download className="h-4 w-4" />
        </Button>
      </div>

      {/* Leyenda - estructura del nodo */}
      <div className="absolute bottom-2 left-2 z-10 flex flex-col gap-0.5 text-xs bg-background/90 rounded-md px-3 py-2 border">
        <div className="font-semibold text-center mb-1">Estructura:</div>
        <div className="text-center">Símbolo₍pos₎</div>
        <div className="text-center text-green-600 dark:text-green-400">Anulable</div>
        <div className="text-center">
          <span className="text-blue-600 dark:text-blue-400">{'{P}'}</span>
          {' '}
          <span className="text-red-600 dark:text-red-400">{'{U}'}</span>
        </div>
      </div>

      {/* Container para Cytoscape */}
      <div className="h-125 w-full">
        <CytoscapeComponent
          elements={elements}
          style={{ width: '100%', height: '100%' }}
          stylesheet={getStylesheet(isDarkMode)}
          cy={(cy) => { cyRef.current = cy; }}
          layout={{ name: 'dagre' }}
          minZoom={0.3}
          maxZoom={3}
          wheelSensitivity={0.3}
        />
      </div>
    </div>
  );
}

/**
 * Tipos para visualización con React Flow
 */

import { Node, Edge } from '@xyflow/react';

/**
 * Nodo para React Flow (autómatas y árboles)
 */
export interface FlowNode extends Node {
  data: {
    label: string; // Etiqueta del nodo
    isInitial?: boolean; // Si es estado inicial
    isFinal?: boolean; // Si es estado final
    nodeType?: 'state' | 'tree-node' | 'production'; // Tipo de nodo
    value?: string; // Valor adicional
  };
}

/**
 * Arista para React Flow
 */
export interface FlowEdge extends Edge {
  data?: {
    symbol?: string; // Símbolo de la transición
    weight?: number; // Peso de la arista
  };
  label?: string; // Etiqueta de la arista
}

/**
 * Datos completos del grafo para React Flow
 */
export interface FlowData {
  nodes: FlowNode[]; // Lista de nodos
  edges: FlowEdge[]; // Lista de aristas
}

/**
 * Opciones de layout para el grafo
 */
export interface LayoutOptions {
  algorithm: 'dagre' | 'force' | 'tree' | 'circular'; // Algoritmo de layout
  direction?: 'TB' | 'BT' | 'LR' | 'RL'; // Dirección del layout
  spacing?: {
    node?: number; // Espaciado entre nodos
    rank?: number; // Espaciado entre niveles
  };
}

/**
 * Configuración de visualización
 */
export interface VisualizationConfig {
  layout: LayoutOptions; // Opciones de layout
  showLabels?: boolean; // Si se muestran etiquetas
  animated?: boolean; // Si las transiciones son animadas
  highlightPath?: string[]; // IDs de nodos a resaltar
}

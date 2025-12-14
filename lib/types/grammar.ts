/**
 * Tipos para análisis sintáctico (descendente y ascendente)
 */

/**
 * Producción de una gramática
 */
export interface Production {
  id: string; // ID único de la producción (ej: "p1", "p2")
  left: string; // Símbolo no terminal en el lado izquierdo
  right: string[]; // Lado derecho de la producción (ej: ["E", "or", "T"])
  number?: number; // Número de producción (para referencia)
}

/**
 * Gramática libre de contexto
 */
export interface Grammar {
  terminals: string[]; // Símbolos terminales (ej: ["a", "b", "as"])
  nonTerminals: string[]; // Símbolos no terminales (ej: ["E", "T", "F"])
  productions: Production[]; // Lista de producciones
  startSymbol: string; // Símbolo inicial de la gramática
}

/**
 * Conjuntos First y Follow de un no terminal
 */
export interface FirstFollow {
  nonTerminal: string; // Símbolo no terminal
  first: string[]; // Conjunto de primeros
  follow: string[]; // Conjunto de siguientes
}

/**
 * Entrada de la tabla de parsing
 */
export interface ParsingTableEntry {
  production: Production | null; // Producción a aplicar
  action?: 'accept' | 'error'; // Acción especial
}

/**
 * Tabla de parsing M (para análisis descendente LL)
 */
export interface ParsingTable {
  entries: Array<{
    nonTerminal: string;
    terminal: string;
    production: string | null;
  }>;
}

/**
 * Paso en el proceso de parsing
 */
export interface ParseStep {
  stepNumber: number; // Número del paso
  stack: string[]; // Contenido de la pila
  input: string[]; // Entrada restante
  output: string; // Producción aplicada o acción realizada
  action: string; // Descripción de la acción
}

/**
 * Relación de precedencia entre dos símbolos
 */
export interface PrecedenceRelation {
  symbol1: string; // Símbolo izquierdo
  symbol2: string; // Símbolo derecho
  relation: '<' | '>' | '=' | '·'; // Relación de precedencia
}

/**
 * Paso en la construcción manual de precedencia
 */
export interface PrecedenceStep {
  stepNumber: number; // Número del paso
  production: Production; // Producción asociada
  relations: PrecedenceRelation[]; // Relaciones establecidas
  reasoning?: string; // Razonamiento para establecer la relación
  explanation: string; // Explicación detallada del paso
}

/**
 * Tabla de precedencia de operadores
 */
export interface PrecedenceTable {
  symbols: string[]; // Todos los símbolos de la gramática
  relations: Map<string, Map<string, '<' | '>' | '=' | '·'>>; // Matriz de relaciones
}

/**
 * Tabla Ir (Goto) para análisis ascendente
 */
export interface GotoTable {
  [state: string]: {
    [symbol: string]: string; // Estado destino
  };
}

/**
 * Entrada en la tabla de acciones LR
 */
export interface ActionTableEntry {
  action: 'shift' | 'reduce' | 'accept' | 'error'; // Tipo de acción
  value?: number | Production; // Número de estado (shift) o producción (reduce)
}

/**
 * Tabla de acciones para análisis ascendente LR
 */
export interface ActionTable {
  [state: string]: {
    [terminal: string]: ActionTableEntry;
  };
}

/**
 * Item LR(0) o LR(1)
 */
export interface LRItem {
  production: Production; // Producción asociada
  dotPosition: number; // Posición del punto en la producción
  lookahead?: string; // Símbolo de anticipación (para LR(1))
}

/**
 * Estado del autómata LR
 */
export interface LRState {
  id: string; // ID del estado
  items: LRItem[]; // Items en este estado
  transitions: Map<string, string>; // Símbolo → Estado destino
}

/**
 * Autómata LR completo
 */
export interface LRAutomaton {
  states: LRState[]; // Estados del autómata
  startState: string; // Estado inicial
}

/**
 * Resultado del análisis sintáctico
 */
export interface ParsingResult {
  accepted: boolean; // Si el análisis fue exitoso
  steps: ParseStep[]; // Pasos del proceso de parsing
  parseTree?: ParseTreeNode | null; // Árbol de derivación
  output?: string; // Salida del proceso de parsing
  error?: string; // Mensaje de error si falló
}

/**
 * Nodo del árbol de derivación
 */
export interface ParseTreeNode {
  id: string; // ID único del nodo
  symbol: string; // Símbolo del nodo
  children: ParseTreeNode[]; // Nodos hijos
  isTerminal: boolean; // Si es un terminal
}

/**
 * Configuración para análisis sintáctico
 */
export interface ParserConfig {
  grammar: Grammar; // Gramática a usar
  input: string; // Cadena de entrada
  algorithm: 'LL1' | 'LR0' | 'LR1' | 'SLR' | 'LALR' | 'precedence'; // Algoritmo
  mode?: 'manual' | 'automatic'; // Modo (para precedencia)
  showSteps?: boolean; // Si se deben mostrar los pasos
}

/**
 * Conjunto de items (cierre de un estado)
 */
export interface ItemSet {
  items: LRItem[]; // Items en el conjunto
  id: string; // ID del conjunto
}

/**
 * Conflicto en la tabla de parsing
 */
export interface ParsingConflict {
  type: 'shift-reduce' | 'reduce-reduce'; // Tipo de conflicto
  state: string; // Estado donde ocurre el conflicto
  terminal: string; // Terminal que causa el conflicto
  options: ActionTableEntry[]; // Opciones en conflicto
}

/**
 * Resultado de validación de gramática
 */
export interface GrammarValidation {
  isValid: boolean; // Si la gramática es válida
  isLL1?: boolean; // Si es LL(1)
  isLR0?: boolean; // Si es LR(0)
  conflicts?: ParsingConflict[]; // Conflictos encontrados
  errors: string[]; // Errores de validación
  warnings?: string[]; // Advertencias
}

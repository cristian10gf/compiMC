/**
 * Tipos fundamentales para el sistema de autómatas finitos
 */

/**
 * Estado de un autómata finito
 */
export interface State {
  id: string; // Identificador único del estado (ej: "q0", "q1", "{q0,q1}")
  label: string; // Etiqueta visible del estado
  isInitial: boolean; // Si es el estado inicial
  isFinal: boolean; // Si es un estado de aceptación
  position?: { x: number; y: number }; // Posición para visualización
}

/**
 * Transición entre estados
 */
export interface Transition {
  from: string; // ID del estado origen
  to: string; // ID del estado destino
  symbol: string; // Símbolo que causa la transición (puede ser 'ε' para epsilon)
  id: string; // ID único de la transición
}

/**
 * Autómata finito completo
 */
export interface Automaton {
  id: string; // ID único del autómata
  states: State[]; // Lista de estados
  transitions: Transition[]; // Lista de transiciones
  alphabet: string[]; // Alfabeto del autómata
  type: 'NFA' | 'DFA' | 'EPSILON_NFA'; // Tipo de autómata
  name?: string; // Nombre descriptivo opcional
}

/**
 * Configuración para construir un autómata
 */
export interface AutomatonConfig {
  languages: string[]; // Lista de lenguajes (ej: ["L={a,d}", "L={a,d}*"])
  regex?: string; // Expresión regular (opcional)
  algorithm: 'thompson' | 'afd-full' | 'afd-short'; // Algoritmo a usar
  showSteps?: boolean; // Si se deben mostrar los pasos intermedios
}

/**
 * Resultado del reconocimiento de una cadena
 */
export interface RecognitionResult {
  accepted: boolean; // Si la cadena fue aceptada
  transitions: Array<{ from: string; symbol: string; to: string }>; // Lista de transiciones
  currentState: string; // Estado final alcanzado
  remainingInput: string; // Entrada restante
  message: string; // Mensaje final: "aceptada" o "rechazada"
  steps: RecognitionStep[]; // Pasos detallados del reconocimiento
}

/**
 * Paso individual en el reconocimiento de una cadena
 */
export interface RecognitionStep {
  stepNumber: number; // Número del paso
  currentState: string; // Estado actual
  remainingInput: string; // Entrada restante
  symbol: string; // Símbolo leído
  nextState: string; // Siguiente estado
  action: string; // Acción realizada
}

/**
 * Nodo del árbol sintáctico para expresiones regulares
 */
export interface TreeNode {
  id: string; // ID único del nodo
  type: 'SYMBOL' | 'CONCAT' | 'UNION' | 'STAR' | 'PLUS' | 'OPTIONAL' | 'EPSILON'; // Tipo de nodo
  value: string; // Valor del nodo (símbolo u operador)
  children: TreeNode[]; // Hijos del nodo
  position?: number; // Posición en el árbol (para algoritmo de posiciones)
  nullable?: boolean; // Si el nodo puede generar epsilon
  firstpos?: Set<number>; // Conjunto de primeras posiciones
  lastpos?: Set<number>; // Conjunto de últimas posiciones
}

/**
 * Árbol sintáctico completo con funciones calculadas
 */
export interface SyntaxTree {
  regex: string; // Expresión regular original
  root: TreeNode; // Raíz del árbol
  alphabet: string[]; // Alfabeto extraído
  anulable: boolean; // Si la raíz puede generar ε
  primeros: Set<number>; // Primeras posiciones de la raíz
  ultimos: Set<number>; // Últimas posiciones de la raíz
  siguientes: Map<number, Set<number>>; // Mapa de siguientes por posición
  positions: Map<number, string>; // Mapa de posición → símbolo
}

/**
 * Frontera para el algoritmo AF → ER
 */
export interface Frontier {
  from: string; // Estado origen
  to: string; // Estado destino
  symbols: string[]; // Símbolos que llevan de from a to
  expression: string; // Expresión regular que representa esta frontera
}

/**
 * Ecuación en el sistema para AF → ER
 */
export interface Equation {
  left: string; // Lado izquierdo (variable/estado)
  right: string; // Lado derecho (expresión)
  isFinal?: boolean; // Si es un estado final
  isInitial?: boolean; // Si es el estado inicial
}

/**
 * Paso en la resolución del sistema de ecuaciones
 */
export interface EquationStep {
  stepNumber: number; // Número del paso
  description: string; // Descripción del paso
  equations: string[]; // Lista de ecuaciones en este paso
  action: string; // Acción realizada (Arden, Sustitución, etc.)
  highlightedVariable?: string; // Variable destacada en este paso
  explanation?: string; // Explicación adicional
}

/**
 * Tabla de transiciones para construcción de autómatas
 */
export interface TransitionTable {
  headers: string[]; // Encabezados de la tabla (Estado, símbolos)
  rows: Array<{ [key: string]: string | string[] }>; // Filas de la tabla
}

/**
 * Resultado de validación de una expresión regular
 */
export interface RegexValidationResult {
  isValid: boolean; // Si la expresión es válida
  errors: string[]; // Lista de errores encontrados
  warnings?: string[]; // Advertencias opcionales
  alphabet?: string[]; // Alfabeto detectado
}

/**
 * Árbol de análisis sintáctico para visualización
 */
export interface SyntaxTree {
  root: TreeNode; // Nodo raíz del árbol
  alphabet: string[]; // Alfabeto extraído
  positions: Map<number, string>; // Mapa de posiciones a símbolos
}

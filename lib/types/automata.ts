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
  type: 'AFN' | 'AFD' | 'AFD-MIN'; // Tipo de autómata
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
  path: RecognitionStep[]; // Camino de transiciones seguido
  finalState: string; // Estado final alcanzado
  currentIndex: number; // Índice actual en la cadena
  error?: string; // Mensaje de error si falló
  message: string; // Mensaje final: "aceptada" o "rechazada"
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
  transitionId: string; // ID de la transición usada
}

/**
 * Nodo del árbol sintáctico para expresiones regulares
 */
export interface TreeNode {
  id: string; // ID único del nodo
  type: 'symbol' | 'operator' | 'epsilon'; // Tipo de nodo
  value: string; // Valor del nodo (símbolo u operador)
  left?: TreeNode; // Hijo izquierdo
  right?: TreeNode; // Hijo derecho
  position?: number; // Posición en el árbol (para algoritmo de posiciones)
  nullable?: boolean; // Si el nodo puede generar epsilon
  firstpos?: Set<number>; // Conjunto de primeras posiciones
  lastpos?: Set<number>; // Conjunto de últimas posiciones
}

/**
 * Frontera para el algoritmo AF → ER
 */
export interface Frontier {
  state: string; // Estado para el cual se calcula la frontera
  transitions: FrontierTransition[]; // Transiciones desde este estado
}

/**
 * Transición de frontera
 */
export interface FrontierTransition {
  symbol: string; // Símbolo de la transición
  targetState: string; // Estado destino
}

/**
 * Ecuación en el sistema para AF → ER
 */
export interface Equation {
  state: string; // Estado para el cual es la ecuación
  expression: string; // Expresión regular resultante
  terms: EquationTerm[]; // Términos de la ecuación
}

/**
 * Término de una ecuación
 */
export interface EquationTerm {
  coefficient: string; // Coeficiente (símbolo o expresión)
  variable: string; // Variable (estado)
}

/**
 * Paso en la resolución del sistema de ecuaciones
 */
export interface EquationStep {
  stepNumber: number; // Número del paso
  description: string; // Descripción del paso
  equation: string; // Ecuación actual
  substitution?: string; // Sustitución aplicada
  result: string; // Resultado del paso
}

/**
 * Tabla de transiciones para construcción de autómatas
 */
export interface TransitionTable {
  states: string[]; // Lista de estados
  alphabet: string[]; // Alfabeto
  transitions: Map<string, Map<string, string | string[]>>; // Estado → Símbolo → Estado(s) destino
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

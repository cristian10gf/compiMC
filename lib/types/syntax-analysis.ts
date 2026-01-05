/**
 * Tipos para análisis sintáctico (hooks y estados)
 */

import type {
  Grammar,
  FirstFollow,
  ParsingTable,
  PrecedenceTable,
  ParsingResult,
  PrecedenceStep,
  ActionTable,
  GotoTable,
  LRAutomaton,
} from './grammar';

// ============================================================================
// TIPOS PARA ANÁLISIS LR
// ============================================================================

/**
 * Tipo de análisis LR
 */
export type LRAnalysisType = 'SLR' | 'LR1' | 'LALR';

/**
 * Conflicto en tabla LR
 */
export interface LRConflict {
  type: 'shift-reduce' | 'reduce-reduce';
  state: number;
  symbol: string;
  description: string;
}

/**
 * Item LR con clave para comparación
 */
export interface LRItemWithKey {
  production: {
    id: string;
    left: string;
    right: string[];
    number?: number;
  };
  dotPosition: number;
  lookahead?: string;
  key: string;
}

/**
 * Conjunto de estados LR
 */
export interface LRStateSet {
  id: number;
  items: LRItemWithKey[];
  kernel: LRItemWithKey[];
  transitions: Map<string, number>;
}

/**
 * Resultado completo del análisis LR
 */
export interface LRAnalysisResult {
  augmentedGrammar: Grammar;
  afn: LRAutomaton;
  canonicalSets: LRStateSet[];
  actionTable: ActionTable;
  gotoTable: GotoTable;
  conflicts: LRConflict[];
  type: LRAnalysisType;
}

/**
 * Estado del análisis LR
 */
export interface LRAnalysisState {
  /** Gramática aumentada */
  augmentedGrammar: Grammar | null;
  /** AFN de elementos LR(0) */
  afn: LRAutomaton | null;
  /** Resultado SLR */
  slr: LRAnalysisResult | null;
  /** Resultado LR(1) canónico */
  lr1: LRAnalysisResult | null;
  /** Resultado LALR */
  lalr: LRAnalysisResult | null;
  /** Tipo de análisis seleccionado para reconocimiento */
  selectedType: LRAnalysisType;
}

// ============================================================================
// TIPOS DE CÁLCULO (FIRST/FOLLOW)
// ============================================================================

/**
 * Resultado del cálculo de First con reglas aplicadas
 */
export interface FirstCalculationStep {
  nonTerminal: string;
  rule: string;
  values: string[];
  explanation: string;
}

/**
 * Resultado del cálculo de Follow con reglas aplicadas
 */
export interface FollowCalculationStep {
  nonTerminal: string;
  rule: string;
  values: string[];
  explanation: string;
}

/**
 * Resultado de First/Follow con reglas de cálculo
 */
export interface FirstFollowWithRules extends FirstFollow {
  firstRules: FirstCalculationStep[];
  followRules: FollowCalculationStep[];
}

// ============================================================================
// TIPOS DE TRANSFORMACIÓN DE GRAMÁTICA
// ============================================================================

/**
 * Resultado de transformación de gramática
 */
export interface GrammarTransformation {
  originalGrammar: Grammar;
  withoutLeftRecursion: Grammar;
  factorized: Grammar;
  transformationSteps: string[];
}

// ============================================================================
// TIPOS DE ESTADO DEL HOOK
// ============================================================================

/**
 * Tipo de análisis sintáctico
 */
export type SyntaxAnalysisType = 'descendente' | 'ascendente';

/**
 * Modo de análisis para ascendente
 */
export type AscendenteMode = 'manual' | 'automatic';

/**
 * Estado del análisis descendente
 */
export interface DescendenteAnalysisState {
  /** Gramática original */
  originalGrammar: Grammar | null;
  /** Resultado de la transformación de gramática */
  transformation: GrammarTransformation | null;
  /** Gramática de trabajo (transformada) */
  workingGrammar: Grammar | null;
  /** Datos de PRIMERO y SIGUIENTE con reglas */
  firstFollow: FirstFollowWithRules[] | null;
  /** Tabla M de parsing */
  parsingTable: ParsingTable | null;
  /** Verificación LL(1) */
  ll1Check: { isLL1: boolean; conflicts: string[] } | null;
}

/**
 * Estado del análisis ascendente
 */
export interface AscendenteAnalysisState {
  /** Gramática */
  grammar: Grammar | null;
  /** Modo de análisis */
  mode: AscendenteMode;
  /** Pasos de construcción de precedencia (modo manual) */
  precedenceSteps: PrecedenceStep[] | null;
  /** Tabla de precedencia */
  precedenceTable: PrecedenceTable | null;
  /** Validación de gramática de operadores */
  operatorValidation: { valid: boolean; errors: string[] } | null;
  /** Estado del análisis LR */
  lrAnalysis: LRAnalysisState | null;
}

/**
 * Estado del reconocimiento de cadenas
 */
export interface RecognitionState {
  /** Resultado del último reconocimiento */
  result: ParsingResult | null;
  /** Historial de reconocimientos */
  history: Array<{ input: string; result: ParsingResult; timestamp: Date }>;
}

/**
 * Estado completo del hook de análisis sintáctico
 */
export interface SyntaxAnalysisState {
  /** Tipo de análisis actual */
  analysisType: SyntaxAnalysisType | null;
  /** Estado del análisis descendente */
  descendente: DescendenteAnalysisState;
  /** Estado del análisis ascendente */
  ascendente: AscendenteAnalysisState;
  /** Estado del reconocimiento */
  recognition: RecognitionState;
  /** Indica si hay un proceso en curso */
  isProcessing: boolean;
  /** Error actual */
  error: string | null;
}

// ============================================================================
// TIPOS DE OPCIONES
// ============================================================================

/**
 * Opciones para el análisis descendente
 */
export interface DescendenteOptions {
  /** Texto de la gramática */
  grammarText: string;
  /** Terminales (separados por espacios) */
  terminals: string;
  /** Autodetectar terminales */
  autoDetectTerminals?: boolean;
}

/**
 * Opciones para el análisis ascendente
 */
export interface AscendenteOptions {
  /** Texto de la gramática */
  grammarText: string;
  /** Terminales (separados por espacios) */
  terminals: string;
  /** Modo de análisis */
  mode?: AscendenteMode;
  /** Autodetectar terminales */
  autoDetectTerminals?: boolean;
}

/**
 * Opciones para el análisis LR
 */
export interface LRAnalysisOptions {
  /** Texto de la gramática */
  grammarText: string;
  /** Terminales (separados por espacios) */
  terminals: string;
  /** Autodetectar terminales */
  autoDetectTerminals?: boolean;
}

// ============================================================================
// TIPOS DE RETORNO DE HOOKS
// ============================================================================

/**
 * Retorno del hook de análisis sintáctico completo
 */
export interface UseSyntaxAnalysisReturn {
  // Estado
  state: SyntaxAnalysisState;
  
  // Análisis descendente
  analyzeDescendente: (options: DescendenteOptions) => Promise<void>;
  
  // Análisis ascendente
  analyzeAscendente: (options: AscendenteOptions) => Promise<void>;
  
  // Análisis LR
  analyzeLR: (options: LRAnalysisOptions) => Promise<void>;
  
  // Reconocimiento de cadenas
  recognizeString: (input: string, customPrecedenceTable?: PrecedenceTable) => Promise<ParsingResult | null>;
  recognizeStringLR: (input: string, type?: LRAnalysisType) => Promise<ParsingResult | null>;
  
  // Utilidades
  parseGrammar: (grammarText: string, terminals: string, autoDetect?: boolean) => Grammar;
  clearAnalysis: () => void;
  clearError: () => void;
  clearRecognitionHistory: () => void;
  setLRType: (type: LRAnalysisType) => void;
  
  // Computed
  hasAnalysis: boolean;
  currentGrammar: Grammar | null;
}

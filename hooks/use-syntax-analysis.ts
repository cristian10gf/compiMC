/**
 * Hook personalizado para análisis sintáctico
 * 
 * Encapsula la lógica completa del analizador sintáctico tanto descendente (LL)
 * como ascendente (LR/Precedencia de operadores).
 * 
 * Características:
 * - Análisis descendente (LL1) con transformación de gramática
 * - Análisis ascendente (Precedencia de operadores)
 * - Cálculo de PRIMERO y SIGUIENTE
 * - Construcción de tablas de parsing
 * - Reconocimiento de cadenas
 * - Verificación de gramáticas LL(1)
 */

import { useState, useCallback, useMemo } from 'react';
import type {
  Grammar,
  FirstFollow,
  ParsingTable,
  PrecedenceTable,
  ParsingResult,
  PrecedenceStep,
} from '@/lib/types/grammar';
import {
  parseGrammarText,
  transformGrammar,
  generateFirstFollow,
  generateFirstFollowWithRules,
  buildParsingTable,
  parseStringLL,
  isLL1,
  type FirstFollowWithRules,
  type GrammarTransformation,
} from '@/lib/algorithms/syntax/descendente';
import {
  calculatePrecedenceManual,
  calculatePrecedenceAutomatic,
  parseStringPrecedence,
  isOperatorGrammar,
} from '@/lib/algorithms/syntax/ascendente';

// ============================================================================
// TIPOS
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
 * Estado completo del hook
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
 * Retorno del hook
 */
export interface UseSyntaxAnalysisReturn {
  // Estado
  state: SyntaxAnalysisState;
  
  // Análisis descendente
  analyzeDescendente: (options: DescendenteOptions) => Promise<void>;
  
  // Análisis ascendente
  analyzeAscendente: (options: AscendenteOptions) => Promise<void>;
  
  // Reconocimiento de cadenas
  recognizeString: (input: string) => Promise<ParsingResult | null>;
  
  // Utilidades
  parseGrammar: (grammarText: string, terminals: string, autoDetect?: boolean) => Grammar;
  clearAnalysis: () => void;
  clearError: () => void;
  clearRecognitionHistory: () => void;
  
  // Computed
  hasAnalysis: boolean;
  currentGrammar: Grammar | null;
}

// ============================================================================
// ESTADO INICIAL
// ============================================================================

const initialDescendenteState: DescendenteAnalysisState = {
  originalGrammar: null,
  transformation: null,
  workingGrammar: null,
  firstFollow: null,
  parsingTable: null,
  ll1Check: null,
};

const initialAscendenteState: AscendenteAnalysisState = {
  grammar: null,
  mode: 'automatic',
  precedenceSteps: null,
  precedenceTable: null,
  operatorValidation: null,
};

const initialRecognitionState: RecognitionState = {
  result: null,
  history: [],
};

const initialState: SyntaxAnalysisState = {
  analysisType: null,
  descendente: initialDescendenteState,
  ascendente: initialAscendenteState,
  recognition: initialRecognitionState,
  isProcessing: false,
  error: null,
};

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook para análisis sintáctico completo
 */
export function useSyntaxAnalysis(): UseSyntaxAnalysisReturn {
  const [state, setState] = useState<SyntaxAnalysisState>(initialState);

  // -------------------------------------------------------------------------
  // Utilidades
  // -------------------------------------------------------------------------

  /**
   * Parsea una gramática desde texto
   */
  const parseGrammar = useCallback((
    grammarText: string,
    terminals: string,
    autoDetect: boolean = false
  ): Grammar => {
    return parseGrammarText(grammarText, terminals, autoDetect);
  }, []);

  /**
   * Limpia el error actual
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * Limpia el análisis completo
   */
  const clearAnalysis = useCallback(() => {
    setState(initialState);
  }, []);

  /**
   * Limpia el historial de reconocimientos
   */
  const clearRecognitionHistory = useCallback(() => {
    setState(prev => ({
      ...prev,
      recognition: {
        ...prev.recognition,
        history: [],
      },
    }));
  }, []);

  // -------------------------------------------------------------------------
  // Análisis Descendente (LL)
  // -------------------------------------------------------------------------

  /**
   * Realiza el análisis sintáctico descendente completo
   */
  const analyzeDescendente = useCallback(async (options: DescendenteOptions) => {
    const { grammarText, terminals, autoDetectTerminals = false } = options;

    setState(prev => ({
      ...prev,
      isProcessing: true,
      error: null,
      analysisType: 'descendente',
    }));

    try {
      // 1. Parsear la gramática
      const originalGrammar = parseGrammarText(grammarText, terminals, autoDetectTerminals);
      
      if (originalGrammar.productions.length === 0) {
        throw new Error('No se pudieron parsear las producciones. Verifica el formato de la gramática.');
      }

      // 2. Transformar la gramática (eliminar recursividad izquierda, factorizar)
      const transformation = transformGrammar(originalGrammar);
      const workingGrammar = transformation.factorized;

      // ordena los noterminales segun el orden de definicion de las producciones      
      const orderedNonTerminals = Array.from(new Set(workingGrammar.productions.map(p => p.left)));
      const orderedTerminals = Array.from(new Set(
        workingGrammar.productions.flatMap(p => p.right)
                                  .filter(s => !workingGrammar.nonTerminals.includes(s) && s !== 'ε')
      ));

      workingGrammar.nonTerminals = orderedNonTerminals;
      workingGrammar.terminals = orderedTerminals;

      // 3. Calcular PRIMERO y SIGUIENTE con reglas
      const firstFollow = generateFirstFollowWithRules(workingGrammar);

      // 4. Construir la tabla M de parsing
      const parsingTable = buildParsingTable(workingGrammar);

      // 5. Verificar si es LL(1)
      const ll1Check = isLL1(workingGrammar);

      // Actualizar estado
      setState(prev => ({
        ...prev,
        isProcessing: false,
        analysisType: 'descendente',
        descendente: {
          originalGrammar,
          transformation,
          workingGrammar,
          firstFollow,
          parsingTable,
          ll1Check,
        },
        // Limpiar estado ascendente
        ascendente: initialAscendenteState,
        // Limpiar reconocimiento previo
        recognition: initialRecognitionState,
      }));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al analizar la gramática';
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: errorMessage,
        descendente: initialDescendenteState,
      }));
    }
  }, []);

  // -------------------------------------------------------------------------
  // Análisis Ascendente (Precedencia de Operadores)
  // -------------------------------------------------------------------------

  /**
   * Realiza el análisis sintáctico ascendente
   */
  const analyzeAscendente = useCallback(async (options: AscendenteOptions) => {
    const { grammarText, terminals, mode = 'automatic', autoDetectTerminals = false } = options;

    setState(prev => ({
      ...prev,
      isProcessing: true,
      error: null,
      analysisType: 'ascendente',
    }));

    try {
      // 1. Parsear la gramática
      const grammar = parseGrammarText(grammarText, terminals, autoDetectTerminals);
      
      if (grammar.productions.length === 0) {
        throw new Error('No se pudieron parsear las producciones. Verifica el formato de la gramática.');
      }

      // 2. Verificar que sea gramática de operadores
      const operatorValidation = isOperatorGrammar(grammar);
      
      if (!operatorValidation.valid) {
        throw new Error(`Gramática no válida para precedencia de operadores:\n${operatorValidation.errors.join('\n')}`);
      }

      // 3. Calcular tabla de precedencia
      let precedenceSteps: PrecedenceStep[] | null = null;
      let precedenceTable: PrecedenceTable;

      if (mode === 'manual') {
        // Modo manual: generar pasos
        precedenceSteps = calculatePrecedenceManual(grammar);
        
        // Construir tabla a partir de los pasos
        const symbols = [...grammar.terminals, '$'];
        const relations = new Map<string, Map<string, '<' | '>' | '=' | '·'>>();
        
        // Inicializar mapa
        symbols.forEach(s1 => {
          relations.set(s1, new Map());
          symbols.forEach(s2 => {
            relations.get(s1)!.set(s2, '·');
          });
        });

        // Aplicar relaciones de los pasos
        precedenceSteps.forEach(step => {
          step.relations.forEach(rel => {
            relations.get(rel.symbol1)?.set(rel.symbol2, rel.relation);
          });
        });

        precedenceTable = { symbols, relations };
      } else {
        // Modo automático
        precedenceTable = calculatePrecedenceAutomatic(grammar);
      }

      // Actualizar estado
      setState(prev => ({
        ...prev,
        isProcessing: false,
        analysisType: 'ascendente',
        ascendente: {
          grammar,
          mode,
          precedenceSteps,
          precedenceTable,
          operatorValidation,
        },
        // Limpiar estado descendente
        descendente: initialDescendenteState,
        // Limpiar reconocimiento previo
        recognition: initialRecognitionState,
      }));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al analizar la gramática';
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: errorMessage,
        ascendente: initialAscendenteState,
      }));
    }
  }, []);

  // -------------------------------------------------------------------------
  // Reconocimiento de Cadenas
  // -------------------------------------------------------------------------

  /**
   * Reconoce una cadena con el análisis actual
   */
  const recognizeString = useCallback(async (input: string): Promise<ParsingResult | null> => {
    if (!state.analysisType) {
      setState(prev => ({
        ...prev,
        error: 'Primero debes realizar un análisis de gramática',
      }));
      return null;
    }

    setState(prev => ({
      ...prev,
      isProcessing: true,
      error: null,
    }));

    try {
      let result: ParsingResult;

      if (state.analysisType === 'descendente') {
        // Análisis LL
        const { workingGrammar, parsingTable } = state.descendente;
        
        if (!workingGrammar || !parsingTable) {
          throw new Error('No hay análisis descendente disponible');
        }

        result = parseStringLL(workingGrammar, parsingTable, input);
      } else {
        // Análisis por precedencia
        const { grammar, precedenceTable } = state.ascendente;
        
        if (!grammar || !precedenceTable) {
          throw new Error('No hay análisis ascendente disponible');
        }

        result = parseStringPrecedence(grammar, precedenceTable, input);
      }

      // Actualizar estado con resultado
      setState(prev => ({
        ...prev,
        isProcessing: false,
        recognition: {
          result,
          history: [
            { input, result, timestamp: new Date() },
            ...prev.recognition.history.slice(0, 9), // Mantener últimos 10
          ],
        },
      }));

      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al reconocer la cadena';
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: errorMessage,
      }));
      return null;
    }
  }, [state.analysisType, state.descendente, state.ascendente]);

  // -------------------------------------------------------------------------
  // Valores Computados
  // -------------------------------------------------------------------------

  /**
   * Indica si hay un análisis realizado
   */
  const hasAnalysis = useMemo(() => {
    if (state.analysisType === 'descendente') {
      return state.descendente.workingGrammar !== null;
    }
    if (state.analysisType === 'ascendente') {
      return state.ascendente.grammar !== null;
    }
    return false;
  }, [state.analysisType, state.descendente.workingGrammar, state.ascendente.grammar]);

  /**
   * Gramática actual (según el tipo de análisis)
   */
  const currentGrammar = useMemo(() => {
    if (state.analysisType === 'descendente') {
      return state.descendente.workingGrammar;
    }
    if (state.analysisType === 'ascendente') {
      return state.ascendente.grammar;
    }
    return null;
  }, [state.analysisType, state.descendente.workingGrammar, state.ascendente.grammar]);

  // -------------------------------------------------------------------------
  // Retorno
  // -------------------------------------------------------------------------

  return {
    state,
    analyzeDescendente,
    analyzeAscendente,
    recognizeString,
    parseGrammar,
    clearAnalysis,
    clearError,
    clearRecognitionHistory,
    hasAnalysis,
    currentGrammar,
  };
}

// ============================================================================
// HOOKS ESPECIALIZADOS
// ============================================================================

/**
 * Hook especializado solo para análisis descendente
 */
export function useDescendenteAnalysis() {
  const analysis = useSyntaxAnalysis();
  
  return {
    // Estado específico descendente
    state: analysis.state.descendente,
    recognition: analysis.state.recognition,
    isProcessing: analysis.state.isProcessing,
    error: analysis.state.error,
    
    // Funciones
    analyze: analysis.analyzeDescendente,
    recognizeString: analysis.recognizeString,
    parseGrammar: analysis.parseGrammar,
    clearAnalysis: analysis.clearAnalysis,
    clearError: analysis.clearError,
    
    // Computed
    hasAnalysis: analysis.state.analysisType === 'descendente' && analysis.hasAnalysis,
  };
}

/**
 * Hook especializado solo para análisis ascendente
 */
export function useAscendenteAnalysis() {
  const analysis = useSyntaxAnalysis();
  
  return {
    // Estado específico ascendente
    state: analysis.state.ascendente,
    recognition: analysis.state.recognition,
    isProcessing: analysis.state.isProcessing,
    error: analysis.state.error,
    
    // Funciones
    analyze: analysis.analyzeAscendente,
    recognizeString: analysis.recognizeString,
    parseGrammar: analysis.parseGrammar,
    clearAnalysis: analysis.clearAnalysis,
    clearError: analysis.clearError,
    
    // Computed
    hasAnalysis: analysis.state.analysisType === 'ascendente' && analysis.hasAnalysis,
  };
}

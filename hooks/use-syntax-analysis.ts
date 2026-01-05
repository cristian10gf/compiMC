/**
 * Hook personalizado para análisis sintáctico
 * 
 * Encapsula la lógica completa del analizador sintáctico tanto descendente (LL)
 * como ascendente (LR/Precedencia de operadores).
 * 
 * Características:
 * - Análisis descendente (LL1) con transformación de gramática
 * - Análisis ascendente (Precedencia de operadores)
 * - Análisis LR (SLR, LR canónico, LALR)
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
import type {
  FirstFollowWithRules,
  GrammarTransformation,
  SyntaxAnalysisType,
  AscendenteMode,
  DescendenteAnalysisState,
  AscendenteAnalysisState,
  RecognitionState,
  SyntaxAnalysisState,
  DescendenteOptions,
  AscendenteOptions,
  LRAnalysisOptions,
  LRAnalysisType,
  LRAnalysisState,
  UseSyntaxAnalysisReturn,
} from '@/lib/types/syntax-analysis';
import {
  parseGrammarText,
  transformGrammar,
  generateFirstFollow,
  generateFirstFollowWithRules,
  buildParsingTable,
  parseStringLL,
  isLL1,
} from '@/lib/algorithms/syntax/descendente';
import {
  calculatePrecedenceManual,
  calculatePrecedenceAutomatic,
  parseStringPrecedence,
  isOperatorGrammar,
} from '@/lib/algorithms/syntax/ascendente';
import {
  buildSLRTable,
  buildLR1Table,
  buildLALRTable,
  buildLR0AFN,
  augmentGrammar,
  parseLR,
} from '@/lib/algorithms/syntax/lr';

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

const initialLRAnalysisState: LRAnalysisState = {
  augmentedGrammar: null,
  afn: null,
  slr: null,
  lr1: null,
  lalr: null,
  selectedType: 'SLR',
};

const initialAscendenteState: AscendenteAnalysisState = {
  grammar: null,
  mode: 'automatic',
  precedenceSteps: null,
  precedenceTable: null,
  operatorValidation: null,
  lrAnalysis: null,
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
          lrAnalysis: null,
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
  // Análisis LR
  // -------------------------------------------------------------------------

  /**
   * Realiza el análisis LR completo (SLR, LR1, LALR)
   */
  const analyzeLR = useCallback(async (options: LRAnalysisOptions) => {
    const { grammarText, terminals, autoDetectTerminals = false } = options;

    setState(prev => ({
      ...prev,
      isProcessing: true,
      error: null,
      analysisType: 'ascendente',
    }));

    try {
      // 1. Parsear la gramática
      const grammar = parseGrammarText(grammarText, terminals, autoDetectTerminals);
      
      // ordenar los terminales segun el orden de definicion de las producciones
      grammar.terminals.sort((a, b) => {
        const indexA = grammar.productions.findIndex(p => p.right.includes(a));
        const indexB = grammar.productions.findIndex(p => p.right.includes(b));
        return indexA - indexB;
      });
      
      // ordenar los no terminales segun el orden de definicion de las producciones
      grammar.nonTerminals.sort((a, b) => {
        const indexA = grammar.productions.findIndex(p => p.left === a);
        const indexB = grammar.productions.findIndex(p => p.left === b);
        return indexA - indexB;
      });


      if (grammar.productions.length === 0) {
        throw new Error('No se pudieron parsear las producciones. Verifica el formato de la gramática.');
      }

      // 2. Construir gramática aumentada
      const augmentedGrammar = augmentGrammar(grammar);

      // 3. Construir AFN LR(0)
      const afn = buildLR0AFN(grammar);

      // 4. Construir tablas para cada tipo
      const slr = buildSLRTable(grammar);
      const lr1 = buildLR1Table(grammar);
      const lalr = buildLALRTable(grammar);

      // 5. Actualizar estado
      setState(prev => ({
        ...prev,
        isProcessing: false,
        analysisType: 'ascendente',
        ascendente: {
          grammar,
          mode: 'automatic',
          precedenceSteps: null,
          precedenceTable: null,
          operatorValidation: null,
          lrAnalysis: {
            augmentedGrammar,
            afn,
            slr,
            lr1,
            lalr,
            selectedType: 'SLR',
          },
        },
        descendente: initialDescendenteState,
        recognition: initialRecognitionState,
      }));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al analizar la gramática';
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: errorMessage,
      }));
    }
  }, []);

  /**
   * Cambia el tipo de análisis LR seleccionado
   */
  const setLRType = useCallback((type: LRAnalysisType) => {
    setState(prev => ({
      ...prev,
      ascendente: {
        ...prev.ascendente,
        lrAnalysis: prev.ascendente.lrAnalysis
          ? { ...prev.ascendente.lrAnalysis, selectedType: type }
          : null,
      },
    }));
  }, []);

  // -------------------------------------------------------------------------
  // Reconocimiento de Cadenas
  // -------------------------------------------------------------------------

  /**
   * Reconoce una cadena con el análisis actual
   * @param input - Cadena a reconocer
   * @param customPrecedenceTable - Tabla de precedencia personalizada (opcional, solo para ascendente)
   */
  const recognizeString = useCallback(async (
    input: string,
    customPrecedenceTable?: PrecedenceTable
  ): Promise<ParsingResult | null> => {
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
        
        if (!grammar) {
          throw new Error('No hay gramática disponible');
        }

        // Usar la tabla personalizada si se proporciona, sino usar la del estado
        const tableToUse = customPrecedenceTable || precedenceTable;
        
        if (!tableToUse) {
          throw new Error('No hay tabla de precedencia disponible');
        }

        result = parseStringPrecedence(grammar, tableToUse, input);
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
      return state.ascendente.grammar !== null || state.ascendente.lrAnalysis !== null;
    }
    return false;
  }, [state.analysisType, state.descendente.workingGrammar, state.ascendente.grammar, state.ascendente.lrAnalysis]);

  /**
   * Gramática actual (según el tipo de análisis)
   */
  const currentGrammar = useMemo(() => {
    if (state.analysisType === 'descendente') {
      return state.descendente.workingGrammar;
    }
    if (state.analysisType === 'ascendente') {
      return state.ascendente.lrAnalysis?.augmentedGrammar || state.ascendente.grammar;
    }
    return null;
  }, [state.analysisType, state.descendente.workingGrammar, state.ascendente.grammar, state.ascendente.lrAnalysis]);

  /**
   * Reconoce una cadena usando análisis LR
   */
  const recognizeStringLR = useCallback(async (
    input: string,
    type?: LRAnalysisType
  ): Promise<ParsingResult | null> => {
    const lrAnalysis = state.ascendente.lrAnalysis;
    
    if (!lrAnalysis) {
      setState(prev => ({
        ...prev,
        error: 'Primero debes realizar un análisis LR',
      }));
      return null;
    }

    setState(prev => ({
      ...prev,
      isProcessing: true,
      error: null,
    }));

    try {
      const analysisType = type || lrAnalysis.selectedType;
      const grammar = state.ascendente.grammar;
      
      if (!grammar) {
        throw new Error('No hay gramática disponible');
      }

      let actionTable;
      let gotoTable;

      switch (analysisType) {
        case 'SLR':
          actionTable = lrAnalysis.slr?.actionTable;
          gotoTable = lrAnalysis.slr?.gotoTable;
          break;
        case 'LR1':
          actionTable = lrAnalysis.lr1?.actionTable;
          gotoTable = lrAnalysis.lr1?.gotoTable;
          break;
        case 'LALR':
          actionTable = lrAnalysis.lalr?.actionTable;
          gotoTable = lrAnalysis.lalr?.gotoTable;
          break;
      }

      if (!actionTable || !gotoTable) {
        throw new Error(`No hay tabla de análisis ${analysisType} disponible`);
      }

      const result = parseLR(grammar, actionTable, gotoTable, input);

      setState(prev => ({
        ...prev,
        isProcessing: false,
        recognition: {
          result,
          history: [
            { input, result, timestamp: new Date() },
            ...prev.recognition.history.slice(0, 9),
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
  }, [state.ascendente.lrAnalysis, state.ascendente.grammar]);

  // -------------------------------------------------------------------------
  // Retorno
  // -------------------------------------------------------------------------

  return {
    state,
    analyzeDescendente,
    analyzeAscendente,
    analyzeLR,
    recognizeString,
    recognizeStringLR,
    parseGrammar,
    clearAnalysis,
    clearError,
    clearRecognitionHistory,
    setLRType,
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
    analyzeLR: analysis.analyzeLR,
    recognizeString: analysis.recognizeString,
    recognizeStringLR: analysis.recognizeStringLR,
    parseGrammar: analysis.parseGrammar,
    clearAnalysis: analysis.clearAnalysis,
    clearError: analysis.clearError,
    setLRType: analysis.setLRType,
    
    // Computed
    hasAnalysis: analysis.state.analysisType === 'ascendente' && analysis.hasAnalysis,
  };
}


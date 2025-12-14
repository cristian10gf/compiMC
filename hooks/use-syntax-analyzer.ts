/**
 * Hook personalizado para el análisis sintáctico
 * 
 * Proporciona funcionalidades para:
 * - Análisis descendente (LL)
 * - Análisis ascendente (LR)
 * - Cálculo de First y Follow
 * - Construcción de tablas de parsing
 * - Simulación paso a paso
 */

import { useState, useCallback } from 'react';
import { useCompiler } from '@/lib/context/compiler-context';
import {
  Grammar,
  FirstFollow,
  ParsingTable,
  PrecedenceTable,
  GotoTable,
  ActionTable,
  ParsingResult,
  ParseStep,
} from '@/lib/types';
import { 
  generateFirstFollow, 
  buildParsingTable,
  parseStringLL,
} from '@/lib/algorithms/syntax/descendente';
import {
  calculatePrecedenceManual,
  calculatePrecedenceAutomatic,
  parseStringPrecedence,
} from '@/lib/algorithms/syntax/ascendente';

export interface UseSyntaxAnalyzerReturn {
  // Estado
  grammar: Grammar | null;
  mode: 'LL' | 'LR' | null;
  firstFollow: FirstFollow[] | null;
  parsingTable: ParsingTable | null;
  precedenceTable: PrecedenceTable | null;
  gotoTable: GotoTable | null;
  actionTable: ActionTable | null;
  parsingResult: ParsingResult | null;
  isManualMode: boolean;
  isProcessing: boolean;
  error: string | null;

  // Funciones
  setGrammar: (grammar: Grammar) => void;
  analyzeLL: () => Promise<void>;
  analyzeLR: (manual: boolean) => Promise<void>;
  parseString: (input: string) => Promise<ParsingResult | null>;
  setManualMode: (manual: boolean) => void;
  clearAnalysis: () => void;
  clearError: () => void;
}

/**
 * Hook de analizador sintáctico
 */
export function useSyntaxAnalyzer(): UseSyntaxAnalyzerReturn {
  const {
    syntax,
    setGrammar: setContextGrammar,
    setSyntaxMode,
    setFirstFollow,
    setParsingTable,
    setPrecedenceTable,
    setGotoTable,
    setActionTable,
    setParsingResult,
    setIsManualMode,
  } = useCompiler();

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Establece la gramática
   */
  const setGrammar = useCallback((grammar: Grammar) => {
    setContextGrammar(grammar);
    // Limpiar análisis previos
    setFirstFollow(null);
    setParsingTable(null);
    setPrecedenceTable(null);
    setGotoTable(null);
    setActionTable(null);
    setParsingResult(null);
  }, [setContextGrammar, setFirstFollow, setParsingTable, setPrecedenceTable, setGotoTable, setActionTable, setParsingResult]);

  /**
   * Realiza análisis descendente (LL)
   */
  const analyzeLL = useCallback(async () => {
    if (!syntax.grammar) {
      setError('No hay gramática definida');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      setSyntaxMode('LL');

      // Calcular First y Follow
      const firstFollowResult = generateFirstFollow(syntax.grammar);
      setFirstFollow(firstFollowResult);

      // Construir tabla de parsing M
      const parsingTable = buildParsingTable(syntax.grammar);
      setParsingTable(parsingTable);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error en análisis LL';
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [syntax.grammar, setSyntaxMode, setFirstFollow, setParsingTable]);

  /**
   * Realiza análisis ascendente (LR)
   */
  const analyzeLR = useCallback(async (manual: boolean) => {
    if (!syntax.grammar) {
      setError('No hay gramática definida');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      setSyntaxMode('LR');
      setIsManualMode(manual);

      // Calcular tabla de precedencia
      let precedenceTable: PrecedenceTable;
      
      if (manual) {
        // Modo manual: generar pasos
        const steps = calculatePrecedenceManual(syntax.grammar);
        
        // Construir tabla a partir de los pasos
        const symbols = [
          ...syntax.grammar.terminals,
          ...syntax.grammar.nonTerminals,
        ];
        
        const relations = new Map<string, Map<string, '<' | '>' | '=' | '·'>>();
        
        // Inicializar mapa
        symbols.forEach(s1 => {
          relations.set(s1, new Map());
          symbols.forEach(s2 => {
            relations.get(s1)!.set(s2, '·');
          });
        });

        // Aplicar relaciones de los pasos
        steps.forEach(step => {
          step.relations.forEach(rel => {
            relations.get(rel.symbol1)?.set(rel.symbol2, rel.relation);
          });
        });

        precedenceTable = { symbols, relations };
      } else {
        // Modo automático
        precedenceTable = calculatePrecedenceAutomatic(syntax.grammar);
      }

      setPrecedenceTable(precedenceTable);

      // Tablas goto y action (placeholder - implementación compleja)
      // En una implementación real, se construirían aquí
      setGotoTable({});
      setActionTable({});
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error en análisis LR';
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [syntax.grammar, setSyntaxMode, setIsManualMode, setPrecedenceTable, setGotoTable, setActionTable]);

  /**
   * Parsea una cadena con la gramática actual
   */
  const parseString = useCallback(async (input: string): Promise<ParsingResult | null> => {
    if (!syntax.grammar) {
      setError('No hay gramática definida');
      return null;
    }

    if (!syntax.mode) {
      setError('No se ha realizado un análisis previo');
      return null;
    }

    setIsProcessing(true);
    setError(null);

    try {
      let result: ParsingResult;

      if (syntax.mode === 'LL') {
        if (!syntax.parsingTable) {
          throw new Error('No hay tabla de parsing LL disponible');
        }
        result = parseStringLL(syntax.grammar, syntax.parsingTable, input);
      } else {
        // LR
        if (!syntax.precedenceTable) {
          throw new Error('No hay tabla de precedencia disponible');
        }
        result = parseStringPrecedence(
          syntax.grammar,
          syntax.precedenceTable,
          input
        );
      }

      setParsingResult(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al parsear la cadena';
      setError(errorMessage);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [syntax.grammar, syntax.mode, syntax.parsingTable, syntax.precedenceTable, syntax.gotoTable, setParsingResult]);

  /**
   * Establece el modo manual/automático
   */
  const setManualMode = useCallback((manual: boolean) => {
    setIsManualMode(manual);
  }, [setIsManualMode]);

  /**
   * Limpia el análisis actual
   */
  const clearAnalysis = useCallback(() => {
    setContextGrammar(null);
    setSyntaxMode(null);
    setFirstFollow(null);
    setParsingTable(null);
    setPrecedenceTable(null);
    setGotoTable(null);
    setActionTable(null);
    setParsingResult(null);
    setIsManualMode(false);
    setError(null);
  }, [
    setContextGrammar,
    setSyntaxMode,
    setFirstFollow,
    setParsingTable,
    setPrecedenceTable,
    setGotoTable,
    setActionTable,
    setParsingResult,
    setIsManualMode,
  ]);

  /**
   * Limpia el error actual
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    grammar: syntax.grammar,
    mode: syntax.mode,
    firstFollow: syntax.firstFollow,
    parsingTable: syntax.parsingTable,
    precedenceTable: syntax.precedenceTable,
    gotoTable: syntax.gotoTable,
    actionTable: syntax.actionTable,
    parsingResult: syntax.parsingResult,
    isManualMode: syntax.isManualMode,
    isProcessing,
    error,
    setGrammar,
    analyzeLL,
    analyzeLR,
    parseString,
    setManualMode,
    clearAnalysis,
    clearError,
  };
}

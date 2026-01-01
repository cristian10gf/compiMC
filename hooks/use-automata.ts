/**
 * Hook personalizado para manejar autómatas finitos
 * 
 * Proporciona funcionalidades para:
 * - Construir autómatas a partir de expresiones regulares
 * - Reconocer cadenas
 * - Generar tablas de transiciones
 * - Convertir AF a ER
 * 
 * Utiliza el CompilerContext para persistir el estado
 */

import { useState, useCallback } from 'react';
import { useCompiler } from '@/lib/context/compiler-context';
import { 
  Automaton, 
  AutomatonConfig, 
  RecognitionResult,
  TransitionTable,
  AutomatonResults
} from '@/lib/types';
import { buildAFDFull, buildAFDShort } from '@/lib/algorithms/lexical/afd-construction';
import { recognizeStringDFA } from '@/lib/algorithms/lexical/string-recognition';
import { afToER } from '@/lib/algorithms/lexical/af-to-er';
import { validateRegex } from '@/lib/algorithms/lexical/regex-parser';

export interface UseAutomataReturn {
  // Estado
  automaton: AutomatonResults | null;
  isProcessing: boolean;
  error: string | null;
  recognitionResult: RecognitionResult | null;
  
  // Funciones
  buildAutomaton: (config: AutomatonConfig) => Promise<AutomatonResults  | null>;
  testString: (input: string) => Promise<RecognitionResult | null>;
  getTransitionTable: () => TransitionTable | null;
  convertToER: () => Promise<{ regex: string; steps: any[] } | null>;
  clearAutomaton: () => void;
  clearError: () => void;
}

/**
 * Hook de autómata
 */
export function useAutomata(): UseAutomataReturn {
  const { 
    lexical, 
    setAutomaton, 
    setRecognitionResult,
    setAfToErResult,
  } = useCompiler();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syntaxTree, setSyntaxTree] = useState<Automaton | null>(null);

  /**
   * Construye un autómata basado en la configuración
   * Retorna el árbol sintáctico construido
   */
  const buildAutomaton = useCallback(async (config: AutomatonConfig): Promise<AutomatonResults  | null> => {
    setIsProcessing(true);
    setError(null);
    setSyntaxTree(null);

    try {
      // Validar expresión regular si existe
      if (!config.regex) {
        throw new Error('Se requiere una expresión regular');
      }

      const validation = validateRegex(config.regex);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      let results : AutomatonResults

      switch (config.algorithm) {
        case 'afd-full':
          // AFD mediante thompson + subconjuntos + estados significativos
          results = buildAFDFull(config.regex);
          break;

        case 'afd-short':
          // AFD optimizado mediante arbol sintáctico
          results = buildAFDShort(config.regex);
          break;

        default:
          throw new Error(`Algoritmo no soportado: ${config.algorithm}`);
      }

      // 3. Guardar autómata en el contexto
      setAutomaton(results);

      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al construir el autómata';
      setError(errorMessage);
      setAutomaton(null);
      setSyntaxTree(null);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [setAutomaton]);

  /**
   * Prueba si una cadena es aceptada por el autómata
   */
  const testString = useCallback(async (input: string): Promise<RecognitionResult | null> => {
    if (!lexical.automaton) {
      setError('No hay autómata disponible para reconocer la cadena');
      return null;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const result = recognizeStringDFA(lexical.automaton.automatonAFD, input);
      setRecognitionResult(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al reconocer la cadena';
      setError(errorMessage);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [lexical.automaton, setRecognitionResult]);

  /**
   * Genera la tabla de transiciones del autómata
   */
  const getTransitionTable = useCallback((): TransitionTable | null => {
    if (!lexical.automaton) return null;

    const { states, transitions, alphabet } = lexical.automaton.automatonAFD;

    // Crear encabezados: Estado, símbolo1, símbolo2, ...
    const headers = ['Estado', ...alphabet];

    // Crear filas
    const rows = states.map(state => {
      const row: { [key: string]: string | string[] } = {
        Estado: state.label,
      };

      // Para cada símbolo del alfabeto, encontrar transiciones
      alphabet.forEach(symbol => {
        const stateTransitions = transitions
          .filter(t => t.from === state.id && t.symbol === symbol)
          .map(t => {
            const targetState = states.find(s => s.id === t.to);
            return targetState?.label || t.to;
          });

        // Si no hay transiciones, poner guion
        row[symbol] = stateTransitions.length > 0 ? stateTransitions : '-';
      });

      return row;
    });

    return { headers, rows };
  }, [lexical.automaton]);

  /**
   * Convierte el autómata a expresión regular
   */
  const convertToER = useCallback(async (): Promise<{ regex: string; steps: any[] } | null> => {
    if (!lexical.automaton) {
      setError('No hay autómata disponible para convertir');
      return null;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const result = afToER(lexical.automaton.automatonAFD);
      setAfToErResult(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al convertir a ER';
      setError(errorMessage);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [lexical.automaton, setAfToErResult]);

  /**
   * Limpia el autómata actual
   */
  const clearAutomaton = useCallback(() => {
    setAutomaton(null);
    setRecognitionResult(null);
    setAfToErResult(null);
    setError(null);
  }, [setAutomaton, setRecognitionResult, setAfToErResult]);

  /**
   * Limpia el error actual
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    automaton: lexical.automaton,
    isProcessing,
    error,
    recognitionResult: lexical.recognitionResult,
    buildAutomaton,
    testString,
    getTransitionTable,
    convertToER,
    clearAutomaton,
    clearError,
  };
}

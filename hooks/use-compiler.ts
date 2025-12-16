/**
 * Hook personalizado para el compilador completo
 * 
 * Proporciona funcionalidades para:
 * - Análisis léxico (tokenización)
 * - Análisis sintáctico (árbol de derivación)
 * - Generación de código intermedio
 * - Optimización de código
 * - Generación de código objeto
 */

import { useState, useCallback } from 'react';
import { useCompiler as useCompilerContext } from '@/lib/context/compiler-context';
import { useHistory as useHistoryContext } from '@/lib/context/history-context';
import { CompilerResult, Token } from '@/lib/types';
import {
  lexicalAnalysis,
  syntaxAnalysis,
  semanticAnalysis,
  generateIntermediateCode,
  optimizeCode,
  generateObjectCode,
  TokenPattern,
} from '@/lib/algorithms/general/compiler';

export interface UseCompilerFullReturn {
  // Estado
  sourceCode: string;
  result: CompilerResult | null;
  currentPhase: 'idle' | 'lexical' | 'syntax' | 'intermediate' | 'optimization' | 'codegen' | 'complete';
  progress: number;
  isProcessing: boolean;
  error: string | null;

  // Funciones
  setSourceCode: (code: string) => void;
  compile: (customPatterns?: TokenPattern[]) => Promise<void>;
  compilePhase: (phase: 'lexical' | 'syntax' | 'intermediate' | 'optimization' | 'codegen') => Promise<void>;
  clearCompiler: () => void;
  clearError: () => void;
}

/**
 * Hook de compilador completo
 */
export function useCompilerFull(): UseCompilerFullReturn {
  const {
    compiler,
    setSourceCode: setContextSourceCode,
    setCompilerResult,
    setCompilerPhase,
    setCompilerProgress,
  } = useCompilerContext();

  const { addEntry } = useHistoryContext();

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Establece el código fuente
   */
  const setSourceCode = useCallback((code: string) => {
    setContextSourceCode(code);
  }, [setContextSourceCode]);

  /**
   * Compila el código completo (siempre hace análisis y síntesis)
   */
  const compile = useCallback(async (customPatterns?: TokenPattern[]) => {
    if (!compiler.sourceCode || compiler.sourceCode.trim() === '') {
      setError('No hay código fuente para compilar');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setCompilerProgress(0);

    try {
      // Fase 1: Análisis Léxico
      setCompilerPhase('lexical');
      setCompilerProgress(20);
      const lexicalResult = await lexicalAnalysis(compiler.sourceCode, customPatterns);
      
      if (lexicalResult.tokens.length === 0) {
        throw new Error('No se generaron tokens en el análisis léxico');
      }

      // Fase 2: Análisis Sintáctico
      setCompilerPhase('syntax');
      setCompilerProgress(30);
      const syntaxTree = await syntaxAnalysis(lexicalResult.tokens);

      // Fase 3: Análisis Semántico
      setCompilerProgress(50);
      const semanticTree = await semanticAnalysis(syntaxTree);

      // Fase 4: Generación de Código Intermedio
      setCompilerPhase('intermediate');
      setCompilerProgress(60);
      const intermediateCode = await generateIntermediateCode(semanticTree);

      // Fase 5: Optimización
      setCompilerPhase('optimization');
      setCompilerProgress(80);
      const optimizations = await optimizeCode(intermediateCode);

      // Fase 6: Generación de Código Objeto
      setCompilerPhase('codegen');
      setCompilerProgress(90);
      const objectCode = await generateObjectCode(optimizations);

      // Resultado completo con TODAS las fases
      const result: CompilerResult = {
        success: true,
        syntaxTree: syntaxTree || undefined,
        semanticTree: semanticTree || undefined,
        lexical: lexicalResult,
        syntax: { parseTree: syntaxTree as any, success: true, errors: [] },
        intermediateCode,
        optimization: optimizations,
        objectCode,
        errors: [],
      };

      setCompilerResult(result);
      setCompilerPhase('complete');
      setCompilerProgress(100);
      
      // Guardar en historial
      addEntry({
        type: 'compiler',
        input: compiler.sourceCode,
        result,
        metadata: {
          success: true,
        },
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error durante la compilación';
      setError(errorMessage);
      setCompilerPhase('idle');
    } finally {
      setIsProcessing(false);
    }
  }, [
    compiler.sourceCode,
    setCompilerResult,
    setCompilerPhase,
    setCompilerProgress,
    addEntry,
  ]);

  /**
   * Compila una fase específica
   */
  const compilePhase = useCallback(async (
    phase: 'lexical' | 'syntax' | 'intermediate' | 'optimization' | 'codegen'
  ) => {
    if (!compiler.sourceCode || compiler.sourceCode.trim() === '') {
      setError('No hay código fuente para compilar');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      switch (phase) {
        case 'lexical': {
          setCompilerPhase('lexical');
          const lexicalResult = await lexicalAnalysis(compiler.sourceCode);
          setCompilerResult({
            success: true,
            lexical: lexicalResult,
            syntax: { parseTree: null, success: false, errors: [] },
            intermediateCode: [],
            optimization: [],
            objectCode: [],
            errors: [],
          });
          break;
        }

        case 'syntax': {
          if (!compiler.compilerResult?.lexical) {
            throw new Error('Debe ejecutar primero el análisis léxico');
          }
          setCompilerPhase('syntax');
          const syntaxTree = await syntaxAnalysis(compiler.compilerResult.lexical.tokens);
          setCompilerResult({
            ...compiler.compilerResult,
            syntaxTree: syntaxTree || undefined,
            syntax: { parseTree: syntaxTree as any, success: true, errors: [] },
          });
          break;
        }

        case 'intermediate': {
          if (!compiler.compilerResult?.syntaxTree) {
            throw new Error('Debe ejecutar primero el análisis sintáctico');
          }
          setCompilerPhase('intermediate');
          const intermediateCode = await generateIntermediateCode(compiler.compilerResult.syntaxTree);
          setCompilerResult({
            ...compiler.compilerResult,
            intermediateCode,
          });
          break;
        }

        case 'optimization': {
          if (!compiler.compilerResult?.intermediateCode || compiler.compilerResult.intermediateCode.length === 0) {
            throw new Error('Debe generar primero el código intermedio');
          }
          setCompilerPhase('optimization');
          const optimization = await optimizeCode(compiler.compilerResult.intermediateCode);
          setCompilerResult({
            ...compiler.compilerResult,
            optimization,
          });
          break;
        }

        case 'codegen': {
          if (!compiler.compilerResult?.optimization || compiler.compilerResult.optimization.length === 0) {
            throw new Error('Debe optimizar primero el código');
          }
          setCompilerPhase('codegen');
          const objectCode = await generateObjectCode(compiler.compilerResult.optimization);
          setCompilerResult({
            ...compiler.compilerResult,
            objectCode,
          });
          break;
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Error en fase ${phase}`;
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [compiler.sourceCode, compiler.compilerResult, setCompilerResult, setCompilerPhase]);

  /**
   * Limpia el compilador
   */
  const clearCompiler = useCallback(() => {
    setContextSourceCode('');
    setCompilerResult(null);
    setCompilerPhase('idle');
    setCompilerProgress(0);
    setError(null);
  }, [setContextSourceCode, setCompilerResult, setCompilerPhase, setCompilerProgress]);

  /**
   * Limpia el error actual
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    sourceCode: compiler.sourceCode,
    result: compiler.compilerResult,
    currentPhase: compiler.currentPhase,
    progress: compiler.progress,
    isProcessing,
    error,
    setSourceCode,
    compile,
    compilePhase,
    clearCompiler,
    clearError,
  };
}

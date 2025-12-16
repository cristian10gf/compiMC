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
  compile as compileSource,
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
   * Usa la función compile() de compiler.ts para evitar duplicación de lógica
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
      
      // Fase 2: Análisis Sintáctico
      await new Promise(resolve => setTimeout(resolve, 50)); // Para que se vea el progreso
      setCompilerPhase('syntax');
      setCompilerProgress(40);
      
      // Fase 3: Generación de Código Intermedio
      await new Promise(resolve => setTimeout(resolve, 50));
      setCompilerPhase('intermediate');
      setCompilerProgress(60);
      
      // Fase 4: Optimización
      await new Promise(resolve => setTimeout(resolve, 50));
      setCompilerPhase('optimization');
      setCompilerProgress(80);
      
      // Fase 5: Generación de Código Objeto
      await new Promise(resolve => setTimeout(resolve, 50));
      setCompilerPhase('codegen');
      setCompilerProgress(90);

      // Ejecutar el pipeline completo usando la función de compiler.ts
      const result = await Promise.resolve(
        compileSource({ source: compiler.sourceCode, mode: 'sintesis' }, customPatterns)
      );

      // Actualizar estado en el contexto
      setCompilerResult(result);
      
      if (!result.success) {
        // Si hay errores, establecer mensaje de error apropiado
        const firstError = result.errors[0];
        if (firstError) {
          setError(`Error en ${firstError.phase}: ${firstError.message}`);
        }
        setCompilerPhase('idle');
      } else {
        setCompilerPhase('complete');
      }
      
      setCompilerProgress(100);
      
      // Guardar en historial
      addEntry({
        type: 'compiler',
        input: compiler.sourceCode,
        result,
        metadata: {
          success: result.success,
        },
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error durante la compilación';
      setError(errorMessage);
      setCompilerPhase('idle');
      
      // Crear resultado con error para mostrar en la UI
      const errorResult: CompilerResult = {
        success: false,
        lexical: { tokens: [], errors: [errorMessage] },
        syntax: { parseTree: null, success: false, errors: [errorMessage] },
        intermediateCode: [],
        optimization: [],
        objectCode: [],
        errors: [{
          phase: 'unknown' as const,
          message: errorMessage,
          line: 1,
          severity: 'error' as const,
        }],
      };
      
      setCompilerResult(errorResult);
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
          
          // Verificar errores léxicos
          const hasErrors = lexicalResult.errors.length > 0;
          
          setCompilerResult({
            success: !hasErrors,
            lexical: lexicalResult,
            syntax: { parseTree: null, success: false, errors: [] },
            intermediateCode: [],
            optimization: [],
            objectCode: [],
            errors: hasErrors ? lexicalResult.errors.map(msg => ({
              phase: 'lexical' as const,
              message: msg,
              line: 1,
              severity: 'error' as const,
            })) : [],
          });
          
          if (hasErrors) {
            setError('Errores en el análisis léxico');
          }
          break;
        }

        case 'syntax': {
          if (!compiler.compilerResult?.lexical) {
            throw new Error('Debe ejecutar primero el análisis léxico');
          }
          setCompilerPhase('syntax');
          const syntaxTree = await syntaxAnalysis(compiler.compilerResult.lexical.tokens);
          
          // Verificar si se pudo construir el árbol
          const hasError = !syntaxTree;
          
          setCompilerResult({
            ...compiler.compilerResult,
            success: !hasError,
            syntaxTree: syntaxTree || undefined,
            syntax: { 
              parseTree: syntaxTree as any, 
              success: !hasError, 
              errors: hasError ? ['Error al construir el árbol sintáctico'] : [] 
            },
            errors: hasError ? [{
              phase: 'syntax' as const,
              message: 'Error al construir el árbol sintáctico',
              line: 1,
              severity: 'error' as const,
            }] : [],
          });
          
          if (hasError) {
            setError('Error en el análisis sintáctico');
          }
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
      
      // Propagar error al resultado si existe
      if (compiler.compilerResult) {
        setCompilerResult({
          ...compiler.compilerResult,
          success: false,
          errors: [{
            phase: 'unknown' as const,
            message: errorMessage,
            line: 1,
            severity: 'error' as const,
          }],
        });
      }
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

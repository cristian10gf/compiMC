/**
 * Tipos para el compilador completo (página General)
 */

import { Token, LexicalAnalysisResult } from './token';
import { ParseTreeNode } from './grammar';

/**
 * Entrada del compilador
 */
export interface CompilerInput {
  source: string; // Código fuente (ej: "2 + 3 * a + c^2/c + 5 - a/a + c")
  mode: 'analisis' | 'sintesis'; // Modo de compilación
}

/**
 * Instrucción de código intermedio (3 direcciones)
 */
export interface IntermediateCodeInstruction {
  number: number; // Número de instrucción
  instruction: string; // Instrucción (ej: "t1 := 3 * a")
  type?: 'assign' | 'binary' | 'unary' | 'goto' | 'label'; // Tipo de instrucción
}

/**
 * Paso de optimización de código
 */
export interface OptimizationStep {
  number: number; // Número de paso
  instruction: string; // Instrucción después de la optimización
  action: string; // Acción realizada (ej: "eliminado", "coalescido", "plegado")
  reason?: string; // Razón de la optimización
}

/**
 * Instrucción de código objeto (ensamblador)
 */
export interface ObjectCodeInstruction {
  number: number; // Número de instrucción
  instruction: string; // Código ensamblador
  address?: string; // Dirección de memoria (opcional)
}

/**
 * Resultado completo de la compilación
 */
export interface CompilerResult {
  lexical: LexicalAnalysisResult; // Resultado del análisis léxico
  syntax: SyntaxAnalysisResult; // Resultado del análisis sintáctico
  intermediateCode: IntermediateCodeInstruction[]; // Código intermedio
  optimization: OptimizationStep[]; // Pasos de optimización
  objectCode: ObjectCodeInstruction[]; // Código objeto final
  errors: CompilerError[]; // Errores durante la compilación
}

/**
 * Resultado del análisis sintáctico
 */
export interface SyntaxAnalysisResult {
  parseTree: ParseTreeNode | null; // Árbol de derivación
  success: boolean; // Si el análisis fue exitoso
  errors: string[]; // Errores sintácticos
}

/**
 * Error del compilador
 */
export interface CompilerError {
  phase: 'lexical' | 'syntax' | 'semantic' | 'optimization' | 'codegen'; // Fase donde ocurrió
  message: string; // Mensaje de error
  line?: number; // Línea del error
  column?: number; // Columna del error
  severity: 'error' | 'warning' | 'info'; // Severidad
}

/**
 * Paso en el proceso de compilación (para visualización paso a paso)
 */
export interface AlgorithmStep {
  stepNumber: number; // Número del paso
  phase: string; // Fase del compilador (ej: "Análisis Léxico")
  description: string; // Descripción de lo que se hace
  highlightedElements?: string[]; // Elementos a resaltar en la UI
  data?: any; // Datos adicionales del paso
}

/**
 * Tabla de símbolos
 */
export interface SymbolTable {
  entries: SymbolTableEntry[]; // Entradas de la tabla
}

/**
 * Entrada de la tabla de símbolos
 */
export interface SymbolTableEntry {
  name: string; // Nombre del símbolo
  type: string; // Tipo del símbolo
  scope: string; // Ámbito
  value?: any; // Valor (si es constante)
  address?: string; // Dirección de memoria
}

/**
 * Configuración del compilador
 */
export interface CompilerConfig {
  optimizationLevel: 0 | 1 | 2 | 3; // Nivel de optimización
  targetArchitecture: 'x86' | 'arm' | 'mips'; // Arquitectura objetivo
  generateSymbolTable: boolean; // Si se genera tabla de símbolos
  showIntermediateSteps: boolean; // Si se muestran pasos intermedios
}

/**
 * Estado del proceso de compilación
 */
export interface CompilationState {
  currentPhase: 'idle' | 'lexical' | 'syntax' | 'intermediate' | 'optimization' | 'codegen' | 'complete' | 'error';
  progress: number; // Progreso en porcentaje (0-100)
  currentStep?: AlgorithmStep; // Paso actual
  results?: Partial<CompilerResult>; // Resultados parciales
}

/**
 * Expresión del árbol de sintaxis abstracta (AST)
 */
export interface ASTNode {
  id: string; // ID único
  type: 'literal' | 'identifier' | 'binary' | 'unary' | 'assignment' | 'call'; // Tipo de nodo
  value?: string | number; // Valor (para literales e identificadores)
  operator?: string; // Operador (para expresiones)
  left?: ASTNode; // Hijo izquierdo
  right?: ASTNode; // Hijo derecho
  children?: ASTNode[]; // Hijos (para nodos n-arios)
}

/**
 * Información de uso de registros
 */
export interface RegisterInfo {
  name: string; // Nombre del registro (ej: "R1", "R2")
  inUse: boolean; // Si está en uso
  value?: string; // Valor actual (variable o temporal)
}

/**
 * Descriptor de registros para generación de código
 */
export interface RegisterDescriptor {
  registers: RegisterInfo[]; // Lista de registros
  variableLocations: Map<string, string>; // Variable → Registro/Memoria
}

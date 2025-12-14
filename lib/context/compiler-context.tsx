'use client';

/**
 * Context global para el compilador
 * Maneja el estado de todos los análisis (léxico, sintáctico, compilador completo)
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  Automaton,
  Grammar,
  ParsingResult,
  CompilerResult,
  RecognitionResult,
  FirstFollow,
  ParsingTable,
  PrecedenceTable,
  GotoTable,
  ActionTable,
} from '@/lib/types';

/**
 * Estado del analizador léxico
 */
interface LexicalState {
  regex: string; // Expresión regular actual
  languages: string[]; // Lenguajes definidos
  automaton: Automaton | null; // Autómata generado
  recognitionResult: RecognitionResult | null; // Resultado del reconocimiento
  afToErResult: { regex: string; steps: any[] } | null; // Resultado de AF → ER
}

/**
 * Estado del analizador sintáctico
 */
interface SyntaxState {
  grammar: Grammar | null; // Gramática actual
  mode: 'LL' | 'LR' | null; // Modo de análisis
  firstFollow: FirstFollow[] | null; // Conjuntos First y Follow
  parsingTable: ParsingTable | null; // Tabla M (para LL)
  precedenceTable: PrecedenceTable | null; // Tabla de precedencia (para LR)
  gotoTable: GotoTable | null; // Tabla Ir (para LR)
  actionTable: ActionTable | null; // Tabla de acciones (para LR)
  parsingResult: ParsingResult | null; // Resultado del parsing
  isManualMode: boolean; // Si está en modo manual (precedencia)
}

/**
 * Estado del compilador completo
 */
interface CompilerState {
  sourceCode: string; // Código fuente
  compilerResult: CompilerResult | null; // Resultado completo
  currentPhase: 'idle' | 'lexical' | 'syntax' | 'intermediate' | 'optimization' | 'codegen' | 'complete';
  progress: number; // Progreso 0-100
}

/**
 * Tipo del contexto
 */
interface CompilerContextType {
  // Estado léxico
  lexical: LexicalState;
  setRegex: (regex: string) => void;
  setLanguages: (languages: string[]) => void;
  setAutomaton: (automaton: Automaton | null) => void;
  setRecognitionResult: (result: RecognitionResult | null) => void;
  setAfToErResult: (result: { regex: string; steps: any[] } | null) => void;

  // Estado sintáctico
  syntax: SyntaxState;
  setGrammar: (grammar: Grammar | null) => void;
  setSyntaxMode: (mode: 'LL' | 'LR' | null) => void;
  setFirstFollow: (firstFollow: FirstFollow[] | null) => void;
  setParsingTable: (table: ParsingTable | null) => void;
  setPrecedenceTable: (table: PrecedenceTable | null) => void;
  setGotoTable: (table: GotoTable | null) => void;
  setActionTable: (table: ActionTable | null) => void;
  setParsingResult: (result: ParsingResult | null) => void;
  setIsManualMode: (isManual: boolean) => void;

  // Estado compilador
  compiler: CompilerState;
  setSourceCode: (code: string) => void;
  setCompilerResult: (result: CompilerResult | null) => void;
  setCompilerPhase: (phase: CompilerState['currentPhase']) => void;
  setCompilerProgress: (progress: number) => void;

  // Reset
  resetLexical: () => void;
  resetSyntax: () => void;
  resetCompiler: () => void;
  resetAll: () => void;
}

const CompilerContext = createContext<CompilerContextType | undefined>(undefined);

/**
 * Estados iniciales
 */
const initialLexicalState: LexicalState = {
  regex: '',
  languages: [],
  automaton: null,
  recognitionResult: null,
  afToErResult: null,
};

const initialSyntaxState: SyntaxState = {
  grammar: null,
  mode: null,
  firstFollow: null,
  parsingTable: null,
  precedenceTable: null,
  gotoTable: null,
  actionTable: null,
  parsingResult: null,
  isManualMode: false,
};

const initialCompilerState: CompilerState = {
  sourceCode: '',
  compilerResult: null,
  currentPhase: 'idle',
  progress: 0,
};

/**
 * Provider del contexto
 */
export function CompilerProvider({ children }: { children: ReactNode }) {
  const [lexical, setLexicalState] = useState<LexicalState>(initialLexicalState);
  const [syntax, setSyntaxState] = useState<SyntaxState>(initialSyntaxState);
  const [compiler, setCompilerState] = useState<CompilerState>(initialCompilerState);

  // Métodos léxicos
  const setRegex = useCallback((regex: string) => {
    setLexicalState((prev) => ({ ...prev, regex }));
  }, []);

  const setLanguages = useCallback((languages: string[]) => {
    setLexicalState((prev) => ({ ...prev, languages }));
  }, []);

  const setAutomaton = useCallback((automaton: Automaton | null) => {
    setLexicalState((prev) => ({ ...prev, automaton }));
  }, []);

  const setRecognitionResult = useCallback((recognitionResult: RecognitionResult | null) => {
    setLexicalState((prev) => ({ ...prev, recognitionResult }));
  }, []);

  const setAfToErResult = useCallback((afToErResult: { regex: string; steps: any[] } | null) => {
    setLexicalState((prev) => ({ ...prev, afToErResult }));
  }, []);

  // Métodos sintácticos
  const setGrammar = useCallback((grammar: Grammar | null) => {
    setSyntaxState((prev) => ({ ...prev, grammar }));
  }, []);

  const setSyntaxMode = useCallback((mode: 'LL' | 'LR' | null) => {
    setSyntaxState((prev) => ({ ...prev, mode }));
  }, []);

  const setFirstFollow = useCallback((firstFollow: FirstFollow[] | null) => {
    setSyntaxState((prev) => ({ ...prev, firstFollow }));
  }, []);

  const setParsingTable = useCallback((parsingTable: ParsingTable | null) => {
    setSyntaxState((prev) => ({ ...prev, parsingTable }));
  }, []);

  const setPrecedenceTable = useCallback((precedenceTable: PrecedenceTable | null) => {
    setSyntaxState((prev) => ({ ...prev, precedenceTable }));
  }, []);

  const setGotoTable = useCallback((gotoTable: GotoTable | null) => {
    setSyntaxState((prev) => ({ ...prev, gotoTable }));
  }, []);

  const setActionTable = useCallback((actionTable: ActionTable | null) => {
    setSyntaxState((prev) => ({ ...prev, actionTable }));
  }, []);

  const setParsingResult = useCallback((parsingResult: ParsingResult | null) => {
    setSyntaxState((prev) => ({ ...prev, parsingResult }));
  }, []);

  const setIsManualMode = useCallback((isManualMode: boolean) => {
    setSyntaxState((prev) => ({ ...prev, isManualMode }));
  }, []);

  // Métodos compilador
  const setSourceCode = useCallback((sourceCode: string) => {
    setCompilerState((prev) => ({ ...prev, sourceCode }));
  }, []);

  const setCompilerResult = useCallback((compilerResult: CompilerResult | null) => {
    setCompilerState((prev) => ({ ...prev, compilerResult }));
  }, []);

  const setCompilerPhase = useCallback((currentPhase: CompilerState['currentPhase']) => {
    setCompilerState((prev) => ({ ...prev, currentPhase }));
  }, []);

  const setCompilerProgress = useCallback((progress: number) => {
    setCompilerState((prev) => ({ ...prev, progress }));
  }, []);

  // Reset
  const resetLexical = useCallback(() => {
    setLexicalState(initialLexicalState);
  }, []);

  const resetSyntax = useCallback(() => {
    setSyntaxState(initialSyntaxState);
  }, []);

  const resetCompiler = useCallback(() => {
    setCompilerState(initialCompilerState);
  }, []);

  const resetAll = useCallback(() => {
    resetLexical();
    resetSyntax();
    resetCompiler();
  }, [resetLexical, resetSyntax, resetCompiler]);

  const value: CompilerContextType = {
    lexical,
    setRegex,
    setLanguages,
    setAutomaton,
    setRecognitionResult,
    setAfToErResult,

    syntax,
    setGrammar,
    setSyntaxMode,
    setFirstFollow,
    setParsingTable,
    setPrecedenceTable,
    setGotoTable,
    setActionTable,
    setParsingResult,
    setIsManualMode,

    compiler,
    setSourceCode,
    setCompilerResult,
    setCompilerPhase,
    setCompilerProgress,

    resetLexical,
    resetSyntax,
    resetCompiler,
    resetAll,
  };

  return <CompilerContext.Provider value={value}>{children}</CompilerContext.Provider>;
}

/**
 * Hook para usar el contexto
 */
export function useCompiler() {
  const context = useContext(CompilerContext);
  if (context === undefined) {
    throw new Error('useCompiler must be used within a CompilerProvider');
  }
  return context;
}

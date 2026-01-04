/**
 * Barrel export para todos los hooks personalizados
 */

export { useAutomata } from './use-automata';
export type { UseAutomataReturn } from './use-automata';

export { useGraph } from './use-graph';
export type { UseGraphReturn } from './use-graph';

export { useSyntaxAnalyzer } from './use-syntax-analyzer';
export type { UseSyntaxAnalyzerReturn } from './use-syntax-analyzer';

export { 
  useSyntaxAnalysis,
  useDescendenteAnalysis,
  useAscendenteAnalysis,
} from './use-syntax-analysis';
export type { 
  UseSyntaxAnalysisReturn,
  SyntaxAnalysisState,
  SyntaxAnalysisType,
  AscendenteMode,
  DescendenteAnalysisState,
  AscendenteAnalysisState,
  RecognitionState,
  DescendenteOptions,
  AscendenteOptions,
} from './use-syntax-analysis';

export { useCompilerFull } from './use-compiler';
export type { UseCompilerFullReturn } from './use-compiler';

export { useHistory } from './use-history';
export type { UseHistoryReturn } from './use-history';

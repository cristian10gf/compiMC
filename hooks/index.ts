/**
 * Barrel export para todos los hooks personalizados
 */

export { useAutomata } from './use-automata';
export type { UseAutomataReturn } from './use-automata';

export { 
  useSyntaxAnalysis,
  useDescendenteAnalysis,
  useAscendenteAnalysis,
} from './use-syntax-analysis';

export { useCompilerFull } from './use-compiler';
export type { UseCompilerFullReturn } from './use-compiler';

export { useHistory } from './use-history';
export type { UseHistoryReturn } from './use-history';

export { useAsdPage } from './use-asd-page';
export { useAsaPage } from './use-asa-page';
export { useAfToErPage } from './use-af-to-er-page';
export { useGeneralPage } from './use-general-page';

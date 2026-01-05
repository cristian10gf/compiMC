/**
 * Exportaciones de componentes de análisis sintáctico
 */

// Componentes de precedencia de operadores
export { PrecedenceTable } from './precedence-table';
export { PrecedenceSteps } from './precedence-steps';
export { StringRecognitionPrecedence } from './string-recognition-precedence';

// Componentes LR
export { LRAnalysisSection } from './lr-analysis-section';
export { LRCanonicalSets } from './lr-canonical-sets';
export { LRParsingTable } from './lr-parsing-table';
export { LRAutomatonGraph } from './lr-automaton-graph';
export { StringRecognitionLR } from './string-recognition-lr';

// Componentes compartidos
export { ParsingTable } from './parsing-table';
export { StackTraceTable } from './stack-trace-table';
export { GrammarInputEnhanced } from './grammar-input-enhanced';
export { GrammarInputASA } from './grammar-input-asa';
export { FirstFollowTable } from './first-follow-table';
export { GrammarTransformations } from './grammar-transformations';
export { StringRecognitionLL } from './string-recognition-ll';

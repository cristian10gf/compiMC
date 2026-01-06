/**
 * Exportaciones del módulo de análisis léxico
 */

// Construcción de AFN y AFD
export { 
  erToAFN, 
  erToAFD,
  resetStateCounter,
  generateTransitionTable,
} from './er-to-af';

export { 
  afnToAfd,
  buildAFDFull,
  buildAFDShort,
  optimizeBySignificantStates,
  getSignificantStates,
  isDeterministic,
  getAutomatonStats,
} from './afd-construction';

// Parser de expresiones regulares
export { 
  validateRegex,
  getAlphabet,
  tokenizeRegex,
  buildSyntaxTree,
  calculateAnulable,
  calculatePrimeros,
  calculateUltimos,
  calculateSiguientes,
  assignPositions,
  treeToString,
} from './regex-parser';

// Reconocimiento de cadenas
export { 
  recognizeStringDFA,
  recognizeStringNFA,
} from './string-recognition';

// Conversión AF → ER
export { 
  afToER,
} from './af-to-er';

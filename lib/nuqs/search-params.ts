import {
  parseAsString,
  parseAsBoolean,
  parseAsStringLiteral,
  parseAsArrayOf,
  createSerializer,
  type inferParserType,
} from 'nuqs/server';

// ============================================
// Analizador Léxico - AFD Full / AFD Short (params compartidos)
// ============================================
export const lexicalSearchParams = {
  regex: parseAsString.withDefault(''),
  languages: parseAsArrayOf(parseAsString).withDefault([]),
};

export type LexicalSearchParams = inferParserType<typeof lexicalSearchParams>;

// Aliases para backward compat con serializers e imports existentes
export const afdFullSearchParams = lexicalSearchParams;
export const afdShortSearchParams = lexicalSearchParams;
export type AFDFullSearchParams = LexicalSearchParams;
export type AFDShortSearchParams = LexicalSearchParams;

// ============================================
// Analizador Léxico - Reconocer
// ============================================
export const reconocerSearchParams = {
  regex: parseAsString.withDefault(''),
  testString: parseAsString.withDefault(''),
};

export type ReconocerSearchParams = inferParserType<typeof reconocerSearchParams>;

// ============================================
// Analizador Léxico - AF to ER
// ============================================
const inputModes = ['visual', 'table'] as const;
const alphabetModes = ['auto', 'custom'] as const;

export const afToErSearchParams = {
  inputMode: parseAsStringLiteral(inputModes).withDefault('visual'),
  alphabetMode: parseAsStringLiteral(alphabetModes).withDefault('auto'),
  customAlphabet: parseAsArrayOf(parseAsString).withDefault([]),
  automaton: parseAsString, // JSON stringified automaton
};

export type AFToERSearchParams = inferParserType<typeof afToErSearchParams>;

// ============================================
// Análisis Sintáctico Descendente (ASD/LL)
// ============================================
export const asdSearchParams = {
  grammar: parseAsString.withDefault(''),
  terminals: parseAsString.withDefault(''),
  autoDetect: parseAsBoolean.withDefault(false),
  testString: parseAsString.withDefault(''), // Cadena a probar
};

export type ASDSearchParams = inferParserType<typeof asdSearchParams>;

// ============================================
// Análisis Sintáctico Ascendente (ASA/LR)
// ============================================
const asaMethods = ['precedence', 'lr'] as const;
const lrTypes = ['SLR', 'LR1', 'LALR'] as const;

export const asaSearchParams = {
  grammar: parseAsString.withDefault(''),
  terminals: parseAsString.withDefault(''),
  method: parseAsStringLiteral(asaMethods).withDefault('precedence'),
  lrType: parseAsStringLiteral(lrTypes).withDefault('SLR'),
  testString: parseAsString.withDefault(''), // Cadena a probar
};

export type ASASearchParams = inferParserType<typeof asaSearchParams>;

// ============================================
// Compilador General
// ============================================
export const compilerSearchParams = {
  code: parseAsString.withDefault(''),
  tokens: parseAsString, // JSON stringified tokens array
};

export type CompilerSearchParams = inferParserType<typeof compilerSearchParams>;

// ============================================
// Serializers para navegación desde historial
// ============================================
export const serializeAFDFull = createSerializer(afdFullSearchParams);
export const serializeAFDShort = createSerializer(afdShortSearchParams);
export const serializeReconocer = createSerializer(reconocerSearchParams);
export const serializeAFToER = createSerializer(afToErSearchParams);
export const serializeASD = createSerializer(asdSearchParams);
export const serializeASA = createSerializer(asaSearchParams);
export const serializeCompiler = createSerializer(compilerSearchParams);

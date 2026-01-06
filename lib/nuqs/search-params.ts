/**
 * Definición de parsers de nuqs para cada página
 * Tipados y centralizados para uso consistente
 */

import {
  parseAsString,
  parseAsBoolean,
  parseAsStringLiteral,
  parseAsArrayOf,
  parseAsJson,
  createSerializer,
  createParser,
  type inferParserType,
} from 'nuqs/server';

// ============================================
// Parsers personalizados
// ============================================

/**
 * Parser personalizado para gramáticas con saltos de línea y caracteres especiales
 * Usa decodeURIComponent para manejar correctamente la codificación
 */
const parseAsGrammar = createParser({
  parse: (value: string) => {
    try {
      // Decodificar el valor de la URL
      const decoded = decodeURIComponent(value);
      return decoded || '';
    } catch (error) {
      console.error('[parseAsGrammar] Error al decodificar:', error);
      return '';
    }
  },
  serialize: (value: string) => {
    try {
      // Codificar el valor para la URL
      return encodeURIComponent(value);
    } catch (error) {
      console.error('[parseAsGrammar] Error al codificar:', error);
      return '';
    }
  },
}).withDefault('');

// ============================================
// Analizador Léxico - AFD Full
// ============================================
export const afdFullSearchParams = {
  regex: parseAsString.withDefault(''),
  languages: parseAsArrayOf(parseAsString).withDefault([]),
};

export type AFDFullSearchParams = inferParserType<typeof afdFullSearchParams>;

// ============================================
// Analizador Léxico - AFD Short
// ============================================
export const afdShortSearchParams = {
  regex: parseAsString.withDefault(''),
  languages: parseAsArrayOf(parseAsString).withDefault([]),
};

export type AFDShortSearchParams = inferParserType<typeof afdShortSearchParams>;

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
  grammar: parseAsGrammar, // Usar parser personalizado
  terminals: parseAsString.withDefault(''),
  autoDetect: parseAsBoolean.withDefault(false),
};

export type ASDSearchParams = inferParserType<typeof asdSearchParams>;

// ============================================
// Análisis Sintáctico Ascendente (ASA/LR)
// ============================================
const asaMethods = ['precedence', 'lr'] as const;
const lrTypes = ['SLR', 'LR1', 'LALR'] as const;

export const asaSearchParams = {
  grammar: parseAsGrammar, // Usar parser personalizado
  terminals: parseAsString.withDefault(''),
  method: parseAsStringLiteral(asaMethods).withDefault('precedence'),
  lrType: parseAsStringLiteral(lrTypes).withDefault('SLR'),
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

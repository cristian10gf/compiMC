/**
 * Utilidades para navegación del historial
 * Genera URLs con parámetros de query string para restaurar estados de páginas
 */

import { HistoryEntry, historyTypeToPath } from '@/lib/types';

/**
 * Genera la URL para navegar a una entrada del historial
 * Incluye todos los parámetros necesarios para restaurar el estado
 */
export function generateHistoryEntryUrl(entry: HistoryEntry): string {
  const basePath = historyTypeToPath[entry.type];
  const params = new URLSearchParams();

  // Siempre incluir el ID de la entrada del historial
  params.set('historyId', entry.id);

  const metadata = entry.metadata || {};

  switch (entry.type) {
    case 'lexical-afd-full':
    case 'lexical-afd-short':
      if (metadata.regex) params.set('regex', metadata.regex);
      if (metadata.languages?.length) params.set('languages', metadata.languages.join(','));
      break;

    case 'lexical-reconocer':
      if (metadata.regex) params.set('regex', metadata.regex);
      if (metadata.testString) params.set('testString', metadata.testString);
      break;

    case 'lexical-af-to-er':
      if (metadata.inputMode) params.set('inputMode', metadata.inputMode);
      if (metadata.alphabetMode) params.set('alphabetMode', metadata.alphabetMode);
      if (metadata.customAlphabet?.length) params.set('customAlphabet', metadata.customAlphabet.join(','));
      if (metadata.automatonJson) params.set('automaton', encodeURIComponent(metadata.automatonJson));
      break;

    case 'syntax-ll':
      if (metadata.grammarText) params.set('grammar', encodeURIComponent(metadata.grammarText));
      if (metadata.terminals) params.set('terminals', metadata.terminals);
      if (metadata.autoDetectTerminals !== undefined) {
        params.set('autoDetect', String(metadata.autoDetectTerminals));
      }
      break;

    case 'syntax-lr':
    case 'syntax-precedence':
      if (metadata.grammarText) params.set('grammar', encodeURIComponent(metadata.grammarText));
      if (metadata.terminals) params.set('terminals', metadata.terminals);
      if (metadata.method) params.set('method', metadata.method);
      if (metadata.lrType) params.set('lrType', metadata.lrType.toUpperCase());
      break;

    case 'compiler':
      if (metadata.sourceCode) params.set('code', encodeURIComponent(metadata.sourceCode));
      if (metadata.customTokens?.length) {
        params.set('tokens', encodeURIComponent(JSON.stringify(metadata.customTokens)));
      }
      break;
  }

  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

/**
 * Parsea los parámetros de query string para una página específica
 */
export function parseHistoryParams(searchParams: URLSearchParams): {
  historyId?: string;
  regex?: string;
  languages?: string[];
  testString?: string;
  inputMode?: 'visual' | 'table';
  alphabetMode?: 'auto' | 'custom';
  customAlphabet?: string[];
  automatonJson?: string;
  grammarText?: string;
  terminals?: string;
  autoDetectTerminals?: boolean;
  method?: 'precedence' | 'lr';
  lrType?: 'slr' | 'lr1' | 'lalr';
  sourceCode?: string;
  customTokens?: Array<{ symbol: string; regex: string }>;
} {
  const result: ReturnType<typeof parseHistoryParams> = {};

  const historyId = searchParams.get('historyId');
  if (historyId) result.historyId = historyId;

  const regex = searchParams.get('regex');
  if (regex) result.regex = regex;

  const languages = searchParams.get('languages');
  if (languages) result.languages = languages.split(',').filter(Boolean);

  const testString = searchParams.get('testString');
  if (testString) result.testString = testString;

  const inputMode = searchParams.get('inputMode');
  if (inputMode === 'visual' || inputMode === 'table') result.inputMode = inputMode;

  const alphabetMode = searchParams.get('alphabetMode');
  if (alphabetMode === 'auto' || alphabetMode === 'custom') result.alphabetMode = alphabetMode;

  const customAlphabet = searchParams.get('customAlphabet');
  if (customAlphabet) result.customAlphabet = customAlphabet.split(',').filter(Boolean);

  const automaton = searchParams.get('automaton');
  if (automaton) result.automatonJson = decodeURIComponent(automaton);

  const grammar = searchParams.get('grammar');
  if (grammar) result.grammarText = decodeURIComponent(grammar);

  const terminals = searchParams.get('terminals');
  if (terminals) result.terminals = terminals;

  const autoDetect = searchParams.get('autoDetect');
  if (autoDetect !== null) result.autoDetectTerminals = autoDetect === 'true';

  const method = searchParams.get('method');
  if (method === 'precedence' || method === 'lr') result.method = method;

  const lrType = searchParams.get('lrType');
  if (lrType === 'SLR' || lrType === 'LR1' || lrType === 'LALR') {
    result.lrType = lrType.toLowerCase() as 'slr' | 'lr1' | 'lalr';
  }

  const code = searchParams.get('code');
  if (code) result.sourceCode = decodeURIComponent(code);

  const tokens = searchParams.get('tokens');
  if (tokens) {
    try {
      result.customTokens = JSON.parse(decodeURIComponent(tokens));
    } catch {
      // Ignorar errores de parseo
    }
  }

  return result;
}

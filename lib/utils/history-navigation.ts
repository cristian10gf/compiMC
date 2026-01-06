/**
 * Utilidades para navegación del historial
 * Genera URLs con parámetros de query string para restaurar estados de páginas
 * Usa los serializadores de nuqs para consistencia
 */

import { HistoryEntry, historyTypeToPath } from '@/lib/types';
import { 
  serializeAFDFull, 
  serializeAFDShort, 
  serializeReconocer, 
  serializeAFToER,
  serializeASD,
  serializeASA,
  serializeCompiler,
} from '@/lib/nuqs';

/**
 * Genera la URL para navegar a una entrada del historial
 * Incluye todos los parámetros necesarios para restaurar el estado
 * Usa los serializadores de nuqs para garantizar consistencia
 */
export function generateHistoryEntryUrl(entry: HistoryEntry): string {
  const basePath = historyTypeToPath[entry.type];
  const metadata = entry.metadata || {};

  let queryString = '';

  switch (entry.type) {
    case 'lexical-afd-full':
      queryString = serializeAFDFull({
        regex: metadata.regex || '',
        languages: metadata.languages || [],
      });
      break;

    case 'lexical-afd-short':
      queryString = serializeAFDShort({
        regex: metadata.regex || '',
        languages: metadata.languages || [],
      });
      break;

    case 'lexical-reconocer':
      queryString = serializeReconocer({
        regex: metadata.regex || '',
        testString: metadata.testString || '',
      });
      break;

    case 'lexical-af-to-er':
      queryString = serializeAFToER({
        inputMode: metadata.inputMode || 'visual',
        alphabetMode: metadata.alphabetMode || 'auto',
        customAlphabet: metadata.customAlphabet || [],
        automaton: metadata.automatonJson || null,
      });
      break;

    case 'syntax-ll':
      queryString = serializeASD({
        grammar: metadata.grammarText || '',
        terminals: metadata.terminals || '',
        autoDetect: metadata.autoDetectTerminals ?? false,
      });
      break;

    case 'syntax-lr':
    case 'syntax-precedence':
      queryString = serializeASA({
        grammar: metadata.grammarText || '',
        terminals: metadata.terminals || '',
        method: (metadata.method as 'precedence' | 'lr') || 'precedence',
        lrType: metadata.lrType 
          ? (metadata.lrType.toUpperCase() as 'SLR' | 'LR1' | 'LALR')
          : 'SLR',
      });
      break;

    case 'compiler':
      queryString = serializeCompiler({
        code: metadata.sourceCode || '',
        tokens: metadata.customTokens 
          ? JSON.stringify(metadata.customTokens) 
          : null,
      });
      break;
  }

  // Los serializadores de nuqs ya retornan el query string con '?' al inicio
  // Solo concatenar si queryString tiene contenido
  if (queryString) {
    // Si queryString ya empieza con '?', no agregarlo de nuevo
    if (queryString.startsWith('?')) {
      return `${basePath}${queryString}`;
    }
    return `${basePath}?${queryString}`;
  }
  
  return basePath;
}

// NOTA: La función parseHistoryParams ya no es necesaria
// ya que nuqs maneja automáticamente el parseo de los parámetros
// con los parsers definidos en lib/nuqs/search-params.ts

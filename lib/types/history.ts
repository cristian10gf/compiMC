/**
 * Tipos para el historial de análisis
 */

/**
 * Tipos de análisis disponibles con sus subtipos
 */
export type HistoryType = 
  | 'lexical-afd-full'      // AFD Full (Thompson + Subconjuntos)
  | 'lexical-afd-short'     // AFD Óptimo (Árbol Sintáctico)
  | 'lexical-reconocer'     // Reconocimiento de cadenas
  | 'lexical-af-to-er'      // Conversión AF → ER
  | 'syntax-ll'             // Análisis Descendente LL(1)
  | 'syntax-lr'             // Análisis Ascendente LR
  | 'syntax-precedence'     // Análisis Ascendente Precedencia
  | 'compiler';             // Compilador General

/**
 * Mapeo de tipo de historial a ruta de la página
 */
export const historyTypeToPath: Record<HistoryType, string> = {
  'lexical-afd-full': '/analizador-lexico/afd-full',
  'lexical-afd-short': '/analizador-lexico/afd-short',
  'lexical-reconocer': '/analizador-lexico/reconocer',
  'lexical-af-to-er': '/analizador-lexico/af-to-er',
  'syntax-ll': '/asd',
  'syntax-lr': '/asa',
  'syntax-precedence': '/asa',
  'compiler': '/general',
};

/**
 * Etiquetas legibles para tipos de historial
 */
export const historyTypeLabels: Record<HistoryType, string> = {
  'lexical-afd-full': 'AFD Full',
  'lexical-afd-short': 'AFD Óptimo',
  'lexical-reconocer': 'Reconocer',
  'lexical-af-to-er': 'AF → ER',
  'syntax-ll': 'Sint. LL',
  'syntax-lr': 'Sint. LR',
  'syntax-precedence': 'Precedencia',
  'compiler': 'Compilador',
};

/**
 * Colores para badges de tipos de historial
 */
export const historyTypeColors: Record<HistoryType, string> = {
  'lexical-afd-full': 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  'lexical-afd-short': 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400',
  'lexical-reconocer': 'bg-teal-500/10 text-teal-700 dark:text-teal-400',
  'lexical-af-to-er': 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400',
  'syntax-ll': 'bg-green-500/10 text-green-700 dark:text-green-400',
  'syntax-lr': 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
  'syntax-precedence': 'bg-violet-500/10 text-violet-700 dark:text-violet-400',
  'compiler': 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
};

/**
 * Entrada del historial
 */
export interface HistoryEntry {
  id: string; // ID único de la entrada
  timestamp: Date; // Fecha y hora de creación
  type: HistoryType; // Tipo de análisis
  input: string; // Entrada original (expresión regular, gramática, código fuente)
  result?: unknown; // Resultado del análisis (puede ser Automaton, ParsingResult, CompilerResult, etc.)
  metadata?: HistoryMetadata; // Metadatos adicionales
}

/**
 * Metadatos de una entrada del historial
 * Incluye todos los inputs necesarios para restaurar el estado de la página
 */
export interface HistoryMetadata {
  algorithm?: string; // Algoritmo usado
  duration?: number; // Duración en milisegundos
  success?: boolean; // Si el análisis fue exitoso
  errorCount?: number; // Número de errores
  description?: string; // Descripción personalizada
  tags?: string[]; // Etiquetas para filtrar
  
  // === Inputs específicos para cada tipo de análisis ===
  
  // Analizador Léxico (AFD-Full, AFD-Short, Reconocer)
  regex?: string; // Expresión regular
  languages?: string[]; // Lenguajes/alfabeto
  testString?: string; // Cadena a reconocer
  
  // Analizador Léxico (AF → ER)
  inputMode?: 'visual' | 'table'; // Modo de entrada del autómata
  alphabetMode?: 'auto' | 'custom'; // Modo del alfabeto
  customAlphabet?: string[]; // Alfabeto personalizado
  automatonJson?: string; // Autómata serializado en JSON
  
  // Análisis Sintáctico (LL y LR)
  grammarText?: string; // Texto de la gramática
  terminals?: string; // Terminales
  autoDetectTerminals?: boolean; // Auto-detectar terminales
  
  // Análisis Ascendente específico
  method?: 'precedence' | 'lr'; // Método de análisis
  lrType?: 'slr' | 'lr1' | 'lalr'; // Tipo de LR
  
  // Compilador General
  sourceCode?: string; // Código fuente
  customTokens?: Array<{ symbol: string; regex: string }>; // Tokens personalizados
}

/**
 * Filtros para el historial
 */
export interface HistoryFilter {
  type?: HistoryType; // Filtrar por tipo
  dateFrom?: Date; // Fecha desde
  dateTo?: Date; // Fecha hasta
  successOnly?: boolean; // Solo análisis exitosos
  searchTerm?: string; // Término de búsqueda en input
  tags?: string[]; // Filtrar por etiquetas
}

/**
 * Estadísticas del historial
 */
export interface HistoryStats {
  totalEntries: number; // Total de entradas
  byType: Record<string, number>; // Conteo por tipo
  successRate: number; // Tasa de éxito (0-100)
  averageDuration?: number; // Duración promedio
}

/**
 * Opciones de exportación del historial
 */
export interface HistoryExportOptions {
  format: 'json' | 'csv' | 'pdf'; // Formato de exportación
  includeResults: boolean; // Si se incluyen los resultados completos
  filter?: HistoryFilter; // Filtro a aplicar antes de exportar
}

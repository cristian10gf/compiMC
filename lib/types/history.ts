/**
 * Tipos para el historial de análisis
 */

/**
 * Entrada del historial
 */
export interface HistoryEntry {
  id: string; // ID único de la entrada
  timestamp: Date; // Fecha y hora de creación
  type: 'lexical' | 'syntax-ll' | 'syntax-lr' | 'compiler'; // Tipo de análisis
  input: string; // Entrada original (expresión regular, gramática, código fuente)
  result?: any; // Resultado del análisis (puede ser Automaton, ParsingResult, CompilerResult, etc.)
  metadata?: HistoryMetadata; // Metadatos adicionales
}

/**
 * Metadatos de una entrada del historial
 */
export interface HistoryMetadata {
  algorithm?: string; // Algoritmo usado
  duration?: number; // Duración en milisegundos
  success?: boolean; // Si el análisis fue exitoso
  errorCount?: number; // Número de errores
  description?: string; // Descripción personalizada
  tags?: string[]; // Etiquetas para filtrar
}

/**
 * Filtros para el historial
 */
export interface HistoryFilter {
  type?: 'lexical' | 'syntax-ll' | 'syntax-lr' | 'compiler'; // Filtrar por tipo
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

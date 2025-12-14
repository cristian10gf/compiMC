/**
 * Hook personalizado para el manejo del historial
 * 
 * Proporciona funcionalidades para:
 * - Agregar entradas al historial
 * - Recuperar análisis previos
 * - Filtrar y buscar en el historial
 * - Exportar historial
 * - Limpiar historial
 */

import { useCallback } from 'react';
import { useHistory as useHistoryContext } from '@/lib/context/history-context';
import { HistoryEntry, HistoryFilter } from '@/lib/types';

export interface UseHistoryReturn {
  // Estado
  history: HistoryEntry[];
  filteredHistory: HistoryEntry[];
  currentFilter: HistoryFilter | null;

  // Funciones
  addEntry: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void;
  removeEntry: (id: string) => void;
  clearHistory: () => void;
  loadEntry: (id: string) => HistoryEntry | null;
  updateEntry: (id: string, updates: Partial<HistoryEntry>) => void;
  setFilter: (filter: HistoryFilter | null) => void;
  clearFilter: () => void;
  searchHistory: (term: string) => HistoryEntry[];
}

/**
 * Hook de historial
 */
export function useHistory(): UseHistoryReturn {
  const context = useHistoryContext();

  /**
   * Agrega una nueva entrada al historial
   */
  const addEntry = useCallback((entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => {
    context.addEntry(entry);
  }, [context]);

  /**
   * Elimina una entrada del historial
   */
  const removeEntry = useCallback((id: string) => {
    context.removeEntry(id);
  }, [context]);

  /**
   * Limpia todo el historial
   */
  const clearHistory = useCallback(() => {
    context.clearHistory();
  }, [context]);

  /**
   * Carga una entrada del historial
   */
  const loadEntry = useCallback((id: string): HistoryEntry | null => {
    return context.loadEntry(id);
  }, [context]);

  /**
   * Actualiza una entrada del historial
   */
  const updateEntry = useCallback((id: string, updates: Partial<HistoryEntry>) => {
    context.updateEntry(id, updates);
  }, [context]);

  /**
   * Establece un filtro
   */
  const setFilter = useCallback((filter: HistoryFilter | null) => {
    context.setFilter(filter);
  }, [context]);

  /**
   * Limpia el filtro actual
   */
  const clearFilter = useCallback(() => {
    context.clearFilter();
  }, [context]);

  /**
   * Busca en el historial
   */
  const searchHistory = useCallback((term: string): HistoryEntry[] => {
    return context.searchHistory(term);
  }, [context]);

  return {
    history: context.history,
    filteredHistory: context.filteredHistory,
    currentFilter: context.currentFilter,
    addEntry,
    removeEntry,
    clearHistory,
    loadEntry,
    updateEntry,
    setFilter,
    clearFilter,
    searchHistory,
  };
}

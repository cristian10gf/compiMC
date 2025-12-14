'use client';

/**
 * Context para el historial de análisis
 * Maneja el almacenamiento y recuperación de análisis previos usando localStorage
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { HistoryEntry, HistoryFilter, HistoryStats, HistoryExportOptions } from '@/lib/types';

/**
 * Tipo del contexto
 */
interface HistoryContextType {
  history: HistoryEntry[]; // Lista completa del historial
  filteredHistory: HistoryEntry[]; // Historial filtrado
  currentFilter: HistoryFilter | null; // Filtro actual
  stats: HistoryStats; // Estadísticas del historial

  // Operaciones
  addEntry: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void;
  removeEntry: (id: string) => void;
  clearHistory: () => void;
  loadEntry: (id: string) => HistoryEntry | null;
  updateEntry: (id: string, updates: Partial<HistoryEntry>) => void;

  // Filtrado
  setFilter: (filter: HistoryFilter | null) => void;
  clearFilter: () => void;

  // Exportación
  exportHistory: (options: HistoryExportOptions) => void;

  // Búsqueda
  searchHistory: (term: string) => HistoryEntry[];
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

const STORAGE_KEY = 'compimc-history';
const MAX_HISTORY_SIZE = 500; // Máximo número de entradas

/**
 * Calcula estadísticas del historial
 */
function calculateStats(entries: HistoryEntry[]): HistoryStats {
  const byType: Record<string, number> = {};
  let successCount = 0;
  let totalDuration = 0;
  let durationCount = 0;

  entries.forEach((entry) => {
    // Conteo por tipo
    byType[entry.type] = (byType[entry.type] || 0) + 1;

    // Tasa de éxito
    if (entry.metadata?.success) {
      successCount++;
    }

    // Duración promedio
    if (entry.metadata?.duration) {
      totalDuration += entry.metadata.duration;
      durationCount++;
    }
  });

  return {
    totalEntries: entries.length,
    byType,
    successRate: entries.length > 0 ? (successCount / entries.length) * 100 : 0,
    averageDuration: durationCount > 0 ? totalDuration / durationCount : undefined,
  };
}

/**
 * Aplica filtros al historial
 */
function applyFilter(entries: HistoryEntry[], filter: HistoryFilter | null): HistoryEntry[] {
  if (!filter) return entries;

  return entries.filter((entry) => {
    // Filtro por tipo
    if (filter.type && entry.type !== filter.type) return false;

    // Filtro por fecha
    if (filter.dateFrom && new Date(entry.timestamp) < filter.dateFrom) return false;
    if (filter.dateTo && new Date(entry.timestamp) > filter.dateTo) return false;

    // Solo exitosos
    if (filter.successOnly && !entry.metadata?.success) return false;

    // Búsqueda por término
    if (filter.searchTerm && !entry.input.toLowerCase().includes(filter.searchTerm.toLowerCase())) {
      return false;
    }

    // Filtro por etiquetas
    if (filter.tags && filter.tags.length > 0) {
      const entryTags = entry.metadata?.tags || [];
      if (!filter.tags.some((tag) => entryTags.includes(tag))) return false;
    }

    return true;
  });
}

/**
 * Provider del contexto
 */
export function HistoryProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentFilter, setCurrentFilterState] = useState<HistoryFilter | null>(null);

  // Cargar historial desde localStorage al montar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Convertir timestamps de string a Date
          const entries = parsed.map((entry: any) => ({
            ...entry,
            timestamp: new Date(entry.timestamp),
          }));
          setHistory(entries);
        }
      } catch (error) {
        console.error('Error loading history from localStorage:', error);
      }
    }
  }, []);

  // Guardar historial en localStorage cuando cambia
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
      } catch (error) {
        console.error('Error saving history to localStorage:', error);
      }
    }
  }, [history]);

  // Añadir nueva entrada
  const addEntry = useCallback((entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => {
    const newEntry: HistoryEntry = {
      ...entry,
      id: `entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    setHistory((prev) => {
      const updated = [newEntry, ...prev];
      // Limitar el tamaño del historial
      return updated.slice(0, MAX_HISTORY_SIZE);
    });
  }, []);

  // Eliminar entrada
  const removeEntry = useCallback((id: string) => {
    setHistory((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

  // Limpiar historial
  const clearHistory = useCallback(() => {
    setHistory([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Cargar entrada específica
  const loadEntry = useCallback(
    (id: string): HistoryEntry | null => {
      return history.find((entry) => entry.id === id) || null;
    },
    [history]
  );

  // Actualizar entrada
  const updateEntry = useCallback((id: string, updates: Partial<HistoryEntry>) => {
    setHistory((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, ...updates } : entry))
    );
  }, []);

  // Establecer filtro
  const setFilter = useCallback((filter: HistoryFilter | null) => {
    setCurrentFilterState(filter);
  }, []);

  // Limpiar filtro
  const clearFilter = useCallback(() => {
    setCurrentFilterState(null);
  }, []);

  // Buscar en historial
  const searchHistory = useCallback(
    (term: string): HistoryEntry[] => {
      return history.filter((entry) => entry.input.toLowerCase().includes(term.toLowerCase()));
    },
    [history]
  );

  // Exportar historial
  const exportHistory = useCallback(
    (options: HistoryExportOptions) => {
      const dataToExport = applyFilter(history, options.filter || null);

      switch (options.format) {
        case 'json': {
          const json = JSON.stringify(
            options.includeResults ? dataToExport : dataToExport.map(({ result, ...rest }) => rest),
            null,
            2
          );
          const blob = new Blob([json], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `compimc-history-${Date.now()}.json`;
          a.click();
          URL.revokeObjectURL(url);
          break;
        }
        case 'csv': {
          const headers = ['ID', 'Timestamp', 'Type', 'Input', 'Success', 'Duration (ms)'];
          const rows = dataToExport.map((entry) => [
            entry.id,
            entry.timestamp.toISOString(),
            entry.type,
            `"${entry.input.replace(/"/g, '""')}"`,
            entry.metadata?.success ? 'Yes' : 'No',
            entry.metadata?.duration || 'N/A',
          ]);
          const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `compimc-history-${Date.now()}.csv`;
          a.click();
          URL.revokeObjectURL(url);
          break;
        }
        case 'pdf':
          // TODO: Implementar exportación a PDF
          console.warn('PDF export not implemented yet');
          break;
      }
    },
    [history]
  );

  // Calcular valores derivados
  const filteredHistory = applyFilter(history, currentFilter);
  const stats = calculateStats(history);

  const value: HistoryContextType = {
    history,
    filteredHistory,
    currentFilter,
    stats,
    addEntry,
    removeEntry,
    clearHistory,
    loadEntry,
    updateEntry,
    setFilter,
    clearFilter,
    exportHistory,
    searchHistory,
  };

  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
}

/**
 * Hook para usar el contexto
 */
export function useHistory() {
  const context = useContext(HistoryContext);
  if (context === undefined) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return context;
}

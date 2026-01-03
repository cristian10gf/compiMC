'use client';

/**
 * Tabla de transiciones editable para definir un autómata finito
 * Permite agregar/eliminar estados, símbolos del alfabeto y definir transiciones
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, ArrowRight, Circle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Automaton, State, Transition } from '@/lib/types/automata';

interface TransitionTableEditorProps {
  alphabet?: string[];
  onChange: (automaton: Automaton) => void;
  initialAutomaton?: Automaton;
  className?: string;
}

interface InternalTableRow {
  stateId: string;
  stateLabel: string;
  isInitial: boolean;
  isFinal: boolean;
  transitions: { [symbol: string]: string };
}

export function TransitionTableEditor({
  alphabet: externalAlphabet,
  onChange,
  initialAutomaton,
  className,
}: TransitionTableEditorProps) {
  // Estado interno del alfabeto (editable)
  const [internalAlphabet, setInternalAlphabet] = useState<string[]>(
    externalAlphabet && externalAlphabet.length > 0 ? externalAlphabet : []
  );
  const [newSymbol, setNewSymbol] = useState('');
  
  // Estado de la tabla
  const [stateCounter, setStateCounter] = useState(0);
  const [rows, setRows] = useState<InternalTableRow[]>([]);
  
  // Ref para evitar llamadas innecesarias a onChange
  const isInitializedRef = useRef(false);
  const previousAutomatonRef = useRef<string>('');

  // Sincronizar alfabeto externo cuando cambia
  useEffect(() => {
    if (externalAlphabet && externalAlphabet.length > 0) {
      setInternalAlphabet(prev => {
        // Agregar símbolos nuevos que no existan
        const newSymbols = externalAlphabet.filter(s => !prev.includes(s));
        if (newSymbols.length > 0) {
          return [...prev, ...newSymbols];
        }
        return prev;
      });
    }
  }, [externalAlphabet]);
  
  // Ref para rastrear el ID del autómata
  const initialAutomatonIdRef = useRef(initialAutomaton?.id);

  // Inicializar/sincronizar con el autómata inicial
  useEffect(() => {
    // Solo sincronizar si el autómata cambió (diferente ID)
    if (!initialAutomaton || initialAutomaton.states.length === 0) return;
    if (isInitializedRef.current && initialAutomaton.id === initialAutomatonIdRef.current) return;
    
    isInitializedRef.current = true;
    initialAutomatonIdRef.current = initialAutomaton.id;
    
    // Extraer alfabeto del autómata inicial si no hay alfabeto externo
    const autoAlphabet = [...new Set(initialAutomaton.transitions.map(t => t.symbol))].filter(s => s && s !== 'ε');
    if (autoAlphabet.length > 0) {
      setInternalAlphabet(autoAlphabet);
    }
    
    const currentAlphabet = autoAlphabet.length > 0 ? autoAlphabet : internalAlphabet;
    
    const initialRows: InternalTableRow[] = initialAutomaton.states.map(state => {
      const trans: { [symbol: string]: string } = {};
      currentAlphabet.forEach(symbol => {
        const t = initialAutomaton.transitions.find(
          tr => tr.from === state.id && tr.symbol === symbol
        );
        trans[symbol] = t ? (initialAutomaton.states.find(s => s.id === t.to)?.label || t.to) : '';
      });
      return {
        stateId: state.id,
        stateLabel: state.label,
        isInitial: state.isInitial,
        isFinal: state.isFinal,
        transitions: trans,
      };
    });
    setRows(initialRows);
    setStateCounter(initialAutomaton.states.length);
    
    // Actualizar el previousAutomatonRef para evitar llamar onChange inmediatamente
    const transitions: Transition[] = [];
    let transId = 0;
    initialRows.forEach(row => {
      Object.entries(row.transitions).forEach(([symbol, target]) => {
        if (target) {
          const targetRow = initialRows.find(r => r.stateLabel === target || r.stateId === target);
          if (targetRow) {
            transitions.push({
              id: `t${transId++}`,
              from: row.stateId,
              to: targetRow.stateId,
              symbol,
            });
          }
        }
      });
    });
    const states = initialRows.map(r => ({
      id: r.stateId,
      label: r.stateLabel,
      isInitial: r.isInitial,
      isFinal: r.isFinal,
    }));
    previousAutomatonRef.current = JSON.stringify({ states, transitions, alphabet: currentAlphabet });
  }, [initialAutomaton]);

  // Agregar símbolo al alfabeto
  const addSymbol = useCallback(() => {
    const trimmed = newSymbol.trim();
    if (trimmed && !internalAlphabet.includes(trimmed)) {
      setInternalAlphabet(prev => [...prev, trimmed]);
      // Agregar columna vacía a todas las filas
      setRows(prev => prev.map(row => ({
        ...row,
        transitions: { ...row.transitions, [trimmed]: '' }
      })));
      setNewSymbol('');
    }
  }, [newSymbol, internalAlphabet]);

  // Eliminar símbolo del alfabeto
  const removeSymbol = useCallback((symbol: string) => {
    setInternalAlphabet(prev => prev.filter(s => s !== symbol));
    // Eliminar la columna de todas las filas
    setRows(prev => prev.map(row => {
      const { [symbol]: _, ...restTransitions } = row.transitions;
      return { ...row, transitions: restTransitions };
    }));
  }, []);

  // Agregar nuevo estado
  const addState = useCallback(() => {
    const newId = `q${stateCounter}`;
    const newTransitions: { [symbol: string]: string } = {};
    internalAlphabet.forEach(s => { newTransitions[s] = ''; });

    const newRow: InternalTableRow = {
      stateId: newId,
      stateLabel: newId,
      isInitial: rows.length === 0,
      isFinal: false,
      transitions: newTransitions,
    };

    setRows(prev => [...prev, newRow]);
    setStateCounter(prev => prev + 1);
  }, [stateCounter, rows.length, internalAlphabet]);

  // Eliminar estado
  const removeState = useCallback((stateId: string) => {
    setRows(prev => {
      const removedLabel = prev.find(r => r.stateId === stateId)?.stateLabel;
      const newRows = prev.filter(r => r.stateId !== stateId);
      // Limpiar transiciones que apuntan a este estado
      return newRows.map(r => ({
        ...r,
        transitions: Object.fromEntries(
          Object.entries(r.transitions).map(([k, v]) => [k, v === removedLabel ? '' : v])
        ),
      }));
    });
  }, []);

  // Toggle estado inicial (solo uno puede ser inicial)
  const toggleInitial = useCallback((stateId: string) => {
    setRows(prev => prev.map(r => ({
      ...r,
      isInitial: r.stateId === stateId ? !r.isInitial : false,
    })));
  }, []);

  // Toggle estado final
  const toggleFinal = useCallback((stateId: string) => {
    setRows(prev => prev.map(r =>
      r.stateId === stateId ? { ...r, isFinal: !r.isFinal } : r
    ));
  }, []);

  // Actualizar transición usando Select
  const updateTransition = useCallback((stateId: string, symbol: string, targetState: string) => {
    setRows(prev => prev.map(r =>
      r.stateId === stateId
        ? { ...r, transitions: { ...r.transitions, [symbol]: targetState === '__empty__' ? '' : targetState } }
        : r
    ));
  }, []);

  // Actualizar etiqueta del estado
  const updateStateLabel = useCallback((stateId: string, newLabel: string) => {
    setRows(prev => {
      const oldLabel = prev.find(r => r.stateId === stateId)?.stateLabel || '';
      return prev.map(r => {
        const updatedRow = r.stateId === stateId ? { ...r, stateLabel: newLabel } : r;
        // Actualizar referencias en transiciones
        const updatedTransitions = Object.fromEntries(
          Object.entries(updatedRow.transitions).map(([k, v]) => [k, v === oldLabel ? newLabel : v])
        );
        return { ...updatedRow, transitions: updatedTransitions };
      });
    });
  }, []);

  // Obtener lista de estados disponibles para el dropdown
  const availableStates = useMemo(() => {
    return rows.map(r => r.stateLabel);
  }, [rows]);

  // Convertir a Automaton y notificar cambios (con debounce implícito)
  useEffect(() => {
    // No llamar onChange si acabamos de inicializar desde initialAutomaton
    if (!isInitializedRef.current && rows.length === 0) {
      return;
    }
    
    const states: State[] = rows.map(r => ({
      id: r.stateId,
      label: r.stateLabel,
      isInitial: r.isInitial,
      isFinal: r.isFinal,
    }));

    const transitions: Transition[] = [];
    let transId = 0;

    rows.forEach(row => {
      Object.entries(row.transitions).forEach(([symbol, target]) => {
        if (target) {
          const targetRow = rows.find(r => r.stateLabel === target || r.stateId === target);
          if (targetRow) {
            transitions.push({
              id: `t${transId++}`,
              from: row.stateId,
              to: targetRow.stateId,
              symbol,
            });
          }
        }
      });
    });

    const automaton: Automaton = {
      id: 'table-editor-' + Date.now(),
      states,
      transitions,
      alphabet: internalAlphabet,
      type: 'DFA',
    };

    // Solo llamar onChange si el autómata realmente cambió
    const automatonStr = JSON.stringify({ states, transitions, alphabet: internalAlphabet });
    if (automatonStr !== previousAutomatonRef.current) {
      previousAutomatonRef.current = automatonStr;
      onChange(automaton);
    }
  }, [rows, internalAlphabet, onChange]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toolbar para agregar estados y símbolos */}
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" onClick={addState} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Agregar Estado
        </Button>
        
        <div className="h-6 w-px bg-border" />
        
        {/* Agregar símbolo al alfabeto */}
        <div className="flex items-center gap-2">
          <Input
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addSymbol()}
            placeholder="Símbolo"
            className="h-8 w-20 text-center font-mono"
          />
          <Button size="sm" variant="outline" onClick={addSymbol} disabled={!newSymbol.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex-1" />
        
        {/* Mostrar alfabeto actual */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>Σ =</span>
          {internalAlphabet.length === 0 ? (
            <span className="italic">vacío</span>
          ) : (
            <span className="font-mono">
              {'{' + internalAlphabet.join(', ') + '}'}
            </span>
          )}
        </div>
      </div>

      {/* Tabla */}
      {rows.length === 0 ? (
        <div className="rounded-lg border bg-muted/20 p-8 text-center text-muted-foreground">
          <div className="h-12 w-12 mx-auto mb-2 opacity-20 border-2 rounded" />
          <p className="text-sm">No hay estados definidos</p>
          <p className="text-xs mt-1">
            1. Agrega símbolos al alfabeto (ej: a, b, 0, 1)
            <br />
            2. Haz clic en &quot;Agregar Estado&quot; para comenzar
          </p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-20 text-center sticky left-0 bg-muted/50 z-10">Tipo</TableHead>
                <TableHead className="w-24 sticky left-20 bg-muted/50 z-10">Estado</TableHead>
                {internalAlphabet.map(symbol => (
                  <TableHead key={symbol} className="text-center min-w-28">
                    <div className="flex items-center justify-center gap-1">
                      <span className="font-mono">{symbol}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-5 w-5 p-0 opacity-50 hover:opacity-100"
                        onClick={() => removeSymbol(symbol)}
                        title={`Eliminar símbolo "${symbol}"`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableHead>
                ))}
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(row => (
                <TableRow key={row.stateId}>
                  {/* Tipo de estado */}
                  <TableCell className="text-center sticky left-0 bg-background z-10">
                    <div className="flex justify-center gap-1">
                      <Button
                        size="sm"
                        variant={row.isInitial ? 'default' : 'ghost'}
                        className={cn(
                          "h-7 w-7 p-0",
                          row.isInitial && "bg-green-600 hover:bg-green-700"
                        )}
                        onClick={() => toggleInitial(row.stateId)}
                        title="Estado inicial"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant={row.isFinal ? 'default' : 'ghost'}
                        className={cn(
                          "h-7 w-7 p-0",
                          row.isFinal && "bg-orange-600 hover:bg-orange-700"
                        )}
                        onClick={() => toggleFinal(row.stateId)}
                        title="Estado final"
                      >
                        <Circle className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>

                  {/* Nombre del estado */}
                  <TableCell className="sticky left-20 bg-background z-10">
                    <Input
                      defaultValue={row.stateLabel}
                      onBlur={(e) => {
                        if (e.target.value !== row.stateLabel) {
                          updateStateLabel(row.stateId, e.target.value);
                        }
                      }}
                      className="h-8 w-20 text-center font-mono text-sm"
                    />
                  </TableCell>

                  {/* Transiciones - usando Select para mejor UX */}
                  {internalAlphabet.map(symbol => (
                    <TableCell key={symbol} className="text-center p-1">
                      <Select
                        value={row.transitions[symbol] || '__empty__'}
                        onValueChange={(value) => updateTransition(row.stateId, symbol, value)}
                      >
                        <SelectTrigger className="h-8 w-full font-mono text-sm">
                          <SelectValue placeholder="-" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__empty__">
                            <span className="text-muted-foreground">- (vacío)</span>
                          </SelectItem>
                          {availableStates.map(state => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  ))}

                  {/* Eliminar */}
                  <TableCell className="text-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => removeState(row.stateId)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Resumen */}
      {rows.length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>Estados: <Badge variant="secondary">{rows.length}</Badge></span>
          {rows.find(r => r.isInitial) && (
            <span>
              Inicial: <Badge variant="outline" className="border-green-500 text-green-600">
                {rows.find(r => r.isInitial)?.stateLabel}
              </Badge>
            </span>
          )}
          {rows.filter(r => r.isFinal).length > 0 && (
            <span>
              Finales: {rows.filter(r => r.isFinal).map(r => (
                <Badge key={r.stateId} variant="outline" className="border-orange-500 text-orange-600 ml-1">
                  {r.stateLabel}
                </Badge>
              ))}
            </span>
          )}
        </div>
      )}

      {/* Leyenda */}
      <div className="flex gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="h-4 w-4 rounded bg-green-600 flex items-center justify-center">
            <ArrowRight className="h-3 w-3 text-white" />
          </div>
          <span>Estado inicial</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-4 w-4 rounded bg-orange-600 flex items-center justify-center">
            <Circle className="h-3 w-3 text-white" />
          </div>
          <span>Estado final</span>
        </div>
      </div>
    </div>
  );
}

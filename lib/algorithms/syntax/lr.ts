/**
 * Análisis Sintáctico Ascendente LR
 * 
 * Implementa los algoritmos de análisis LR:
 * - LR(0): Autómata básico sin lookahead
 * - SLR(1): Simple LR con conjuntos FOLLOW
 * - LR(1) Canónico: LR completo con lookahead
 * - LALR(1): LR con estados comprimidos
 * 
 * Funciones principales:
 * - Construcción del AFN de elementos LR(0)
 * - Construcción del AFD mediante subconjuntos (cerradura, ir_a)
 * - Construcción de tablas de análisis sintáctico
 * - Análisis de cadenas
 */

import {
  Grammar,
  Production,
  LRItem,
  LRState,
  LRAutomaton,
  ActionTable,
  GotoTable,
  ParseStep,
  ParsingResult,
} from '@/lib/types/grammar';
import { generateFirstFollow } from './descendente';

// ============================================================================
// TIPOS ADICIONALES PARA LR
// ============================================================================

/**
 * Representa un item LR con representación string para comparación
 */
export interface LRItemWithKey extends LRItem {
  key: string;
}

/**
 * Estado del AFD LR con información adicional
 */
export interface LRStateSet {
  id: number;
  items: LRItemWithKey[];
  kernel: LRItemWithKey[]; // Items del núcleo (sin los agregados por cerradura)
  transitions: Map<string, number>;
}

/**
 * Resultado del análisis LR completo
 */
export interface LRAnalysisResult {
  augmentedGrammar: Grammar;
  afn: LRAutomaton;
  canonicalSets: LRStateSet[];
  actionTable: ActionTable;
  gotoTable: GotoTable;
  conflicts: LRConflict[];
  type: 'SLR' | 'LR1' | 'LALR';
}

/**
 * Conflicto en tabla LR
 */
export interface LRConflict {
  type: 'shift-reduce' | 'reduce-reduce';
  state: number;
  symbol: string;
  description: string;
}

/**
 * Entrada de la tabla de análisis unificada
 */
export interface LRTableEntry {
  action: 'shift' | 'reduce' | 'accept' | 'goto' | 'error';
  value: number | string; // Estado para shift/goto, número de producción para reduce
}

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Crea una clave única para un item LR
 */
function itemToKey(item: LRItem): string {
  const productionStr = `${item.production.left}->${item.production.right.join('')}`;
  const lookahead = item.lookahead ? `/${item.lookahead}` : '';
  return `[${productionStr}•${item.dotPosition}${lookahead}]`;
}

/**
 * Formatea un item LR para mostrar
 */
export function formatLRItem(item: LRItem): string {
  const left = item.production.left;
  const right = [...item.production.right];
  right.splice(item.dotPosition, 0, '•');
  const lookahead = item.lookahead ? `, ${item.lookahead}` : '';
  return `${left}→${right.join('')}${lookahead}`;
}

/**
 * Compara dos items LR
 */
function itemsEqual(a: LRItem, b: LRItem, checkLookahead: boolean = true): boolean {
  if (a.production.id !== b.production.id) return false;
  if (a.dotPosition !== b.dotPosition) return false;
  if (checkLookahead && a.lookahead !== b.lookahead) return false;
  return true;
}

/**
 * Aumenta la gramática agregando S' -> S
 */
export function augmentGrammar(grammar: Grammar): Grammar {
  const newStartSymbol = grammar.startSymbol + "'";
  const augmentedProduction: Production = {
    id: 'p0',
    left: newStartSymbol,
    right: [grammar.startSymbol],
    number: 0,
  };

  // Renumerar producciones existentes
  const renumberedProductions = grammar.productions.map((p, i) => ({
    ...p,
    id: `p${i + 1}`,
    number: i + 1,
  }));

  return {
    ...grammar,
    startSymbol: newStartSymbol,
    nonTerminals: [newStartSymbol, ...grammar.nonTerminals],
    productions: [augmentedProduction, ...renumberedProductions],
  };
}

// ============================================================================
// CONSTRUCCIÓN DEL AFN LR(0)
// ============================================================================

/**
 * Construye el AFN de elementos LR(0)
 * Cada estado representa un item de la forma A → α•β
 */
export function buildLR0AFN(grammar: Grammar): LRAutomaton {
  const augmented = augmentGrammar(grammar);
  const states: LRState[] = [];
  const stateMap = new Map<string, string>();
  
  let stateId = 0;
  
  // Crear un estado por cada posición del punto en cada producción
  for (const prod of augmented.productions) {
    for (let dot = 0; dot <= prod.right.length; dot++) {
      const item: LRItem = {
        production: prod,
        dotPosition: dot,
      };
      
      const key = itemToKey(item);
      const id = `q${stateId++}`;
      stateMap.set(key, id);
      
      const isInitial = prod.left === augmented.startSymbol && dot === 0;
      
      states.push({
        id,
        items: [item],
        transitions: new Map(),
      });
    }
  }
  
  // Crear transiciones
  for (const state of states) {
    const item = state.items[0];
    const { production, dotPosition } = item;
    
    // Si el punto no está al final
    if (dotPosition < production.right.length) {
      const symbol = production.right[dotPosition];
      
      // Transición por el símbolo después del punto
      const nextItem: LRItem = {
        production,
        dotPosition: dotPosition + 1,
      };
      const nextKey = itemToKey(nextItem);
      const nextStateId = stateMap.get(nextKey);
      
      if (nextStateId) {
        state.transitions.set(symbol, nextStateId);
      }
      
      // Si el símbolo es un no terminal, agregar transiciones ε
      if (augmented.nonTerminals.includes(symbol)) {
        for (const prod of augmented.productions) {
          if (prod.left === symbol) {
            const epsilonItem: LRItem = {
              production: prod,
              dotPosition: 0,
            };
            const epsilonKey = itemToKey(epsilonItem);
            const epsilonStateId = stateMap.get(epsilonKey);
            
            if (epsilonStateId) {
              // Agregar transición epsilon
              const existing = state.transitions.get('ε');
              if (existing) {
                // Si ya hay una transición ε, necesitamos manejar múltiples destinos
                // Por simplicidad, guardamos como lista separada por comas
                state.transitions.set('ε', `${existing},${epsilonStateId}`);
              } else {
                state.transitions.set('ε', epsilonStateId);
              }
            }
          }
        }
      }
    }
  }
  
  // Encontrar el estado inicial
  const initialItem: LRItem = {
    production: augmented.productions[0],
    dotPosition: 0,
  };
  const initialKey = itemToKey(initialItem);
  const startState = stateMap.get(initialKey) || 'q0';
  
  return {
    states,
    startState,
  };
}

// ============================================================================
// ALGORITMOS DE CERRADURA E IR_A
// ============================================================================

/**
 * Calcula la cerradura de un conjunto de items LR(0)
 */
export function closure0(items: LRItemWithKey[], grammar: Grammar): LRItemWithKey[] {
  const result: LRItemWithKey[] = [...items];
  const added = new Set<string>(items.map(i => i.key));
  let changed = true;
  
  while (changed) {
    changed = false;
    
    for (const item of [...result]) {
      const { production, dotPosition } = item;
      
      // Si el punto no está al final y el símbolo después del punto es un no terminal
      if (dotPosition < production.right.length) {
        const nextSymbol = production.right[dotPosition];
        
        if (grammar.nonTerminals.includes(nextSymbol)) {
          // Agregar todos los items B → •γ donde B es el no terminal
          for (const prod of grammar.productions) {
            if (prod.left === nextSymbol) {
              const newItem: LRItem = {
                production: prod,
                dotPosition: 0,
              };
              const key = itemToKey(newItem);
              
              if (!added.has(key)) {
                result.push({ ...newItem, key });
                added.add(key);
                changed = true;
              }
            }
          }
        }
      }
    }
  }
  
  return result;
}

/**
 * Calcula la cerradura de un conjunto de items LR(1)
 */
export function closure1(items: LRItemWithKey[], grammar: Grammar): LRItemWithKey[] {
  const result: LRItemWithKey[] = [...items];
  const added = new Set<string>(items.map(i => i.key));
  let changed = true;
  
  // Precalcular FIRST sets
  const firstFollow = generateFirstFollow(grammar);
  const firstSets = new Map<string, Set<string>>();
  firstFollow.forEach(ff => {
    firstSets.set(ff.nonTerminal, new Set(ff.first));
  });
  
  // Función para calcular FIRST de una secuencia
  const getFirstOfSequence = (symbols: string[]): Set<string> => {
    const result = new Set<string>();
    
    for (const symbol of symbols) {
      if (grammar.terminals.includes(symbol) || symbol === '$') {
        result.add(symbol);
        break;
      } else if (grammar.nonTerminals.includes(symbol)) {
        const first = firstSets.get(symbol);
        if (first) {
          first.forEach(s => {
            if (s !== 'ε') result.add(s);
          });
          if (!first.has('ε')) break;
        }
      }
    }
    
    if (symbols.length === 0 || symbols.every(s => {
      const first = firstSets.get(s);
      return first?.has('ε') ?? false;
    })) {
      result.add('ε');
    }
    
    return result;
  };
  
  while (changed) {
    changed = false;
    
    for (const item of [...result]) {
      const { production, dotPosition, lookahead } = item;
      
      if (dotPosition < production.right.length) {
        const nextSymbol = production.right[dotPosition];
        
        if (grammar.nonTerminals.includes(nextSymbol)) {
          // Calcular FIRST(βa) donde β es lo que sigue al no terminal y a es el lookahead
          const beta = production.right.slice(dotPosition + 1);
          const betaWithLookahead = lookahead ? [...beta, lookahead] : beta;
          const firstBeta = getFirstOfSequence(betaWithLookahead);
          
          // Agregar items B → •γ, b para cada b en FIRST(βa)
          for (const prod of grammar.productions) {
            if (prod.left === nextSymbol) {
              for (const b of firstBeta) {
                if (b === 'ε') continue;
                
                const newItem: LRItem = {
                  production: prod,
                  dotPosition: 0,
                  lookahead: b,
                };
                const key = itemToKey(newItem);
                
                if (!added.has(key)) {
                  result.push({ ...newItem, key });
                  added.add(key);
                  changed = true;
                }
              }
            }
          }
        }
      }
    }
  }
  
  return result;
}

/**
 * Calcula ir_a (goto) para un conjunto de items y un símbolo
 */
export function gotoSet(
  items: LRItemWithKey[],
  symbol: string,
  grammar: Grammar,
  useLR1: boolean = false
): LRItemWithKey[] {
  const kernel: LRItemWithKey[] = [];
  
  for (const item of items) {
    const { production, dotPosition, lookahead } = item;
    
    if (dotPosition < production.right.length && production.right[dotPosition] === symbol) {
      const newItem: LRItem = {
        production,
        dotPosition: dotPosition + 1,
        lookahead,
      };
      kernel.push({ ...newItem, key: itemToKey(newItem) });
    }
  }
  
  return useLR1 ? closure1(kernel, grammar) : closure0(kernel, grammar);
}

// ============================================================================
// CONSTRUCCIÓN DE CONJUNTOS CANÓNICOS
// ============================================================================

/**
 * Construye los conjuntos canónicos LR(0) - usado por SLR
 */
export function buildCanonicalSetsLR0(grammar: Grammar): LRStateSet[] {
  const augmented = augmentGrammar(grammar);
  const states: LRStateSet[] = [];
  const stateMap = new Map<string, number>();
  
  // Estado inicial: cerradura de {S' → •S}
  const initialItem: LRItem = {
    production: augmented.productions[0],
    dotPosition: 0,
  };
  const initialItems = closure0([{ ...initialItem, key: itemToKey(initialItem) }], augmented);
  
  const initialKey = initialItems.map(i => i.key).sort().join('|');
  stateMap.set(initialKey, 0);
  
  states.push({
    id: 0,
    items: initialItems,
    kernel: [{ ...initialItem, key: itemToKey(initialItem) }],
    transitions: new Map(),
  });
  
  // Procesar estados pendientes
  const queue = [0];
  
  while (queue.length > 0) {
    const stateId = queue.shift()!;
    const state = states[stateId];
    
    // Obtener todos los símbolos después del punto
    const symbols = new Set<string>();
    for (const item of state.items) {
      if (item.dotPosition < item.production.right.length) {
        symbols.add(item.production.right[item.dotPosition]);
      }
    }
    
    // Calcular ir_a para cada símbolo
    for (const symbol of symbols) {
      const nextItems = gotoSet(state.items, symbol, augmented, false);
      
      if (nextItems.length === 0) continue;
      
      const nextKey = nextItems.map(i => i.key).sort().join('|');
      
      if (!stateMap.has(nextKey)) {
        const nextId = states.length;
        stateMap.set(nextKey, nextId);
        
        // Calcular el kernel
        const kernel = nextItems.filter(item => {
          // El kernel incluye items con punto no al inicio,
          // o el item inicial S' → •S
          return item.dotPosition > 0 || 
                 (item.production.left === augmented.startSymbol && item.dotPosition === 0);
        });
        
        states.push({
          id: nextId,
          items: nextItems,
          kernel,
          transitions: new Map(),
        });
        
        queue.push(nextId);
      }
      
      state.transitions.set(symbol, stateMap.get(nextKey)!);
    }
  }
  
  return states;
}

/**
 * Construye los conjuntos canónicos LR(1) - usado por LR canónico
 */
export function buildCanonicalSetsLR1(grammar: Grammar): LRStateSet[] {
  const augmented = augmentGrammar(grammar);
  const states: LRStateSet[] = [];
  const stateMap = new Map<string, number>();
  
  // Estado inicial: cerradura de {S' → •S, $}
  const initialItem: LRItem = {
    production: augmented.productions[0],
    dotPosition: 0,
    lookahead: '$',
  };
  const initialItems = closure1([{ ...initialItem, key: itemToKey(initialItem) }], augmented);
  
  const initialKey = initialItems.map(i => i.key).sort().join('|');
  stateMap.set(initialKey, 0);
  
  states.push({
    id: 0,
    items: initialItems,
    kernel: [{ ...initialItem, key: itemToKey(initialItem) }],
    transitions: new Map(),
  });
  
  const queue = [0];
  
  while (queue.length > 0) {
    const stateId = queue.shift()!;
    const state = states[stateId];
    
    const symbols = new Set<string>();
    for (const item of state.items) {
      if (item.dotPosition < item.production.right.length) {
        symbols.add(item.production.right[item.dotPosition]);
      }
    }
    
    for (const symbol of symbols) {
      const nextItems = gotoSet(state.items, symbol, augmented, true);
      
      if (nextItems.length === 0) continue;
      
      const nextKey = nextItems.map(i => i.key).sort().join('|');
      
      if (!stateMap.has(nextKey)) {
        const nextId = states.length;
        stateMap.set(nextKey, nextId);
        
        const kernel = nextItems.filter(item => item.dotPosition > 0);
        
        states.push({
          id: nextId,
          items: nextItems,
          kernel,
          transitions: new Map(),
        });
        
        queue.push(nextId);
      }
      
      state.transitions.set(symbol, stateMap.get(nextKey)!);
    }
  }
  
  return states;
}

/**
 * Construye los conjuntos LALR(1) comprimiendo estados LR(1)
 */
export function buildCanonicalSetsLALR(grammar: Grammar): LRStateSet[] {
  const lr1States = buildCanonicalSetsLR1(grammar);
  
  // Agrupar estados con el mismo núcleo LR(0)
  const coreMap = new Map<string, number[]>();
  
  for (const state of lr1States) {
    // Calcular el core (núcleo sin lookahead)
    const core = state.items.map(item => {
      const { production, dotPosition } = item;
      return `${production.left}->${production.right.join('')}•${dotPosition}`;
    }).sort().join('|');
    
    if (!coreMap.has(core)) {
      coreMap.set(core, []);
    }
    coreMap.get(core)!.push(state.id);
  }
  
  // Crear mapeo de estados originales a estados comprimidos
  const stateMapping = new Map<number, number>();
  const mergedStates: LRStateSet[] = [];
  
  let newId = 0;
  for (const [core, stateIds] of coreMap) {
    // Asignar el mismo nuevo ID a todos los estados con el mismo core
    for (const oldId of stateIds) {
      stateMapping.set(oldId, newId);
    }
    
    // Combinar los items de todos los estados (uniendo lookaheads)
    const combinedItems = new Map<string, LRItemWithKey>();
    const combinedKernel: LRItemWithKey[] = [];
    
    for (const oldId of stateIds) {
      const oldState = lr1States[oldId];
      
      for (const item of oldState.items) {
        // Clave sin lookahead
        const coreKey = `${item.production.id}•${item.dotPosition}`;
        
        if (!combinedItems.has(coreKey)) {
          combinedItems.set(coreKey, { ...item });
        } else {
          // Combinar lookaheads (en este caso, mantenemos todos)
          const existing = combinedItems.get(coreKey)!;
          if (existing.lookahead !== item.lookahead) {
            // Crear nuevo item con lookahead combinado
            const combined = existing.lookahead && item.lookahead
              ? `${existing.lookahead}/${item.lookahead}`
              : existing.lookahead || item.lookahead;
            existing.lookahead = combined;
            existing.key = itemToKey(existing);
          }
        }
      }
    }
    
    // Procesar transiciones (tomamos las del primer estado, luego actualizamos)
    const firstState = lr1States[stateIds[0]];
    const newTransitions = new Map<string, number>();
    
    mergedStates.push({
      id: newId,
      items: Array.from(combinedItems.values()),
      kernel: combinedKernel,
      transitions: newTransitions,
    });
    
    newId++;
  }
  
  // Actualizar transiciones con los nuevos IDs
  for (const state of mergedStates) {
    const originalStates = Array.from(coreMap.values()).find(ids => 
      stateMapping.get(ids[0]) === state.id
    );
    
    if (originalStates) {
      const firstOriginal = lr1States[originalStates[0]];
      for (const [symbol, targetId] of firstOriginal.transitions) {
        state.transitions.set(symbol, stateMapping.get(targetId)!);
      }
    }
  }
  
  return mergedStates;
}

// ============================================================================
// CONSTRUCCIÓN DE TABLAS DE ANÁLISIS
// ============================================================================

/**
 * Construye la tabla de análisis SLR
 */
export function buildSLRTable(grammar: Grammar): LRAnalysisResult {
  const augmented = augmentGrammar(grammar);
  const canonicalSets = buildCanonicalSetsLR0(grammar);
  const afn = buildLR0AFN(grammar);
  
  // Calcular FOLLOW para SLR
  const firstFollow = generateFirstFollow(augmented);
  const followSets = new Map<string, Set<string>>();
  firstFollow.forEach(ff => {
    followSets.set(ff.nonTerminal, new Set(ff.follow));
  });
  
  const actionTable: ActionTable = {};
  const gotoTable: GotoTable = {};
  const conflicts: LRConflict[] = [];
  
  // Inicializar tablas
  for (const state of canonicalSets) {
    actionTable[state.id] = {};
    gotoTable[state.id] = {};
  }
  
  // Llenar tablas
  for (const state of canonicalSets) {
    for (const item of state.items) {
      const { production, dotPosition } = item;
      
      if (dotPosition < production.right.length) {
        // Hay un símbolo después del punto
        const symbol = production.right[dotPosition];
        const nextState = state.transitions.get(symbol);
        
        if (nextState !== undefined) {
          if (augmented.terminals.includes(symbol)) {
            // SHIFT
            const existing = actionTable[state.id][symbol];
            if (existing && existing.action !== 'shift') {
              conflicts.push({
                type: 'shift-reduce',
                state: state.id,
                symbol,
                description: `Conflicto shift-reduce en estado ${state.id} con '${symbol}'`,
              });
            }
            actionTable[state.id][symbol] = { action: 'shift', value: nextState };
          } else {
            // GOTO
            gotoTable[state.id][symbol] = nextState.toString();
          }
        }
      } else {
        // El punto está al final (reducción)
        if (production.left === augmented.startSymbol) {
          // Aceptar
          actionTable[state.id]['$'] = { action: 'accept', value: 0 };
        } else {
          // Reducir
          const follow = followSets.get(production.left) || new Set();
          
          for (const terminal of follow) {
            const existing = actionTable[state.id][terminal];
            if (existing) {
              if (existing.action === 'shift') {
                conflicts.push({
                  type: 'shift-reduce',
                  state: state.id,
                  symbol: terminal,
                  description: `Conflicto shift-reduce en estado ${state.id} con '${terminal}'`,
                });
              } else if (existing.action === 'reduce' && existing.value !== production.number) {
                conflicts.push({
                  type: 'reduce-reduce',
                  state: state.id,
                  symbol: terminal,
                  description: `Conflicto reduce-reduce en estado ${state.id} con '${terminal}'`,
                });
              }
            }
            actionTable[state.id][terminal] = { action: 'reduce', value: production.number! };
          }
        }
      }
    }
  }
  
  return {
    augmentedGrammar: augmented,
    afn,
    canonicalSets,
    actionTable,
    gotoTable,
    conflicts,
    type: 'SLR',
  };
}

/**
 * Construye la tabla de análisis LR(1) canónico
 */
export function buildLR1Table(grammar: Grammar): LRAnalysisResult {
  const augmented = augmentGrammar(grammar);
  const canonicalSets = buildCanonicalSetsLR1(grammar);
  const afn = buildLR0AFN(grammar);
  
  const actionTable: ActionTable = {};
  const gotoTable: GotoTable = {};
  const conflicts: LRConflict[] = [];
  
  // Inicializar tablas
  for (const state of canonicalSets) {
    actionTable[state.id] = {};
    gotoTable[state.id] = {};
  }
  
  // Llenar tablas
  for (const state of canonicalSets) {
    for (const item of state.items) {
      const { production, dotPosition, lookahead } = item;
      
      if (dotPosition < production.right.length) {
        const symbol = production.right[dotPosition];
        const nextState = state.transitions.get(symbol);
        
        if (nextState !== undefined) {
          if (augmented.terminals.includes(symbol)) {
            const existing = actionTable[state.id][symbol];
            if (existing && existing.action !== 'shift') {
              conflicts.push({
                type: 'shift-reduce',
                state: state.id,
                symbol,
                description: `Conflicto shift-reduce en estado ${state.id} con '${symbol}'`,
              });
            }
            actionTable[state.id][symbol] = { action: 'shift', value: nextState };
          } else {
            gotoTable[state.id][symbol] = nextState.toString();
          }
        }
      } else {
        // Reducción usando lookahead
        if (production.left === augmented.startSymbol) {
          actionTable[state.id]['$'] = { action: 'accept', value: 0 };
        } else if (lookahead) {
          const existing = actionTable[state.id][lookahead];
          if (existing) {
            if (existing.action === 'shift') {
              conflicts.push({
                type: 'shift-reduce',
                state: state.id,
                symbol: lookahead,
                description: `Conflicto shift-reduce en estado ${state.id} con '${lookahead}'`,
              });
            } else if (existing.action === 'reduce' && existing.value !== production.number) {
              conflicts.push({
                type: 'reduce-reduce',
                state: state.id,
                symbol: lookahead,
                description: `Conflicto reduce-reduce en estado ${state.id} con '${lookahead}'`,
              });
            }
          }
          actionTable[state.id][lookahead] = { action: 'reduce', value: production.number! };
        }
      }
    }
  }
  
  return {
    augmentedGrammar: augmented,
    afn,
    canonicalSets,
    actionTable,
    gotoTable,
    conflicts,
    type: 'LR1',
  };
}

/**
 * Construye la tabla de análisis LALR(1)
 */
export function buildLALRTable(grammar: Grammar): LRAnalysisResult {
  const augmented = augmentGrammar(grammar);
  const canonicalSets = buildCanonicalSetsLALR(grammar);
  const afn = buildLR0AFN(grammar);
  
  const actionTable: ActionTable = {};
  const gotoTable: GotoTable = {};
  const conflicts: LRConflict[] = [];
  
  // Inicializar tablas
  for (const state of canonicalSets) {
    actionTable[state.id] = {};
    gotoTable[state.id] = {};
  }
  
  // Llenar tablas (similar a LR1 pero con lookaheads combinados)
  for (const state of canonicalSets) {
    for (const item of state.items) {
      const { production, dotPosition, lookahead } = item;
      
      if (dotPosition < production.right.length) {
        const symbol = production.right[dotPosition];
        const nextState = state.transitions.get(symbol);
        
        if (nextState !== undefined) {
          if (augmented.terminals.includes(symbol)) {
            actionTable[state.id][symbol] = { action: 'shift', value: nextState };
          } else {
            gotoTable[state.id][symbol] = nextState.toString();
          }
        }
      } else {
        if (production.left === augmented.startSymbol) {
          actionTable[state.id]['$'] = { action: 'accept', value: 0 };
        } else if (lookahead) {
          // Manejar lookaheads combinados (separados por /)
          const lookaheads = lookahead.split('/');
          
          for (const la of lookaheads) {
            const existing = actionTable[state.id][la];
            if (existing) {
              if (existing.action === 'shift') {
                conflicts.push({
                  type: 'shift-reduce',
                  state: state.id,
                  symbol: la,
                  description: `Conflicto shift-reduce en estado ${state.id} con '${la}'`,
                });
              } else if (existing.action === 'reduce' && existing.value !== production.number) {
                conflicts.push({
                  type: 'reduce-reduce',
                  state: state.id,
                  symbol: la,
                  description: `Conflicto reduce-reduce en estado ${state.id} con '${la}'`,
                });
              }
            }
            actionTable[state.id][la] = { action: 'reduce', value: production.number! };
          }
        }
      }
    }
  }
  
  return {
    augmentedGrammar: augmented,
    afn,
    canonicalSets,
    actionTable,
    gotoTable,
    conflicts,
    type: 'LALR',
  };
}

// ============================================================================
// ANÁLISIS DE CADENAS
// ============================================================================

/**
 * Analiza una cadena usando una tabla LR
 */
export function parseLR(
  grammar: Grammar,
  actionTable: ActionTable,
  gotoTable: GotoTable,
  input: string
): ParsingResult {
  const augmented = augmentGrammar(grammar);
  const tokens = input.split(/\s+/).filter(t => t.length > 0);
  tokens.push('$');
  
  const stack: (string | number)[] = [0];
  const steps: ParseStep[] = [];
  let inputIndex = 0;
  let stepNumber = 0;
  
  // Paso inicial
  steps.push({
    stepNumber: stepNumber++,
    stack: ['0'],
    input: [...tokens],
    output: '',
    action: 'Inicio',
  });
  
  while (true) {
    const state = stack[stack.length - 1] as number;
    const currentToken = tokens[inputIndex];
    const action = actionTable[state]?.[currentToken];
    
    if (!action) {
      steps.push({
        stepNumber: stepNumber++,
        stack: stack.map(String),
        input: tokens.slice(inputIndex),
        output: '',
        action: `Error: no hay acción para estado ${state} con '${currentToken}'`,
      });
      
      return {
        accepted: false,
        steps,
        error: `Error sintáctico: no se esperaba '${currentToken}'`,
      };
    }
    
    if (action.action === 'shift') {
      stack.push(currentToken);
      stack.push(action.value as number);
      
      steps.push({
        stepNumber: stepNumber++,
        stack: stack.map(String),
        input: tokens.slice(inputIndex + 1),
        output: '',
        action: `Desplazar '${currentToken}', ir a estado ${action.value}`,
      });
      
      inputIndex++;
    } else if (action.action === 'reduce') {
      const prodNum = action.value as number;
      const production = augmented.productions[prodNum];
      
      // Sacar 2 * |β| elementos de la pila
      const popCount = production.right[0] === 'ε' ? 0 : production.right.length * 2;
      for (let i = 0; i < popCount; i++) {
        stack.pop();
      }
      
      // Obtener el estado del tope
      const topState = stack[stack.length - 1] as number;
      
      // Meter el no terminal
      stack.push(production.left);
      
      // Ir al nuevo estado según GOTO
      const newState = gotoTable[topState]?.[production.left];
      if (newState !== undefined) {
        stack.push(parseInt(newState));
      }
      
      steps.push({
        stepNumber: stepNumber++,
        stack: stack.map(String),
        input: tokens.slice(inputIndex),
        output: `${production.left} → ${production.right.join(' ')}`,
        action: `Reducir por ${production.left} → ${production.right.join(' ')}`,
      });
    } else if (action.action === 'accept') {
      steps.push({
        stepNumber: stepNumber++,
        stack: stack.map(String),
        input: tokens.slice(inputIndex),
        output: 'Aceptar',
        action: 'Cadena aceptada',
      });
      
      return {
        accepted: true,
        steps,
      };
    }
  }
}

// ============================================================================
// CONVERSIÓN A AUTÓMATA PARA VISUALIZACIÓN
// ============================================================================

/**
 * Convierte los conjuntos canónicos a formato de autómata para visualización
 */
export function canonicalSetsToAutomaton(
  canonicalSets: LRStateSet[],
  grammar: Grammar
): LRAutomaton {
  const augmented = augmentGrammar(grammar);
  
  const states: LRState[] = canonicalSets.map(set => ({
    id: `I${set.id}`,
    items: set.items.map(item => ({
      production: item.production,
      dotPosition: item.dotPosition,
      lookahead: item.lookahead,
    })),
    transitions: new Map(
      Array.from(set.transitions.entries()).map(([symbol, targetId]) => [
        symbol,
        `I${targetId}`,
      ])
    ),
  }));
  
  return {
    states,
    startState: 'I0',
  };
}

/**
 * Exporta los conjuntos canónicos como texto formateado
 */
export function formatCanonicalSets(canonicalSets: LRStateSet[]): string {
  return canonicalSets.map(set => {
    const itemsStr = set.items.map(item => formatLRItem(item)).join('\n  ');
    const transStr = Array.from(set.transitions.entries())
      .map(([symbol, target]) => `  ${symbol} → I${target}`)
      .join('\n');
    
    return `I${set.id}:\n  ${itemsStr}\n${transStr ? `Transiciones:\n${transStr}` : ''}`;
  }).join('\n\n');
}

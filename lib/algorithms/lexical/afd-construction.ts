/**
 * Construcción y Minimización de Autómatas Finitos Deterministas
 * 
 * Implementa:
 * 1. Construcción de AFD mediante método de subconjuntos (Subset Construction)
 * 2. Eliminación de estados inalcanzables
 * 3. Minimización de AFD usando algoritmo de particiones (Hopcroft)
 * 4. Conversión de AFN a AFD
 */

import { Automaton, State, Transition } from '@/lib/types/automata';
import { erToAFN } from './er-to-af';

/**
 * Calcula la cerradura-ε de un conjunto de estados
 * Retorna todos los estados alcanzables mediante transiciones ε
 */
function epsilonClosure(states: Set<string>, automaton: Automaton): Set<string> {
  const closure = new Set(states);
  const stack = Array.from(states);

  while (stack.length > 0) {
    const current = stack.pop()!;

    // Buscar todas las transiciones ε desde el estado actual
    const epsilonTransitions = automaton.transitions.filter(
      t => t.from === current && t.symbol === 'ε'
    );

    for (const transition of epsilonTransitions) {
      if (!closure.has(transition.to)) {
        closure.add(transition.to);
        stack.push(transition.to);
      }
    }
  }

  return closure;
}

/**
 * Calcula move(T, a): estados alcanzables desde T mediante símbolo a
 */
function move(states: Set<string>, symbol: string, automaton: Automaton): Set<string> {
  const result = new Set<string>();

  for (const state of states) {
    const transitions = automaton.transitions.filter(
      t => t.from === state && t.symbol === symbol
    );

    for (const transition of transitions) {
      result.add(transition.to);
    }
  }

  return result;
}

/**
 * Convierte un AFN a AFD usando el algoritmo de construcción de subconjuntos
 */
export function afnToAfd(afn: Automaton): Automaton {
  if (afn.type === 'DFA') {
    return afn; // Ya es AFD
  }

  const dStates: Map<string, Set<string>> = new Map(); // Mapeo de ID a conjunto de estados del AFN
  const dTransitions: Transition[] = [];
  const unmarkedStates: string[] = [];
  let stateCounter = 0;

  // Función auxiliar para crear un ID de estado desde un conjunto
  function setToStateId(stateSet: Set<string>): string {
    return Array.from(stateSet).sort().join(',');
  }

  // Función auxiliar para generar un nuevo ID de estado
  function newDStateId(): string {
    return `q${stateCounter++}`;
  }

  // 1. El estado inicial del AFD es ε-cerradura del estado inicial del AFN
  const initialState = afn.states.find(s => s.isInitial);
  if (!initialState) throw new Error('AFN no tiene estado inicial');

  const initialClosure = epsilonClosure(new Set([initialState.id]), afn);
  const initialId = newDStateId();
  const initialKey = setToStateId(initialClosure);

  dStates.set(initialId, initialClosure);
  unmarkedStates.push(initialId);

  const stateKeyToId = new Map<string, string>();
  stateKeyToId.set(initialKey, initialId);

  // 2. Algoritmo de construcción de subconjuntos
  while (unmarkedStates.length > 0) {
    const currentId = unmarkedStates.shift()!;
    const currentSet = dStates.get(currentId)!;

    // Para cada símbolo del alfabeto (excepto ε)
    for (const symbol of afn.alphabet) {
      if (symbol === 'ε') continue;

      // Calcular move(T, a)
      const moveSet = move(currentSet, symbol, afn);
      
      // Calcular ε-cerradura(move(T, a))
      const closure = epsilonClosure(moveSet, afn);

      if (closure.size > 0) {
        const closureKey = setToStateId(closure);
        
        // Si es un nuevo estado
        if (!stateKeyToId.has(closureKey)) {
          const newId = newDStateId();
          stateKeyToId.set(closureKey, newId);
          dStates.set(newId, closure);
          unmarkedStates.push(newId);
        }

        const targetId = stateKeyToId.get(closureKey)!;

        // Agregar transición
        dTransitions.push({
          id: `${currentId}-${symbol}-${targetId}`,
          from: currentId,
          to: targetId,
          symbol,
        });
      }
    }
  }

  // 3. Construir estados del AFD
  const dFinalStates: State[] = [];
  const afnFinalStates = new Set(afn.states.filter(s => s.isFinal).map(s => s.id));

  for (const [stateId, stateSet] of dStates.entries()) {
    // Un estado es final si contiene algún estado final del AFN
    const isFinal = Array.from(stateSet).some(s => afnFinalStates.has(s));
    const isInitial = stateId === initialId;

    dFinalStates.push({
      id: stateId,
      label: stateId,
      isInitial,
      isFinal,
    });
  }

  return {
    id: `afd-${Date.now()}`,
    type: 'DFA',
    states: dFinalStates,
    transitions: dTransitions,
    alphabet: afn.alphabet.filter(s => s !== 'ε'),
    name: `AFD de ${afn.name || 'AFN'}`,
  };
}

/**
 * Elimina estados inalcanzables de un AFD
 */
export function removeUnreachableStates(afd: Automaton): Automaton {
  const initialState = afd.states.find(s => s.isInitial);
  if (!initialState) return afd;

  // BFS para encontrar estados alcanzables
  const reachable = new Set<string>();
  const queue: string[] = [initialState.id];
  reachable.add(initialState.id);

  while (queue.length > 0) {
    const current = queue.shift()!;

    // Buscar transiciones desde el estado actual
    const outgoingTransitions = afd.transitions.filter(t => t.from === current);

    for (const transition of outgoingTransitions) {
      if (!reachable.has(transition.to)) {
        reachable.add(transition.to);
        queue.push(transition.to);
      }
    }
  }

  // Filtrar estados y transiciones
  const newStates = afd.states.filter(s => reachable.has(s.id));
  const newTransitions = afd.transitions.filter(
    t => reachable.has(t.from) && reachable.has(t.to)
  );

  return {
    ...afd,
    states: newStates,
    transitions: newTransitions,
  };
}

/**
 * Minimiza un AFD usando el algoritmo de particiones (Hopcroft)
 */
export function minimizeDFA(afd: Automaton): Automaton {
  // 1. Eliminar estados inalcanzables
  const cleanedAfd = removeUnreachableStates(afd);

  // 2. Crear particiones iniciales: estados finales y no finales
  const finalStates = new Set(cleanedAfd.states.filter(s => s.isFinal).map(s => s.id));
  const nonFinalStates = new Set(cleanedAfd.states.filter(s => !s.isFinal).map(s => s.id));

  let partitions: Set<string>[] = [];
  if (finalStates.size > 0) partitions.push(finalStates);
  if (nonFinalStates.size > 0) partitions.push(nonFinalStates);

  // 3. Refinar particiones
  let refined = true;
  while (refined) {
    refined = false;
    const newPartitions: Set<string>[] = [];

    for (const partition of partitions) {
      if (partition.size === 1) {
        newPartitions.push(partition);
        continue;
      }

      // Agrupar estados por su comportamiento
      const groups = new Map<string, Set<string>>();

      for (const state of partition) {
        // Crear firma del estado (a qué partición va con cada símbolo)
        const signature: number[] = [];

        for (const symbol of cleanedAfd.alphabet) {
          const transition = cleanedAfd.transitions.find(
            t => t.from === state && t.symbol === symbol
          );

          if (transition) {
            // Encontrar a qué partición pertenece el estado destino
            const targetPartitionIndex = partitions.findIndex(p => p.has(transition.to));
            signature.push(targetPartitionIndex);
          } else {
            signature.push(-1); // No hay transición
          }
        }

        const signatureKey = signature.join(',');
        if (!groups.has(signatureKey)) {
          groups.set(signatureKey, new Set());
        }
        groups.get(signatureKey)!.add(state);
      }

      // Si se dividió la partición, hay refinamiento
      if (groups.size > 1) {
        refined = true;
      }

      for (const group of groups.values()) {
        newPartitions.push(group);
      }
    }

    partitions = newPartitions;
  }

  // 4. Construir AFD minimizado
  const stateMap = new Map<string, string>(); // Estado original -> Estado minimizado
  const minStates: State[] = [];
  const minTransitions: Transition[] = [];

  // Crear un estado por cada partición
  partitions.forEach((partition, index) => {
    const partitionId = `q${index}`;
    const representative = Array.from(partition)[0];
    const originalState = cleanedAfd.states.find(s => s.id === representative)!;

    // Mapear todos los estados de la partición al nuevo estado
    for (const stateId of partition) {
      stateMap.set(stateId, partitionId);
    }

    // El estado minimizado es inicial si algún estado de la partición lo era
    const isInitial = Array.from(partition).some(
      sid => cleanedAfd.states.find(s => s.id === sid)?.isInitial
    );

    // El estado minimizado es final si algún estado de la partición lo era
    const isFinal = Array.from(partition).some(
      sid => cleanedAfd.states.find(s => s.id === sid)?.isFinal
    );

    minStates.push({
      id: partitionId,
      label: partitionId,
      isInitial,
      isFinal,
    });
  });

  // Crear transiciones del AFD minimizado
  const addedTransitions = new Set<string>();

  for (const transition of cleanedAfd.transitions) {
    const fromMin = stateMap.get(transition.from);
    const toMin = stateMap.get(transition.to);

    if (fromMin && toMin) {
      const transitionKey = `${fromMin}-${transition.symbol}-${toMin}`;
      
      if (!addedTransitions.has(transitionKey)) {
        minTransitions.push({
          id: transitionKey,
          from: fromMin,
          to: toMin,
          symbol: transition.symbol,
        });
        addedTransitions.add(transitionKey);
      }
    }
  }

  return {
    id: `afd-min-${Date.now()}`,
    type: 'DFA',
    states: minStates,
    transitions: minTransitions,
    alphabet: cleanedAfd.alphabet,
    name: `AFD Minimizado de ${cleanedAfd.name || 'AFD'}`,
  };
}

/**
 * Construye AFD completo (no óptimo) desde una expresión regular
 * Incluye todos los estados posibles, incluso los inalcanzables
 */
export function buildAFDFull(regex: string): Automaton {
  // 1. Construir AFN
  const afn = erToAFN(regex);

  // 2. Convertir a AFD (sin minimizar)
  const afd = afnToAfd(afn);

  return afd;
}

/**
 * Construye AFD óptimo (minimizado) desde una expresión regular
 */
export function buildAFDShort(regex: string): Automaton {
  // 1. Construir AFD completo
  const afdFull = buildAFDFull(regex);

  // 2. Minimizar
  const afdMin = minimizeDFA(afdFull);

  return afdMin;
}

/**
 * Verifica si un autómata es determinista
 */
export function isDeterministic(automaton: Automaton): boolean {
  // Verificar que no haya transiciones ε
  if (automaton.transitions.some(t => t.symbol === 'ε')) {
    return false;
  }

  // Verificar que no haya múltiples transiciones desde el mismo estado con el mismo símbolo
  const transitionMap = new Map<string, Set<string>>();

  for (const transition of automaton.transitions) {
    const key = `${transition.from}-${transition.symbol}`;
    if (!transitionMap.has(key)) {
      transitionMap.set(key, new Set());
    }
    transitionMap.get(key)!.add(transition.to);
  }

  for (const targets of transitionMap.values()) {
    if (targets.size > 1) {
      return false;
    }
  }

  return true;
}

/**
 * Obtiene estadísticas de un autómata
 */
export function getAutomatonStats(automaton: Automaton) {
  return {
    totalStates: automaton.states.length,
    initialStates: automaton.states.filter(s => s.isInitial).length,
    finalStates: automaton.states.filter(s => s.isFinal).length,
    totalTransitions: automaton.transitions.length,
    alphabetSize: automaton.alphabet.length,
    isDeterministic: isDeterministic(automaton),
    hasEpsilonTransitions: automaton.transitions.some(t => t.symbol === 'ε'),
  };
}

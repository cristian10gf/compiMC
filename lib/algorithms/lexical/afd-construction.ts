/**
 * Construcción y Minimización de Autómatas Finitos Deterministas
 * 
 * Implementa:
 * 1. Construcción de AFD mediante método de subconjuntos (Subset Construction)
 * 2. Eliminación de estados inalcanzables
 * 3. Minimización de AFD usando algoritmo de particiones (Hopcroft)
 * 4. Conversión de AFN a AFD
 */

import { Automaton, AutomatonResults, State, SubsetState, Transition } from '@/lib/types/automata';
import { erToAFD, erToAFN } from './er-to-af';
import { buildSyntaxTree } from './regex-parser';

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
    const statesPosibles = Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    if (stateCounter < statesPosibles.length) {
      return statesPosibles[stateCounter++];
    }
    return `q${stateCounter++}`;
  }

  // 1. El estado inicial del AFD es ε-cerradura del estado inicial del AFN
  const initialState = afn.states.find(s => s.isInitial);
  if (!initialState) throw new Error('AFN no tiene estado inicial');

  const initialClosure = epsilonClosure(new Set([initialState.id]), afn);
  const initialId = newDStateId();
  const initialKey = setToStateId(initialClosure);
  const Subsets: SubsetState[] = [{ id: initialId, constituentStates: initialClosure }];

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
          Subsets.push({ id: newId, constituentStates: closure });
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
    subsetStates: Subsets,
  };
}

/**
 * Identifica estados significativos de un AFN
 * Un estado es significativo si tiene transiciones de salida diferentes de ε
 * move(s, a) ≠ ∅, si s es significativo para algún a en Σ
 */
export function getSignificantStates(afn: Automaton): Set<string> {
  const significant = new Set<string>();

  for (const state of afn.states) {
    // Un estado es significativo si tiene transiciones no-epsilon
    const hasNonEpsilonTransitions = afn.transitions.some(
      t => t.from === state.id && t.symbol !== 'ε'
    );

    if (hasNonEpsilonTransitions) {
      significant.add(state.id);
    }

    // add the final states as significant
    if (state.isFinal) {
      significant.add(state.id);
    }
  }

  return significant;
}

/**
 * Optimiza un AFD identificando estados equivalentes (estados significativos)
 * Algoritmo: Dos estados son equivalentes si tienen los mismos estados significativos
 */
export function optimizeBySignificantStates(afd: Automaton, afn: Automaton): Automaton {
  // 1. Identificar estados significativos
  // En un AFD, todos los estados con transiciones son significativos
  const significantStates = getSignificantStates(afn);

  // 2. Obtener los estados significativos por estado
  const stateSignificantMap: Map<string, Set<string>> = new Map();
  const subconjuntos: SubsetState[] = afd.subsetStates || [];

    
  // Verificar cada subconjunto para ver si contiene estados significativos
  for (const subset of subconjuntos) {
    const sigSet = new Set<string>();
    for (const stateId of subset.constituentStates) {
      if (significantStates.has(stateId)) {
        sigSet.add(stateId);
      }
    }
    stateSignificantMap.set(subset.id, sigSet);
  }
  
  // 3. Agrupar estados por su conjunto de estados significativos
  const partitions: Set<string>[] = [];

  for (const [stateId, sigSet] of stateSignificantMap.entries()) {
    let foundPartition = false;

    for (const partition of partitions) {
      const representative = Array.from(partition)[0];
      const repSigSet = stateSignificantMap.get(representative)!;

      // Comparar conjuntos de estados significativos
      if (
        sigSet.size === repSigSet.size && 
          Array.from(sigSet).every(s => repSigSet.has(s))
      ) {
        partition.add(stateId);
        foundPartition = true;
        break;
      }
    }

    if (!foundPartition) {
      const newPartition = new Set<string>();
      newPartition.add(stateId);
      partitions.push(newPartition);
    }
  }

  // 4. Construir AFD optimizado, fusionando estados equivalentes
  const stateMap = new Map<string, string>();
  const optStates: State[] = [];
  const optTransitions: Transition[] = [];

  for (const partition of partitions) {
    const representative = Array.from(partition)[0];
    const isInitial = afd.states.find(s => s.id === representative)?.isInitial || false;
    const isFinal = Array.from(partition).some(
      stateId => afd.states.find(s => s.id === stateId)?.isFinal
    );

    // Usar el representante (letra) como ID para mantener consistencia en las tablas
    optStates.push({
      id: representative,
      label: representative,
      isInitial,
      isFinal,
    });

    for (const stateId of partition) {
      stateMap.set(stateId, representative);
    }
  }

  // Crear transiciones del AFD optimizado
  const addedTransitions = new Set<string>();

  for (const transition of afd.transitions) {
    const fromOpt = stateMap.get(transition.from);
    const toOpt = stateMap.get(transition.to);

    if (fromOpt && toOpt) {
      const transKey = `${fromOpt}-${transition.symbol}-${toOpt}`;
      
      if (!addedTransitions.has(transKey)) {
        optTransitions.push({
          id: transKey,
          from: fromOpt,
          to: toOpt,
          symbol: transition.symbol,
        });
        addedTransitions.add(transKey);
      }
    }
  }

  // Filtrar subconjuntos para incluir solo los estados representativos (que quedaron en el AFD óptimo)
  const representativeIds = new Set(optStates.map(s => s.id));
  const filteredSubsets = subconjuntos.filter(s => representativeIds.has(s.id));

  return {
    id: `afd-opt-${Date.now()}`,
    type: 'DFA',
    states: optStates,
    transitions: optTransitions,
    alphabet: afd.alphabet,
    name: `AFD Óptimo de ${afd.name || 'AFD'}`,
    subsetStates: filteredSubsets,
  };
}

/**
 * Construye AFD completo (óptimo) desde una expresión regular
 */
export function buildAFDFull(regex: string): AutomatonResults {
  // 1. Construir AFN
  const afn = erToAFN(regex);

  // 2. Convertir a AFD
  const afd = afnToAfd(afn);

  // 3. Minimizar
  const afdMin = optimizeBySignificantStates(afd, afn);

  return {
    automatonAFN: afn,
    automatonAFDNonOptimized: afd,
    automatonAFD: afdMin,
  }
}

export function buildAFDShort(regex: string): AutomatonResults {
  // Construir árbol sintáctico aumentado (con # al final) para mostrar los valores correctos
  const augmentedRegex = `(${regex})#`;
  const syntaxTree = buildSyntaxTree(augmentedRegex);
  
  return {
    automatonAFD: erToAFD(regex),
    syntaxTree,
  };
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

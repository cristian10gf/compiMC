/**
 * Conversión de Expresión Regular a Autómata Finito
 * 
 * Implementa el Método de Thompson para construir un AFN (Autómata Finito No Determinístico)
 * a partir de una expresión regular.
 * 
 * Casos base:
 * 1. Para ε: estado inicial --ε--> estado final
 * 2. Para símbolo 'a': estado inicial --a--> estado final
 * 
 * Casos inductivos:
 * 3. Para r|s: Unión de N(r) y N(s)
 * 4. Para rs: Concatenación de N(r) y N(s)
 * 5. Para r*: Clausura de Kleene de N(r)
 * 6. Para r+: Clausura positiva de N(r) = rr*
 * 7. Para r?: Opcional de N(r) = r|ε
 */

import { Automaton, State, Transition, SyntaxTree, TreeNode, TransitionTable, NFAFragment } from '@/lib/types/automata';
import { buildSyntaxTree, calculateAnulable, calculatePrimeros, calculateUltimos, calculateSiguientes } from './regex-parser';

let stateCounter = 0;

/**
 * Reinicia el contador de estados
 */
export function resetStateCounter() {
  stateCounter = 0;
}

/**
 * Genera un nuevo ID de estado
 */
function newStateId(): string {
  return `q${stateCounter++}`;
}

/**
 * Crea un estado nuevo
 */
function createState(isInitial: boolean = false, isFinal: boolean = false): State {
  return {
    id: newStateId(),
    label: `q${stateCounter - 1}`,
    isInitial,
    isFinal,
  };
}

/**
 * Crea una transición
 */
function createTransition(from: string, to: string, symbol: string): Transition {
  return {
    id: `${from}-${symbol}-${to}`,
    from,
    to,
    symbol,
  };
}

/**
 * Fragmento de autómata (usado durante la construcción)
 */


/**
 * Construye AFN para ε (caso base)
 */
function epsilonNFA(): NFAFragment {
  const start = createState(true, false);
  const accept = createState(false, true);

  return {
    start,
    accept,
    states: [start, accept],
    transitions: [createTransition(start.id, accept.id, 'ε')],
  };
}

/**
 * Construye AFN para un símbolo (caso base)
 */
function symbolNFA(symbol: string): NFAFragment {
  const start = createState(true, false);
  const accept = createState(false, true);

  return {
    start,
    accept,
    states: [start, accept],
    transitions: [createTransition(start.id, accept.id, symbol)],
  };
}

/**
 * Construye AFN para r|s (unión)
 */
function unionNFA(nfa1: NFAFragment, nfa2: NFAFragment): NFAFragment {
  const start = createState(true, false);
  const accept = createState(false, true);

  // Marcar estados anteriores como no iniciales/finales
  nfa1.start.isInitial = false;
  nfa1.accept.isFinal = false;
  nfa2.start.isInitial = false;
  nfa2.accept.isFinal = false;

  const states = [start, ...nfa1.states, ...nfa2.states, accept];
  const transitions = [
    createTransition(start.id, nfa1.start.id, 'ε'),
    createTransition(start.id, nfa2.start.id, 'ε'),
    ...nfa1.transitions,
    ...nfa2.transitions,
    createTransition(nfa1.accept.id, accept.id, 'ε'),
    createTransition(nfa2.accept.id, accept.id, 'ε'),
  ];

  return { start, accept, states, transitions };
}

/**
 * Construye AFN para rs (concatenación)
 */
function concatNFA(nfa1: NFAFragment, nfa2: NFAFragment): NFAFragment {
  // Marcar estados como no iniciales/finales
  nfa2.start.isInitial = false;
  nfa1.accept.isFinal = false;

  // Unificar: el estado final de nfa1 (fr) se fusiona con el estado inicial de nfa2 (is)
  // El estado fusionado será nfa1.accept
  const mergedStateId = nfa1.accept.id;
  const removedStateId = nfa2.start.id;

  // Actualizar todas las transiciones de nfa2 que usan nfa2.start
  // para que usen nfa1.accept en su lugar
  const updatedNfa2Transitions = nfa2.transitions.map(t => {
    if (t.from === removedStateId) {
      return { ...t, from: mergedStateId, id: `${mergedStateId}-${t.symbol}-${t.to}` };
    }
    if (t.to === removedStateId) {
      return { ...t, to: mergedStateId, id: `${t.from}-${t.symbol}-${mergedStateId}` };
    }
    return t;
  });

  // Estados: todos de nfa1 + todos de nfa2 excepto el estado inicial de nfa2
  const states = [
    ...nfa1.states,
    ...nfa2.states.filter(s => s.id !== removedStateId)
  ];

  // Transiciones: todas de nfa1 + transiciones actualizadas de nfa2
  const transitions = [
    ...nfa1.transitions,
    ...updatedNfa2Transitions,
  ];

  return {
    start: nfa1.start,
    accept: nfa2.accept,
    states,
    transitions,
  };
}

/**
 * Construye AFN para r* (clausura de Kleene)
 */
function starNFA(nfa: NFAFragment): NFAFragment {
  const start = createState(true, false);
  const accept = createState(false, true);

  nfa.start.isInitial = false;
  nfa.accept.isFinal = false;

  const states = [start, ...nfa.states, accept];
  const transitions = [
    createTransition(start.id, nfa.start.id, 'ε'),
    createTransition(start.id, accept.id, 'ε'), // Permite ε
    ...nfa.transitions,
    createTransition(nfa.accept.id, nfa.start.id, 'ε'), // Loop
    createTransition(nfa.accept.id, accept.id, 'ε'),
  ];

  return { start, accept, states, transitions };
}

/**
 * Construye AFN para r+ (clausura positiva)
 */
function plusNFA(nfa: NFAFragment): NFAFragment {
  const start = createState(true, false);
  const accept = createState(false, true);

  nfa.start.isInitial = false;
  nfa.accept.isFinal = false;

  const states = [start, ...nfa.states, accept];
  const transitions = [
    createTransition(start.id, nfa.start.id, 'ε'),
    ...nfa.transitions,
    createTransition(nfa.accept.id, nfa.start.id, 'ε'), // Loop
    createTransition(nfa.accept.id, accept.id, 'ε'),
  ];

  return { start, accept, states, transitions };
}

/**
 * Construye AFN para r? (opcional)
 */
function optionalNFA(nfa: NFAFragment): NFAFragment {
  const start = createState(true, false);
  const accept = createState(false, true);

  nfa.start.isInitial = false;
  nfa.accept.isFinal = false;

  const states = [start, ...nfa.states, accept];
  const transitions = [
    createTransition(start.id, nfa.start.id, 'ε'),
    createTransition(start.id, accept.id, 'ε'), // Permite ε
    ...nfa.transitions,
    createTransition(nfa.accept.id, accept.id, 'ε'),
  ];

  return { start, accept, states, transitions };
}

/**
 * Construye AFN recursivamente desde un árbol sintáctico
 */
function buildNFAFromTree(node: TreeNode): NFAFragment {
  if (node.type === 'EPSILON') {
    return epsilonNFA();
  }

  if (node.type === 'SYMBOL') {
    return symbolNFA(node.value);
  }

  if (node.type === 'UNION') {
    const left = buildNFAFromTree(node.children[0]);
    const right = buildNFAFromTree(node.children[1]);
    return unionNFA(left, right);
  }

  if (node.type === 'CONCAT') {
    const left = buildNFAFromTree(node.children[0]);
    const right = buildNFAFromTree(node.children[1]);
    return concatNFA(left, right);
  }

  if (node.type === 'STAR') {
    const child = buildNFAFromTree(node.children[0]);
    return starNFA(child);
  }

  if (node.type === 'PLUS') {
    const child = buildNFAFromTree(node.children[0]);
    return plusNFA(child);
  }

  if (node.type === 'OPTIONAL') {
    const child = buildNFAFromTree(node.children[0]);
    return optionalNFA(child);
  }

  throw new Error(`Tipo de nodo no soportado: ${node.type}`);
}

/**
 * Renombra los estados y transiciones para mejor claridad
 **/ 
function reenumerateStates(nfa: NFAFragment): NFAFragment {
  const stateIdMap: Map<string, string> = new Map();
  let counter = 0;

  // Renombrar estados
  for (const state of nfa.states) {
    const newId = `q${counter++}`;
    stateIdMap.set(state.id, newId);
    state.id = newId;
    state.label = newId;
  }

  // Actualizar transiciones
  for (const transition of nfa.transitions) {
    transition.from = stateIdMap.get(transition.from)!;
    transition.to = stateIdMap.get(transition.to)!;
    transition.id = `${transition.from}-${transition.symbol}-${transition.to}`;
  }

  return nfa;
}

/**
 * Convierte una expresión regular a un AFN usando el Método de Thompson
 */
export function erToAFN(regex: string): Automaton {
  resetStateCounter();
  
  // 1. Construir árbol sintáctico
  const syntaxTree = buildSyntaxTree(regex);

  // 2. Construir AFN desde el árbol
  const nfaFragment = buildNFAFromTree(syntaxTree.root);

  // 3. Renombrar estados y transiciones para mejor claridad
  const renamedNfaFragment = reenumerateStates(nfaFragment);

  // 4. Construir autómata completo
  return {
    id: `afn-${Date.now()}`,
    type: 'NFA',
    states: renamedNfaFragment.states,
    transitions: renamedNfaFragment.transitions,
    alphabet: syntaxTree.alphabet,
    name: `AFN de ${regex}`,
  };
}

/**
 * Construye un AFD a partir de una expresión regular usando el método directo
 * (basado en las funciones anulable, primeros, últimos, siguientes)
 */
export function erToAFD(regex: string): Automaton {
  resetStateCounter();

  // 1. Construir árbol sintáctico aumentado (agregar # al final)
  const augmentedRegex = `(${regex})#`;
  const syntaxTree = buildSyntaxTree(augmentedRegex);

  // 2. Obtener funciones del árbol
  const anulable = calculateAnulable(syntaxTree.root);
  const primeros = calculatePrimeros(syntaxTree.root);
  const ultimos = calculateUltimos(syntaxTree.root);
  const siguientes = calculateSiguientes(syntaxTree.root);
  const positions = syntaxTree.positions;

  // 3. El estado inicial es primeros(raíz)
  const initialState = Array.from(primeros).sort((a, b) => a - b);
  const states: State[] = [];
  const transitions: Transition[] = [];
  const unmarkedStates: number[][] = [initialState];
  const markedStates: Set<string> = new Set();
  const stateMap = new Map<string, string>(); // Mapeo de conjunto de posiciones a ID de estado

  // Crear estado inicial
  const initialStateKey = initialState.join(',');
  const initialStateId = newStateId();
  stateMap.set(initialStateKey, initialStateId);

  // Función para obtener o crear estado
  function getOrCreateState(posSet: number[]): string {
    const key = posSet.sort((a, b) => a - b).join(',');
    if (!stateMap.has(key)) {
      const stateId = newStateId();
      stateMap.set(key, stateId);
    }
    return stateMap.get(key)!;
  }

  // 4. Algoritmo de construcción de subconjuntos
  while (unmarkedStates.length > 0) {
    const currentSet = unmarkedStates.shift()!;
    const currentKey = currentSet.join(',');

    if (markedStates.has(currentKey)) continue;
    markedStates.add(currentKey);

    const currentStateId = getOrCreateState(currentSet);
    const isInitial = currentKey === initialStateKey;
    
    // Verificar si es estado final (contiene la posición de #)
    const hashPosition = Math.max(...Array.from(positions.keys()));
    const isFinal = currentSet.includes(hashPosition);

    states.push({
      id: currentStateId,
      label: currentStateId,
      isInitial,
      isFinal,
    });

    // Para cada símbolo en el alfabeto
    for (const symbol of syntaxTree.alphabet) {
      if (symbol === '#') continue; // Ignorar el marcador

      // Calcular el siguiente estado
      const nextSet: Set<number> = new Set();

      // Para cada posición en el estado actual
      for (const pos of currentSet) {
        const symbolAtPos = positions.get(pos);
        
        // Si el símbolo en esta posición coincide
        if (symbolAtPos === symbol) {
          // Agregar los siguientes de esta posición
          const nextPositions = siguientes.get(pos);
          if (nextPositions) {
            nextPositions.forEach(p => nextSet.add(p));
          }
        }
      }

      // Si hay transición
      if (nextSet.size > 0) {
        const nextArray = Array.from(nextSet).sort((a, b) => a - b);
        const nextStateId = getOrCreateState(nextArray);
        
        transitions.push(createTransition(currentStateId, nextStateId, symbol));
        
        // Agregar a estados no marcados si es nuevo
        const nextKey = nextArray.join(',');
        if (!markedStates.has(nextKey)) {
          unmarkedStates.push(nextArray);
        }
      }
    }
  }

  return {
    id: `afd-${Date.now()}`,
    type: 'DFA',
    states,
    transitions,
    alphabet: syntaxTree.alphabet.filter(s => s !== '#'),
    name: `AFD de ${regex}`,
  };
}

/**
 * Genera la tabla de transiciones de un autómata
 */
export function generateTransitionTable(automaton: Automaton): TransitionTable {
  const table: TransitionTable = {
    headers: ['Estado', ...automaton.alphabet],
    rows: [],
  };

  for (const state of automaton.states) {
    const row: { [key: string]: string | string[] } = {
      estado: state.label,
    };

    // Marcar estado inicial y final
    if (state.isInitial) row.estado = `→${row.estado}`;
    if (state.isFinal) row.estado = `*${row.estado}`;

    for (const symbol of automaton.alphabet) {
      const transitionsForSymbol = automaton.transitions.filter(
        t => t.from === state.id && t.symbol === symbol
      );

      if (transitionsForSymbol.length === 0) {
        row[symbol] = '-';
      } else if (transitionsForSymbol.length === 1) {
        const targetState = automaton.states.find(s => s.id === transitionsForSymbol[0].to);
        row[symbol] = targetState?.label || '-';
      } else {
        // Múltiples transiciones (AFN)
        const targets = transitionsForSymbol.map(t => {
          const targetState = automaton.states.find(s => s.id === t.to);
          return targetState?.label || '';
        });
        row[symbol] = `{${targets.join(',')}}`;
      }
    }

    table.rows.push(row);
  }

  return table;
}

/**
 * Obtiene información del árbol sintáctico en formato legible
 */
export function getSyntaxTreeInfo(regex: string) {
  const syntaxTree = buildSyntaxTree(regex);

  return {
    tree: syntaxTree,
    anulable: calculateAnulable(syntaxTree.root),
    primeros: Array.from(calculatePrimeros(syntaxTree.root)),
    ultimos: Array.from(calculateUltimos(syntaxTree.root)),
    siguientes: Object.fromEntries(
      Array.from(calculateSiguientes(syntaxTree.root).entries()).map(([pos, set]) => [
        pos,
        Array.from(set),
      ])
    ),
    positions: Object.fromEntries(syntaxTree.positions),
  };
}

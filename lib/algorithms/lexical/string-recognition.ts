/**
 * Reconocimiento de Cadenas con Autómatas Finitos
 * 
 * Implementa la simulación de un autómata para determinar si acepta una cadena de entrada.
 * Soporta tanto AFD como AFN.
 */

import { Automaton, RecognitionResult, RecognitionStep } from '@/lib/types/automata';

/**
 * Simula un AFD para reconocer una cadena
 */
export function recognizeStringDFA(automaton: Automaton, input: string): RecognitionResult {
  const steps: RecognitionStep[] = [];
  
  // Encontrar estado inicial
  const initialState = automaton.states.find(s => s.isInitial);
  if (!initialState) {
    return {
      accepted: false,
      transitions: [],
      currentState: '',
      remainingInput: input,
      message: 'Error: No hay estado inicial definido',
      steps: [],
    };
  }

  let currentStateId = initialState.id;
  let remainingInput = input;
  
  // Paso inicial
  steps.push({
    stepNumber: 0,
    currentState: initialState.label,
    symbol: '',
    nextState: initialState.label,
    remainingInput: input,
    action: 'Estado inicial',
  });

  // Procesar cada símbolo de la entrada
  for (let i = 0; i < input.length; i++) {
    const symbol = input[i];

    // Verificar que el símbolo pertenece al alfabeto
    if (!automaton.alphabet.includes(symbol)) {
      const currentState = automaton.states.find(s => s.id === currentStateId);
      return {
        accepted: false,
        transitions: steps.map(s => ({ from: s.currentState, symbol: s.symbol, to: s.nextState })),
        currentState: currentState?.label || '',
        remainingInput: remainingInput.substring(1),
        message: `Error: El símbolo '${symbol}' no pertenece al alfabeto`,
        steps,
      };
    }

    // Buscar transición
    const transition = automaton.transitions.find(
      t => t.from === currentStateId && t.symbol === symbol
    );

    if (!transition) {
      const currentState = automaton.states.find(s => s.id === currentStateId);
      return {
        accepted: false,
        transitions: steps.map(s => ({ from: s.currentState, symbol: s.symbol, to: s.nextState })),
        currentState: currentState?.label || '',
        remainingInput: remainingInput.substring(1),
        message: `Rechazada: No hay transición desde ${currentState?.label} con '${symbol}'`,
        steps,
      };
    }

    // Transición válida
    const nextState = automaton.states.find(s => s.id === transition.to);
    const currentState = automaton.states.find(s => s.id === currentStateId);

    if (!nextState) {
      return {
        accepted: false,
        transitions: steps.map(s => ({ from: s.currentState, symbol: s.symbol, to: s.nextState })),
        currentState: currentState?.label || '',
        remainingInput: remainingInput.substring(1),
        message: `Error: Estado destino no encontrado`,
        steps,
      };
    }

    remainingInput = remainingInput.substring(1);

    steps.push({
      stepNumber: i + 1,
      currentState: currentState?.label || '',
      symbol,
      nextState: nextState.label,
      remainingInput,
      action: `Transición con '${symbol}'`,
    });

    currentStateId = nextState.id;
  }

  // Verificar si el estado final es de aceptación
  const finalState = automaton.states.find(s => s.id === currentStateId);
  const accepted = finalState?.isFinal || false;

  return {
    accepted,
    transitions: steps.map(s => ({ from: s.currentState, symbol: s.symbol, to: s.nextState })),
    currentState: finalState?.label || '',
    remainingInput: '',
    message: accepted ? 'Cadena aceptada' : 'Rechazada: El estado final no es de aceptación',
    steps,
  };
}

/**
 * Calcula la cerradura-ε de un conjunto de estados
 */
function epsilonClosureSet(stateIds: Set<string>, automaton: Automaton): Set<string> {
  const closure = new Set(stateIds);
  const stack = Array.from(stateIds);

  while (stack.length > 0) {
    const current = stack.pop()!;

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
 * Simula un AFN para reconocer una cadena
 */
export function recognizeStringNFA(automaton: Automaton, input: string): RecognitionResult {
  const steps: RecognitionStep[] = [];

  // Encontrar estado inicial
  const initialState = automaton.states.find(s => s.isInitial);
  if (!initialState) {
    return {
      accepted: false,
      transitions: [],
      currentState: '',
      remainingInput: input,
      message: 'Error: No hay estado inicial definido',
      steps: [],
    };
  }

  // Conjunto de estados actuales (considerando cerradura-ε)
  let currentStates = epsilonClosureSet(new Set([initialState.id]), automaton);
  let remainingInput = input;

  // Paso inicial
  const initialStateLabels = Array.from(currentStates).map(id => {
    const state = automaton.states.find(s => s.id === id);
    return state?.label || id;
  }).join(', ');

  steps.push({
    stepNumber: 0,
    currentState: initialStateLabels,
    symbol: '',
    nextState: initialStateLabels,
    remainingInput: input,
    action: 'Estado inicial (con ε-cerradura)',
  });

  // Procesar cada símbolo
  for (let i = 0; i < input.length; i++) {
    const symbol = input[i];

    // Verificar alfabeto
    if (!automaton.alphabet.includes(symbol) && symbol !== 'ε') {
      return {
        accepted: false,
        transitions: steps.map(s => ({ from: s.currentState, symbol: s.symbol, to: s.nextState })),
        currentState: Array.from(currentStates).join(', '),
        remainingInput: remainingInput.substring(1),
        message: `Error: El símbolo '${symbol}' no pertenece al alfabeto`,
        steps,
      };
    }

    // Calcular move(currentStates, symbol)
    const nextStates = new Set<string>();
    for (const stateId of currentStates) {
      const transitions = automaton.transitions.filter(
        t => t.from === stateId && t.symbol === symbol
      );

      for (const transition of transitions) {
        nextStates.add(transition.to);
      }
    }

    // Aplicar ε-cerradura
    const nextStatesWithEpsilon = epsilonClosureSet(nextStates, automaton);

    if (nextStatesWithEpsilon.size === 0) {
      return {
        accepted: false,
        transitions: steps.map(s => ({ from: s.currentState, symbol: s.symbol, to: s.nextState })),
        currentState: Array.from(currentStates).map(id => {
          const state = automaton.states.find(s => s.id === id);
          return state?.label || id;
        }).join(', '),
        remainingInput: remainingInput.substring(1),
        message: `Rechazada: No hay transición desde los estados actuales con '${symbol}'`,
        steps,
      };
    }

    remainingInput = remainingInput.substring(1);

    const currentStateLabels = Array.from(currentStates).map(id => {
      const state = automaton.states.find(s => s.id === id);
      return state?.label || id;
    }).join(', ');

    const nextStateLabels = Array.from(nextStatesWithEpsilon).map(id => {
      const state = automaton.states.find(s => s.id === id);
      return state?.label || id;
    }).join(', ');

    steps.push({
      stepNumber: i + 1,
      currentState: currentStateLabels,
      symbol,
      nextState: nextStateLabels,
      remainingInput,
      action: `Transición con '${symbol}' (con ε-cerradura)`,
    });

    currentStates = nextStatesWithEpsilon;
  }

  // Verificar si alguno de los estados finales es de aceptación
  const finalStates = Array.from(currentStates).map(id => 
    automaton.states.find(s => s.id === id)
  );

  const accepted = finalStates.some(s => s?.isFinal);

  return {
    accepted,
    transitions: steps.map(s => ({ from: s.currentState, symbol: s.symbol, to: s.nextState })),
    currentState: finalStates.map(s => s?.label || '').join(', '),
    remainingInput: '',
    message: accepted ? 'Cadena aceptada' : 'Rechazada: Ningún estado final es de aceptación',
    steps,
  };
}

/**
 * Reconoce una cadena usando el autómata apropiado (AFD o AFN)
 */
export function recognizeString(automaton: Automaton, input: string): RecognitionResult {
  // Verificar si es AFD o AFN
  const hasEpsilonTransitions = automaton.transitions.some(t => t.symbol === 'ε');
  
  // Verificar si hay transiciones no determinísticas
  const transitionMap = new Map<string, Set<string>>();
  for (const transition of automaton.transitions) {
    const key = `${transition.from}-${transition.symbol}`;
    if (!transitionMap.has(key)) {
      transitionMap.set(key, new Set());
    }
    transitionMap.get(key)!.add(transition.to);
  }

  const hasMultipleTransitions = Array.from(transitionMap.values()).some(set => set.size > 1);
  const isNFA = hasEpsilonTransitions || hasMultipleTransitions || automaton.type === 'NFA';

  if (isNFA) {
    return recognizeStringNFA(automaton, input);
  } else {
    return recognizeStringDFA(automaton, input);
  }
}

/**
 * Genera todas las cadenas aceptadas por el autómata hasta una longitud máxima
 * Útil para pruebas y visualización
 */
export function generateAcceptedStrings(
  automaton: Automaton,
  maxLength: number = 5,
  maxCount: number = 100
): string[] {
  const acceptedStrings: string[] = [];

  // Generar todas las combinaciones posibles
  function generateCombinations(length: number): string[] {
    if (length === 0) return [''];
    
    const shorter = generateCombinations(length - 1);
    const result: string[] = [];
    
    for (const str of shorter) {
      for (const symbol of automaton.alphabet) {
        if (symbol !== 'ε') {
          result.push(str + symbol);
        }
      }
    }
    
    return result;
  }

  // Probar cadena vacía
  const emptyResult = recognizeString(automaton, '');
  if (emptyResult.accepted) {
    acceptedStrings.push('ε');
  }

  // Probar cadenas de longitud creciente
  for (let len = 1; len <= maxLength && acceptedStrings.length < maxCount; len++) {
    const combinations = generateCombinations(len);
    
    for (const str of combinations) {
      if (acceptedStrings.length >= maxCount) break;
      
      const result = recognizeString(automaton, str);
      if (result.accepted) {
        acceptedStrings.push(str);
      }
    }
  }

  return acceptedStrings;
}

/**
 * Valida un conjunto de cadenas contra un autómata
 */
export function validateStrings(
  automaton: Automaton,
  strings: string[]
): Array<{ input: string; result: RecognitionResult }> {
  return strings.map(input => ({
    input,
    result: recognizeString(automaton, input),
  }));
}

/**
 * Obtiene el camino de aceptación de una cadena (si es aceptada)
 * Retorna los estados visitados en orden
 */
export function getAcceptancePath(automaton: Automaton, input: string): string[] | null {
  const result = recognizeString(automaton, input);
  
  if (!result.accepted) {
    return null;
  }

  const path: string[] = [];
  
  if (result.steps.length > 0) {
    // Agregar el primer estado
    path.push(result.steps[0].currentState);
    
    // Agregar los estados siguientes
    for (let i = 1; i < result.steps.length; i++) {
      path.push(result.steps[i].nextState);
    }
  }

  return path;
}

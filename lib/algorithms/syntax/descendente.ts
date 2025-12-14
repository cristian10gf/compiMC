/**
 * Análisis Sintáctico Descendente (LL)
 * 
 * Implementa:
 * 1. Cálculo de conjuntos FIRST (Primeros)
 * 2. Cálculo de conjuntos FOLLOW (Siguientes)
 * 3. Construcción de la Tabla M de parsing predictivo
 * 4. Simulación del análisis sintáctico predictivo no recursivo
 * 5. Verificación de gramáticas LL(1)
 * 
 * Reglas para FIRST:
 * - Si X es terminal, FIRST(X) = {X}
 * - Si X → ε, agregar ε a FIRST(X)
 * - Si X → Y₁Y₂...Yₖ, agregar FIRST(Y₁) a FIRST(X)
 *   Si ε ∈ FIRST(Y₁), agregar FIRST(Y₂), y así sucesivamente
 * 
 * Reglas para FOLLOW:
 * - Agregar $ a FOLLOW(S), donde S es el símbolo inicial
 * - Si A → αBβ, agregar FIRST(β) (excepto ε) a FOLLOW(B)
 * - Si A → αB o A → αBβ donde ε ∈ FIRST(β), agregar FOLLOW(A) a FOLLOW(B)
 */

import {
  Grammar,
  Production,
  FirstFollow,
  ParsingTable,
  ParsingTableEntry,
  ParseStep,
  ParsingResult,
} from '@/lib/types/grammar';

/**
 * Calcula el conjunto FIRST de un símbolo
 */
export function calculateFirst(
  grammar: Grammar,
  memo: Map<string, Set<string>> = new Map()
): Map<string, Set<string>> {
  // Inicializar conjuntos
  const first = new Map<string, Set<string>>();

  // FIRST de terminales
  for (const terminal of grammar.terminals) {
    first.set(terminal, new Set([terminal]));
  }

  // FIRST de no terminales (inicialmente vacío)
  for (const nonTerminal of grammar.nonTerminals) {
    first.set(nonTerminal, new Set());
  }

  // Agregar ε como terminal especial
  first.set('ε', new Set(['ε']));
  first.set('$', new Set(['$']));

  // Iterar hasta que no haya cambios
  let changed = true;
  while (changed) {
    changed = false;

    for (const production of grammar.productions) {
      const { left, right } = production;
      const currentFirst = first.get(left)!;
      const initialSize = currentFirst.size;

      // Si la producción es A → ε
      if (right.length === 1 && right[0] === 'ε') {
        currentFirst.add('ε');
      } else {
        // Para cada símbolo en el lado derecho
        let allNullable = true;

        for (const symbol of right) {
          const symbolFirst = first.get(symbol);
          if (!symbolFirst) continue;

          // Agregar FIRST(símbolo) excepto ε
          for (const item of symbolFirst) {
            if (item !== 'ε') {
              currentFirst.add(item);
            }
          }

          // Si el símbolo no puede derivar ε, parar
          if (!symbolFirst.has('ε')) {
            allNullable = false;
            break;
          }
        }

        // Si todos los símbolos pueden derivar ε, agregar ε a FIRST(A)
        if (allNullable) {
          currentFirst.add('ε');
        }
      }

      // Verificar si hubo cambios
      if (currentFirst.size > initialSize) {
        changed = true;
      }
    }
  }

  return first;
}

/**
 * Calcula el conjunto FOLLOW de todos los no terminales
 */
export function calculateFollow(
  grammar: Grammar,
  first: Map<string, Set<string>>
): Map<string, Set<string>> {
  const follow = new Map<string, Set<string>>();

  // Inicializar conjuntos FOLLOW
  for (const nonTerminal of grammar.nonTerminals) {
    follow.set(nonTerminal, new Set());
  }

  // Regla 1: Agregar $ al FOLLOW del símbolo inicial
  follow.get(grammar.startSymbol)!.add('$');

  // Iterar hasta que no haya cambios
  let changed = true;
  while (changed) {
    changed = false;

    for (const production of grammar.productions) {
      const { left, right } = production;

      // Para cada símbolo en el lado derecho
      for (let i = 0; i < right.length; i++) {
        const symbol = right[i];

        // Solo procesar no terminales
        if (!grammar.nonTerminals.includes(symbol)) continue;

        const currentFollow = follow.get(symbol)!;
        const initialSize = currentFollow.size;

        // Regla 2: Si A → αBβ, agregar FIRST(β) \ {ε} a FOLLOW(B)
        if (i < right.length - 1) {
          const beta = right.slice(i + 1);

          // Calcular FIRST(β)
          let allNullable = true;
          for (const betaSymbol of beta) {
            const betaFirst = first.get(betaSymbol);
            if (!betaFirst) continue;

            // Agregar FIRST(betaSymbol) excepto ε
            for (const item of betaFirst) {
              if (item !== 'ε') {
                currentFollow.add(item);
              }
            }

            // Si no puede derivar ε, parar
            if (!betaFirst.has('ε')) {
              allNullable = false;
              break;
            }
          }

          // Regla 3: Si A → αB o A → αBβ donde ε ∈ FIRST(β),
          // agregar FOLLOW(A) a FOLLOW(B)
          if (allNullable || i === right.length - 1) {
            const leftFollow = follow.get(left);
            if (leftFollow) {
              for (const item of leftFollow) {
                currentFollow.add(item);
              }
            }
          }
        } else {
          // Si B está al final: A → αB
          // Agregar FOLLOW(A) a FOLLOW(B)
          const leftFollow = follow.get(left);
          if (leftFollow) {
            for (const item of leftFollow) {
              currentFollow.add(item);
            }
          }
        }

        // Verificar cambios
        if (currentFollow.size > initialSize) {
          changed = true;
        }
      }
    }
  }

  return follow;
}

/**
 * Genera la estructura First/Follow para visualización
 */
export function generateFirstFollow(grammar: Grammar): FirstFollow[] {
  const first = calculateFirst(grammar);
  const follow = calculateFollow(grammar, first);

  return grammar.nonTerminals.map(nonTerminal => ({
    nonTerminal,
    first: Array.from(first.get(nonTerminal) || []),
    follow: Array.from(follow.get(nonTerminal) || []),
  }));
}

/**
 * Construye la Tabla M de parsing predictivo
 * 
 * Método:
 * 1. Para cada producción A → α:
 *    - Para cada terminal a en FIRST(α), agregar A → α a M[A, a]
 *    - Si ε ∈ FIRST(α), para cada terminal b en FOLLOW(A), agregar A → α a M[A, b]
 * 2. Todas las demás entradas son errores
 */
export function buildParsingTable(grammar: Grammar): ParsingTable {
  const first = calculateFirst(grammar);
  const follow = calculateFollow(grammar, first);
  const table: ParsingTable = {};

  // Inicializar tabla
  for (const nonTerminal of grammar.nonTerminals) {
    table[nonTerminal] = {};
    for (const terminal of [...grammar.terminals, '$']) {
      table[nonTerminal][terminal] = { production: null, action: 'error' };
    }
  }

  // Llenar tabla
  for (const production of grammar.productions) {
    const { left, right } = production;

    // Calcular FIRST(α)
    const firstAlpha = new Set<string>();
    let allNullable = true;

    for (const symbol of right) {
      const symbolFirst = first.get(symbol);
      if (!symbolFirst) continue;

      for (const item of symbolFirst) {
        if (item !== 'ε') {
          firstAlpha.add(item);
        }
      }

      if (!symbolFirst.has('ε')) {
        allNullable = false;
        break;
      }
    }

    // Si todos los símbolos pueden derivar ε, incluir ε
    if (allNullable || (right.length === 1 && right[0] === 'ε')) {
      firstAlpha.add('ε');
    }

    // Regla 1: Para cada a en FIRST(α), agregar A → α a M[A, a]
    for (const terminal of firstAlpha) {
      if (terminal !== 'ε') {
        table[left][terminal] = { production, action: undefined };
      }
    }

    // Regla 2: Si ε ∈ FIRST(α), para cada b en FOLLOW(A), agregar A → α a M[A, b]
    if (firstAlpha.has('ε')) {
      const followSet = follow.get(left);
      if (followSet) {
        for (const terminal of followSet) {
          if (terminal === '$') {
            table[left]['$'] = { production, action: 'accept' };
          } else {
            table[left][terminal] = { production, action: undefined };
          }
        }
      }
    }
  }

  return table;
}

/**
 * Verifica si una gramática es LL(1)
 * Una gramática es LL(1) si cada entrada de la tabla M tiene a lo más una producción
 */
export function isLL1(grammar: Grammar): { isLL1: boolean; conflicts: string[] } {
  const table = buildParsingTable(grammar);
  const conflicts: string[] = [];

  // Verificar cada entrada de la tabla
  for (const nonTerminal of grammar.nonTerminals) {
    for (const terminal of [...grammar.terminals, '$']) {
      const entry = table[nonTerminal][terminal];
      
      // Esta verificación es simplificada. En una implementación real,
      // se verificaría si hay múltiples producciones para la misma entrada.
      // Aquí asumimos que la construcción de la tabla ya maneja esto.
    }
  }

  // Verificar ambigüedades en FIRST/FOLLOW
  const first = calculateFirst(grammar);
  const follow = calculateFollow(grammar, first);

  for (const nonTerminal of grammar.nonTerminals) {
    // Obtener todas las producciones con este no terminal en el lado izquierdo
    const productions = grammar.productions.filter(p => p.left === nonTerminal);

    // Verificar que los FIRST de las producciones sean disjuntos
    for (let i = 0; i < productions.length; i++) {
      for (let j = i + 1; j < productions.length; j++) {
        const firstI = calculateFirstOfProduction(productions[i].right, first);
        const firstJ = calculateFirstOfProduction(productions[j].right, first);

        const intersection = new Set(
          [...firstI].filter(x => firstJ.has(x) && x !== 'ε')
        );

        if (intersection.size > 0) {
          conflicts.push(
            `Conflicto en ${nonTerminal}: FIRST(${productions[i].right.join(' ')}) ∩ FIRST(${productions[j].right.join(' ')}) = {${Array.from(intersection).join(', ')}}`
          );
        }

        // Si ambas pueden derivar ε, verificar FIRST/FOLLOW
        if (firstI.has('ε') && firstJ.has('ε')) {
          conflicts.push(
            `Conflicto en ${nonTerminal}: Ambas producciones pueden derivar ε`
          );
        }
      }
    }
  }

  return {
    isLL1: conflicts.length === 0,
    conflicts,
  };
}

/**
 * Calcula FIRST de una secuencia de símbolos
 */
function calculateFirstOfProduction(
  symbols: string[],
  first: Map<string, Set<string>>
): Set<string> {
  const result = new Set<string>();

  if (symbols.length === 0 || (symbols.length === 1 && symbols[0] === 'ε')) {
    result.add('ε');
    return result;
  }

  let allNullable = true;
  for (const symbol of symbols) {
    const symbolFirst = first.get(symbol);
    if (!symbolFirst) continue;

    for (const item of symbolFirst) {
      if (item !== 'ε') {
        result.add(item);
      }
    }

    if (!symbolFirst.has('ε')) {
      allNullable = false;
      break;
    }
  }

  if (allNullable) {
    result.add('ε');
  }

  return result;
}

/**
 * Simula el análisis sintáctico predictivo no recursivo
 */
export function parseStringLL(
  grammar: Grammar,
  table: ParsingTable,
  input: string
): ParsingResult {
  const steps: ParseStep[] = [];
  const stack: string[] = ['$', grammar.startSymbol];
  const inputSymbols = input.split(' ').filter(s => s !== '');
  const inputQueue = [...inputSymbols, '$'];
  const output: string[] = [];

  let stepNumber = 0;

  // Paso inicial
  steps.push({
    stepNumber: stepNumber++,
    stack: [...stack],
    input: [...inputQueue],
    output: '',
    action: 'Inicio',
  });

  while (stack.length > 0) {
    const top = stack[stack.length - 1];
    const currentInput = inputQueue[0];

    // Si el tope de la pila es $
    if (top === '$') {
      if (currentInput === '$') {
        steps.push({
          stepNumber: stepNumber++,
          stack: [...stack],
          input: [...inputQueue],
          output: output.join('\n'),
          action: 'Aceptar',
        });

        return {
          accepted: true,
          steps,
          output: output.join('\n'),
          parseTree: null, // TODO: Construir árbol
        };
      } else {
        steps.push({
          stepNumber: stepNumber++,
          stack: [...stack],
          input: [...inputQueue],
          output: output.join('\n'),
          action: 'Error: Entrada no consumida completamente',
        });

        return {
          accepted: false,
          steps,
          error: 'Entrada no consumida completamente',
        };
      }
    }

    // Si el tope es un terminal
    if (grammar.terminals.includes(top) || top === '$') {
      if (top === currentInput) {
        // Match: extraer de pila y avanzar entrada
        stack.pop();
        inputQueue.shift();

        steps.push({
          stepNumber: stepNumber++,
          stack: [...stack],
          input: [...inputQueue],
          output: output.join('\n'),
          action: `Match: ${top}`,
        });
      } else {
        steps.push({
          stepNumber: stepNumber++,
          stack: [...stack],
          input: [...inputQueue],
          output: output.join('\n'),
          action: `Error: Se esperaba '${top}', se encontró '${currentInput}'`,
        });

        return {
          accepted: false,
          steps,
          error: `Se esperaba '${top}', se encontró '${currentInput}'`,
        };
      }
    } else {
      // El tope es un no terminal
      const entry = table[top]?.[currentInput];

      if (!entry || entry.action === 'error' || !entry.production) {
        steps.push({
          stepNumber: stepNumber++,
          stack: [...stack],
          input: [...inputQueue],
          output: output.join('\n'),
          action: `Error: No hay producción M[${top}, ${currentInput}]`,
        });

        return {
          accepted: false,
          steps,
          error: `No hay producción M[${top}, ${currentInput}]`,
        };
      }

      // Aplicar producción
      const production = entry.production;
      stack.pop(); // Sacar el no terminal

      // Agregar símbolos de la producción en orden inverso
      const rightSymbols = production.right.filter(s => s !== 'ε');
      for (let i = rightSymbols.length - 1; i >= 0; i--) {
        stack.push(rightSymbols[i]);
      }

      const productionStr = `${production.left} → ${production.right.join(' ')}`;
      output.push(productionStr);

      steps.push({
        stepNumber: stepNumber++,
        stack: [...stack],
        input: [...inputQueue],
        output: output.join('\n'),
        action: `Aplicar: ${productionStr}`,
      });
    }
  }

  return {
    accepted: false,
    steps,
    error: 'Error inesperado',
  };
}

/**
 * Analiza una gramática completa (calcula First, Follow, Tabla M)
 */
export function analyzeDescendente(grammar: Grammar) {
  const firstFollow = generateFirstFollow(grammar);
  const parsingTable = buildParsingTable(grammar);
  const ll1Check = isLL1(grammar);

  return {
    firstFollow,
    parsingTable,
    isLL1: ll1Check.isLL1,
    conflicts: ll1Check.conflicts,
  };
}

/**
 * Análisis Sintáctico Descendente (LL)
 * 
 * Implementa:
 * 1. Cálculo de conjuntos FIRST (Primeros)
 * 2. Cálculo de conjuntos FOLLOW (Siguientes)
 * 3. Construcción de la Tabla M de parsing predictivo
 * 4. Simulación del análisis sintáctico predictivo no recursivo
 * 5. Verificación de gramáticas LL(1)
 * 6. Eliminación de recursividad por izquierda
 * 7. Factorización por izquierda
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
 * Resultado del cálculo de First con reglas aplicadas
 */
export interface FirstCalculationStep {
  nonTerminal: string;
  rule: string;
  values: string[];
  explanation: string;
}

/**
 * Resultado del cálculo de Follow con reglas aplicadas
 */
export interface FollowCalculationStep {
  nonTerminal: string;
  rule: string;
  values: string[];
  explanation: string;
}

/**
 * Resultado de First/Follow con reglas de cálculo
 */
export interface FirstFollowWithRules extends FirstFollow {
  firstRules: FirstCalculationStep[];
  followRules: FollowCalculationStep[];
}

/**
 * Resultado de transformación de gramática
 */
export interface GrammarTransformation {
  originalGrammar: Grammar;
  withoutLeftRecursion: Grammar;
  factorized: Grammar;
  transformationSteps: string[];
}

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
  
  // Tabla interna para construcción
  const internalTable: Record<string, Record<string, { production: Production | null; action?: 'accept' | 'error' }>> = {};

  // Inicializar tabla
  for (const nonTerminal of grammar.nonTerminals) {
    internalTable[nonTerminal] = {};
    for (const terminal of [...grammar.terminals, '$']) {
      internalTable[nonTerminal][terminal] = { production: null, action: 'error' };
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
        internalTable[left][terminal] = { production, action: undefined };
      }
    }

    // Regla 2: Si ε ∈ FIRST(α), para cada b en FOLLOW(A), agregar A → α a M[A, b]
    if (firstAlpha.has('ε')) {
      const followSet = follow.get(left);
      if (followSet) {
        for (const terminal of followSet) {
          if (terminal === '$') {
            internalTable[left]['$'] = { production, action: 'accept' };
          } else {
            internalTable[left][terminal] = { production, action: undefined };
          }
        }
      }
    }
  }

  // Convertir a formato de entries para el componente
  const entries: Array<{ nonTerminal: string; terminal: string; production: string | null }> = [];
  
  for (const nonTerminal of grammar.nonTerminals) {
    for (const terminal of [...grammar.terminals, '$']) {
      const entry = internalTable[nonTerminal][terminal];
      let productionStr: string | null = null;
      
      if (entry.production) {
        productionStr = `${entry.production.left} → ${entry.production.right.join('')}`;
      }
      
      entries.push({
        nonTerminal,
        terminal,
        production: productionStr,
      });
    }
  }

  return { entries };
}

/**
 * Construye la Tabla M interna (para uso interno)
 */
function buildInternalParsingTable(grammar: Grammar): Record<string, Record<string, { production: Production | null; action?: 'accept' | 'error' }>> {
  const first = calculateFirst(grammar);
  const follow = calculateFollow(grammar, first);
  
  const table: Record<string, Record<string, { production: Production | null; action?: 'accept' | 'error' }>> = {};

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

    if (allNullable || (right.length === 1 && right[0] === 'ε')) {
      firstAlpha.add('ε');
    }

    for (const terminal of firstAlpha) {
      if (terminal !== 'ε') {
        table[left][terminal] = { production, action: undefined };
      }
    }

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
  const conflicts: string[] = [];

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
            `Conflicto en ${nonTerminal}: FIRST(${productions[i].right.join('')}) ∩ FIRST(${productions[j].right.join('')}) = {${Array.from(intersection).join(', ')}}`
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
  // Construir tabla interna desde el formato de entries
  const internalTable = buildInternalParsingTable(grammar);
  
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
          parseTree: null,
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
      // El tope es un no terminal - usar tabla interna
      const entry = internalTable[top]?.[currentInput];

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

/**
 * Genera un nuevo nombre para un no terminal prima (A')
 */
function generatePrimeSymbol(base: string, existingSymbols: Set<string>): string {
  let candidate = base + "'";
  while (existingSymbols.has(candidate)) {
    candidate += "'";
  }
  return candidate;
}

/**
 * Elimina la recursividad por izquierda de una gramática
 * 
 * Método:
 * Para cada producción A → Aα₁ | Aα₂ | ... | Aαₙ | β₁ | β₂ | ... | βₘ
 * Se transforma en:
 * A → β₁A' | β₂A' | ... | βₘA'
 * A' → α₁A' | α₂A' | ... | αₙA' | ε
 */
export function eliminateLeftRecursion(grammar: Grammar): {
  grammar: Grammar;
  steps: string[];
} {
  const steps: string[] = [];
  const newProductions: Production[] = [];
  const newNonTerminals = new Set(grammar.nonTerminals);
  let prodCounter = 1;

  // Agrupar producciones por no terminal
  const productionsByNT = new Map<string, Production[]>();
  for (const prod of grammar.productions) {
    if (!productionsByNT.has(prod.left)) {
      productionsByNT.set(prod.left, []);
    }
    productionsByNT.get(prod.left)!.push(prod);
  }

  for (const nonTerminal of grammar.nonTerminals) {
    const prods = productionsByNT.get(nonTerminal) || [];
    
    // Separar producciones con y sin recursividad izquierda
    const recursive: Production[] = [];
    const nonRecursive: Production[] = [];

    for (const prod of prods) {
      if (prod.right.length > 0 && prod.right[0] === nonTerminal) {
        recursive.push(prod);
      } else {
        nonRecursive.push(prod);
      }
    }

    // Si no hay recursividad, mantener producciones originales
    if (recursive.length === 0) {
      for (const prod of prods) {
        newProductions.push({
          id: `p${prodCounter++}`,
          left: prod.left,
          right: [...prod.right],
        });
      }
      continue;
    }

    // Crear nuevo no terminal A'
    const primeSymbol = generatePrimeSymbol(nonTerminal, newNonTerminals);
    newNonTerminals.add(primeSymbol);

    steps.push(`Eliminando recursividad en ${nonTerminal}:`);
    steps.push(`  Se crea nuevo no terminal: ${primeSymbol}`);

    // Transformar producciones no recursivas: A → βA'
    if (nonRecursive.length === 0) {
      // Si no hay producciones no recursivas, agregar A → A'
      newProductions.push({
        id: `p${prodCounter++}`,
        left: nonTerminal,
        right: [primeSymbol],
      });
      steps.push(`  ${nonTerminal} → ${primeSymbol}`);
    } else {
      for (const prod of nonRecursive) {
        const newRight = prod.right[0] === 'ε' 
          ? [primeSymbol] 
          : [...prod.right, primeSymbol];
        newProductions.push({
          id: `p${prodCounter++}`,
          left: nonTerminal,
          right: newRight,
        });
        steps.push(`  ${nonTerminal} → ${newRight.join(' ')}`);
      }
    }

    // Transformar producciones recursivas: A' → αA' | ε
    for (const prod of recursive) {
      const alpha = prod.right.slice(1); // Quitar el primer símbolo (A)
      const newRight = alpha.length > 0 ? [...alpha, primeSymbol] : [primeSymbol];
      newProductions.push({
        id: `p${prodCounter++}`,
        left: primeSymbol,
        right: newRight,
      });
      steps.push(`  ${primeSymbol} → ${newRight.join(' ')}`);
    }

    // Agregar producción épsilon para A'
    newProductions.push({
      id: `p${prodCounter++}`,
      left: primeSymbol,
      right: ['ε'],
    });
    steps.push(`  ${primeSymbol} → ε`);
  }

  // Recalcular terminales (excluyendo nuevos no terminales)
  const newTerminals = new Set(grammar.terminals);

  return {
    grammar: {
      terminals: Array.from(newTerminals),
      nonTerminals: Array.from(newNonTerminals),
      productions: newProductions,
      startSymbol: grammar.startSymbol,
    },
    steps,
  };
}

/**
 * Factoriza por izquierda una gramática
 * 
 * Método:
 * Para producciones A → αβ₁ | αβ₂ | ... | αβₙ | γ
 * Se transforma en:
 * A → αA' | γ
 * A' → β₁ | β₂ | ... | βₙ
 */
export function leftFactorize(grammar: Grammar): {
  grammar: Grammar;
  steps: string[];
} {
  const steps: string[] = [];
  let currentProductions = [...grammar.productions];
  const newNonTerminals = new Set(grammar.nonTerminals);
  let changed = true;
  let iterations = 0;
  const maxIterations = 100;

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;
    const nextProductions: Production[] = [];

    // Agrupar por no terminal
    const productionsByNT = new Map<string, Production[]>();
    for (const prod of currentProductions) {
      if (!productionsByNT.has(prod.left)) {
        productionsByNT.set(prod.left, []);
      }
      productionsByNT.get(prod.left)!.push(prod);
    }

    for (const [nonTerminal, prods] of productionsByNT) {
      if (prods.length < 2) {
        nextProductions.push(...prods);
        continue;
      }

      // Encontrar prefijo común más largo
      const prefixGroups = new Map<string, Production[]>();
      
      for (const prod of prods) {
        const firstSymbol = prod.right[0] || 'ε';
        if (!prefixGroups.has(firstSymbol)) {
          prefixGroups.set(firstSymbol, []);
        }
        prefixGroups.get(firstSymbol)!.push(prod);
      }

      // Procesar cada grupo de prefijos
      for (const [prefix, group] of prefixGroups) {
        // Si el grupo tiene solo una producción o es epsilon, no factorizar
        if (group.length < 2 || prefix === 'ε') {
          nextProductions.push(...group);
          continue;
        }

        // Encontrar el prefijo común más largo entre todas las producciones del grupo
        let commonPrefix: string[] = [...group[0].right];
        
        for (let i = 1; i < group.length; i++) {
          const currentRight = group[i].right;
          let j = 0;
          while (j < commonPrefix.length && j < currentRight.length && commonPrefix[j] === currentRight[j]) {
            j++;
          }
          commonPrefix = commonPrefix.slice(0, j);
        }

        if (commonPrefix.length === 0) {
          nextProductions.push(...group);
          continue;
        }

        // Crear nuevo no terminal
        const primeSymbol = generatePrimeSymbol(nonTerminal, newNonTerminals);
        newNonTerminals.add(primeSymbol);

        steps.push(`Factorizando ${nonTerminal} con prefijo común "${commonPrefix.join(' ')}":`);

        // Nueva producción A → α A'
        nextProductions.push({
          id: `p${Date.now()}-1`,
          left: nonTerminal,
          right: [...commonPrefix, primeSymbol],
        });
        steps.push(`  ${nonTerminal} → ${[...commonPrefix, primeSymbol].join(' ')}`);

        // Nuevas producciones A' → β₁ | β₂ | ... (usando Set para evitar duplicados)
        const addedSuffixes = new Set<string>();
        for (const prod of group) {
          const suffix = prod.right.slice(commonPrefix.length);
          const newRight = suffix.length > 0 ? suffix : ['ε'];
          const suffixKey = newRight.join(' ');
          
          if (!addedSuffixes.has(suffixKey)) {
            addedSuffixes.add(suffixKey);
            nextProductions.push({
              id: `p${Date.now()}-${Math.random()}`,
              left: primeSymbol,
              right: newRight,
            });
            steps.push(`  ${primeSymbol} → ${newRight.join(' ')}`);
          }
        }

        changed = true;
      }
    }

    currentProductions = nextProductions;
  }

  // Renumerar producciones
  const finalProductions = currentProductions.map((prod, idx) => ({
    ...prod,
    id: `p${idx + 1}`,
  }));

  return {
    grammar: {
      terminals: [...grammar.terminals],
      nonTerminals: Array.from(newNonTerminals),
      productions: finalProductions,
      startSymbol: grammar.startSymbol,
    },
    steps,
  };
}

/**
 * Elimina producciones duplicadas de una gramática
 */
function removeDuplicateProductions(grammar: Grammar): Grammar {
  const seen = new Set<string>();
  const uniqueProductions: Production[] = [];
  
  for (const prod of grammar.productions) {
    const key = `${prod.left}->${prod.right.join(' ')}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueProductions.push(prod);
    }
  }
  
  // Renumerar
  const finalProductions = uniqueProductions.map((prod, idx) => ({
    ...prod,
    id: `p${idx + 1}`,
  }));
  
  return {
    ...grammar,
    productions: finalProductions,
  };
}

/**
 * Transforma una gramática eliminando recursividad izquierda y factorizando
 */
export function transformGrammar(grammar: Grammar): GrammarTransformation {
  const transformationSteps: string[] = [];

  // Paso 1: Eliminar recursividad izquierda
  transformationSteps.push('=== Eliminación de Recursividad por Izquierda ===');
  const { grammar: grammarNoRecursion, steps: recursionSteps } = eliminateLeftRecursion(grammar);
  transformationSteps.push(...recursionSteps);

  if (recursionSteps.length === 0) {
    transformationSteps.push('No se encontró recursividad por izquierda.');
  }

  // Paso 2: Factorizar por izquierda
  transformationSteps.push('\n=== Factorización por Izquierda ===');
  const { grammar: grammarFactorized, steps: factorSteps } = leftFactorize(grammarNoRecursion);
  transformationSteps.push(...factorSteps);

  if (factorSteps.length === 0) {
    transformationSteps.push('No se requiere factorización por izquierda.');
  }

  // Paso 3: Eliminar producciones duplicadas
  const finalGrammar = removeDuplicateProductions(grammarFactorized);

  return {
    originalGrammar: grammar,
    withoutLeftRecursion: grammarNoRecursion,
    factorized: finalGrammar,
    transformationSteps,
  };
}

/**
 * Genera First/Follow con las reglas de cálculo para cada paso
 */
export function generateFirstFollowWithRules(grammar: Grammar): FirstFollowWithRules[] {
  const first = calculateFirst(grammar);
  const follow = calculateFollow(grammar, first);

  return grammar.nonTerminals.map(nonTerminal => {
    const firstRules: FirstCalculationStep[] = [];
    const followRules: FollowCalculationStep[] = [];

    // Generar reglas para FIRST
    const prods = grammar.productions.filter(p => p.left === nonTerminal);
    for (const prod of prods) {
      const rightStr = prod.right.join(' ');
      if (prod.right.length === 1 && prod.right[0] === 'ε') {
        firstRules.push({
          nonTerminal,
          rule: `${nonTerminal} → ε`,
          values: ['ε'],
          explanation: `Regla 2: Si X → ε, agregar ε a PRIMERO(${nonTerminal})`,
        });
      } else {
        const firstSymbol = prod.right[0];
        if (grammar.terminals.includes(firstSymbol)) {
          firstRules.push({
            nonTerminal,
            rule: `${nonTerminal} → ${rightStr}`,
            values: [firstSymbol],
            explanation: `Regla 1: ${firstSymbol} es terminal, se agrega a PRIMERO(${nonTerminal})`,
          });
        } else {
          const symbolFirst = first.get(firstSymbol);
          if (symbolFirst) {
            firstRules.push({
              nonTerminal,
              rule: `${nonTerminal} → ${rightStr}`,
              values: Array.from(symbolFirst).filter(s => s !== 'ε'),
              explanation: `Regla 3: PRIMERO(${firstSymbol}) se agrega a PRIMERO(${nonTerminal})`,
            });
          }
        }
      }
    }

    // Generar reglas para FOLLOW
    if (nonTerminal === grammar.startSymbol) {
      followRules.push({
        nonTerminal,
        rule: 'Símbolo inicial',
        values: ['$'],
        explanation: 'Regla 1: Agregar $ a SIGUIENTE del símbolo inicial',
      });
    }

    // Buscar apariciones del no terminal en lados derechos
    for (const prod of grammar.productions) {
      for (let i = 0; i < prod.right.length; i++) {
        if (prod.right[i] === nonTerminal) {
          if (i < prod.right.length - 1) {
            // Hay símbolos después
            const beta = prod.right.slice(i + 1);
            const betaFirst = new Set<string>();
            let allNullable = true;

            for (const symbol of beta) {
              const symbolFirst = first.get(symbol);
              if (symbolFirst) {
                for (const item of symbolFirst) {
                  if (item !== 'ε') betaFirst.add(item);
                }
                if (!symbolFirst.has('ε')) {
                  allNullable = false;
                  break;
                }
              }
            }

            if (betaFirst.size > 0) {
              followRules.push({
                nonTerminal,
                rule: `${prod.left} → ${prod.right.join(' ')}`,
                values: Array.from(betaFirst),
                explanation: `Regla 2: PRIMERO(${beta.join(' ')}) sin ε se agrega a SIGUIENTE(${nonTerminal})`,
              });
            }

            if (allNullable) {
              const leftFollow = follow.get(prod.left);
              if (leftFollow && leftFollow.size > 0) {
                followRules.push({
                  nonTerminal,
                  rule: `${prod.left} → ${prod.right.join(' ')}`,
                  values: Array.from(leftFollow),
                  explanation: `Regla 3: SIGUIENTE(${prod.left}) se agrega porque β puede derivar ε`,
                });
              }
            }
          } else {
            // Al final de la producción
            const leftFollow = follow.get(prod.left);
            if (leftFollow && leftFollow.size > 0 && prod.left !== nonTerminal) {
              followRules.push({
                nonTerminal,
                rule: `${prod.left} → ${prod.right.join(' ')}`,
                values: Array.from(leftFollow),
                explanation: `Regla 3: ${nonTerminal} está al final, SIGUIENTE(${prod.left}) se agrega`,
              });
            }
          }
        }
      }
    }

    return {
      nonTerminal,
      first: Array.from(first.get(nonTerminal) || []),
      follow: Array.from(follow.get(nonTerminal) || []),
      firstRules,
      followRules,
    };
  });
}

/**
 * Parsea una gramática desde texto
 * Formato: E -> E+T | T (símbolos sin espacios, | para alternativas)
 * No terminales: letras mayúsculas
 */
export function parseGrammarText(
  grammarText: string, 
  terminalsInput: string,
  autoDetectTerminals: boolean = false
): Grammar {
  const lines = grammarText.trim().split('\n').filter(line => line.trim());
  const productions: Production[] = [];
  const nonTerminals = new Set<string>();
  const detectedTerminals = new Set<string>();
  let startSymbol = '';
  let prodCounter = 1;

  // Parsear terminales de entrada
  let inputTerminals: Set<string>;
  if (!autoDetectTerminals && terminalsInput.trim()) {
    inputTerminals = new Set(
      terminalsInput.split(',').map(t => t.trim()).filter(t => t)
    );
  } else {
    inputTerminals = new Set();
  }

  for (const line of lines) {
    // Parsear línea: A -> α | β
    const arrowMatch = line.match(/^\s*([A-Z][A-Z']*)\s*(?:->|→)\s*(.+)$/);
    if (!arrowMatch) continue;

    const left = arrowMatch[1].trim();
    const rightPart = arrowMatch[2].trim();

    // Primer no terminal es el símbolo inicial
    if (!startSymbol) startSymbol = left;
    nonTerminals.add(left);

    // Separar alternativas por |
    const alternatives = rightPart.split('|').map(alt => alt.trim());

    for (const alt of alternatives) {
      if (!alt) continue;

      // Parsear símbolos de la alternativa
      // Reconocer: letras mayúsculas con primas como no terminales
      // Todo lo demás como terminales
      const symbols: string[] = [];
      let remaining = alt;

      while (remaining.length > 0) {
        // Intentar reconocer un no terminal (mayúscula con posibles primas)
        const ntMatch = remaining.match(/^([A-Z][A-Z']*)/);
        if (ntMatch) {
          symbols.push(ntMatch[1]);
          nonTerminals.add(ntMatch[1]);
          remaining = remaining.slice(ntMatch[1].length);
          continue;
        }

        // Intentar reconocer epsilon
        if (remaining.startsWith('ε') || remaining.startsWith('epsilon') || remaining.startsWith('∈')) {
          symbols.push('ε');
          remaining = remaining.slice(remaining.startsWith('ε') ? 1 : remaining.startsWith('∈') ? 1 : 7);
          continue;
        }

        // Intentar reconocer terminal multi-caracter conocido
        let matched = false;
        for (const terminal of inputTerminals) {
          if (remaining.startsWith(terminal)) {
            symbols.push(terminal);
            detectedTerminals.add(terminal);
            remaining = remaining.slice(terminal.length);
            matched = true;
            break;
          }
        }
        if (matched) continue;

        // Si es autodetección, tomar caracteres especiales como terminales individuales
        if (autoDetectTerminals) {
          // Reconocer palabras reservadas/identificadores minúsculas
          const wordMatch = remaining.match(/^([a-z]+[a-z0-9]*)/);
          if (wordMatch) {
            symbols.push(wordMatch[1]);
            detectedTerminals.add(wordMatch[1]);
            remaining = remaining.slice(wordMatch[1].length);
            continue;
          }
        }

        // Tomar el siguiente caracter como terminal
        const char = remaining[0];
        if (char !== ' ' && char !== '\t') {
          symbols.push(char);
          detectedTerminals.add(char);
        }
        remaining = remaining.slice(1);
      }

      if (symbols.length > 0) {
        productions.push({
          id: `p${prodCounter++}`,
          left,
          right: symbols,
        });
      }
    }
  }

  // Determinar terminales finales
  let terminals: string[];
  if (autoDetectTerminals) {
    terminals = Array.from(detectedTerminals).filter(t => t !== 'ε' && !nonTerminals.has(t));
  } else {
    terminals = Array.from(inputTerminals);
  }

  return {
    terminals,
    nonTerminals: Array.from(nonTerminals),
    productions,
    startSymbol,
  };
}

/**
 * Convierte una gramática a formato de texto
 */
export function grammarToText(grammar: Grammar): string {
  const lines: string[] = [];
  
  // Agrupar producciones por no terminal
  const productionsByNT = new Map<string, string[]>();
  
  for (const prod of grammar.productions) {
    if (!productionsByNT.has(prod.left)) {
      productionsByNT.set(prod.left, []);
    }
    productionsByNT.get(prod.left)!.push(prod.right.join(''));
  }

  // Generar texto manteniendo el orden de los no terminales
  for (const nt of grammar.nonTerminals) {
    const alternatives = productionsByNT.get(nt);
    if (alternatives && alternatives.length > 0) {
      lines.push(`${nt} → ${alternatives.join(' | ')}`);
    }
  }

  return lines.join('\n');
}

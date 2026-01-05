/**
 * Análisis Sintáctico Ascendente (LR) - Precedencia de Operadores
 * 
 * Implementa análisis sintáctico ascendente por precedencia de operadores con dos modos:
 * 1. Modo Manual: El usuario construye paso a paso la tabla de precedencia mediante derivaciones
 * 2. Modo Automático: El sistema genera derivaciones automáticas cubriendo todas las producciones
 * 
 * El análisis se basa en:
 * - Generar derivaciones desde el símbolo inicial
 * - En cada paso de derivación, analizar el "mango" (handle) y los terminales que lo rodean
 * - Las relaciones se establecen según: $ <· primer_terminal, último_terminal ·> $, 
 *   y entre terminales adyacentes al mango
 * 
 * Relaciones de precedencia:
 * - a <· b: "a cede la precedencia a b" (a tiene menor precedencia)
 * - a ≐ b: "a tiene la misma precedencia que b"
 * - a ·> b: "a tiene más precedencia que b"
 * 
 * Características de gramáticas de operadores:
 * - Ningún lado derecho es ε
 * - No hay dos no terminales adyacentes
 */

import {
  Grammar,
  Production,
  PrecedenceRelation,
  PrecedenceStep,
  PrecedenceTable,
  ParseStep,
  ParsingResult,
  GotoTable,
  DerivationStep,
} from '@/lib/types/grammar';

/**
 * Verifica si una gramática es de operadores
 */
export function isOperatorGrammar(grammar: Grammar): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const production of grammar.productions) {
    // Verificar que no sea ε
    if (production.right.length === 1 && production.right[0] === 'ε') {
      errors.push(`Producción ${production.left} → ε no permitida en gramática de operadores`);
    }

    // Verificar que no haya dos no terminales adyacentes
    for (let i = 0; i < production.right.length - 1; i++) {
      const current = production.right[i];
      const next = production.right[i + 1];

      if (grammar.nonTerminals.includes(current) && grammar.nonTerminals.includes(next)) {
        errors.push(
          `Producción ${production.left} → ${production.right.join(' ')}: No terminales adyacentes ${current} y ${next}`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Extrae todos los símbolos (terminales) de una gramática para la tabla de precedencia
 * Los símbolos se ordenan según su aparición en las producciones, con $ al final.
 */
function extractSymbolsForPrecedence(grammar: Grammar): string[] {
  const orderedTerminals: string[] = [];
  const seen = new Set<string>();
  
  // Recorrer producciones en orden y agregar terminales según aparecen
  for (const production of grammar.productions) {
    for (const symbol of production.right) {
      if (grammar.terminals.includes(symbol) && !seen.has(symbol) && symbol !== 'ε') {
        orderedTerminals.push(symbol);
        seen.add(symbol);
      }
    }
  }
  
  // Agregar terminales que no aparecieron en ninguna producción
  for (const terminal of grammar.terminals) {
    if (!seen.has(terminal) && terminal !== 'ε') {
      orderedTerminals.push(terminal);
      seen.add(terminal);
    }
  }
  
  // Agregar $ al final
  orderedTerminals.push('$');
  
  return orderedTerminals;
}

/**
 * Calcula las relaciones de precedencia paso a paso (Modo Manual)
 * Analiza cada producción y genera las relaciones según las reglas
 */
export function calculatePrecedenceManual(grammar: Grammar): PrecedenceStep[] {
  const steps: PrecedenceStep[] = [];
  let stepNumber = 1;

  // Verificar que sea gramática de operadores
  const validation = isOperatorGrammar(grammar);
  if (!validation.valid) {
    throw new Error(`Gramática inválida: ${validation.errors.join(', ')}`);
  }

  // Procesar cada producción
  for (const production of grammar.productions) {
    const relations: PrecedenceRelation[] = [];
    const { right } = production;

    // Analizar cada par de símbolos adyacentes
    for (let i = 0; i < right.length - 1; i++) {
      const current = right[i];
      const next = right[i + 1];

      // Regla 1: Si hay "terminal1 terminal2" consecutivos: terminal1 ≐ terminal2
      if (grammar.terminals.includes(current) && grammar.terminals.includes(next)) {
        relations.push({
          symbol1: current,
          symbol2: next,
          relation: '=',
        });
      }

      // Regla 2: Si hay "terminal NoTerminal": terminal <· primero(NoTerminal)
      if (grammar.terminals.includes(current) && grammar.nonTerminals.includes(next)) {
        // El siguiente símbolo después del no terminal (si existe)
        if (i + 2 < right.length) {
          const afterNonTerminal = right[i + 2];
          if (grammar.terminals.includes(afterNonTerminal)) {
            relations.push({
              symbol1: current,
              symbol2: afterNonTerminal,
              relation: '<',
            });
          }
        }
      }

      // Regla 3: Si hay "NoTerminal terminal": último(NoTerminal) ·> terminal
      if (grammar.nonTerminals.includes(current) && grammar.terminals.includes(next)) {
        // El símbolo antes del no terminal (si existe)
        if (i > 0) {
          const beforeNonTerminal = right[i - 1];
          if (grammar.terminals.includes(beforeNonTerminal)) {
            relations.push({
              symbol1: beforeNonTerminal,
              symbol2: next,
              relation: '>',
            });
          }
        }
      }
    }

    // Relaciones con $ (inicio y fin)
    const firstSymbol = right[0];
    const lastSymbol = right[right.length - 1];

    if (grammar.terminals.includes(firstSymbol)) {
      relations.push({
        symbol1: '$',
        symbol2: firstSymbol,
        relation: '<',
      });
    }

    if (grammar.terminals.includes(lastSymbol)) {
      relations.push({
        symbol1: lastSymbol,
        symbol2: '$',
        relation: '>',
      });
    }

    // Si hay relaciones, agregar paso
    if (relations.length > 0) {
      steps.push({
        stepNumber: stepNumber++,
        production,
        relations,
        explanation: `Analizando ${production.left} → ${right.join(' ')}`,
      });
    }
  }

  return steps;
}

/**
 * Construye la tabla de precedencia desde los pasos manuales
 */
export function buildPrecedenceTableFromSteps(
  grammar: Grammar,
  steps: PrecedenceStep[]
): PrecedenceTable {
  const symbols = extractSymbolsForPrecedence(grammar);
  const relations = new Map<string, Map<string, '<' | '>' | '=' | '·'>>();

  // Inicializar tabla con '·' (sin relación)
  for (const symbol1 of symbols) {
    relations.set(symbol1, new Map());
    for (const symbol2 of symbols) {
      relations.get(symbol1)!.set(symbol2, '·');
    }
  }

  // Llenar con las relaciones de los pasos
  for (const step of steps) {
    for (const relation of step.relations) {
      if (!relations.has(relation.symbol1)) {
        relations.set(relation.symbol1, new Map());
      }
      relations.get(relation.symbol1)!.set(relation.symbol2, relation.relation);
    }
  }

  return {
    symbols,
    relations,
  };
}

/**
 * Calcula la tabla de precedencia automáticamente (Modo Automático)
 */
export function calculatePrecedenceAutomatic(grammar: Grammar): PrecedenceTable {
  // Calcular tabla de precedencia usando análisis de FIRST/LAST y jerarquía de operadores
  return calculatePrecedenceUsingFirstLast(grammar);
}

/**
 * Encuentra el mango de una cadena usando la tabla de precedencia
 * 
 * Algoritmo (según el libro):
 * Cuando detectamos a·>b (donde a es terminal del tope, b es entrada):
 * 1. Empezar desde el tope de la pila
 * 2. Retroceder extrayendo símbolos hasta encontrar un terminal prev tal que prev<·curr
 * 3. El mango incluye todos los símbolos desde donde encontramos <· hasta el tope
 * 
 * Este método se llama SOLO cuando ya sabimos que a·>b
 */
export function findHandle(
  stack: string[],
  precedenceTable: PrecedenceTable
): { handle: string[]; position: number } | null {
  if (stack.length <= 1) {
    return null; // Solo hay $
  }

  // Buscar terminales de derecha a izquierda
  let currentTerminal: string | null = null;
  let startPosition = stack.length;

  // Primero, encontrar el terminal más a la derecha (tope)
  for (let i = stack.length - 1; i >= 0; i--) {
    if (precedenceTable.symbols.includes(stack[i])) {
      currentTerminal = stack[i];
      startPosition = i;
      break;
    }
  }

  if (!currentTerminal) {
    return null;
  }

  // Ahora retroceder buscando el terminal anterior y verificar la relación
  for (let i = startPosition - 1; i >= 0; i--) {
    if (precedenceTable.symbols.includes(stack[i])) {
      const prevTerminal = stack[i];
      const relation = precedenceTable.relations.get(prevTerminal)?.get(currentTerminal);
      
      // Si encontramos <·, el mango va desde i+1 hasta el final
      if (relation === '<') {
        const handle = stack.slice(i + 1);
        return { handle, position: i + 1 };
      }
      
      // Si es ≐, continuamos buscando
      // Actualizar el terminal actual para la siguiente iteración
      currentTerminal = prevTerminal;
    }
  }

  // Si no encontramos <·, el mango incluye todo desde después de $ hasta el final
  // Esto ocurre cuando el primer terminal tiene relación $<·terminal
  const handle = stack.slice(1); // Excluir el $
  return { handle, position: 1 };
}

/**
 * Busca la producción que corresponde a un mango
 */
function findProductionForHandle(
  handle: string[],
  grammar: Grammar
): Production | null {
  // Filtrar solo terminales del mango
  const terminals = handle.filter(s => grammar.terminals.includes(s));

  // Buscar producción cuyo lado derecho coincida con los terminales
  for (const production of grammar.productions) {
    const prodTerminals = production.right.filter(s => grammar.terminals.includes(s));

    if (prodTerminals.length === terminals.length) {
      let match = true;
      for (let i = 0; i < prodTerminals.length; i++) {
        if (prodTerminals[i] !== terminals[i]) {
          match = false;
          break;
        }
      }

      if (match) {
        return production;
      }
    }
  }

  return null;
}

/**
 * Simula el análisis sintáctico ascendente por precedencia
 */
export function parseStringPrecedence(
  grammar: Grammar,
  precedenceTable: PrecedenceTable,
  input: string
): ParsingResult {
  const steps: ParseStep[] = [];
  const stack: string[] = ['$'];
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

  while (inputQueue.length > 0) {
    const currentInput = inputQueue[0];
    
    // Buscar el terminal más a la cima de la pila (ignorando no terminales)
    // Según el algoritmo: "sea a el símbolo terminal más a la cima de la pila"
    let stackTopTerminal = '$';
    for (let i = stack.length - 1; i >= 0; i--) {
      if (precedenceTable.symbols.includes(stack[i])) {
        stackTopTerminal = stack[i];
        break;
      }
    }

    // Si llegamos a $ en ambos lados, aceptar
    if (stackTopTerminal === '$' && currentInput === '$') {
      // Verificar si solo queda el símbolo inicial en la pila (además de $)
      const nonDollarSymbols = stack.filter(s => s !== '$');
      if (nonDollarSymbols.length === 1 && nonDollarSymbols[0] === grammar.startSymbol) {
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
        };
      }
    }

    // Obtener relación de precedencia entre el terminal de la pila y el símbolo de entrada
    const relation = precedenceTable.relations.get(stackTopTerminal)?.get(currentInput);

    if (!relation || relation === '·') {
      steps.push({
        stepNumber: stepNumber++,
        stack: [...stack],
        input: [...inputQueue],
        output: output.join('\n'),
        action: `Error: No hay relación entre '${stackTopTerminal}' y '${currentInput}'`,
      });

      return {
        accepted: false,
        steps,
        error: `No hay relación entre '${stackTopTerminal}' y '${currentInput}'`,
      };
    }

    if (relation === '<' || relation === '=') {
      // Desplazar: mover símbolo de entrada a pila
      const symbol = inputQueue.shift()!;
      stack.push(symbol);

      steps.push({
        stepNumber: stepNumber++,
        stack: [...stack],
        input: [...inputQueue],
        output: output.join('\n'),
        action: `Desplazar '${symbol}'`,
      });
    } else if (relation === '>') {
      // Reducir: encontrar mango y reducir
      const handleInfo = findHandle(stack, precedenceTable);

      if (!handleInfo) {
        steps.push({
          stepNumber: stepNumber++,
          stack: [...stack],
          input: [...inputQueue],
          output: output.join('\n'),
          action: 'Error: No se pudo encontrar mango',
        });

        return {
          accepted: false,
          steps,
          error: 'No se pudo encontrar mango',
        };
      }

      const { handle, position } = handleInfo;
      const production = findProductionForHandle(handle, grammar);

      if (!production) {
        steps.push({
          stepNumber: stepNumber++,
          stack: [...stack],
          input: [...inputQueue],
          output: output.join('\n'),
          action: `Error: No hay producción para mango [${handle.join(' ')}]`,
        });

        return {
          accepted: false,
          steps,
          error: `No hay producción para mango [${handle.join(' ')}]`,
        };
      }

      // Reducir: quitar mango de la pila y agregar no terminal
      stack.splice(position, handle.length, production.left);

      const productionStr = `${production.left} → ${production.right.join(' ')}`;
      output.push(productionStr);

      steps.push({
        stepNumber: stepNumber++,
        stack: [...stack],
        input: [...inputQueue],
        output: output.join('\n'),
        action: `Reducir por ${productionStr}`,
      });
    }
  }

  return {
    accepted: false,
    steps,
    error: 'Error inesperado en el análisis',
  };
}

/**
 * Analiza una gramática completa en modo ascendente
 */
export function analyzeAscendente(
  grammar: Grammar,
  mode: 'manual' | 'automatic' = 'automatic'
) {
  // Validar que sea gramática de operadores
  const validation = isOperatorGrammar(grammar);
  if (!validation.valid) {
    throw new Error(`Gramática inválida: ${validation.errors.join(', ')}`);
  }

  if (mode === 'manual') {
    // Generar pasos de precedencia
    const precedenceSteps = calculatePrecedenceManual(grammar);
    const precedenceTable = buildPrecedenceTableFromSteps(grammar, precedenceSteps);

    return {
      precedenceTable,
      precedenceSteps,
      mode: 'manual' as const,
    };
  } else {
    // Generar tabla directamente
    const precedenceTable = calculatePrecedenceAutomatic(grammar);

    return {
      precedenceTable,
      mode: 'automatic' as const,
    };
  }
}

/**
 * Formatea la tabla de precedencia para visualización
 */
export function formatPrecedenceTable(table: PrecedenceTable): string {
  const { symbols, relations } = table;
  let result = '     ';

  // Encabezado
  for (const symbol of symbols) {
    result += `${symbol.padEnd(4)}`;
  }
  result += '\n';

  // Línea separadora
  result += '─'.repeat(5 + symbols.length * 4) + '\n';

  // Filas
  for (const symbol1 of symbols) {
    result += `${symbol1.padEnd(5)}`;
    for (const symbol2 of symbols) {
      const relation = relations.get(symbol1)?.get(symbol2) || '·';
      result += `${relation.padEnd(4)}`;
    }
    result += '\n';
  }

  return result;
}

/**
 * Exporta la tabla de precedencia como matriz
 */
export function exportPrecedenceTableAsMatrix(table: PrecedenceTable): {
  headers: string[];
  rows: Array<{ symbol: string; values: string[] }>;
} {
  const { symbols, relations } = table;

  return {
    headers: ['', ...symbols],
    rows: symbols.map(symbol1 => ({
      symbol: symbol1,
      values: symbols.map(symbol2 => relations.get(symbol1)?.get(symbol2) || '·'),
    })),
  };
}

// ============================================================================
// GENERACIÓN DE CADENA DE PRUEBA
// ============================================================================

/**
 * Obtiene los terminales en orden de aparición en las producciones
 */
export function getTerminalsInProductionOrder(grammar: Grammar): string[] {
  const orderedTerminals: string[] = [];
  const seen = new Set<string>();
  
  // Recorrer producciones en orden y agregar terminales según aparecen
  for (const production of grammar.productions) {
    for (const symbol of production.right) {
      if (grammar.terminals.includes(symbol) && !seen.has(symbol) && symbol !== 'ε') {
        orderedTerminals.push(symbol);
        seen.add(symbol);
      }
    }
  }
  
  // Agregar terminales que no aparecieron en ninguna producción
  for (const terminal of grammar.terminals) {
    if (!seen.has(terminal) && terminal !== 'ε') {
      orderedTerminals.push(terminal);
      seen.add(terminal);
    }
  }
  
  return orderedTerminals;
}

/**
 * Genera una cadena de prueba con la máxima combinación de terminales posible.
 * 
 * El algoritmo genera todas las combinaciones posibles entre pares de terminales
 * para encontrar todas las relaciones de precedencia.
 * 
 * Estrategia:
 * 1. Obtener terminales en orden de definición
 * 2. Identificar operandos vs operadores
 * 3. Generar combinaciones: para cada par de operadores, crear operando op1 operando op2 operando
 * 4. Incluir paréntesis si existen
 */
export function generateTestString(grammar: Grammar): string {
  const terminals = getTerminalsInProductionOrder(grammar);
  
  // Identificar operandos (típicamente 'id', 'num', o letras solas que aparecen solos en producciones)
  const operands = terminals.filter(t => {
    // Buscar si este terminal aparece solo (sin operadores) en alguna producción
    const appearsAlone = grammar.productions.some(p => 
      p.right.length === 1 && p.right[0] === t
    );
    return appearsAlone || t === 'id' || t === 'num' || /^[a-z]$/.test(t);
  });
  
  // Identificar operadores (todo lo que no sea operando ni paréntesis)
  const operators = terminals.filter(t => 
    !operands.includes(t) && t !== '(' && t !== ')'
  );
  
  // Determinar el operando principal
  const operand = operands.length > 0 ? operands[0] : 'id';
  
  // Si no hay operadores, retornar solo el operando
  if (operators.length === 0) {
    return operand;
  }
  
  const parts: string[] = [];
  
  // Generar cadena con TODAS las combinaciones de operadores
  // Para n operadores, necesitamos mostrar cada operador con cada otro operador
  // Ejemplo: id op1 id op2 id op1 id op3 id op2 id op3 id ...
  
  // Primero, una secuencia con todos los operadores
  parts.push(operand);
  for (const op of operators) {
    parts.push(op);
    parts.push(operand);
  }
  
  // Luego, agregar combinaciones adicionales para cubrir todos los pares
  // Cada operador debe aparecer tanto a la izquierda como a la derecha de cada otro
  for (let i = 0; i < operators.length; i++) {
    for (let j = 0; j < operators.length; j++) {
      if (i !== j) {
        // Agregar: operando op_i operando op_j operando
        // Solo si esta combinación no está ya implícita
        parts.push(operators[i]);
        parts.push(operand);
        parts.push(operators[j]);
        parts.push(operand);
      }
    }
  }
  
  // Si hay paréntesis, agregar expresiones con paréntesis
  if (terminals.includes('(') && terminals.includes(')')) {
    // ( operando op operando )
    parts.push('(');
    parts.push(operand);
    if (operators.length > 0) {
      parts.push(operators[0]);
      parts.push(operand);
    }
    parts.push(')');
    
    // operando op ( operando )
    if (operators.length > 0) {
      parts.push(operators[0]);
      parts.push('(');
      parts.push(operand);
      parts.push(')');
    }
  }
  
  return parts.join(' ');
}

/**
 * Calcula las relaciones de precedencia usando una cadena de ejemplo.
 * 
 * Este es el algoritmo principal para el modo automático que analiza
 * una cadena de prueba para encontrar todas las relaciones de precedencia
 * basándose en la estructura de la gramática.
 */
export function calculatePrecedenceFromString(
  grammar: Grammar,
  testString: string
): { table: PrecedenceTable; derivation: string[] } {
  // Primero calculamos la tabla usando el método tradicional basado en FIRST/LAST
  const table = calculatePrecedenceUsingFirstLast(grammar);
  
  // La derivación muestra cómo la cadena de prueba ayuda a verificar las relaciones
  const derivation: string[] = [];
  derivation.push(`Cadena de prueba: ${testString}`);
  derivation.push(`Se analizan las relaciones entre símbolos terminales adyacentes.`);
  
  return { table, derivation };
}

/**
 * Calcula PRIMERO(A) para los terminales que pueden aparecer primero
 * después de un no terminal A en una derivación
 */
function computeFirst(grammar: Grammar): Map<string, Set<string>> {
  const first = new Map<string, Set<string>>();
  
  // Inicializar First para todos los símbolos
  for (const terminal of grammar.terminals) {
    first.set(terminal, new Set([terminal]));
  }
  for (const nonTerminal of grammar.nonTerminals) {
    first.set(nonTerminal, new Set());
  }
  
  let changed = true;
  while (changed) {
    changed = false;
    
    for (const production of grammar.productions) {
      const leftFirst = first.get(production.left)!;
      const rightFirst = production.right[0];
      
      if (grammar.terminals.includes(rightFirst)) {
        // Si empieza con terminal, agregar a First
        if (!leftFirst.has(rightFirst)) {
          leftFirst.add(rightFirst);
          changed = true;
        }
      } else if (grammar.nonTerminals.includes(rightFirst)) {
        // Si empieza con no terminal, agregar First de ese no terminal
        const rightFirstSet = first.get(rightFirst)!;
        for (const symbol of rightFirstSet) {
          if (!leftFirst.has(symbol)) {
            leftFirst.add(symbol);
            changed = true;
          }
        }
      }
    }
  }
  
  return first;
}

/**
 * Calcula ÚLTIMO(A) para los terminales que pueden aparecer al final
 * de una derivación de A
 */
function computeLast(grammar: Grammar): Map<string, Set<string>> {
  const last = new Map<string, Set<string>>();
  
  // Inicializar Last para todos los símbolos
  for (const terminal of grammar.terminals) {
    last.set(terminal, new Set([terminal]));
  }
  for (const nonTerminal of grammar.nonTerminals) {
    last.set(nonTerminal, new Set());
  }
  
  let changed = true;
  while (changed) {
    changed = false;
    
    for (const production of grammar.productions) {
      const leftLast = last.get(production.left)!;
      const rightLast = production.right[production.right.length - 1];
      
      if (grammar.terminals.includes(rightLast)) {
        // Si termina con terminal, agregar a Last
        if (!leftLast.has(rightLast)) {
          leftLast.add(rightLast);
          changed = true;
        }
      } else if (grammar.nonTerminals.includes(rightLast)) {
        // Si termina con no terminal, agregar Last de ese no terminal
        const rightLastSet = last.get(rightLast)!;
        for (const symbol of rightLastSet) {
          if (!leftLast.has(symbol)) {
            leftLast.add(symbol);
            changed = true;
          }
        }
      }
    }
  }
  
  return last;
}

/**
 * Calcula la tabla de precedencia para gramáticas de operadores.
 * 
 * Para gramáticas ambiguas como E → E + E | E * E | id, las reglas son:
 * 
 * 1. OPERANDOS (id, num, etc.):
 *    - id ·> θ para todo operador θ (el operando tiene más precedencia)
 *    - θ <· id para todo operador θ (el operador cede al operando)
 *    - $ <· id e id ·> $
 * 
 * 2. PARÉNTESIS (si existen):
 *    - ( ≐ ) (igual precedencia entre paréntesis)
 *    - ( <· todo, todo ·> )
 *    - θ <· (, ) ·> θ
 * 
 * 3. OPERADORES:
 *    - Asociatividad izquierda (por defecto): θ ·> θ
 *    - El orden de las producciones determina precedencia:
 *      Las producciones que aparecen después tienen MAYOR precedencia
 *      Por ejemplo: E → E+E | E*E | id → * tiene mayor precedencia que +
 *    - Si θ₁ tiene mayor precedencia: θ₁ ·> θ₂ y θ₂ <· θ₁
 * 
 * 4. RELACIONES CON $:
 *    - $ <· FIRST⁺(S)
 *    - LAST⁺(S) ·> $
 */
export function calculatePrecedenceUsingFirstLast(grammar: Grammar): PrecedenceTable {
  const orderedTerminals = getTerminalsInProductionOrder(grammar);
  const symbols = [...orderedTerminals, '$'];
  
  const relations = new Map<string, Map<string, '<' | '>' | '=' | '·'>>();
  
  // Inicializar tabla con '·' (sin relación)
  for (const s1 of symbols) {
    relations.set(s1, new Map());
    for (const s2 of symbols) {
      relations.get(s1)!.set(s2, '·');
    }
  }
  
  // Identificar operandos, operadores y paréntesis
  const operands = identifyOperands(grammar);
  const operators = identifyOperators(grammar, operands);
  const hasParentheses = grammar.terminals.includes('(') && grammar.terminals.includes(')');
  
  // Determinar precedencia de operadores basándose en el orden de las producciones
  // Las producciones que aparecen después tienen MAYOR precedencia
  const operatorPrecedence = computeOperatorPrecedence(grammar, operators);
  
  // Helper para establecer relación
  const setRel = (s1: string, s2: string, rel: '<' | '>' | '=') => {
    if (relations.has(s1) && relations.get(s1)!.has(s2)) {
      relations.get(s1)!.set(s2, rel);
    }
  };
  
  // ============================================
  // REGLA 1: Relaciones con OPERANDOS
  // ============================================
  for (const operand of operands) {
    // id ·> θ para todo operador (el operando tiene más precedencia que operadores)
    for (const op of operators) {
      setRel(operand, op, '>');
    }
    // θ <· id para todo operador
    for (const op of operators) {
      setRel(op, operand, '<');
    }
    // id ·> $
    setRel(operand, '$', '>');
    // $ <· id
    setRel('$', operand, '<');
  }
  
  // ============================================
  // REGLA 2: Relaciones con PARÉNTESIS
  // ============================================
  if (hasParentheses) {
    // ( ≐ ) - pero normalmente no hay relación directa, se usa para agrupar
    // ( <· todo lo que puede iniciar una expresión
    for (const op of operators) {
      setRel('(', op, '<');
    }
    for (const operand of operands) {
      setRel('(', operand, '<');
    }
    setRel('(', '(', '<');
    
    // todo ·> )
    for (const op of operators) {
      setRel(op, ')', '>');
    }
    for (const operand of operands) {
      setRel(operand, ')', '>');
    }
    setRel(')', ')', '>');
    
    // ) ·> operadores y $
    for (const op of operators) {
      setRel(')', op, '>');
    }
    setRel(')', '$', '>');
    
    // operadores <· (
    for (const op of operators) {
      setRel(op, '(', '<');
    }
    
    // $ <· (
    setRel('$', '(', '<');
    
    // ( ≐ ) solo si aparecen juntos (como en producción ( E ))
    // Verificar si hay producción con ( E )
    const hasParenProduction = grammar.productions.some(p =>
      p.right.includes('(') && p.right.includes(')')
    );
    if (hasParenProduction) {
      setRel('(', ')', '=');
    }
  }
  
  // ============================================
  // REGLA 3: Relaciones entre OPERADORES
  // ============================================
  for (const op1 of operators) {
    for (const op2 of operators) {
      const prec1 = operatorPrecedence.get(op1) || 0;
      const prec2 = operatorPrecedence.get(op2) || 0;
      
      if (op1 === op2) {
        // Mismo operador: asociatividad izquierda → θ ·> θ
        setRel(op1, op2, '>');
      } else if (prec1 > prec2) {
        // op1 tiene MAYOR precedencia que op2
        // op1 ·> op2 (op1 se evalúa primero)
        setRel(op1, op2, '>');
      } else if (prec1 < prec2) {
        // op1 tiene MENOR precedencia que op2
        // op1 <· op2 (op2 se evalúa primero)
        setRel(op1, op2, '<');
      } else {
        // Igual precedencia pero diferentes operadores: asociatividad izquierda
        setRel(op1, op2, '>');
      }
    }
  }
  
  // ============================================
  // REGLA 4: Relaciones con $
  // ============================================
  // $ <· todo lo que puede iniciar (FIRST del símbolo inicial)
  for (const op of operators) {
    setRel('$', op, '<');
  }
  // ya se hizo $ <· operandos arriba
  
  // todo ·> $ (lo que puede terminar una expresión)
  for (const op of operators) {
    setRel(op, '$', '>');
  }
  // ya se hizo operandos ·> $ arriba
  
  return { symbols, relations };
}

/**
 * Identifica los operandos en la gramática.
 * Un operando es un terminal que:
 * - Aparece solo en una producción (ej: E → id)
 * - Es 'id', 'num', o una letra minúscula sola
 */
function identifyOperands(grammar: Grammar): string[] {
  const operands: string[] = [];
  
  for (const terminal of grammar.terminals) {
    if (terminal === 'ε') continue;
    
    // Es operando si aparece solo en una producción
    const appearsAlone = grammar.productions.some(p => 
      p.right.length === 1 && p.right[0] === terminal
    );
    
    // O si es un identificador típico
    const isTypicalOperand = ['id', 'num', 'ID', 'NUM'].includes(terminal) ||
      /^[a-z]$/.test(terminal);
    
    if (appearsAlone || isTypicalOperand) {
      operands.push(terminal);
    }
  }
  
  return operands;
}

/**
 * Identifica los operadores en la gramática.
 * Un operador es un terminal que NO es operando ni paréntesis.
 */
function identifyOperators(grammar: Grammar, operands: string[]): string[] {
  const operators: string[] = [];
  
  for (const terminal of grammar.terminals) {
    if (terminal === 'ε') continue;
    if (operands.includes(terminal)) continue;
    if (['(', ')', '[', ']', '{', '}'].includes(terminal)) continue;
    
    operators.push(terminal);
  }
  
  return operators;
}

/**
 * Calcula la precedencia de cada operador basándose en el orden de las producciones.
 * Las producciones que aparecen DESPUÉS tienen MAYOR precedencia.
 * 
 * Ejemplo: E → E+E | E*E | id
 * - + aparece en producción 0, precedencia = 0
 * - * aparece en producción 1, precedencia = 1 (mayor)
 * 
 * Esto coincide con la convención matemática donde * tiene mayor precedencia que +.
 */
function computeOperatorPrecedence(grammar: Grammar, operators: string[]): Map<string, number> {
  const precedence = new Map<string, number>();
  
  // Inicializar todos los operadores con precedencia 0
  for (const op of operators) {
    precedence.set(op, 0);
  }
  
  // Asignar precedencia basándose en el orden de aparición en producciones
  // Un operador que aparece en una producción posterior tiene mayor precedencia
  let currentPrecedence = 0;
  const seenOperators = new Set<string>();
  
  for (const production of grammar.productions) {
    // Encontrar operadores en esta producción
    const opsInProduction = production.right.filter(s => operators.includes(s));
    
    for (const op of opsInProduction) {
      if (!seenOperators.has(op)) {
        seenOperators.add(op);
        precedence.set(op, currentPrecedence);
        currentPrecedence++;
      }
    }
  }
  
  return precedence;
}

/**
 * Genera los pasos de construcción de la tabla de precedencia para modo manual
 * basándose en una cadena de ejemplo
 */
export function generatePrecedenceStepsFromString(
  grammar: Grammar,
  testString: string
): PrecedenceStep[] {
  const steps: PrecedenceStep[] = [];
  let stepNumber = 1;
  
  // Tokenizar la cadena
  const tokens = testString.split(' ').filter(t => t !== '');
  
  // Calcular First y Last
  const first = computeFirst(grammar);
  const last = computeLast(grammar);
  
  // Paso inicial: mostrar la cadena de prueba
  steps.push({
    stepNumber: stepNumber++,
    production: grammar.productions[0],
    relations: [],
    explanation: `Analizando cadena de prueba: "${testString}"`,
  });
  
  // Generar pasos para cada producción
  for (const production of grammar.productions) {
    const { right } = production;
    const relations: PrecedenceRelation[] = [];
    
    // Analizar pares adyacentes
    for (let i = 0; i < right.length - 1; i++) {
      const current = right[i];
      const next = right[i + 1];
      
      // terminal terminal
      if (grammar.terminals.includes(current) && grammar.terminals.includes(next)) {
        relations.push({
          symbol1: current,
          symbol2: next,
          relation: '=',
        });
      }
      
      // terminal NoTerminal
      if (grammar.terminals.includes(current) && grammar.nonTerminals.includes(next)) {
        const firstNext = first.get(next)!;
        for (const f of firstNext) {
          if (grammar.terminals.includes(f)) {
            relations.push({
              symbol1: current,
              symbol2: f,
              relation: '<',
            });
          }
        }
      }
      
      // NoTerminal terminal
      if (grammar.nonTerminals.includes(current) && grammar.terminals.includes(next)) {
        const lastCurrent = last.get(current)!;
        for (const l of lastCurrent) {
          if (grammar.terminals.includes(l)) {
            relations.push({
              symbol1: l,
              symbol2: next,
              relation: '>',
            });
          }
        }
      }
    }
    
    if (relations.length > 0) {
      steps.push({
        stepNumber: stepNumber++,
        production,
        relations,
        explanation: `Analizando producción: ${production.left} → ${right.join(' ')}`,
      });
    }
  }
  
  // Agregar relaciones con $
  const dollarRelations: PrecedenceRelation[] = [];
  
  const startFirst = first.get(grammar.startSymbol);
  if (startFirst) {
    for (const f of startFirst) {
      if (grammar.terminals.includes(f)) {
        dollarRelations.push({
          symbol1: '$',
          symbol2: f,
          relation: '<',
        });
      }
    }
  }
  
  const startLast = last.get(grammar.startSymbol);
  if (startLast) {
    for (const l of startLast) {
      if (grammar.terminals.includes(l)) {
        dollarRelations.push({
          symbol1: l,
          symbol2: '$',
          relation: '>',
        });
      }
    }
  }
  
  if (dollarRelations.length > 0) {
    steps.push({
      stepNumber: stepNumber++,
      production: grammar.productions[0],
      relations: dollarRelations,
      explanation: 'Relaciones con el marcador de fin de cadena ($)',
    });
  }
  
  return steps;
}

// ============================================================================
// ANÁLISIS DE PRECEDENCIA BASADO EN DERIVACIONES
// ============================================================================

/**
 * Extrae solo los terminales de una forma sentencial (los no terminales son "invisibles")
 */
function extractTerminals(grammar: Grammar, form: string[]): string[] {
  return form.filter(s => grammar.terminals.includes(s));
}

/**
 * Analiza las relaciones de precedencia entre dos pasos de derivación consecutivos.
 * 
 * Las relaciones se calculan según las reglas de precedencia de operadores:
 * 1. Operandos: id ·> θ, θ <· id
 * 2. Entre operadores: según precedencia y asociatividad
 * 3. Con $: $ <· todo, todo ·> $
 */
export function analyzeDerivationStep(
  grammar: Grammar,
  currForm: string[],
  production: Production | null,
  prevForm?: string[]
): PrecedenceRelation[] {
  const relations: PrecedenceRelation[] = [];
  const seen = new Set<string>();
  
  const addRelation = (s1: string, s2: string, rel: '<' | '>' | '=') => {
    const key = `${s1}-${s2}`;
    if (!seen.has(key) && s1 && s2) {
      seen.add(key);
      relations.push({ symbol1: s1, symbol2: s2, relation: rel });
    }
  };
  
  // Identificar operandos y operadores
  const operands = identifyOperands(grammar);
  const operators = identifyOperators(grammar, operands);
  const operatorPrecedence = computeOperatorPrecedence(grammar, operators);
  
  // Si no hay producción, solo analizar relaciones básicas con $
  if (!production) {
    const terminals = currForm.filter(s => grammar.terminals.includes(s));
    if (terminals.length > 0) {
      const first = terminals[0];
      const last = terminals[terminals.length - 1];
      addRelation('$', first, '<');
      addRelation(last, '$', '>');
    }
    return relations;
  }
  
  const handle = production.right;
  const handleTerminals = handle.filter(s => grammar.terminals.includes(s));
  
  // Buscar dónde se insertó el mango en la forma actual
  let handleStartPos = -1;
  for (let i = 0; i <= currForm.length - handle.length; i++) {
    let match = true;
    for (let j = 0; j < handle.length; j++) {
      if (currForm[i + j] !== handle[j]) {
        match = false;
        break;
      }
    }
    if (match) {
      handleStartPos = i;
      break;
    }
  }
  
  if (handleStartPos === -1) {
    return relations;
  }
  
  const handleEndPos = handleStartPos + handle.length - 1;
  
  // Obtener terminal a la izquierda del mango
  let leftTerminal: string | null = null;
  for (let i = handleStartPos - 1; i >= 0; i--) {
    if (grammar.terminals.includes(currForm[i])) {
      leftTerminal = currForm[i];
      break;
    }
  }
  
  // Obtener terminal a la derecha del mango
  let rightTerminal: string | null = null;
  for (let i = handleEndPos + 1; i < currForm.length; i++) {
    if (grammar.terminals.includes(currForm[i])) {
      rightTerminal = currForm[i];
      break;
    }
  }
  
  const effectiveLeft = leftTerminal || '$';
  const effectiveRight = rightTerminal || '$';
  
  // Analizar cada terminal del mango
  for (const terminal of handleTerminals) {
    const isOperand = operands.includes(terminal);
    const isOperator = operators.includes(terminal);
    
    if (isOperand) {
      // operando ·> operador
      if (effectiveRight !== '$' && operators.includes(effectiveRight)) {
        addRelation(terminal, effectiveRight, '>');
      }
      if (effectiveRight === '$') {
        addRelation(terminal, '$', '>');
      }
      if (effectiveLeft === '$') {
        addRelation('$', terminal, '<');
      } else if (operators.includes(effectiveLeft)) {
        addRelation(effectiveLeft, terminal, '<');
      }
    }
    
    if (isOperator) {
      if (effectiveRight === '$') {
        addRelation(terminal, '$', '>');
      }
      if (effectiveLeft === '$') {
        addRelation('$', terminal, '<');
      }
      
      // Relaciones entre operadores
      if (effectiveRight !== '$' && operators.includes(effectiveRight)) {
        const precTerminal = operatorPrecedence.get(terminal) || 0;
        const precRight = operatorPrecedence.get(effectiveRight) || 0;
        
        if (precTerminal >= precRight) {
          addRelation(terminal, effectiveRight, '>');
        } else {
          addRelation(terminal, effectiveRight, '<');
        }
      }
      
      if (effectiveLeft !== '$' && operators.includes(effectiveLeft)) {
        addRelation(effectiveLeft, terminal, '<');
      }
    }
  }
  
  // Relaciones dentro del mango
  for (let i = 0; i < handle.length - 1; i++) {
    const curr = handle[i];
    const next = handle[i + 1];
    
    if (!grammar.terminals.includes(curr) || !grammar.terminals.includes(next)) continue;
    
    const currIsOperand = operands.includes(curr);
    const nextIsOperand = operands.includes(next);
    const currIsOperator = operators.includes(curr);
    const nextIsOperator = operators.includes(next);
    
    if (currIsOperator && nextIsOperand) {
      addRelation(curr, next, '<');
    }
    if (currIsOperand && nextIsOperator) {
      addRelation(curr, next, '>');
    }
    if (currIsOperator && nextIsOperator) {
      const precCurr = operatorPrecedence.get(curr) || 0;
      const precNext = operatorPrecedence.get(next) || 0;
      if (precCurr >= precNext) {
        addRelation(curr, next, '>');
      } else {
        addRelation(curr, next, '<');
      }
    }
  }
  
  return relations;
}

/**
 * Aplica una producción a una forma sentencial, expandiendo un no terminal.
 * 
 * @param sententialForm - Forma sentencial actual
 * @param position - Posición del no terminal a expandir
 * @param production - Producción a aplicar
 * @returns Nueva forma sentencial después de la derivación
 */
export function applyDerivation(
  sententialForm: string[],
  position: number,
  production: Production
): string[] {
  const result = [...sententialForm];
  result.splice(position, 1, ...production.right);
  return result;
}

/**
 * Genera múltiples cadenas de derivaciones en paralelo usando derivación más a la derecha.
 * 
 * El algoritmo genera MÚLTIPLES secuencias de derivaciones, cada una explorando
 * diferentes producciones para maximizar la cobertura de relaciones de precedencia.
 * 
 * Estrategia:
 * 1. Generar N cadenas de derivación en paralelo (N = número de producciones del símbolo inicial)
 * 2. Cada cadena comienza con una producción diferente del símbolo inicial
 * 3. En cada paso, expandir el no-terminal MÁS A LA DERECHA (derivación más derecha)
 * 4. Si hay múltiples producciones posibles, cada cadena elige una diferente
 * 5. Continuar hasta que todas las cadenas lleguen a solo terminales
 * 
 * Esto garantiza encontrar relaciones como:
 * - a ·> a (asociatividad por izquierda) al tener E op E op E
 * - a ·> b, b ·> a (precedencias cruzadas) al explorar diferentes órdenes
 */
export function generateAutomaticDerivations(grammar: Grammar): DerivationStep[] {
  // Calcular conjuntos FIRST⁺ y LAST⁺ para todos los símbolos
  const firstPlus = computeFirstPlusSets(grammar);
  const lastPlus = computeLastPlusSets(grammar);
  
  // Obtener producciones del símbolo inicial
  const startProductions = grammar.productions.filter(p => p.left === grammar.startSymbol);
  
  // Número de cadenas de derivación a generar
  // Al menos tantas como producciones diferentes existen, para explorar todas las combinaciones
  const numChains = Math.max(
    startProductions.length,
    grammar.productions.length,
    3 // Mínimo 3 cadenas
  );
  
  // Generar múltiples cadenas de derivación
  const allChains: DerivationStep[][] = [];
  
  for (let chainIndex = 0; chainIndex < numChains; chainIndex++) {
    const chain = generateSingleDerivationChain(
      grammar,
      firstPlus,
      lastPlus,
      chainIndex, // Índice para variar la selección de producciones
      numChains
    );
    allChains.push(chain);
  }
  
  // Combinar todas las cadenas en una secuencia de pasos
  // Cada cadena se muestra como una "rama" de derivación
  const combinedSteps: DerivationStep[] = [];
  let globalStepNumber = 1;
  
  // Agregar paso inicial global
  combinedSteps.push({
    stepNumber: globalStepNumber++,
    sententialForm: [grammar.startSymbol],
    productionUsed: null,
    positionExpanded: -1,
    relations: [],
    explanation: `Inicio: Generando ${allChains.length} cadenas de derivación para encontrar todas las relaciones`,
  });
  
  // Recolectar todas las relaciones únicas encontradas
  const allRelationsMap = new Map<string, PrecedenceRelation>();
  
  // Procesar cada cadena
  for (let chainIdx = 0; chainIdx < allChains.length; chainIdx++) {
    const chain = allChains[chainIdx];
    
    // Agregar separador para esta cadena
    if (chain.length > 0) {
      // Agregar cada paso de la cadena
      for (const step of chain) {
        // Actualizar número de paso global
        const newStep: DerivationStep = {
          ...step,
          stepNumber: globalStepNumber++,
          explanation: `[Cadena ${chainIdx + 1}] ${step.explanation}`,
        };
        
        combinedSteps.push(newStep);
        
        // Recolectar relaciones únicas
        for (const rel of step.relations) {
          const key = `${rel.symbol1}-${rel.symbol2}`;
          if (!allRelationsMap.has(key)) {
            allRelationsMap.set(key, rel);
          }
        }
      }
    }
  }
  
  // Agregar paso final con relaciones de $ si no se encontraron en las cadenas
  const dollarRelations: PrecedenceRelation[] = [];
  
  // $ <· FIRST⁺(S)
  const startFirst = firstPlus.get(grammar.startSymbol);
  if (startFirst) {
    for (const f of startFirst) {
      const key = `$-${f}`;
      if (!allRelationsMap.has(key)) {
        const rel: PrecedenceRelation = { symbol1: '$', symbol2: f, relation: '<' };
        dollarRelations.push(rel);
        allRelationsMap.set(key, rel);
      }
    }
  }
  
  // LAST⁺(S) ·> $
  const startLast = lastPlus.get(grammar.startSymbol);
  if (startLast) {
    for (const l of startLast) {
      const key = `${l}-$`;
      if (!allRelationsMap.has(key)) {
        const rel: PrecedenceRelation = { symbol1: l, symbol2: '$', relation: '>' };
        dollarRelations.push(rel);
        allRelationsMap.set(key, rel);
      }
    }
  }
  
  if (dollarRelations.length > 0) {
    combinedSteps.push({
      stepNumber: globalStepNumber++,
      sententialForm: ['$', grammar.startSymbol, '$'],
      productionUsed: null,
      positionExpanded: -1,
      relations: dollarRelations,
      explanation: `Relaciones con $: $ <· FIRST⁺(${grammar.startSymbol}), LAST⁺(${grammar.startSymbol}) ·> $`,
    });
  }
  
  return combinedSteps;
}

/**
 * Genera una única cadena de derivación más a la derecha.
 * 
 * Las cadenas pares priorizan derivaciones con operadores (más profundas)
 * Las cadenas impares priorizan derivaciones terminales (más cortas)
 * Esto ayuda a capturar tanto relaciones simples como asociatividad.
 * 
 * @param grammar - La gramática
 * @param firstPlus - Conjuntos FIRST⁺ precalculados
 * @param lastPlus - Conjuntos LAST⁺ precalculados
 * @param chainIndex - Índice de esta cadena (para variar selección)
 * @param totalChains - Número total de cadenas
 */
function generateSingleDerivationChain(
  grammar: Grammar,
  firstPlus: Map<string, Set<string>>,
  lastPlus: Map<string, Set<string>>,
  chainIndex: number,
  totalChains: number
): DerivationStep[] {
  const steps: DerivationStep[] = [];
  let stepNumber = 1;
  
  // Máximo de iteraciones para esta cadena - aumentado para permitir más derivaciones
  const maxIterations = grammar.productions.length * 8;
  
  // Profundidad máxima deseada para esta cadena
  // Cadenas con índice bajo son más profundas (más operadores)
  const targetDepth = chainIndex < totalChains / 2 
    ? Math.max(5, grammar.productions.length) // Más profundo
    : 3; // Menos profundo, terminales más rápido
  
  // Estado de la derivación
  let currentForm: string[] = [grammar.startSymbol];
  const usedInThisChain = new Set<string>();
  let iterations = 0;
  let currentDepth = 0;
  
  while (iterations < maxIterations) {
    iterations++;
    
    // Encontrar el no terminal más a la derecha (derivación más derecha)
    let rightmostNTIndex = -1;
    for (let i = currentForm.length - 1; i >= 0; i--) {
      if (grammar.nonTerminals.includes(currentForm[i])) {
        rightmostNTIndex = i;
        break;
      }
    }
    
    // Si no hay más no terminales, terminamos esta cadena
    if (rightmostNTIndex === -1) {
      break;
    }
    
    const ntSymbol = currentForm[rightmostNTIndex];
    
    // Obtener producciones para este no terminal
    const availableProductions = grammar.productions.filter(p => p.left === ntSymbol);
    
    if (availableProductions.length === 0) {
      break;
    }
    
    // Seleccionar producción basándose en el índice de la cadena y la profundidad
    const selectedProduction = selectProductionForChain(
      availableProductions,
      usedInThisChain,
      chainIndex,
      totalChains,
      currentForm,
      rightmostNTIndex,
      grammar,
      currentDepth,
      targetDepth
    );
    
    if (!selectedProduction) {
      break;
    }
    
    // Aplicar la derivación
    currentForm = applyDerivation(currentForm, rightmostNTIndex, selectedProduction);
    currentDepth++;
    
    // Marcar producción como usada
    const prodKey = `${selectedProduction.left}->${selectedProduction.right.join(' ')}`;
    usedInThisChain.add(prodKey);
    
    // Analizar relaciones de este paso
    const stepRelations = analyzeDerivationStepRightmost(
      grammar,
      currentForm,
      selectedProduction,
      rightmostNTIndex,
      firstPlus,
      lastPlus
    );
    
    // Agregar paso
    steps.push({
      stepNumber: stepNumber++,
      sententialForm: [...currentForm],
      productionUsed: selectedProduction,
      positionExpanded: rightmostNTIndex,
      relations: stepRelations,
      explanation: `${selectedProduction.left} → ${selectedProduction.right.join(' ')}`,
    });
  }
  
  return steps;
}

/**
 * Selecciona una producción para una cadena específica.
 * Diferentes cadenas seleccionan diferentes producciones para maximizar cobertura.
 * 
 * @param currentDepth - Profundidad actual de la derivación
 * @param targetDepth - Profundidad objetivo para esta cadena
 */
function selectProductionForChain(
  availableProductions: Production[],
  usedInThisChain: Set<string>,
  chainIndex: number,
  totalChains: number,
  currentForm: string[],
  position: number,
  grammar: Grammar,
  currentDepth: number = 0,
  targetDepth: number = 3
): Production | null {
  if (availableProductions.length === 0) return null;
  
  // Separar producciones en dos grupos:
  // - Recursivas (tienen el mismo no-terminal en el lado derecho, o tienen operadores)
  // - Terminales (solo tienen terminales, típicamente E → id)
  const recursiveProductions = availableProductions.filter(prod => 
    prod.right.some(s => grammar.nonTerminals.includes(s)) ||
    prod.right.some(s => grammar.terminals.includes(s) && !['id', 'num', '(', ')'].includes(s) && !/^[a-z]$/.test(s))
  );
  const terminalProductions = availableProductions.filter(prod =>
    !prod.right.some(s => grammar.nonTerminals.includes(s))
  );
  
  // Decidir si preferir producciones recursivas o terminales
  // basándose en la profundidad actual vs objetivo
  const preferRecursive = currentDepth < targetDepth && recursiveProductions.length > 0;
  
  // Conjunto de producciones a considerar
  const candidateProductions = preferRecursive 
    ? (recursiveProductions.length > 0 ? recursiveProductions : availableProductions)
    : (terminalProductions.length > 0 ? terminalProductions : availableProductions);
  
  // Calcular puntuaciones para cada producción
  const scored = candidateProductions.map((prod, idx) => {
    const prodKey = `${prod.left}->${prod.right.join(' ')}`;
    let score = 0;
    
    // Bonus por no haber sido usada en esta cadena
    if (!usedInThisChain.has(prodKey)) {
      score += 100;
    }
    
    // Bonus por tener operadores (terminales que no son operandos)
    const operatorCount = prod.right.filter(s => 
      grammar.terminals.includes(s) && !['id', 'num', '(', ')'].includes(s) && !/^[a-z]$/.test(s)
    ).length;
    
    if (preferRecursive) {
      // Si queremos más profundidad, preferir producciones con operadores
      score += operatorCount * 30;
      
      // Bonus por tener más no terminales (permite más derivaciones)
      const nonTerminalCount = prod.right.filter(s => grammar.nonTerminals.includes(s)).length;
      score += nonTerminalCount * 20;
    } else {
      // Si queremos terminar, preferir producciones sin no terminales
      const nonTerminalCount = prod.right.filter(s => grammar.nonTerminals.includes(s)).length;
      score -= nonTerminalCount * 20;
      
      // Preferir producciones simples como E → id
      if (prod.right.length === 1) {
        score += 50;
      }
    }
    
    // Variar selección según el índice de la cadena
    // Esto hace que diferentes cadenas exploren diferentes caminos
    const rotatedIdx = (idx + chainIndex) % candidateProductions.length;
    score += (candidateProductions.length - rotatedIdx) * 3;
    
    // Analizar contexto: si ya hay terminales a los lados, bonus por generar relaciones
    if (position > 0) {
      const leftSymbol = currentForm[position - 1];
      if (grammar.terminals.includes(leftSymbol)) {
        score += 15;
      }
    }
    if (position < currentForm.length - 1) {
      const rightSymbol = currentForm[position + 1];
      if (grammar.terminals.includes(rightSymbol)) {
        score += 15;
      }
    }
    
    return { prod, score };
  });
  
  // Ordenar por puntuación descendente
  scored.sort((a, b) => b.score - a.score);
  
  // Para mayor variedad, seleccionar basándose en el índice de la cadena
  const selectionIndex = chainIndex % Math.min(scored.length, 2);
  return scored[Math.min(selectionIndex, scored.length - 1)].prod;
}

/**
 * Analiza las relaciones de precedencia para un paso de derivación más a la derecha.
 * 
 * Las relaciones se calculan según las reglas de precedencia de operadores:
 * 1. Operandos: id ·> θ, θ <· id
 * 2. Entre operadores: según precedencia y asociatividad
 * 3. Con $: $ <· todo, todo ·> $
 * 
 * El análisis muestra cómo la derivación justifica cada relación.
 */
function analyzeDerivationStepRightmost(
  grammar: Grammar,
  currentForm: string[],
  production: Production,
  expandedPosition: number,
  firstPlus: Map<string, Set<string>>,
  lastPlus: Map<string, Set<string>>
): PrecedenceRelation[] {
  const relations: PrecedenceRelation[] = [];
  const seen = new Set<string>();
  
  const addRel = (s1: string, s2: string, rel: '<' | '>' | '='): void => {
    const key = `${s1}-${s2}`;
    if (!seen.has(key) && s1 && s2) {
      seen.add(key);
      relations.push({ symbol1: s1, symbol2: s2, relation: rel });
    }
  };
  
  // Identificar operandos y operadores
  const operands = identifyOperands(grammar);
  const operators = identifyOperators(grammar, operands);
  const operatorPrecedence = computeOperatorPrecedence(grammar, operators);
  
  const handle = production.right;
  const handleTerminals = handle.filter(s => grammar.terminals.includes(s));
  
  // Calcular posiciones del mango en currentForm
  const handleStart = expandedPosition;
  const handleEnd = expandedPosition + handle.length - 1;
  
  // Obtener terminal a la izquierda del mango (ignorando no terminales)
  let leftTerminal: string | null = null;
  for (let i = handleStart - 1; i >= 0; i--) {
    if (grammar.terminals.includes(currentForm[i])) {
      leftTerminal = currentForm[i];
      break;
    }
  }
  
  // Obtener terminal a la derecha del mango
  let rightTerminal: string | null = null;
  for (let i = handleEnd + 1; i < currentForm.length; i++) {
    if (grammar.terminals.includes(currentForm[i])) {
      rightTerminal = currentForm[i];
      break;
    }
  }
  
  // Si no hay terminal a la izquierda, usar $
  const effectiveLeft = leftTerminal || '$';
  // Si no hay terminal a la derecha, usar $
  const effectiveRight = rightTerminal || '$';
  
  // Analizar cada terminal del mango
  for (const terminal of handleTerminals) {
    const isOperand = operands.includes(terminal);
    const isOperator = operators.includes(terminal);
    
    if (isOperand) {
      // REGLA: operando ·> operador (el operando tiene más precedencia)
      if (effectiveRight !== '$' && operators.includes(effectiveRight)) {
        addRel(terminal, effectiveRight, '>');
      }
      // REGLA: operando ·> $
      if (effectiveRight === '$') {
        addRel(terminal, '$', '>');
      }
      // REGLA: operador/$ <· operando
      if (effectiveLeft === '$') {
        addRel('$', terminal, '<');
      } else if (operators.includes(effectiveLeft)) {
        addRel(effectiveLeft, terminal, '<');
      }
    }
    
    if (isOperator) {
      // REGLA: operador ·> $ 
      if (effectiveRight === '$') {
        addRel(terminal, '$', '>');
      }
      // REGLA: $ <· operador
      if (effectiveLeft === '$') {
        addRel('$', terminal, '<');
      }
      
      // REGLA: relaciones entre operadores según precedencia
      if (effectiveRight !== '$' && operators.includes(effectiveRight)) {
        const precTerminal = operatorPrecedence.get(terminal) || 0;
        const precRight = operatorPrecedence.get(effectiveRight) || 0;
        
        if (precTerminal >= precRight) {
          // El operador del mango tiene mayor o igual precedencia
          // → se reduce primero → terminal ·> effectiveRight
          addRel(terminal, effectiveRight, '>');
        } else {
          // El operador de la derecha tiene mayor precedencia
          addRel(terminal, effectiveRight, '<');
        }
      }
      
      if (effectiveLeft !== '$' && operators.includes(effectiveLeft)) {
        const precTerminal = operatorPrecedence.get(terminal) || 0;
        const precLeft = operatorPrecedence.get(effectiveLeft) || 0;
        
        if (precTerminal > precLeft) {
          // El operador del mango tiene mayor precedencia
          addRel(effectiveLeft, terminal, '<');
        } else {
          // Igual o menor precedencia (asociatividad izquierda)
          addRel(effectiveLeft, terminal, '<');
        }
      }
    }
  }
  
  // Relaciones dentro del mango (terminales adyacentes en la producción)
  for (let i = 0; i < handle.length - 1; i++) {
    const curr = handle[i];
    const next = handle[i + 1];
    
    if (!grammar.terminals.includes(curr) || !grammar.terminals.includes(next)) continue;
    
    const currIsOperand = operands.includes(curr);
    const nextIsOperand = operands.includes(next);
    const currIsOperator = operators.includes(curr);
    const nextIsOperator = operators.includes(next);
    
    // Operador seguido de operando: operador <· operando
    if (currIsOperator && nextIsOperand) {
      addRel(curr, next, '<');
    }
    // Operando seguido de operador: operando ·> operador
    if (currIsOperand && nextIsOperator) {
      addRel(curr, next, '>');
    }
    // Dos operadores adyacentes (raro en gramáticas de operadores)
    if (currIsOperator && nextIsOperator) {
      const precCurr = operatorPrecedence.get(curr) || 0;
      const precNext = operatorPrecedence.get(next) || 0;
      if (precCurr >= precNext) {
        addRel(curr, next, '>');
      } else {
        addRel(curr, next, '<');
      }
    }
  }
  
  return relations;
}

/**
 * Calcula FIRST⁺ (primeros terminales alcanzables) para gramáticas de precedencia.
 * Solo incluye terminales, nunca épsilon.
 */
function computeFirstPlusSets(grammar: Grammar): Map<string, Set<string>> {
  const firstPlus = new Map<string, Set<string>>();
  
  // Inicializar: terminales tienen su propio FIRST⁺
  for (const terminal of grammar.terminals) {
    firstPlus.set(terminal, new Set([terminal]));
  }
  for (const nonTerminal of grammar.nonTerminals) {
    firstPlus.set(nonTerminal, new Set());
  }
  
  // Punto fijo: iterar hasta que no haya cambios
  let changed = true;
  while (changed) {
    changed = false;
    
    for (const production of grammar.productions) {
      const leftSet = firstPlus.get(production.left)!;
      
      if (production.right.length === 0) continue;
      
      // Obtener el primer símbolo de la producción
      const firstSymbol = production.right[0];
      
      // Si es terminal, agregarlo directamente
      if (grammar.terminals.includes(firstSymbol)) {
        if (!leftSet.has(firstSymbol)) {
          leftSet.add(firstSymbol);
          changed = true;
        }
      } 
      // Si es no-terminal, agregar su FIRST⁺
      else if (grammar.nonTerminals.includes(firstSymbol)) {
        const symbolFirstPlus = firstPlus.get(firstSymbol)!;
        for (const terminal of symbolFirstPlus) {
          if (!leftSet.has(terminal)) {
            leftSet.add(terminal);
            changed = true;
          }
        }
      }
    }
  }
  
  return firstPlus;
}

/**
 * Calcula LAST⁺ (últimos terminales alcanzables) para gramáticas de precedencia.
 * Solo incluye terminales, nunca épsilon.
 */
function computeLastPlusSets(grammar: Grammar): Map<string, Set<string>> {
  const lastPlus = new Map<string, Set<string>>();
  
  // Inicializar: terminales tienen su propio LAST⁺
  for (const terminal of grammar.terminals) {
    lastPlus.set(terminal, new Set([terminal]));
  }
  for (const nonTerminal of grammar.nonTerminals) {
    lastPlus.set(nonTerminal, new Set());
  }
  
  // Punto fijo: iterar hasta que no haya cambios
  let changed = true;
  while (changed) {
    changed = false;
    
    for (const production of grammar.productions) {
      const leftSet = lastPlus.get(production.left)!;
      
      if (production.right.length === 0) continue;
      
      // Obtener el último símbolo de la producción
      const lastSymbol = production.right[production.right.length - 1];
      
      // Si es terminal, agregarlo directamente
      if (grammar.terminals.includes(lastSymbol)) {
        if (!leftSet.has(lastSymbol)) {
          leftSet.add(lastSymbol);
          changed = true;
        }
      } 
      // Si es no-terminal, agregar su LAST⁺
      else if (grammar.nonTerminals.includes(lastSymbol)) {
        const symbolLastPlus = lastPlus.get(lastSymbol)!;
        for (const terminal of symbolLastPlus) {
          if (!leftSet.has(terminal)) {
            leftSet.add(terminal);
            changed = true;
          }
        }
      }
    }
  }
  
  return lastPlus;
}

/**
 * Construye la tabla de precedencia a partir de los pasos de derivación.
 * Usa las reglas correctas de precedencia de operadores.
 */
export function buildPrecedenceTableFromDerivations(
  grammar: Grammar,
  derivationSteps: DerivationStep[]
): PrecedenceTable {
  // Usar el cálculo correcto de precedencia
  // Las derivaciones son para mostrar el proceso, pero la tabla se calcula
  // con las reglas establecidas de precedencia de operadores
  return calculatePrecedenceUsingFirstLast(grammar);
}

/**
 * Procesa un paso de derivación manual (cuando el usuario hace clic en una producción).
 * Retorna el nuevo paso con las relaciones encontradas.
 */
export function processManualDerivationStep(
  grammar: Grammar,
  currentForm: string[],
  position: number,
  production: Production,
  stepNumber: number
): DerivationStep {
  const newForm = applyDerivation(currentForm, position, production);
  const relations = analyzeDerivationStep(grammar, newForm, production);
  
  return {
    stepNumber,
    sententialForm: newForm,
    productionUsed: production,
    positionExpanded: position,
    relations,
    explanation: `Derivación: ${production.left} → ${production.right.join(' ')} (posición ${position + 1})`,
  };
}

/**
 * Obtiene la cadena de prueba final (solo terminales) de los pasos de derivación.
 */
export function getTestStringFromDerivations(
  grammar: Grammar,
  steps: DerivationStep[]
): string {
  if (steps.length === 0) return '';
  
  const lastStep = steps[steps.length - 1];
  const terminals = lastStep.sententialForm.filter(s => grammar.terminals.includes(s));
  return terminals.join(' ');
}

/**
 * Convierte los pasos de derivación al formato PrecedenceStep para compatibilidad
 * con los componentes existentes.
 */
export function derivationsToPrecedenceSteps(
  derivationSteps: DerivationStep[]
): PrecedenceStep[] {
  return derivationSteps
    .filter(step => step.productionUsed !== null)
    .map(step => ({
      stepNumber: step.stepNumber,
      production: step.productionUsed!,
      relations: step.relations,
      explanation: step.explanation,
    }));
}

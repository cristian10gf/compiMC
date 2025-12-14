/**
 * Análisis Sintáctico Ascendente (LR) - Precedencia de Operadores
 * 
 * Implementa análisis sintáctico ascendente por precedencia de operadores con dos modos:
 * 1. Modo Manual: El usuario construye paso a paso la tabla de precedencia
 * 2. Modo Automático: El sistema genera automáticamente la tabla completa
 * 
 * Relaciones de precedencia:
 * - a <· b: "a cede la precedencia a b"
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
 */
function extractSymbolsForPrecedence(grammar: Grammar): string[] {
  const symbols = new Set<string>();

  // Agregar todos los terminales
  for (const terminal of grammar.terminals) {
    symbols.add(terminal);
  }

  // Agregar símbolos especiales
  symbols.add('$'); // Marcador de fin

  return Array.from(symbols).sort();
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
  // Usar el método manual para generar pasos
  const steps = calculatePrecedenceManual(grammar);
  
  // Construir tabla desde los pasos
  return buildPrecedenceTableFromSteps(grammar, steps);
}

/**
 * Encuentra el mango de una cadena usando la tabla de precedencia
 * 
 * Algoritmo:
 * 1. Insertar $ al inicio y fin: $w$
 * 2. Insertar relaciones de precedencia entre símbolos
 * 3. Buscar el primer ·>
 * 4. Retroceder hasta encontrar <·
 * 5. El mango está entre <· y ·>
 */
export function findHandle(
  stack: string[],
  precedenceTable: PrecedenceTable
): { handle: string[]; position: number } | null {
  // Buscar el primer ·>
  for (let i = 0; i < stack.length - 1; i++) {
    const current = stack[i];
    const next = stack[i + 1];

    const relation = precedenceTable.relations.get(current)?.get(next);

    if (relation === '>') {
      // Retroceder hasta encontrar <·
      let start = i;
      while (start > 0) {
        const prev = stack[start - 1];
        const curr = stack[start];
        const prevRelation = precedenceTable.relations.get(prev)?.get(curr);

        if (prevRelation === '<') {
          break;
        }
        start--;
      }

      // El mango está entre start y i (inclusive)
      const handle = stack.slice(start, i + 1);
      return { handle, position: start };
    }
  }

  return null;
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
    const stackTop = stack[stack.length - 1];

    // Si llegamos a $ en ambos lados, aceptar
    if (stackTop === '$' && currentInput === '$' && stack.length === 2) {
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

    // Obtener relación de precedencia
    const relation = precedenceTable.relations.get(stackTop)?.get(currentInput);

    if (!relation || relation === '·') {
      steps.push({
        stepNumber: stepNumber++,
        stack: [...stack],
        input: [...inputQueue],
        output: output.join('\n'),
        action: `Error: No hay relación entre '${stackTop}' y '${currentInput}'`,
      });

      return {
        accepted: false,
        steps,
        error: `No hay relación entre '${stackTop}' y '${currentInput}'`,
      };
    }

    if (relation === '<' || relation === '=') {
      // Desplazar: mover símbolo de entrada a pila
      stack.push(currentInput);
      inputQueue.shift();

      steps.push({
        stepNumber: stepNumber++,
        stack: [...stack],
        input: [...inputQueue],
        output: output.join('\n'),
        action: `Desplazar '${currentInput}'`,
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
          action: `Error: No hay producción para mango {${handle.join(' ')}}`,
        });

        return {
          accepted: false,
          steps,
          error: `No hay producción para mango {${handle.join(' ')}}`,
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

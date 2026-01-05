/**
 * Conversión de Autómata Finito a Expresión Regular
 * 
 * Implementa dos métodos para convertir un AF en una ER equivalente:
 * 
 * 1. MÉTODO DE ARDEN (ecuaciones):
 *    - Teorema de Arden: Si X = A·X | B, entonces X = A*·B (siempre que ε ∉ A)
 *    - Crea ecuaciones para cada estado y las resuelve algebraicamente
 * 
 * 2. MÉTODO DE ELIMINACIÓN DE ESTADOS (State Elimination):
 *    - Agrega un nuevo estado inicial y final
 *    - Elimina estados uno por uno, actualizando las transiciones
 *    - Fórmula para eliminar estado q: R(p→r) = R(p→q)·R(q→q)*·R(q→r) + R(p→r)
 *    - La ER final es la transición del estado inicial al final
 */

import { Automaton, Equation, EquationStep, Frontier } from '@/lib/types/automata';

/**
 * Genera las fronteras de un autómata
 * Una frontera es el conjunto de símbolos que van de un estado a otro
 */
export function calculateFrontiers(automaton: Automaton): Frontier[] {
  const frontiers: Frontier[] = [];

  // Para cada par de estados
  for (const fromState of automaton.states) {
    for (const toState of automaton.states) {
      // Buscar todas las transiciones desde fromState hacia toState
      const symbols = automaton.transitions
        .filter(t => t.from === fromState.id && t.to === toState.id)
        .map(t => t.symbol);

      if (symbols.length > 0) {
        // Construir expresión regular para estos símbolos
        let expression = symbols.length === 1 ? symbols[0] : `(${symbols.join('|')})`;

        frontiers.push({
          from: fromState.label,
          to: toState.label,
          symbols,
          expression,
        });
      }
    }
  }

  return frontiers;
}

/**
 * Genera el sistema de ecuaciones inicial
 * 
 * Usando el método de Arden con ecuaciones basadas en transiciones SALIENTES:
 * qi = ∑(símbolo·qj) para todas las transiciones que SALEN de qi hacia qj
 * 
 * Si qi es estado FINAL, se agrega +ε al lado derecho (representa aceptación)
 * 
 * Ejemplo del Lema de Arden en la imagen:
 * A = 1B | 0A  (transiciones que SALEN de A: con '1' va a B, con '0' se queda)
 * B = 1A | 0B | ε  (transiciones que SALEN de B, ε porque es final)
 */
export function generateEquations(automaton: Automaton, frontiers: Frontier[]): Equation[] {
  const equations: Equation[] = [];

  for (const state of automaton.states) {
    const leftSide = state.label;
    const rightSide: string[] = [];

    // Agregar términos por cada frontera que SALE de este estado
    for (const frontier of frontiers) {
      if (frontier.from === state.label) {
        // formato: símbolo·estadoDestino
        rightSide.push(`${frontier.expression}${frontier.to}`);
      }
    }

    // Si es estado FINAL, agregar ε (representa cadena aceptada)
    if (state.isFinal) {
      rightSide.push('ε');
    }

    equations.push({
      left: leftSide,
      right: rightSide.length > 0 ? rightSide.join(' | ') : '∅',
      isFinal: state.isFinal,
      isInitial: state.isInitial,
    });
  }

  return equations;
}

/**
 * Divide una expresión por unión (|) respetando paréntesis
 */
function splitByUnion(expr: string): string[] {
  const terms: string[] = [];
  let current = '';
  let depth = 0;
  
  for (let i = 0; i < expr.length; i++) {
    const char = expr[i];
    
    if (char === '(') depth++;
    else if (char === ')') depth--;
    
    if (char === '|' && depth === 0) {
      if (current.trim()) terms.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  if (current.trim()) terms.push(current.trim());
  return terms;
}

/**
 * Verifica si un término contiene una variable (estado)
 * Detecta variables como q0, q1, q2, A, B en expresiones como "aq2", "bq3", etc.
 */
function containsVariable(term: string, variable: string): boolean {
  if (!term || !variable) return false;
  
  const escaped = escapeRegExp(variable);
  // Buscar la variable que:
  // 1. No esté seguida por más dígitos (para evitar q1 matcheando en q10)
  // 2. Puede estar al final o seguida por operadores/espacios/paréntesis
  const regex = new RegExp(`${escaped}(?![0-9a-zA-Z])|${escaped}$`);
  return regex.test(term);
}

/**
 * Escapa caracteres especiales de regex
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extrae el coeficiente de un término recursivo
 * ej: "aX" -> { coefficient: "a", isPrefix: true }
 * ej: "Xa" -> { coefficient: "a", isPrefix: false }
 * ej: "aq2" -> { coefficient: "a", isPrefix: true } (para variable q2)
 */
function extractCoefficient(
  term: string, 
  variable: string
): { coefficient: string; isPrefix: boolean } | null {
  if (!containsVariable(term, variable)) return null;
  
  // Encontrar la posición de la variable
  const escaped = escapeRegExp(variable);
  const regex = new RegExp(`${escaped}(?![0-9a-zA-Z])|${escaped}$`);
  const match = regex.exec(term);
  
  if (!match) return null;
  
  const varIndex = match.index;
  const varLength = variable.length;
  
  // Verificar si la variable está al final (prefijo: αX)
  if (varIndex + varLength === term.length) {
    const coefficient = term.substring(0, varIndex).trim();
    return { coefficient: coefficient || 'ε', isPrefix: true };
  }
  
  // Verificar si la variable está al inicio (sufijo: Xα)
  if (varIndex === 0) {
    const coefficient = term.substring(varLength).trim();
    return { coefficient: coefficient || 'ε', isPrefix: false };
  }
  
  // Variable en medio - tratar como prefijo
  const prefix = term.substring(0, varIndex).trim();
  return { coefficient: prefix || 'ε', isPrefix: true };
}

/**
 * Verifica si una expresión necesita paréntesis
 */
function needsParens(expr: string): boolean {
  if (expr.length <= 1) return false;
  if (expr.startsWith('(') && expr.endsWith(')')) {
    let depth = 0;
    for (let i = 0; i < expr.length - 1; i++) {
      if (expr[i] === '(') depth++;
      else if (expr[i] === ')') depth--;
      if (depth === 0) return true;
    }
    return false;
  }
  return expr.includes('|') || expr.includes(' ');
}

/**
 * Aplica el Lema de Arden de forma robusta
 * Si X = αX | β, entonces X = α*β
 * Si X = Xα | β, entonces X = βα*
 */
function applyArdenLemmaImproved(
  rightSide: string, 
  variable: string
): { applied: boolean; result: string; alpha: string; beta: string } {
  const terms = splitByUnion(rightSide);
  
  // Separar términos recursivos y no recursivos
  const selfTerms: string[] = [];
  const otherTerms: string[] = [];
  
  for (const term of terms) {
    if (containsVariable(term, variable)) {
      selfTerms.push(term);
    } else {
      otherTerms.push(term);
    }
  }
  
  if (selfTerms.length === 0) {
    return { applied: false, result: rightSide, alpha: '', beta: '' };
  }
  
  // Extraer α de los términos recursivos
  const alphaTerms: string[] = [];
  let isPrefix = true;
  
  for (const term of selfTerms) {
    const extracted = extractCoefficient(term, variable);
    if (extracted) {
      alphaTerms.push(extracted.coefficient);
      isPrefix = extracted.isPrefix;
    }
  }
  
  // Construir α
  let alpha = alphaTerms.length === 1 
    ? alphaTerms[0] 
    : `(${alphaTerms.join('|')})`;
  
  // Construir β
  let beta = otherTerms.length === 0 
    ? 'ε' 
    : otherTerms.length === 1 
      ? otherTerms[0] 
      : `(${otherTerms.join(' | ')})`;
  
  // Aplicar Arden
  let result: string;
  const alphaStar = alpha === 'ε' ? '' : needsParens(alpha) ? `(${alpha})*` : `${alpha}*`;
  
  if (isPrefix) {
    if (beta === 'ε' && alphaStar) {
      result = alphaStar;
    } else if (!alphaStar) {
      result = beta;
    } else {
      result = `${alphaStar}${beta}`;
    }
  } else {
    if (beta === 'ε' && alphaStar) {
      result = alphaStar;
    } else if (!alphaStar) {
      result = beta;
    } else {
      result = `${beta}${alphaStar}`;
    }
  }
  
  result = simplifyRegex(result);
  
  return { applied: true, result, alpha, beta };
}

/**
 * Simplifica una expresión regular
 */
function simplifyRegex(regex: string): string {
  if (!regex) return '∅';
  
  let simplified = regex;
  
  // 1. Eliminar concatenación con ε: εa = aε = a
  simplified = simplified.replace(/ε([a-zA-Z0-9(])/g, '$1');
  simplified = simplified.replace(/([a-zA-Z0-9)])ε/g, '$1');
  simplified = simplified.replace(/^ε$/, 'ε');
  
  // 2. ∅ unido con cualquier cosa es la cosa misma: ∅|a = a
  simplified = simplified.replace(/∅\s*\|\s*/g, '');
  simplified = simplified.replace(/\s*\|\s*∅/g, '');
  
  // 3. ε* = ε
  simplified = simplified.replace(/ε\*/g, 'ε');
  
  // 4. ∅* = ε
  simplified = simplified.replace(/∅\*/g, 'ε');
  
  // 5. (a)* = a* para símbolos simples
  simplified = simplified.replace(/\(([a-zA-Z0-9])\)\*/g, '$1*');
  
  // 6. (a) = a para símbolos simples
  simplified = simplified.replace(/\(([a-zA-Z0-9])\)/g, '$1');
  
  // 7. a|a = a (eliminar duplicados en uniones)
  const terms = splitByUnion(simplified);
  const uniqueTerms = [...new Set(terms.map(t => t.trim()).filter(t => t))];
  if (uniqueTerms.length !== terms.length || terms.some(t => !t.trim())) {
    simplified = uniqueTerms.join(' | ');
  }
  
  // 8. Limpiar espacios múltiples
  simplified = simplified.replace(/\s+/g, ' ').trim();
  
  // 9. (ε) = ε
  simplified = simplified.replace(/\(ε\)/g, 'ε');
  
  // 10. Eliminar paréntesis redundantes al inicio/final
  if (simplified.startsWith('(') && simplified.endsWith(')')) {
    let depth = 0;
    let canRemove = true;
    for (let i = 0; i < simplified.length - 1; i++) {
      if (simplified[i] === '(') depth++;
      else if (simplified[i] === ')') depth--;
      if (depth === 0) { canRemove = false; break; }
    }
    if (canRemove) {
      simplified = simplified.slice(1, -1);
    }
  }
  
  return simplified || '∅';
}

/**
 * Sustituye una variable en todas las ecuaciones
 */
function substituteVariable(
  equations: Equation[],
  variable: string,
  replacement: string
): Equation[] {
  return equations.map(eq => {
    if (eq.left === variable) {
      return eq; // No sustituir en su propia ecuación
    }

    // Sustituir en el lado derecho usando la misma lógica de detección
    const escaped = escapeRegExp(variable);
    const regex = new RegExp(`${escaped}(?![0-9a-zA-Z])`, 'g');
    
    // Envolver replacement en paréntesis si es necesario
    const needsWrap = replacement.includes('|') || replacement.includes(' ');
    const wrappedReplacement = needsWrap ? `(${replacement})` : replacement;
    
    let newRight = eq.right.replace(regex, wrappedReplacement);
    newRight = simplifyRegex(newRight);

    return {
      ...eq,
      right: newRight,
    };
  });
}

/**
 * Reemplaza una variable en una expresión
 */
function replaceVariableInExpr(expr: string, variable: string, replacement: string): string {
  const escaped = escapeRegExp(variable);
  const regex = new RegExp(`${escaped}(?![0-9a-zA-Z])`, 'g');
  const needsWrap = replacement.includes('|') || replacement.includes(' ');
  const wrappedReplacement = needsWrap ? `(${replacement})` : replacement;
  return expr.replace(regex, wrappedReplacement);
}

/**
 * Resuelve el sistema de ecuaciones paso a paso usando el método de Arden
 * Procesa estados en orden descendente (qN -> q0) para eliminar dependencias
 */
export function solveEquations(
  equations: Equation[],
  frontiers: Frontier[]
): { steps: EquationStep[]; finalRegex: string } {
  const steps: EquationStep[] = [];
  let currentEquations = equations.map(eq => ({ ...eq }));
  let stepNumber = 1;

  // Paso 0: Sistema inicial
  steps.push({
    stepNumber: 0,
    description: 'Sistema de ecuaciones inicial',
    equations: currentEquations.map(eq => {
      let prefix = '';
      if (eq.isInitial) prefix = '→';
      if (eq.isFinal) prefix += '*';
      return `${prefix}${eq.left} = ${eq.right}`;
    }),
    action: 'Inicio',
    highlightedVariable: '',
    explanation: 'Ecuaciones generadas a partir del autómata.\n→: estado inicial\n*: estado final\nε en el lado derecho indica que el estado es final (acepta la cadena vacía)',
  });

  // Obtener todos los nombres de variables (estados)
  const allVariables = currentEquations.map(eq => eq.left);
  
  // Ordenar estados en orden descendente por número (q3, q2, q1, q0)
  // Esto asegura que eliminamos dependencias de mayor a menor
  const sortedVariables = [...allVariables].sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.replace(/\D/g, '')) || 0;
    return numB - numA; // Descendente
  });
  
  // Encontrar el estado inicial (objetivo final)
  const initialState = currentEquations.find(eq => eq.isInitial);
  const initialVariable = initialState?.left || sortedVariables[sortedVariables.length - 1];
  
  // Mover el estado inicial al final del procesamiento
  const processingOrder = sortedVariables.filter(v => v !== initialVariable);
  processingOrder.push(initialVariable);

  steps.push({
    stepNumber: stepNumber++,
    description: 'Orden de procesamiento determinado',
    equations: [`Orden: ${processingOrder.join(' → ')}`],
    action: 'Ordenamiento',
    highlightedVariable: '',
    explanation: `Se procesarán los estados en orden descendente, dejando el estado inicial (${initialVariable}) para el final.\nEsto permite eliminar todas las dependencias progresivamente.`,
  });

  const resolvedExpressions = new Map<string, string>();

  // Resolver cada ecuación en orden
  for (const variable of processingOrder) {
    let eq = currentEquations.find(e => e.left === variable)!;
    let currentRight = eq.right;
    
    // Paso 1: Sustituir todas las variables ya resueltas en esta ecuación
    for (const [resolvedVar, resolvedExpr] of resolvedExpressions) {
      if (containsVariable(currentRight, resolvedVar)) {
        currentRight = replaceVariableInExpr(currentRight, resolvedVar, resolvedExpr);
        currentRight = simplifyRegex(currentRight);
      }
    }
    
    // Actualizar la ecuación con las sustituciones
    if (currentRight !== eq.right) {
      currentEquations = currentEquations.map(e =>
        e.left === variable ? { ...e, right: currentRight } : e
      );
      
      steps.push({
        stepNumber: stepNumber++,
        description: `Sustituir variables resueltas en ${variable}`,
        equations: currentEquations.map(e => `${e.left} = ${e.right}`),
        action: 'Sustitución',
        highlightedVariable: variable,
        explanation: `Reemplazar variables ya resueltas en la ecuación de ${variable}`,
      });
      
      eq = currentEquations.find(e => e.left === variable)!;
      currentRight = eq.right;
    }
    
    // Paso 2: Aplicar Arden si hay recursión (la variable aparece en su propia ecuación)
    if (containsVariable(currentRight, variable)) {
      const ardenResult = applyArdenLemmaImproved(currentRight, variable);
      
      if (ardenResult.applied) {
        currentRight = ardenResult.result;
        currentEquations = currentEquations.map(e =>
          e.left === variable ? { ...e, right: currentRight } : e
        );
        
        steps.push({
          stepNumber: stepNumber++,
          description: `Aplicar Lema de Arden a ${variable}`,
          equations: currentEquations.map(e => `${e.left} = ${e.right}`),
          action: 'Arden',
          highlightedVariable: variable,
          explanation: `${variable} = α${variable} | β donde α = ${ardenResult.alpha}, β = ${ardenResult.beta}\nPor Arden: ${variable} = α*β = ${ardenResult.result}`,
        });
      }
    }
    
    // Paso 3: Verificar que no queden otras variables no resueltas
    // Si quedan, sustituir iterativamente (de mayor a menor índice)
    let iterations = 0;
    const maxIterations = allVariables.length * 3;
    
    // Ordenar las otras variables para sustituir de mayor a menor
    const otherVarsSorted = allVariables
      .filter(v => v !== variable)
      .sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.replace(/\D/g, '')) || 0;
        return numB - numA;
      });
    
    while (iterations < maxIterations && containsAnyVariable(currentRight, otherVarsSorted)) {
      let changed = false;
      
      for (const otherVar of otherVarsSorted) {
        if (containsVariable(currentRight, otherVar)) {
          // Buscar la expresión de esta variable
          const resolvedExpr = resolvedExpressions.get(otherVar);
          const otherEq = currentEquations.find(e => e.left === otherVar);
          const replacement = resolvedExpr || otherEq?.right;
          
          if (replacement && replacement !== '∅' && replacement !== otherVar) {
            const newRight = replaceVariableInExpr(currentRight, otherVar, replacement);
            
            if (newRight !== currentRight) {
              currentRight = simplifyRegex(newRight);
              changed = true;
              
              steps.push({
                stepNumber: stepNumber++,
                description: `Sustituir ${otherVar} en ${variable}`,
                equations: [`${variable} = ${currentRight}`],
                action: 'Sustitución',
                highlightedVariable: variable,
                explanation: `Reemplazar ${otherVar} por (${replacement})`,
              });
              
              // Verificar si se creó recursión después de la sustitución
              if (containsVariable(currentRight, variable)) {
                const ardenResult = applyArdenLemmaImproved(currentRight, variable);
                if (ardenResult.applied) {
                  currentRight = ardenResult.result;
                  
                  steps.push({
                    stepNumber: stepNumber++,
                    description: `Aplicar Arden a ${variable} (recursión creada)`,
                    equations: [`${variable} = ${currentRight}`],
                    action: 'Arden',
                    highlightedVariable: variable,
                    explanation: `Recursión detectada, aplicar Arden`,
                  });
                }
              }
            }
          }
        }
      }
      
      if (!changed) break;
      iterations++;
    }
    
    // Actualizar ecuación final para esta variable
    currentRight = simplifyRegex(currentRight);
    currentEquations = currentEquations.map(e =>
      e.left === variable ? { ...e, right: currentRight } : e
    );
    
    // Guardar la expresión resuelta
    resolvedExpressions.set(variable, currentRight);
    
    // Mostrar paso de resolución final
    if (!containsAnyVariable(currentRight, allVariables) || variable === initialVariable) {
      steps.push({
        stepNumber: stepNumber++,
        description: `${variable} resuelto completamente`,
        equations: currentEquations.map(e => `${e.left} = ${e.right}`),
        action: 'Resolución',
        highlightedVariable: variable,
        explanation: `La ecuación de ${variable} ya no contiene dependencias de otros estados: ${variable} = ${currentRight}`,
      });
    }
  }

  // Obtener la expresión final del estado inicial
  let finalRegex = resolvedExpressions.get(initialVariable) || '∅';
  
  // Verificación final: asegurar que no queden variables
  let finalIterations = 0;
  while (containsAnyVariable(finalRegex, allVariables) && finalIterations < 10) {
    for (const [varName, varExpr] of resolvedExpressions) {
      if (containsVariable(finalRegex, varName)) {
        finalRegex = replaceVariableInExpr(finalRegex, varName, varExpr);
        finalRegex = simplifyRegex(finalRegex);
      }
    }
    finalIterations++;
  }
  
  finalRegex = simplifyRegex(finalRegex);

  // Verificar si aún quedan variables (error en el algoritmo)
  if (containsAnyVariable(finalRegex, allVariables)) {
    steps.push({
      stepNumber: stepNumber++,
      description: 'Advertencia: Variables no resueltas',
      equations: [`ER parcial = ${finalRegex}`],
      action: 'Advertencia',
      highlightedVariable: '',
      explanation: 'La expresión aún contiene referencias a estados. Esto puede indicar un ciclo no resuelto.',
    });
  }

  steps.push({
    stepNumber: stepNumber,
    description: 'Expresión regular final',
    equations: [`ER = ${finalRegex}`],
    action: 'Final',
    highlightedVariable: '',
    explanation: 'Expresión regular equivalente al autómata finito (derivada del estado inicial)',
  });

  return { steps, finalRegex };
}

/**
 * Verifica si una expresión contiene alguna de las variables dadas
 */
function containsAnyVariable(expr: string, variables: string[]): boolean {
  return variables.some(v => containsVariable(expr, v));
}

/**
 * Convierte un autómata finito a expresión regular (función principal)
 */
export function afToER(automaton: Automaton): {
  regex: string;
  steps: EquationStep[];
  frontiers: Frontier[];
  equations: Equation[];
} {
  // Validar que el autómata tenga lo necesario
  if (!automaton.states || automaton.states.length === 0) {
    throw new Error('El autómata debe tener al menos un estado');
  }
  
  const hasInitial = automaton.states.some(s => s.isInitial);
  const hasFinal = automaton.states.some(s => s.isFinal);
  
  if (!hasInitial) {
    throw new Error('El autómata debe tener un estado inicial');
  }
  
  if (!hasFinal) {
    throw new Error('El autómata debe tener al menos un estado final');
  }

  // 1. Calcular fronteras
  const frontiers = calculateFrontiers(automaton);

  // 2. Generar sistema de ecuaciones
  const equations = generateEquations(automaton, frontiers);

  // 3. Resolver ecuaciones
  const { steps, finalRegex } = solveEquations(equations, frontiers);

  return {
    regex: finalRegex,
    steps,
    frontiers,
    equations,
  };
}

/**
 * Formatea las fronteras para visualización
 */
export function formatFrontiers(frontiers: Frontier[]): string {
  return frontiers
    .map(f => `δ(${f.from}, ${f.expression}) = ${f.to}`)
    .join('\n');
}

/**
 * Formatea las ecuaciones para visualización
 */
export function formatEquations(equations: Equation[]): string {
  return equations
    .map(eq => {
      let prefix = '';
      if (eq.isInitial) prefix = '→';
      if (eq.isFinal) prefix += '*';
      return `${prefix}${eq.left} = ${eq.right}`;
    })
    .join('\n');
}

/**
 * Verifica si dos expresiones regulares son equivalentes
 * (Implementación simplificada - solo compara strings normalizados)
 */
export function areRegexEquivalent(regex1: string, regex2: string): boolean {
  const simplified1 = simplifyRegex(regex1);
  const simplified2 = simplifyRegex(regex2);
  return simplified1 === simplified2;
}

/**
 * Genera un autómata de ejemplo para pruebas
 */
export function createExampleAutomaton(): Automaton {
  return {
    id: 'example-af',
    type: 'DFA',
    alphabet: ['0', '1'],
    states: [
      { id: 'A', label: 'A', isInitial: true, isFinal: false },
      { id: 'B', label: 'B', isInitial: false, isFinal: true },
    ],
    transitions: [
      { id: 't1', from: 'A', to: 'A', symbol: '0' },
      { id: 't2', from: 'A', to: 'B', symbol: '1' },
      { id: 't3', from: 'B', to: 'A', symbol: '1' },
      { id: 't4', from: 'B', to: 'B', symbol: '0' },
    ],
  };
}

// =============================================================================
// MÉTODO DE ELIMINACIÓN DE ESTADOS (STATE ELIMINATION)
// =============================================================================

/**
 * Representación de una transición con expresión regular
 * Usado en el método de eliminación de estados
 */
interface RegexTransition {
  from: string;
  to: string;
  regex: string;
}

/**
 * Paso en el proceso de eliminación de estados
 */
interface StateEliminationStep {
  stepNumber: number;
  description: string;
  action: 'init' | 'add-states' | 'eliminate' | 'final';
  eliminatedState?: string;
  transitions: RegexTransition[];
  currentStates: string[];
  explanation: string;
}

/**
 * Combina dos expresiones regulares con unión
 */
function combineWithUnion(regex1: string, regex2: string): string {
  if (!regex1 || regex1 === '∅') return regex2 || '∅';
  if (!regex2 || regex2 === '∅') return regex1 || '∅';
  if (regex1 === regex2) return regex1;
  
  return `(${regex1}|${regex2})`;
}

/**
 * Combina dos expresiones regulares con concatenación
 */
function combineWithConcat(regex1: string, regex2: string): string {
  if (!regex1 || regex1 === '∅') return '∅';
  if (!regex2 || regex2 === '∅') return '∅';
  if (regex1 === 'ε') return regex2;
  if (regex2 === 'ε') return regex1;
  
  const r1 = needsParens(regex1) ? `(${regex1})` : regex1;
  const r2 = needsParens(regex2) ? `(${regex2})` : regex2;
  
  return `${r1}${r2}`;
}

/**
 * Aplica la estrella de Kleene a una expresión
 */
function applyKleeneStar(regex: string): string {
  if (!regex || regex === '∅') return 'ε';
  if (regex === 'ε') return 'ε';
  
  const needsWrap = regex.length > 1 && !regex.startsWith('(');
  return needsWrap ? `(${regex})*` : `${regex}*`;
}

/**
 * Busca una transición entre dos estados
 */
function findTransition(
  transitions: RegexTransition[],
  from: string,
  to: string
): RegexTransition | undefined {
  return transitions.find(t => t.from === from && t.to === to);
}

/**
 * Actualiza o agrega una transición
 */
function updateTransition(
  transitions: RegexTransition[],
  from: string,
  to: string,
  newRegex: string
): RegexTransition[] {
  const existing = findTransition(transitions, from, to);
  const simplified = simplifyRegex(newRegex);
  
  if (existing) {
    return transitions.map(t =>
      t.from === from && t.to === to ? { ...t, regex: simplified } : t
    );
  } else {
    return [...transitions, { from, to, regex: simplified }];
  }
}

/**
 * Elimina transiciones que involucran un estado
 */
function removeTransitionsWithState(
  transitions: RegexTransition[],
  state: string
): RegexTransition[] {
  return transitions.filter(t => t.from !== state && t.to !== state);
}

/**
 * Convierte AF a ER usando el método de eliminación de estados
 * 
 * Algoritmo:
 * 1. Agregar nuevo estado inicial I con transición ε al estado inicial original
 * 2. Agregar nuevo estado final F con transiciones ε desde todos los estados finales
 * 3. Eliminar estados uno por uno (excepto I y F) usando la fórmula:
 *    R(p→r) = R(p→q)·R(q→q)*·R(q→r) + R(p→r)
 *    donde q es el estado a eliminar
 * 4. La ER final es R(I→F)
 */
export function afToERByStateElimination(automaton: Automaton): {
  regex: string;
  steps: StateEliminationStep[];
  ardenEquations: Equation[];
} {
  const steps: StateEliminationStep[] = [];
  let stepNumber = 1;

  // Generar ecuaciones de Arden para referencia
  const frontiers = calculateFrontiers(automaton);
  const ardenEquations = generateEquations(automaton, frontiers);

  // Paso 0: Mostrar ecuaciones de Arden
  steps.push({
    stepNumber: 0,
    description: 'Ecuaciones de Arden (referencia)',
    action: 'init',
    transitions: [],
    currentStates: [],
    explanation: `Ecuaciones generadas por el método de Arden:\n${formatEquations(ardenEquations)}\n\nAhora aplicaremos el método de eliminación de estados...`,
  });

  // Paso 1: Convertir transiciones a formato regex
  let transitions: RegexTransition[] = [];
  
  for (const t of automaton.transitions) {
    const existing = findTransition(transitions, t.from, t.to);
    if (existing) {
      transitions = updateTransition(
        transitions,
        t.from,
        t.to,
        combineWithUnion(existing.regex, t.symbol)
      );
    } else {
      transitions.push({ from: t.from, to: t.to, regex: t.symbol });
    }
  }

  // Agregar self-loops vacíos donde no existan
  for (const state of automaton.states) {
    if (!findTransition(transitions, state.id, state.id)) {
      transitions.push({ from: state.id, to: state.id, regex: '∅' });
    }
  }

  let currentStates = automaton.states.map(s => s.id);

  steps.push({
    stepNumber: stepNumber++,
    description: 'Transiciones iniciales del autómata',
    action: 'init',
    transitions: [...transitions],
    currentStates: [...currentStates],
    explanation: 'Representación inicial del autómata con transiciones convertidas a expresiones regulares.',
  });

  // Paso 2: Agregar nuevo estado inicial I
  const newInitialState = 'I';
  const originalInitialState = automaton.states.find(s => s.isInitial)!.id;
  
  transitions.push({
    from: newInitialState,
    to: originalInitialState,
    regex: 'ε',
  });
  
  currentStates = [newInitialState, ...currentStates];

  steps.push({
    stepNumber: stepNumber++,
    description: 'Agregar nuevo estado inicial I',
    action: 'add-states',
    transitions: [...transitions],
    currentStates: [...currentStates],
    explanation: `Se agrega un nuevo estado inicial "${newInitialState}" con transición ε hacia el estado inicial original "${originalInitialState}".`,
  });

  // Paso 3: Agregar nuevo estado final F
  const newFinalState = 'F';
  const originalFinalStates = automaton.states.filter(s => s.isFinal).map(s => s.id);
  
  for (const finalState of originalFinalStates) {
    transitions.push({
      from: finalState,
      to: newFinalState,
      regex: 'ε',
    });
  }
  
  currentStates.push(newFinalState);

  steps.push({
    stepNumber: stepNumber++,
    description: 'Agregar nuevo estado final F',
    action: 'add-states',
    transitions: [...transitions],
    currentStates: [...currentStates],
    explanation: `Se agrega un nuevo estado final "${newFinalState}" con transiciones ε desde los estados finales originales: ${originalFinalStates.join(', ')}.`,
  });

  // Paso 4: Eliminar estados uno por uno (excepto I y F)
  const statesToEliminate = currentStates.filter(
    s => s !== newInitialState && s !== newFinalState
  );

  for (const stateToEliminate of statesToEliminate) {
    // Obtener self-loop del estado a eliminar
    const selfLoop = findTransition(transitions, stateToEliminate, stateToEliminate);
    const selfLoopRegex = selfLoop ? selfLoop.regex : '∅';
    const selfLoopStar = selfLoopRegex !== '∅' ? applyKleeneStar(selfLoopRegex) : 'ε';

    // Encontrar todos los estados que apuntan a stateToEliminate
    const incomingStates = new Set(
      transitions
        .filter(t => t.to === stateToEliminate && t.from !== stateToEliminate)
        .map(t => t.from)
    );

    // Encontrar todos los estados a los que apunta stateToEliminate
    const outgoingStates = new Set(
      transitions
        .filter(t => t.from === stateToEliminate && t.to !== stateToEliminate)
        .map(t => t.to)
    );

    // Para cada par (p, r) donde p→q y q→r, crear/actualizar p→r
    // Fórmula: R(p→r) = R(p→q)·R(q→q)*·R(q→r) + R(p→r)
    for (const p of incomingStates) {
      for (const r of outgoingStates) {
        const pToQ = findTransition(transitions, p, stateToEliminate)?.regex || '∅';
        const qToR = findTransition(transitions, stateToEliminate, r)?.regex || '∅';
        const pToR = findTransition(transitions, p, r)?.regex || '∅';

        // Nueva expresión: R(p→q)·R(q→q)*·R(q→r)
        let newPath = combineWithConcat(pToQ, selfLoopStar);
        newPath = combineWithConcat(newPath, qToR);

        // Combinar con la ruta existente: + R(p→r)
        const combinedRegex = combineWithUnion(newPath, pToR);

        transitions = updateTransition(transitions, p, r, combinedRegex);
      }
    }

    // Eliminar todas las transiciones que involucran el estado
    transitions = removeTransitionsWithState(transitions, stateToEliminate);
    currentStates = currentStates.filter(s => s !== stateToEliminate);

    steps.push({
      stepNumber: stepNumber++,
      description: `Eliminar estado ${stateToEliminate}`,
      action: 'eliminate',
      eliminatedState: stateToEliminate,
      transitions: [...transitions],
      currentStates: [...currentStates],
      explanation: `Eliminación del estado "${stateToEliminate}":\n- Self-loop: ${selfLoopRegex} → ${selfLoopStar}\n- Se actualizan las transiciones usando R(p→r) = R(p→q)·R(q→q)*·R(q→r) + R(p→r)\n- Estados entrantes: ${[...incomingStates].join(', ') || 'ninguno'}\n- Estados salientes: ${[...outgoingStates].join(', ') || 'ninguno'}`,
    });
  }

  // Paso 5: Obtener la expresión regular final (I→F)
  const finalTransition = findTransition(transitions, newInitialState, newFinalState);
  const finalRegex = finalTransition ? simplifyRegex(finalTransition.regex) : '∅';

  steps.push({
    stepNumber: stepNumber,
    description: 'Expresión regular final',
    action: 'final',
    transitions: [...transitions],
    currentStates: [...currentStates],
    explanation: `La expresión regular equivalente es la transición de ${newInitialState} → ${newFinalState}:\nER = ${finalRegex}`,
  });

  return {
    regex: finalRegex,
    steps,
    ardenEquations,
  };
}

/**
 * Función principal que usa ambos métodos y compara resultados
 */
export function afToERBothMethods(automaton: Automaton): {
  ardenResult: {
    regex: string;
    steps: EquationStep[];
    frontiers: Frontier[];
    equations: Equation[];
  };
  stateEliminationResult: {
    regex: string;
    steps: StateEliminationStep[];
    ardenEquations: Equation[];
  };
  equivalent: boolean;
} {
  const ardenResult = afToER(automaton);
  const stateEliminationResult = afToERByStateElimination(automaton);

  const equivalent = areRegexEquivalent(ardenResult.regex, stateEliminationResult.regex);

  return {
    ardenResult,
    stateEliminationResult,
    equivalent,
  };
}

/**
 * Conversión de Autómata Finito a Expresión Regular
 * 
 * Implementa el método de Arden (ecuaciones) para convertir un AF en una ER equivalente.
 * 
 * Teorema de Arden: Si X = A·X | B, entonces X = A*·B
 * (siempre que ε ∉ A, la solución es única)
 * 
 * Algoritmo:
 * 1. Crear una ecuación para cada estado: qi = ∑(aij·qj) donde aij son los símbolos de transición
 * 2. El estado inicial tiene +ε si es punto de partida
 * 3. Resolver el sistema sustituyendo variables y aplicando Arden para eliminar recursiones
 * 4. La ER final es la unión de las expresiones de los estados finales
 * 
 * Lema de Arden: Si X = αX | β, entonces X = α*β
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

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
 * Verifica si un término contiene una variable
 */
function containsVariable(term: string, variable: string): boolean {
  const regex = new RegExp(`\\b${escapeRegExp(variable)}\\b`);
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
 */
function extractCoefficient(
  term: string, 
  variable: string
): { coefficient: string; isPrefix: boolean } | null {
  const varRegex = new RegExp(`\\b${escapeRegExp(variable)}\\b`);
  const match = varRegex.exec(term);
  
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

    // Sustituir en el lado derecho
    const regex = new RegExp(`\\b${escapeRegExp(variable)}\\b`, 'g');
    
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
 * Resuelve el sistema de ecuaciones paso a paso usando el método de Arden
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

  // Obtener orden de resolución:
  // Resolver primero los estados que NO son iniciales, dejando el inicial para el final
  // Esto permite que la expresión del estado inicial contenga todas las sustituciones
  const stateOrder = [
    // Primero: estados no iniciales y no finales
    ...currentEquations.filter(eq => !eq.isFinal && !eq.isInitial),
    // Segundo: estados finales que no son iniciales
    ...currentEquations.filter(eq => eq.isFinal && !eq.isInitial),
    // Último: el estado inicial (puede ser final también)
    ...currentEquations.filter(eq => eq.isInitial),
  ];

  const resolvedVars = new Set<string>();

  // Resolver cada ecuación
  for (const targetEq of stateOrder) {
    const variable = targetEq.left;
    
    if (resolvedVars.has(variable)) continue;
    
    let eq = currentEquations.find(e => e.left === variable)!;
    
    // Verificar si tiene recursión
    if (containsVariable(eq.right, variable)) {
      const ardenResult = applyArdenLemmaImproved(eq.right, variable);
      
      if (ardenResult.applied) {
        currentEquations = currentEquations.map(e =>
          e.left === variable ? { ...e, right: ardenResult.result } : e
        );
        
        steps.push({
          stepNumber: stepNumber++,
          description: `Aplicar Lema de Arden a ${variable}`,
          equations: currentEquations.map(e => `${e.left} = ${e.right}`),
          action: 'Arden',
          highlightedVariable: variable,
          explanation: `${variable} = α${variable} | β donde α = ${ardenResult.alpha}, β = ${ardenResult.beta}\nPor Arden: ${variable} = α*β = ${ardenResult.result}`,
        });
        
        eq = currentEquations.find(e => e.left === variable)!;
      }
    }
    
    // Sustituir esta variable en todas las demás ecuaciones
    const replacement = eq.right;
    
    if (replacement !== '∅' && replacement !== variable) {
      currentEquations = substituteVariable(currentEquations, variable, replacement);
      
      steps.push({
        stepNumber: stepNumber++,
        description: `Sustituir ${variable} en las demás ecuaciones`,
        equations: currentEquations.map(e => `${e.left} = ${e.right}`),
        action: 'Sustitución',
        highlightedVariable: variable,
        explanation: `Reemplazar ${variable} por (${replacement}) en todas las ecuaciones`,
      });
    }
    
    resolvedVars.add(variable);
    
    // Verificar si alguna ecuación ganó recursión después de la sustitución
    for (const checkEq of currentEquations) {
      if (!resolvedVars.has(checkEq.left) && containsVariable(checkEq.right, checkEq.left)) {
        const ardenResult = applyArdenLemmaImproved(checkEq.right, checkEq.left);
        
        if (ardenResult.applied) {
          currentEquations = currentEquations.map(e =>
            e.left === checkEq.left ? { ...e, right: ardenResult.result } : e
          );
          
          steps.push({
            stepNumber: stepNumber++,
            description: `Aplicar Lema de Arden a ${checkEq.left} (nueva recursión)`,
            equations: currentEquations.map(e => `${e.left} = ${e.right}`),
            action: 'Arden',
            highlightedVariable: checkEq.left,
            explanation: `${checkEq.left} adquirió recursión tras la sustitución. Aplicar Arden.`,
          });
        }
      }
    }
  }

  // Determinar la expresión regular final
  // Con el método de transiciones salientes + ε en finales, la ER es la del estado inicial
  let finalRegex = '';
  const initialState = currentEquations.find(eq => eq.isInitial);
  
  if (initialState) {
    finalRegex = initialState.right;
  } else {
    // Fallback: unir estados finales
    const finalStates = currentEquations.filter(eq => eq.isFinal);
    if (finalStates.length === 1) {
      finalRegex = finalStates[0].right;
    } else if (finalStates.length > 1) {
      const expressions = finalStates.map(eq => eq.right).filter(r => r !== '∅');
      finalRegex = expressions.length === 1 ? expressions[0] : `(${expressions.join(' | ')})`;
    } else {
      finalRegex = '∅';
    }
  }

  finalRegex = simplifyRegex(finalRegex);

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

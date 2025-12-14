/**
 * Conversión de Autómata Finito a Expresión Regular
 * 
 * Implementa el método de Arden (ecuaciones) para convertir un AF en una ER equivalente.
 * 
 * Pasos del algoritmo:
 * 1. Para cada estado, crear una ecuación que describa cómo se alcanza
 * 2. Calcular fronteras (símbolos que llevan de un estado a otro)
 * 3. Resolver el sistema de ecuaciones usando sustituciones
 * 4. Aplicar el Lema de Arden para eliminar recursiones
 * 5. Obtener la expresión regular final
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
        let expression = symbols.length === 1 ? symbols[0] : symbols.join('|');
        
        // Si hay múltiples símbolos, agregar paréntesis
        if (symbols.length > 1) {
          expression = `(${expression})`;
        }

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
 */
export function generateEquations(automaton: Automaton, frontiers: Frontier[]): Equation[] {
  const equations: Equation[] = [];

  for (const state of automaton.states) {
    // Ecuación para este estado
    const leftSide = state.label;
    const rightSide: string[] = [];

    // Agregar términos por cada frontera que llega a este estado
    for (const frontier of frontiers) {
      if (frontier.to === state.label) {
        // Si viene del mismo estado (auto-loop)
        if (frontier.from === state.label) {
          rightSide.push(`${frontier.expression}${state.label}`);
        } else {
          rightSide.push(`${frontier.expression}${frontier.from}`);
        }
      }
    }

    // Si es estado inicial, agregar ε
    if (state.isInitial) {
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
 * Aplica el Lema de Arden a una ecuación
 * Si X = αX | β, entonces X = α*β
 */
function applyArdenLemma(equation: string, variable: string): string {
  // Buscar patrones de la forma: variable = ...variable | ...
  const regex = new RegExp(`${variable}\\s*=\\s*([^|]+)${variable}\\s*\\|\\s*(.+)`, 'g');
  const match = regex.exec(equation);

  if (match) {
    const alpha = match[1].trim();
    const beta = match[2].trim();
    
    // Aplicar Arden: X = α*β
    let result = `(${alpha})*${beta}`;
    
    // Simplificar si es posible
    result = simplifyRegex(result);
    
    return `${variable} = ${result}`;
  }

  return equation;
}

/**
 * Simplifica una expresión regular
 */
function simplifyRegex(regex: string): string {
  let simplified = regex;

  // Reglas de simplificación
  // 1. ε concatenado con cualquier cosa es la cosa misma: εa = a
  simplified = simplified.replace(/ε\./g, '').replace(/\.ε/g, '');
  
  // 2. ∅ unido con cualquier cosa es la cosa misma: ∅|a = a
  simplified = simplified.replace(/∅\|/g, '').replace(/\|∅/g, '');
  
  // 3. ε* = ε
  simplified = simplified.replace(/ε\*/g, 'ε');
  
  // 4. Eliminar paréntesis innecesarios
  simplified = simplified.replace(/\(([a-z])\)/g, '$1');

  // 5. a|a = a
  const parts = simplified.split('|');
  const uniqueParts = [...new Set(parts)];
  if (uniqueParts.length < parts.length) {
    simplified = uniqueParts.join('|');
  }

  return simplified;
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
    const regex = new RegExp(`\\b${variable}\\b`, 'g');
    let newRight = eq.right.replace(regex, `(${replacement})`);
    newRight = simplifyRegex(newRight);

    return {
      ...eq,
      right: newRight,
    };
  });
}

/**
 * Resuelve el sistema de ecuaciones paso a paso
 */
export function solveEquations(
  equations: Equation[],
  frontiers: Frontier[]
): { steps: EquationStep[]; finalRegex: string } {
  const steps: EquationStep[] = [];
  let currentEquations = [...equations];
  let stepNumber = 1;

  // Paso inicial
  steps.push({
    stepNumber: 0,
    description: 'Sistema de ecuaciones inicial',
    equations: currentEquations.map(eq => `${eq.left} = ${eq.right}`),
    action: 'Inicio',
    highlightedVariable: '',
  });

  // Encontrar estados no finales (resolver primero)
  const nonFinalStates = currentEquations.filter(eq => !eq.isFinal && !eq.isInitial);
  const finalStates = currentEquations.filter(eq => eq.isFinal);

  // Resolver ecuaciones de estados no finales primero
  for (const equation of nonFinalStates) {
    // Verificar si tiene recursión (aparece en su propio lado derecho)
    if (equation.right.includes(equation.left)) {
      // Aplicar Lema de Arden
      const eqString = `${equation.left} = ${equation.right}`;
      const resolved = applyArdenLemma(eqString, equation.left);
      const newRight = resolved.split(' = ')[1];

      // Actualizar ecuación
      currentEquations = currentEquations.map(eq =>
        eq.left === equation.left ? { ...eq, right: newRight } : eq
      );

      steps.push({
        stepNumber: stepNumber++,
        description: `Aplicar Lema de Arden a ${equation.left}`,
        equations: currentEquations.map(eq => `${eq.left} = ${eq.right}`),
        action: 'Arden',
        highlightedVariable: equation.left,
        explanation: `${equation.left} tiene recursión, se aplica Arden: X = αX | β ⇒ X = α*β`,
      });
    }

    // Sustituir esta variable en todas las demás ecuaciones
    const replacement = equation.right;
    currentEquations = substituteVariable(currentEquations, equation.left, replacement);

    steps.push({
      stepNumber: stepNumber++,
      description: `Sustituir ${equation.left} en las demás ecuaciones`,
      equations: currentEquations.map(eq => `${eq.left} = ${eq.right}`),
      action: 'Sustitución',
      highlightedVariable: equation.left,
      explanation: `Reemplazar ${equation.left} por (${replacement})`,
    });

    // Eliminar la ecuación sustituida (opcional, para simplificar)
    // currentEquations = currentEquations.filter(eq => eq.left !== equation.left);
  }

  // Resolver ecuaciones de estados finales
  for (const equation of finalStates) {
    if (equation.right.includes(equation.left)) {
      const eqString = `${equation.left} = ${equation.right}`;
      const resolved = applyArdenLemma(eqString, equation.left);
      const newRight = resolved.split(' = ')[1];

      currentEquations = currentEquations.map(eq =>
        eq.left === equation.left ? { ...eq, right: newRight } : eq
      );

      steps.push({
        stepNumber: stepNumber++,
        description: `Aplicar Lema de Arden a estado final ${equation.left}`,
        equations: currentEquations.map(eq => `${eq.left} = ${eq.right}`),
        action: 'Arden',
        highlightedVariable: equation.left,
        explanation: `Estado final ${equation.left} resuelto con Arden`,
      });
    }
  }

  // La expresión regular final es la del estado inicial o la unión de los estados finales
  let finalRegex = '';
  const initialEquation = currentEquations.find(eq => eq.isInitial);
  
  if (initialEquation) {
    finalRegex = initialEquation.right;
  } else {
    // Si no hay estado inicial marcado, tomar los estados finales
    const finalExpressions = currentEquations
      .filter(eq => eq.isFinal)
      .map(eq => eq.right);
    finalRegex = finalExpressions.join(' | ');
  }

  // Simplificar expresión final
  finalRegex = simplifyRegex(finalRegex);

  steps.push({
    stepNumber: stepNumber++,
    description: 'Expresión regular final',
    equations: [`ER = ${finalRegex}`],
    action: 'Final',
    highlightedVariable: '',
    explanation: 'Expresión regular equivalente al autómata',
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
      if (eq.isInitial) prefix = '(inicial) ';
      if (eq.isFinal) prefix += '(final) ';
      return `${prefix}${eq.left} = ${eq.right}`;
    })
    .join('\n');
}

/**
 * Verifica si dos expresiones regulares son equivalentes
 * (Implementación simplificada - solo compara strings)
 */
export function areRegexEquivalent(regex1: string, regex2: string): boolean {
  // Simplificar ambas expresiones
  const simplified1 = simplifyRegex(regex1);
  const simplified2 = simplifyRegex(regex2);

  // Comparar
  return simplified1 === simplified2;
}

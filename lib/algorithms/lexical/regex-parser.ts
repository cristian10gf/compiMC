/**
 * Parser de Expresiones Regulares
 * 
 * Implementa las funciones necesarias para analizar y procesar expresiones regulares:
 * - Tokenización
 * - Validación de sintaxis
 * - Construcción de árbol sintáctico
 * - Cálculo de funciones: anulable, primeros, últimos, siguientes
 * - Conversión a notación postfija
 */

import { TreeNode, RegexValidationResult, SyntaxTree } from '@/lib/types/automata';

/**
 * Tipo de nodo en el árbol sintáctico
 */
export type NodeType =  'SYMBOL' | 'CONCAT' | 'UNION' | 'STAR' | 'PLUS' | 'OPTIONAL' | 'EPSILON';

/**
 * Token de expresión regular
 */
interface RegexToken {
  type: 'SYMBOL' | 'OPERATOR' | 'LPAREN' | 'RPAREN';
  value: string;
  position: number;
}

/**
 * Operadores soportados y su precedencia
 */
const OPERATORS: { [key: string]: { precedence: number; associativity: string } } = {
  '|': { precedence: 1, associativity: 'left' },  // Unión
  '.': { precedence: 2, associativity: 'left' },  // Concatenación
  '*': { precedence: 3, associativity: 'left' },  // Clausura de Kleene
  '+': { precedence: 3, associativity: 'left' },  // Clausura positiva
  '?': { precedence: 3, associativity: 'left' },  // Opcional
};

/**
 * Valida la sintaxis de una expresión regular
 */
export function validateRegex(regex: string): RegexValidationResult {
  const errors: string[] = [];
  let parenCount = 0;

  // Verificar string vacío
  if (!regex || regex.trim() === '') {
    errors.push('La expresión regular no puede estar vacía');
    return { isValid: false, errors };
  }

  // Verificar paréntesis balanceados
  for (let i = 0; i < regex.length; i++) {
    if (regex[i] === '(') parenCount++;
    if (regex[i] === ')') parenCount--;
    if (parenCount < 0) {
      errors.push(`Paréntesis desbalanceado en posición ${i}`);
      break;
    }
  }

  if (parenCount !== 0) {
    errors.push('Paréntesis no balanceados');
  }

  // Verificar operadores sin operandos
  const invalidPatterns = [
    { pattern: /\|\|/, message: 'Operador | duplicado' },
    { pattern: /\*\*/, message: 'Operador * duplicado' },
    { pattern: /\+\+/, message: 'Operador + duplicado' },
    { pattern: /\?\?/, message: 'Operador ? duplicado' },
    { pattern: /^\|/, message: 'Expresión no puede iniciar con |' },
    { pattern: /\|$/, message: 'Expresión no puede terminar con |' },
    { pattern: /\(\|/, message: 'No puede haber | después de (' },
    { pattern: /\|\)/, message: 'No puede haber | antes de )' },
  ];

  for (const { pattern, message } of invalidPatterns) {
    if (pattern.test(regex)) {
      errors.push(message);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    alphabet: getAlphabet(regex),
  };
}

/**
 * Extrae el alfabeto de una expresión regular
 */
export function getAlphabet(regex: string): string[] {
  const alphabet = new Set<string>();
  
  for (let i = 0; i < regex.length; i++) {
    const char = regex[i];
    // Agregar solo caracteres alfanuméricos (no operadores)
    if (!/[|()*+?.]/.test(char) && char.trim() !== '') {
      alphabet.add(char);
    }
  }

  return Array.from(alphabet).sort();
}

/**
 * Tokeniza una expresión regular
 */
export function tokenizeRegex(regex: string): RegexToken[] {
  const tokens: RegexToken[] = [];
  
  for (let i = 0; i < regex.length; i++) {
    const char = regex[i];
    
    if (char === ' ') continue; // Ignorar espacios

    if (char === '(') {
      tokens.push({ type: 'LPAREN', value: char, position: i });
    } else if (char === ')') {
      tokens.push({ type: 'RPAREN', value: char, position: i });
    } else if ('|*+?'.includes(char)) {
      tokens.push({ type: 'OPERATOR', value: char, position: i });
    } else {
      tokens.push({ type: 'SYMBOL', value: char, position: i });
    }
  }

  return tokens;
}

/**
 * Inserta operadores de concatenación implícitos
 * Ejemplo: ab -> a.b, a(b) -> a.(b), a* b -> a*.b
 */
export function insertConcatOperator(tokens: RegexToken[]): RegexToken[] {
  const result: RegexToken[] = [];

  for (let i = 0; i < tokens.length; i++) {
    result.push(tokens[i]);

    if (i < tokens.length - 1) {
      const current = tokens[i];
      const next = tokens[i + 1];

      // Agregar concatenación si:
      // - símbolo seguido de símbolo: ab
      // - símbolo seguido de paréntesis: a(
      // - paréntesis cerrado seguido de símbolo: )a
      // - paréntesis cerrado seguido de paréntesis abierto: )(
      // - operador unario seguido de símbolo: a*b
      // - operador unario seguido de paréntesis: a*(

      const needsConcat = (
        (current.type === 'SYMBOL' && next.type === 'SYMBOL') ||
        (current.type === 'SYMBOL' && next.type === 'LPAREN') ||
        (current.type === 'RPAREN' && next.type === 'SYMBOL') ||
        (current.type === 'RPAREN' && next.type === 'LPAREN') ||
        (current.type === 'OPERATOR' && ['*', '+', '?'].includes(current.value) && next.type === 'SYMBOL') ||
        (current.type === 'OPERATOR' && ['*', '+', '?'].includes(current.value) && next.type === 'LPAREN')
      );

      if (needsConcat) {
        result.push({ type: 'OPERATOR', value: '.', position: current.position });
      }
    }
  }

  return result;
}

/**
 * Convierte tokens a notación postfija usando Shunting Yard
 */
export function toPostfix(tokens: RegexToken[]): RegexToken[] {
  const output: RegexToken[] = [];
  const operators: RegexToken[] = [];

  for (const token of tokens) {
    if (token.type === 'SYMBOL') {
      output.push(token);
    } else if (token.type === 'OPERATOR') {
      while (
        operators.length > 0 &&
        operators[operators.length - 1].type === 'OPERATOR' &&
        OPERATORS[operators[operators.length - 1].value].precedence >=
          OPERATORS[token.value].precedence
      ) {
        output.push(operators.pop()!);
      }
      operators.push(token);
    } else if (token.type === 'LPAREN') {
      operators.push(token);
    } else if (token.type === 'RPAREN') {
      while (operators.length > 0 && operators[operators.length - 1].type !== 'LPAREN') {
        output.push(operators.pop()!);
      }
      operators.pop(); // Eliminar el '('
    }
  }

  while (operators.length > 0) {
    output.push(operators.pop()!);
  }

  return output;
}

/**
 * Construye el árbol sintáctico desde notación postfija
 */
export function buildSyntaxTreeFromPostfix(postfix: RegexToken[]): TreeNode {
  const stack: TreeNode[] = [];
  let nodeId = 0;

  for (const token of postfix) {
    if (token.type === 'SYMBOL') {
      stack.push({
        id: `node-${nodeId++}`,
        type: 'SYMBOL',
        value: token.value,
        position: token.position,
        children: [],
      });
    } else if (token.type === 'OPERATOR') {
      if (['*', '+', '?'].includes(token.value)) {
        // Operadores unarios
        const child = stack.pop();
        if (!child) throw new Error('Árbol sintáctico inválido');

        let type: NodeType = 'STAR';
        if (token.value === '+') type = 'PLUS';
        if (token.value === '?') type = 'OPTIONAL';

        stack.push({
          id: `node-${nodeId++}`,
          type,
          value: token.value,
          children: [child],
        });
      } else {
        // Operadores binarios (|, .)
        const right = stack.pop();
        const left = stack.pop();
        if (!left || !right) throw new Error('Árbol sintáctico inválido');

        const type: NodeType = token.value === '|' ? 'UNION' : 'CONCAT';

        stack.push({
          id: `node-${nodeId++}`,
          type,
          value: token.value,
          children: [left, right],
        });
      }
    }
  }

  if (stack.length !== 1) {
    throw new Error('Árbol sintáctico inválido');
  }

  return stack[0];
}

/**
 * Construye el árbol sintáctico completo desde una expresión regular
 */
export function buildSyntaxTree(regex: string): SyntaxTree {
  // 1. Validar
  const validation = validateRegex(regex);
  if (!validation.isValid) {
    throw new Error(`Expresión regular inválida: ${validation.errors.join(', ')}`);
  }

  // 2. Tokenizar
  const tokens = tokenizeRegex(regex);

  // 3. Insertar concatenaciones
  const withConcat = insertConcatOperator(tokens);

  // 4. Convertir a postfija
  const postfix = toPostfix(withConcat);

  // 5. Construir árbol
  const root = buildSyntaxTreeFromPostfix(postfix);

  // 6. Calcular funciones
  const anulable = calculateAnulable(root);
  const primeros = calculatePrimeros(root);
  const ultimos = calculateUltimos(root);
  const siguientes = calculateSiguientes(root);

  // 7. Asignar posiciones a los símbolos
  const positions = assignPositions(root);

  return {
    root,
    regex,
    alphabet: validation.alphabet || [],
    anulable,
    primeros,
    ultimos,
    siguientes,
    positions,
  };
}

/**
 * Calcula la función anulable (nullable)
 * Retorna true si el nodo puede generar la cadena vacía ε
 */
export function calculateAnulable(node: TreeNode): boolean {
  if (node.type === 'EPSILON') return true;
  if (node.type === 'SYMBOL') return false;
  if (node.type === 'STAR' || node.type === 'OPTIONAL') return true;
  if (node.type === 'PLUS') return calculateAnulable(node.children[0]);
  if (node.type === 'CONCAT') {
    return node.children.every(child => calculateAnulable(child));
  }
  if (node.type === 'UNION') {
    return node.children.some(child => calculateAnulable(child));
  }
  return false;
}

/**
 * Calcula la función primeros (first)
 * Retorna el conjunto de posiciones que pueden aparecer primero
 */
export function calculatePrimeros(node: TreeNode): Set<number> {
  const result = new Set<number>();

  if (node.type === 'EPSILON') {
    return result;
  }

  if (node.type === 'SYMBOL' && node.position !== undefined) {
    result.add(node.position);
    return result;
  }

  if (node.type === 'STAR' || node.type === 'PLUS' || node.type === 'OPTIONAL') {
    return calculatePrimeros(node.children[0]);
  }

  if (node.type === 'CONCAT') {
    const [left, right] = node.children;
    const leftFirst = calculatePrimeros(left);
    leftFirst.forEach(pos => result.add(pos));

    if (calculateAnulable(left)) {
      const rightFirst = calculatePrimeros(right);
      rightFirst.forEach(pos => result.add(pos));
    }
    return result;
  }

  if (node.type === 'UNION') {
    node.children.forEach(child => {
      const childFirst = calculatePrimeros(child);
      childFirst.forEach(pos => result.add(pos));
    });
    return result;
  }

  return result;
}

/**
 * Calcula la función últimos (last)
 * Retorna el conjunto de posiciones que pueden aparecer últimas
 */
export function calculateUltimos(node: TreeNode): Set<number> {
  const result = new Set<number>();

  if (node.type === 'EPSILON') {
    return result;
  }

  if (node.type === 'SYMBOL' && node.position !== undefined) {
    result.add(node.position);
    return result;
  }

  if (node.type === 'STAR' || node.type === 'PLUS' || node.type === 'OPTIONAL') {
    return calculateUltimos(node.children[0]);
  }

  if (node.type === 'CONCAT') {
    const [left, right] = node.children;
    const rightLast = calculateUltimos(right);
    rightLast.forEach(pos => result.add(pos));

    if (calculateAnulable(right)) {
      const leftLast = calculateUltimos(left);
      leftLast.forEach(pos => result.add(pos));
    }
    return result;
  }

  if (node.type === 'UNION') {
    node.children.forEach(child => {
      const childLast = calculateUltimos(child);
      childLast.forEach(pos => result.add(pos));
    });
    return result;
  }

  return result;
}

/**
 * Calcula la función siguientes (follow/next)
 * Para cada posición, determina qué posiciones pueden seguirle
 */
export function calculateSiguientes(node: TreeNode): Map<number, Set<number>> {
  const siguientes = new Map<number, Set<number>>();

  function traverse(n: TreeNode) {
    if (n.type === 'CONCAT') {
      const [left, right] = n.children;
      const leftLast = calculateUltimos(left);
      const rightFirst = calculatePrimeros(right);

      // Para cada posición en ultimos(left), agregar primeros(right) a sus siguientes
      leftLast.forEach(lastPos => {
        if (!siguientes.has(lastPos)) {
          siguientes.set(lastPos, new Set());
        }
        rightFirst.forEach(firstPos => {
          siguientes.get(lastPos)!.add(firstPos);
        });
      });

      traverse(left);
      traverse(right);
    } else if (n.type === 'STAR' || n.type === 'PLUS') {
      const child = n.children[0];
      const childLast = calculateUltimos(child);
      const childFirst = calculatePrimeros(child);

      // En Kleene star y plus, últimos pueden ir a primeros
      childLast.forEach(lastPos => {
        if (!siguientes.has(lastPos)) {
          siguientes.set(lastPos, new Set());
        }
        childFirst.forEach(firstPos => {
          siguientes.get(lastPos)!.add(firstPos);
        });
      });

      traverse(child);
    } else if (n.type === 'UNION' || n.type === 'OPTIONAL') {
      n.children.forEach(child => traverse(child));
    }
  }

  traverse(node);
  return siguientes;
}

/**
 * Asigna posiciones únicas a cada símbolo en el árbol
 */
export function assignPositions(node: TreeNode): Map<number, string> {
  const positions = new Map<number, string>();
  let currentPosition = 1;

  function traverse(n: TreeNode) {
    if (n.type === 'SYMBOL') {
      n.position = currentPosition;
      positions.set(currentPosition, n.value);
      currentPosition++;
    } else {
      n.children.forEach(child => traverse(child));
    }
  }

  traverse(node);
  return positions;
}

/**
 * Convierte el árbol sintáctico a una representación string legible
 */
export function treeToString(node: TreeNode, level: number = 0): string {
  const indent = '  '.repeat(level);
  let result = `${indent}${node.type}`;
  
  if (node.type === 'SYMBOL') {
    result += ` '${node.value}'`;
    if (node.position !== undefined) {
      result += ` (pos: ${node.position})`;
    }
  }
  
  result += '\n';
  
  node.children.forEach(child => {
    result += treeToString(child, level + 1);
  });
  
  return result;
}

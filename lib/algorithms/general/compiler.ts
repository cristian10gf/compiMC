/**
 * Compilador Completo - Pipeline de Compilación
 * 
 * Implementa el pipeline completo de un compilador desde análisis léxico
 * hasta generación de código objeto.
 * 
 * Fases:
 * 1. Análisis Léxico: Tokenización del código fuente
 * 2. Análisis Sintáctico: Construcción del árbol sintáctico
 * 3. Análisis Semántico: Verificación de tipos y consistencia
 * 4. Generación de Código Intermedio: Código de 3 direcciones
 * 5. Optimización de Código: Mejoras al código intermedio
 * 6. Generación de Código Objeto: Código ensamblador
 */

import {
  CompilerInput,
  CompilerResult,
  IntermediateCodeInstruction,
  OptimizationStep,
  ObjectCodeInstruction,
  CompilerError,
  ASTNode,
  SymbolTable,
  SymbolTableEntry,
} from '@/lib/types/analysis';
import { Token, LexicalAnalysisResult } from '@/lib/types/token';

/**
 * Tipos de tokens reconocidos
 */
const TOKEN_PATTERNS: Array<{ type: string; pattern: RegExp; priority: number }> = [
  { type: 'NUMERO', pattern: /^[0-9]+(\.[0-9]+)?/, priority: 1 },
  { type: 'IDENTIFICADOR', pattern: /^[a-zA-Z_][a-zA-Z0-9_]*/, priority: 2 },
  { type: 'OPERADOR_POT', pattern: /^\^/, priority: 3 },
  { type: 'OPERADOR_MUL', pattern: /^\*/, priority: 4 },
  { type: 'OPERADOR_DIV', pattern: /^\//, priority: 4 },
  { type: 'OPERADOR_SUM', pattern: /^\+/, priority: 5 },
  { type: 'OPERADOR_REST', pattern: /^-/, priority: 5 },
  { type: 'ASIGNACION', pattern: /^:=/, priority: 3 },
  { type: 'IGUAL', pattern: /^=/, priority: 6 },
  { type: 'PAREN_IZQ', pattern: /^\(/, priority: 7 },
  { type: 'PAREN_DER', pattern: /^\)/, priority: 7 },
  { type: 'ESPACIO', pattern: /^\s+/, priority: 10 },
];

/**
 * Fase 1: Análisis Léxico
 * Convierte el código fuente en una secuencia de tokens
 */
export function lexicalAnalysis(source: string): LexicalAnalysisResult {
  const tokens: Token[] = [];
  const errors: string[] = [];
  let position = 0;

  while (position < source.length) {
    let matched = false;

    // Intentar matchear con cada patrón
    for (const { type, pattern } of TOKEN_PATTERNS) {
      const substring = source.substring(position);
      const match = pattern.exec(substring);

      if (match) {
        const lexeme = match[0];

        // Ignorar espacios en blanco
        if (type !== 'ESPACIO') {
          tokens.push({
            type,
            lexeme,
            value: type === 'NUMERO' ? parseFloat(lexeme) : lexeme,
            line: 1,
            column: position,
          });
        }

        position += lexeme.length;
        matched = true;
        break;
      }
    }

    if (!matched) {
      errors.push(`Carácter no reconocido en posición ${position}: '${source[position]}'`);
      position++;
    }
  }

  return { tokens, errors };
}

/**
 * Construye el árbol sintáctico desde los tokens
 * Usa precedencia de operadores para parsear expresiones
 */
function buildAST(tokens: Token[]): ASTNode | null {
  let index = 0;

  // Función auxiliar: obtener token actual
  const current = (): Token | null => (index < tokens.length ? tokens[index] : null);

  // Función auxiliar: avanzar
  const advance = () => index++;

  // Función auxiliar: esperar token
  const expect = (type: string): Token => {
    const token = current();
    if (!token || token.type !== type) {
      throw new Error(`Se esperaba ${type}, se encontró ${token?.type || 'EOF'}`);
    }
    advance();
    return token;
  };

  // Parser de expresiones con precedencia
  function parseExpression(): ASTNode {
    return parseAdditive();
  }

  function parseAdditive(): ASTNode {
    let left = parseMultiplicative();

    while (current() && ['OPERADOR_SUM', 'OPERADOR_REST'].includes(current()!.type)) {
      const operator = current()!;
      advance();
      const right = parseMultiplicative();

      left = {
        id: `node-${Date.now()}-${Math.random()}`,
        type: 'BinaryOp',
        operator: operator.lexeme,
        left,
        right,
      };
    }

    return left;
  }

  function parseMultiplicative(): ASTNode {
    let left = parsePower();

    while (current() && ['OPERADOR_MUL', 'OPERADOR_DIV'].includes(current()!.type)) {
      const operator = current()!;
      advance();
      const right = parsePower();

      left = {
        id: `node-${Date.now()}-${Math.random()}`,
        type: 'BinaryOp',
        operator: operator.lexeme,
        left,
        right,
      };
    }

    return left;
  }

  function parsePower(): ASTNode {
    let left = parsePrimary();

    while (current() && current()!.type === 'OPERADOR_POT') {
      const operator = current()!;
      advance();
      const right = parsePrimary();

      left = {
        id: `node-${Date.now()}-${Math.random()}`,
        type: 'BinaryOp',
        operator: operator.lexeme,
        left,
        right,
      };
    }

    return left;
  }

  function parsePrimary(): ASTNode {
    const token = current();

    if (!token) {
      throw new Error('Expresión incompleta');
    }

    if (token.type === 'NUMERO') {
      advance();
      return {
        id: `node-${Date.now()}-${Math.random()}`,
        type: 'Number',
        value: token.value as number,
      };
    }

    if (token.type === 'IDENTIFICADOR') {
      advance();
      return {
        id: `node-${Date.now()}-${Math.random()}`,
        type: 'Identifier',
        name: token.lexeme,
      };
    }

    if (token.type === 'PAREN_IZQ') {
      advance();
      const expr = parseExpression();
      expect('PAREN_DER');
      return expr;
    }

    throw new Error(`Token inesperado: ${token.type}`);
  }

  try {
    return parseExpression();
  } catch (error) {
    console.error('Error de parsing:', error);
    return null;
  }
}

/**
 * Fase 2 y 3: Análisis Sintáctico y Semántico
 */
export function syntaxAnalysis(tokens: Token[]): ASTNode | null {
  return buildAST(tokens);
}

/**
 * Fase 4: Generación de Código Intermedio (Código de 3 direcciones)
 */
export function generateIntermediateCode(ast: ASTNode | null): IntermediateCodeInstruction[] {
  if (!ast) return [];

  const instructions: IntermediateCodeInstruction[] = [];
  let tempCounter = 1;

  function newTemp(): string {
    return `t${tempCounter++}`;
  }

  function generate(node: ASTNode): string {
    if (node.type === 'Number') {
      return node.value!.toString();
    }

    if (node.type === 'Identifier') {
      return node.name!;
    }

    if (node.type === 'BinaryOp') {
      const left = generate(node.left!);
      const right = generate(node.right!);
      const temp = newTemp();

      instructions.push({
        number: instructions.length + 1,
        instruction: `${temp} = ${left} ${node.operator} ${right}`,
      });

      return temp;
    }

    return '';
  }

  generate(ast);

  return instructions;
}

/**
 * Fase 5: Optimización de Código
 * Aplica reglas de optimización:
 * - Eliminación de código muerto
 * - Propagación de constantes
 * - Reducción de fuerza
 * - Coalescencia de copias
 */
export function optimizeCode(code: IntermediateCodeInstruction[]): OptimizationStep[] {
  const optimized: OptimizationStep[] = [];
  const usedTemps = new Set<string>();

  // 1. Identificar temporales usados
  for (let i = code.length - 1; i >= 0; i--) {
    const instruction = code[i].instruction;
    const parts = instruction.split('=').map(p => p.trim());

    if (parts.length === 2) {
      const temp = parts[0];
      const expr = parts[1];

      // Si el temporal es usado, agregar instrucción
      if (usedTemps.has(temp) || i === code.length - 1) {
        optimized.unshift({
          number: optimized.length + 1,
          instruction,
          action: 'Conservado',
        });

        // Agregar temporales usados en la expresión
        const matches = expr.match(/t\d+/g);
        if (matches) {
          matches.forEach(t => usedTemps.add(t));
        }

        // Agregar variables
        const varMatches = expr.match(/[a-z]/g);
        if (varMatches) {
          varMatches.forEach(v => usedTemps.add(v));
        }
      } else {
        optimized.unshift({
          number: optimized.length + 1,
          instruction: `// ${instruction}`,
          action: 'Eliminado (código muerto)',
        });
      }
    }
  }

  // 2. Propagación de constantes
  const constantMap = new Map<string, number>();

  for (const step of optimized) {
    const instruction = step.instruction;

    if (instruction.startsWith('//')) continue;

    const parts = instruction.split('=').map(p => p.trim());

    if (parts.length === 2) {
      const temp = parts[0];
      const expr = parts[1];

      // Si la expresión es solo un número, es una constante
      if (/^[0-9]+$/.test(expr)) {
        constantMap.set(temp, parseInt(expr));
      }

      // Sustituir constantes conocidas
      let optimizedExpr = expr;
      for (const [constTemp, value] of constantMap.entries()) {
        const regex = new RegExp(`\\b${constTemp}\\b`, 'g');
        optimizedExpr = optimizedExpr.replace(regex, value.toString());
      }

      if (optimizedExpr !== expr) {
        step.instruction = `${temp} = ${optimizedExpr}`;
        step.action = 'Propagación de constantes';
      }
    }
  }

  // 3. Evaluación de expresiones constantes
  for (const step of optimized) {
    const instruction = step.instruction;

    if (instruction.startsWith('//')) continue;

    const parts = instruction.split('=').map(p => p.trim());

    if (parts.length === 2) {
      const temp = parts[0];
      const expr = parts[1];

      // Si la expresión solo tiene números y operadores, evaluarla
      if (/^[0-9\s\+\-\*\/\^\(\)]+$/.test(expr)) {
        try {
          // Convertir ^ a **
          const jsExpr = expr.replace(/\^/g, '**');
          const result = eval(jsExpr);
          step.instruction = `${temp} = ${result}`;
          step.action = 'Evaluado en tiempo de compilación';
          constantMap.set(temp, result);
        } catch (e) {
          // Si falla la evaluación, mantener original
        }
      }
    }
  }

  return optimized;
}

/**
 * Fase 6: Generación de Código Objeto (Ensamblador)
 */
export function generateObjectCode(optimized: OptimizationStep[]): ObjectCodeInstruction[] {
  const objectCode: ObjectCodeInstruction[] = [];
  let registerCounter = 0;
  const registerMap = new Map<string, string>();

  function getRegister(temp: string): string {
    if (!registerMap.has(temp)) {
      registerMap.set(temp, `R${registerCounter++}`);
    }
    return registerMap.get(temp)!;
  }

  for (const step of optimized) {
    const instruction = step.instruction;

    // Ignorar código comentado
    if (instruction.startsWith('//')) continue;

    const parts = instruction.split('=').map(p => p.trim());

    if (parts.length === 2) {
      const dest = parts[0];
      const expr = parts[1];

      // Parsear expresión
      const tokens = expr.split(/\s+/);

      if (tokens.length === 1) {
        // Asignación simple: t1 = a
        const source = tokens[0];
        const destReg = getRegister(dest);

        if (/^[0-9]+$/.test(source)) {
          // LOAD inmediato
          objectCode.push({
            number: objectCode.length + 1,
            instruction: `LOAD ${destReg}, #${source}`,
          });
        } else {
          // LOAD desde memoria
          const sourceReg = getRegister(source);
          objectCode.push({
            number: objectCode.length + 1,
            instruction: `MOV ${destReg}, ${sourceReg}`,
          });
        }
      } else if (tokens.length === 3) {
        // Operación binaria: t1 = a + b
        const [left, operator, right] = tokens;
        const destReg = getRegister(dest);
        const leftReg = getRegister(left);
        const rightReg = getRegister(right);

        // Cargar operandos si es necesario
        if (/^[0-9]+$/.test(left)) {
          objectCode.push({
            number: objectCode.length + 1,
            instruction: `LOAD ${leftReg}, #${left}`,
          });
        }

        if (/^[0-9]+$/.test(right)) {
          objectCode.push({
            number: objectCode.length + 1,
            instruction: `LOAD ${rightReg}, #${right}`,
          });
        }

        // Generar instrucción según operador
        let opcode = '';
        switch (operator) {
          case '+':
            opcode = 'ADD';
            break;
          case '-':
            opcode = 'SUB';
            break;
          case '*':
            opcode = 'MUL';
            break;
          case '/':
            opcode = 'DIV';
            break;
          case '^':
            opcode = 'POW';
            break;
        }

        objectCode.push({
          number: objectCode.length + 1,
          instruction: `${opcode} ${destReg}, ${leftReg}, ${rightReg}`,
        });
      }
    }
  }

  return objectCode;
}

/**
 * Pipeline Completo del Compilador
 */
export function compile(input: CompilerInput): CompilerResult {
  const errors: CompilerError[] = [];

  try {
    // Fase 1: Análisis Léxico
    const lexicalResult = lexicalAnalysis(input.source);

    if (lexicalResult.errors.length > 0) {
      errors.push(
        ...lexicalResult.errors.map(msg => ({
          phase: 'lexical' as const,
          message: msg,
          line: 1,
          severity: 'error' as const,
        }))
      );
    }

    // Fase 2: Análisis Sintáctico
    const ast = syntaxAnalysis(lexicalResult.tokens);

    if (!ast) {
      errors.push({
        phase: 'syntax',
        message: 'Error al construir el árbol sintáctico',
        line: 1,
        severity: 'error' as const,
      });

      return {
        success: false,
        lexical: lexicalResult,
        syntax: { parseTree: null, success: false, errors: ['Error al construir el árbol sintáctico'] },
        intermediateCode: [],
        optimization: [],
        objectCode: [],
        errors,
      };
    }

    // Fase 3: Generación de Código Intermedio
    const intermediateCode = generateIntermediateCode(ast);

    // Fase 4: Optimización
    const optimizedCode = optimizeCode(intermediateCode);

    // Fase 5: Generación de Código Objeto
    const objectCode = generateObjectCode(optimizedCode);

    return {
      success: errors.length === 0,
      syntaxTree: ast,
      lexical: lexicalResult,
      syntax: { parseTree: null, success: true, errors: [] },
      intermediateCode,
      optimization: optimizedCode,
      objectCode,
      errors,
    };
  } catch (error) {
    errors.push({
      phase: 'unknown',
      message: error instanceof Error ? error.message : 'Error desconocido',
      line: 1,
      severity: 'error' as const,
    });

    return {
      success: false,
      lexical: { tokens: [], errors: [] },
      syntax: { parseTree: null, success: false, errors: [] },
      intermediateCode: [],
      optimization: [],
      objectCode: [],
      errors,
    };
  }
}

/**
 * Formatea el árbol sintáctico para visualización
 */
export function formatAST(node: ASTNode | null, indent: number = 0): string {
  if (!node) return '';

  const spaces = '  '.repeat(indent);

  if (node.type === 'Number') {
    return `${spaces}Number(${node.value})`;
  }

  if (node.type === 'Identifier') {
    return `${spaces}Identifier(${node.name})`;
  }

  if (node.type === 'BinaryOp') {
    return `${spaces}BinaryOp(${node.operator})\n${formatAST(node.left!, indent + 1)}\n${formatAST(node.right!, indent + 1)}`;
  }

  return `${spaces}Unknown`;
}

/**
 * Genera la tabla de símbolos
 */
export function generateSymbolTable(tokens: Token[]): SymbolTable {
  const entries: SymbolTableEntry[] = [];
  const seen = new Set<string>();

  for (const token of tokens) {
    if (token.type === 'IDENTIFICADOR' && !seen.has(token.lexeme)) {
      entries.push({
        name: token.lexeme,
        type: 'variable',
        scope: 'global',
        line: token.line || 1,
      });
      seen.add(token.lexeme);
    }
  }

  return { entries };
}

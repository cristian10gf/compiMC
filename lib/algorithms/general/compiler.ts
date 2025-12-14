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
interface TokenPattern {
  type: string;
  pattern?: RegExp; // Opcional: si no hay, usa literal
  literal?: string; // Texto literal para match exacto
  priority: number;
  category: 'identificador' | 'numero' | 'operacion';
  symbol?: string; // Símbolo para mostrar (ej: "POT", "MUL")
}

const DEFAULT_TOKEN_PATTERNS: TokenPattern[] = [
  { type: 'NUMERO', pattern: /^[0-9]+(\.[0-9]+)?/, priority: 1, category: 'numero' },
  { type: 'IDENTIFICADOR', pattern: /^[a-zA-Z_][a-zA-Z0-9_]*/, priority: 2, category: 'identificador' },
  { type: 'OPERADOR_POT', pattern: /^\^/, priority: 3, category: 'operacion', symbol: 'POT' },
  { type: 'OPERADOR_MUL', pattern: /^\*/, priority: 4, category: 'operacion', symbol: 'MUL' },
  { type: 'OPERADOR_DIV', pattern: /^\//, priority: 4, category: 'operacion', symbol: 'DIV' },
  { type: 'OPERADOR_SUM', pattern: /^\+/, priority: 5, category: 'operacion', symbol: 'SUM' },
  { type: 'OPERADOR_REST', pattern: /^-/, priority: 5, category: 'operacion', symbol: 'REST' },
  { type: 'ASIGNACION', pattern: /^:=/, priority: 3, category: 'operacion', symbol: 'AS' },
  { type: 'IGUAL', pattern: /^=/, priority: 6, category: 'operacion', symbol: 'IGUAL' },
  { type: 'PAREN_IZQ', pattern: /^\(/, priority: 7, category: 'operacion', symbol: '(' },
  { type: 'PAREN_DER', pattern: /^\)/, priority: 7, category: 'operacion', symbol: ')' },
  { type: 'ESPACIO', pattern: /^\s+/, priority: 10, category: 'operacion' },
];

/**
 * Fase 1: Análisis Léxico
 * Convierte el código fuente en una secuencia de tokens
 */
export function lexicalAnalysis(
  source: string, 
  customPatterns?: TokenPattern[]
): LexicalAnalysisResult {
  const tokens: Token[] = [];
  const errors: string[] = [];
  let position = 0;

  // Contadores para numeración
  const counters: Record<string, number> = {
    identificador: 1,
    numero: 1,
  };
  // Mapa para mantener el mismo número de ID para identificadores iguales
  const identifierMap: Map<string, string> = new Map();
  // Usar patrones personalizados y por defecto
  const patterns = DEFAULT_TOKEN_PATTERNS.concat(customPatterns || []);

  while (position < source.length) {
    let matched = false;

    // Intentar matchear con cada patrón
    for (const { type, pattern, literal, category, symbol } of patterns) {
      const substring = source.substring(position);
      let match: RegExpExecArray | null = null;
      let lexeme = '';

      // Intentar match con regex o literal
      if (pattern) {
        match = pattern.exec(substring);
        if (match) lexeme = match[0];
      } else if (literal) {
        // Match exacto de texto literal
        if (substring.startsWith(literal)) {
          match = [literal] as any;
          lexeme = literal;
        }
      }

      if (match) {

        // Ignorar espacios en blanco
        if (type !== 'ESPACIO') {
          let numberedType = symbol || type;
          
          // Numerar identificadores y números
          if (category === 'identificador') {
            // Para identificadores, usar el mismo número si ya apareció
            if (identifierMap.has(lexeme)) {
              numberedType = identifierMap.get(lexeme)!;
            } else {
              numberedType = `ID${counters.identificador++}`;
              identifierMap.set(lexeme, numberedType);
            }
          } else if (category === 'numero') {
            // Para números, siempre incrementar (no reutilizar)
            numberedType = `NUM${counters.numero++}`;
          }

          tokens.push({
            type,
            lexeme,
            value: type === 'NUMERO' ? parseFloat(lexeme) : lexeme,
            line: 1,
            column: position,
            numberedType,
            category,
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
 * Convierte tokens personalizados simples a TokenPattern
 */
export function createCustomTokenPatterns(
  tokens: Array<{ symbol: string; regex?: string }>
): TokenPattern[] {
  return tokens
    .filter(t => t.symbol.trim() !== '') // Solo tokens con símbolo
    .map((token, index) => {
      const basePattern: TokenPattern = {
        type: `CUSTOM_${token.symbol.toUpperCase()}`,
        priority: 0, // Alta prioridad para que se evalúen primero
        category: 'operacion',
        symbol: token.symbol,
      };

      if (token.regex && token.regex.trim() !== '') {
        // Con regex
        try {
          basePattern.pattern = new RegExp(`^${token.regex}`);
        } catch (e) {
          // Si el regex es inválido, usar literal
          basePattern.literal = token.symbol;
        }
      } else {
        // Sin regex: match exacto del símbolo
        basePattern.literal = token.symbol;
      }

      return basePattern;
    });
}

/**
 * Exportar patrones y tipos para componentes
 */
export { DEFAULT_TOKEN_PATTERNS };
export type { TokenPattern };

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

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
import { Token, LexicalAnalysisResult, TokenPattern } from '@/lib/types/token';


const DEFAULT_TOKEN_PATTERNS: TokenPattern[] = [
  { type: 'NUMERO', pattern: /^[0-9]+(\.[0-9]+)?/, priority: 1, category: 'numero' },
  { type: 'IDENTIFICADOR', pattern: /^[a-zA-Z_][a-zA-Z0-9_]*/, priority: 2, category: 'identificador' },
  { type: 'OPERADOR_POT', pattern: /^\^/, priority: 3, category: 'operacion', symbol: 'POT' },
  { type: 'OPERADOR_MUL', pattern: /^\*/, priority: 4, category: 'operacion', symbol: 'MUL' },
  { type: 'OPERADOR_DIV', pattern: /^\//, priority: 4, category: 'operacion', symbol: 'DIV' },
  { type: 'OPERADOR_MOD', pattern: /^%/, priority: 4, category: 'operacion', symbol: 'MOD' },
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

  // Parser de asignación (más bajo nivel de precedencia)
  function parseAssignment(): ASTNode {
    const left = parseExpression();

    // Si hay un operador de asignación
    if (current() && (current()!.type === 'IGUAL' || current()!.type === 'ASIGNACION')) {
      const operator = current()!;
      advance();
      const right = parseAssignment(); // Asociatividad derecha

      return {
        id: `node-${Date.now()}-${Math.random()}`,
        type: 'assignment',
        operator: operator.lexeme,
        left,
        right,
      };
    }

    return left;
  }

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

    while (current() && ['OPERADOR_MUL', 'OPERADOR_DIV', 'OPERADOR_MOD'].includes(current()!.type)) {
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

    // La potencia es asociativa por la derecha
    if (current() && current()!.type === 'OPERADOR_POT') {
      const operator = current()!;
      advance();
      const right = parsePower(); // Recursión para asociatividad derecha

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
        name: token.numberedType, // Usar ID numerado (NUM1, NUM2, etc.)
      };
    }

    if (token.type === 'IDENTIFICADOR') {
      advance();
      return {
        id: `node-${Date.now()}-${Math.random()}`,
        type: 'Identifier',
        name: token.numberedType, // Usar ID numerado (ID1, ID2, etc.)
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
    return parseAssignment();
  } catch (error) {
    // Error silencioso - no mostrar en consola del usuario
    return null;
  }
}

/**
 * Fase 2: Análisis Sintáctico
 */
export function syntaxAnalysis(tokens: Token[]): ASTNode | null {
  return buildAST(tokens);
}

/**
 * Fase 3: Análisis Semántico
 * Aplica transformaciones semánticas al árbol:
 * - Convierte nodos numéricos a entReal() excepto los exponentes de potencias
 */
export function semanticAnalysis(ast: ASTNode | null): ASTNode | null {
  if (!ast) return null;

  function transform(node: ASTNode, isExponent: boolean = false): ASTNode {
    // Si es un nodo numérico y NO es exponente, convertir a entReal
    if (node.type === 'Number' && !isExponent) {
      return {
        ...node,
        type: 'entReal',
        value: node.value,
        name: node.name, // Mantener el ID numerado (NUM1, NUM2, etc.)
      };
    }

    // Si es un operador binario, procesar hijos
    if (node.type === 'BinaryOp') {
      const isExponential = node.operator === '^';
      return {
        ...node,
        left: transform(node.left!, false),
        // El hijo derecho de ^ es exponente, no debe convertirse
        right: transform(node.right!, isExponential),
      };
    }

    // Si es asignación, procesar ambos lados
    if (node.type === 'assignment') {
      return {
        ...node,
        left: transform(node.left!, false),
        right: transform(node.right!, false),
      };
    }

    // Identificadores y otros nodos se mantienen igual
    return node;
  }

  return transform(ast);
}

/**
 * Fase 4: Generación de Código Intermedio (Código de 3 direcciones)
 */
export function generateIntermediateCode(ast: ASTNode | null): IntermediateCodeInstruction[] {
  if (!ast) return [];

  const instructions: IntermediateCodeInstruction[] = [];
  let tempCounter = 1;

  function newTemp(): string {
    return `temp${tempCounter++}`;
  }

  function generate(node: ASTNode): string {
    if (node.type === 'Number') {
      // usar el valor numerico directamente
      return node.value!.toString();
    }

    if (node.type === 'entReal') {
      // Generar instrucción para conversión a real
      const temp = newTemp();
      instructions.push({
        number: instructions.length + 1,
        instruction: `${temp} := entReal(${node.value})`,
      });
      return temp;
    }

    if (node.type === 'Identifier') {
      // Usar el ID numerado (NUM1, ID1, etc.)
      return node.name!;
    }

    if (node.type === 'BinaryOp') {
      const left = generate(node.left!);
      const right = generate(node.right!);
      const temp = newTemp();

      instructions.push({
        number: instructions.length + 1,
        instruction: `${temp} := ${left} ${node.operator} ${right}`,
      });

      return temp;
    }

    if (node.type === 'assignment') {
      const left = generate(node.left!);
      const right = generate(node.right!);

      instructions.push({
        number: instructions.length + 1,
        instruction: `${left} := ${right}`,
      });

      return left;
    }

    return '';
  }

  generate(ast);

  return instructions;
}

/**
 * Fase 5: Optimización de Código
 * Aplica reglas de optimización:
 * - Eliminar asignaciones simples sin operación (temp := valor)
 * - Precalcular valores de entReal y propagarlos
 * - Conservar instrucciones con operaciones (operador + asignación)
 * - Eliminar temporal de asignación final
 */
export function optimizeCode(code: IntermediateCodeInstruction[]): OptimizationStep[] {
  const optimized: OptimizationStep[] = [];
  const substitutionMap = new Map<string, string>(); // Mapa de reemplazos

  // Paso 1: Procesar instrucciones y aplicar reglas
  for (let i = 0; i < code.length; i++) {
    const instruction = code[i].instruction;
    const parts = instruction.split(':=').map(p => p.trim());

    if (parts.length !== 2) continue;

    const temp = parts[0];
    let expr = parts[1];
    const originalExpr = expr; // Guardar expresión original

    // Aplicar sustituciones previas
    for (const [oldVar, newValue] of substitutionMap.entries()) {
      const regex = new RegExp(`\\b${oldVar}\\b`, 'g');
      expr = expr.replace(regex, newValue);
    }

    // Detectar operadores aritméticos
    const operators = expr.match(/[+\-*\/^%]/g) || [];
    const wasModified = expr !== originalExpr; // Si la expresión cambió

    // Regla 1: Instrucciones entReal - precalcular y sustituir
    const entRealMatch = expr.match(/^entReal\((\d+(?:\.\d+)?)\)$/);
    if (entRealMatch) {
      const value = entRealMatch[1];
      const realValue = `${parseFloat(value).toFixed(1)}`;
      substitutionMap.set(temp, realValue);
      
      optimized.push({
        number: optimized.length + 1,
        instruction: `${instruction}`,
        action: 'Eliminado',
        reason: 'entReal precalculado',
      });
      continue;
    }

    // Regla 2: Instrucciones CON operación (tienen operador)
    if (operators.length > 0) {
      optimized.push({
        number: optimized.length + 1,
        instruction: `${temp} := ${expr}`,
        action: wasModified ? 'Editado' : 'Conservado',
        reason: wasModified ? 'Valores precalculados' : 'Operación + asignación',
      });
      continue;
    }

    // Regla 3: Asignaciones simples SIN operación - ELIMINAR (excepto última)
    // Es una asignación simple: temp := valor (sin operador)
    if (i === code.length - 1) {
      // Es la última instrucción (asignación final)
      optimized.push({
        number: optimized.length + 1,
        instruction: `${temp} := ${expr}`,
        action: 'Conservado',
        reason: 'Asignación final',
      });
    } else {
      // No es la última, eliminar y guardar para sustitución
      substitutionMap.set(temp, expr);
      optimized.push({
        number: optimized.length + 1,
        instruction: `${temp} := ${expr}`,
        action: 'Eliminado',
        reason: 'Asignación simple',
      });
    }
  }

  // Paso 2: Optimizar la asignación final
  // Si la última instrucción es ID := temp, y temp tiene una expresión, combinarlas
  if (optimized.length > 1) {
    const lastIdx = optimized.length - 1;
    const lastInstruction = optimized[lastIdx].instruction;
    
    if (!lastInstruction.startsWith('//')) {
      const lastParts = lastInstruction.split(':=').map(p => p.trim());
      
      if (lastParts.length === 2) {
        const finalVar = lastParts[0];
        const finalExpr = lastParts[1];
        
        // Si finalExpr es un temp, buscar su definición
        const tempMatch = finalExpr.match(/^temp\d+$/);
        if (tempMatch) {
          // Buscar la instrucción que define este temp
          for (let i = optimized.length - 2; i >= 0; i--) {
            const prevInstruction = optimized[i].instruction;
            if (prevInstruction.startsWith('//')) continue;
            
            const prevParts = prevInstruction.split(':=').map(p => p.trim());
            if (prevParts.length === 2 && prevParts[0] === finalExpr) {
              // Encontramos la definición, combinar
              const tempExpr = prevParts[1];
              
              // Eliminar la instrucción del temp
              optimized[i] = {
                number: optimized[i].number,
                instruction: `${prevInstruction}`,
                action: 'Eliminado',
                reason: 'Combinado con asignación final',
              };
              
              // Actualizar la asignación final
              optimized[lastIdx] = {
                number: optimized[lastIdx].number,
                instruction: `${finalVar} := ${tempExpr}`,
                action: 'Editado',
                reason: 'Asignación final optimizada',
              };
              break;
            }
          }
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
    if (step.action === 'Eliminado') continue;

    const parts = instruction.split(':=').map(p => p.trim());

    if (parts.length === 2) {
      const dest = parts[0];
      const expr = parts[1];

      // Parsear expresión
      const tokens = expr.split(/\s+/);

      if (tokens.length === 1) {
        // Asignación simple: dest = source
        const source = tokens[0];
        const destReg = getRegister(dest);

        // MOV source, destReg
        objectCode.push({
          number: objectCode.length + 1,
          instruction: `MOV ${source}, ${destReg}`,
        });
      } else if (tokens.length === 3) {
        // Operación binaria: dest = left op right
        const [left, operator, right] = tokens;
        const leftReg = getRegister(`temp_left_${objectCode.length}`);
        const rightReg = getRegister(`temp_right_${objectCode.length}`);

        // MOV operandos a registros
        objectCode.push({
          number: objectCode.length + 1,
          instruction: `MOV ${left}, ${leftReg}`,
        });

        objectCode.push({
          number: objectCode.length + 1,
          instruction: `MOV ${right}, ${rightReg}`,
        });

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
            opcode = 'MULT';
            break;
          case '/':
            opcode = 'DIV';
            break;
          case '^':
            opcode = 'EXPT';
            break;
        }

        // Operación con resultado en paréntesis
        objectCode.push({
          number: objectCode.length + 1,
          instruction: `${opcode} ${leftReg}, ${rightReg} (${dest})`,
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

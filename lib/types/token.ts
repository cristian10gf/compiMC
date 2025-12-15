/**
 * Tipos para tokens y análisis léxico
 */

/**
 * Token generado por el analizador léxico
 */
export interface Token {
  type: string; // Tipo de token (ej: "OPERADOR", "NUMERO", "ID", "KEYWORD")
  lexeme: string; // Lexema (texto original)
  value?: any; // Valor opcional (ej: valor numérico para números)
  line?: number; // Línea donde aparece
  column?: number; // Columna donde aparece
  numberedType?: string; // Tipo numerado (ej: "ID1", "NUM1", "POT")
  category?: 'identificador' | 'numero' | 'operacion'; // Categoría del token
}

/**
 * Resultado del análisis léxico
 */
export interface LexicalAnalysisResult {
  tokens: Token[]; // Lista de tokens generados
  errors: string[]; // Errores encontrados
  warnings?: string[]; // Advertencias opcionales
}

/**
 * Regla para reconocer tokens
 */
export interface TokenRule {
  type: string; // Tipo de token
  pattern: string | RegExp; // Patrón de reconocimiento
  priority: number; // Prioridad (mayor = más alta)
}

/**
 * Configuración del analizador léxico
 */
export interface LexerConfig {
  rules: TokenRule[]; // Reglas de tokenización
  ignoreWhitespace?: boolean; // Si se deben ignorar espacios en blanco
  ignoreComments?: boolean; // Si se deben ignorar comentarios
}

/**
 * Tipos de tokens reconocidos
 */
export interface TokenPattern {
  type: string;
  pattern?: RegExp; // Opcional: si no hay, usa literal
  literal?: string; // Texto literal para match exacto
  priority: number;
  category: 'identificador' | 'numero' | 'operacion';
  symbol?: string; // Símbolo para mostrar (ej: "POT", "MUL")
}

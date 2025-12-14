# Plan de Desarrollo Completo - CompiMC Frontend

> **Plan corregido y actualizado basado en wireframes detallados del frontend**

## 📌 Resumen Ejecutivo

**CompiMC** es una aplicación web educativa para la simulación y análisis de:
- **Analizadores Léxicos**: Construcción de autómatas finitos (AFD/AFN), conversión ER↔AF, reconocimiento de cadenas
- **Analizadores Sintácticos**: Parsing descendente (LL) y ascendente (LR)
- **Compilador Completo**: Pipeline completo desde análisis léxico hasta generación de código objeto

### Tecnologías Principales
- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript 5
- **Estilos**: Tailwind CSS 4 + shadcn/ui
- **Visualización**: React Flow (grafos y árboles)
- **Estado**: Context API + localStorage
- **Tiempo Estimado**: 40-50 horas (8 sprints)

### Rutas Principales
- `/` - Home con navegación
- `/general` - Compilador completo
- `/analizador-lexico/*` - 5 páginas de análisis léxico
- `/asd` - Análisis sintáctico descendente
- `/asa` - Análisis sintáctico ascendente

---

## Análisis de las Imágenes del Frontend

Basándome en los wireframes proporcionados, el sistema está compuesto por las siguientes pantallas principales:

### 📋 Pantallas Identificadas

1. **Home (/)** - Landing principal con logo, sidebar y cards de funcionalidades
2. **General (/general)** - Página de análisis completo (léxico → sintáctico → código intermedio → optimización → código objeto)
3. **Analizador Léxico (/analizador-lexico)** - Landing con 4 opciones principales
4. **ER a AF (/analizador-lexico/er-to-af)** - Construir Expresión Regular a Autómata
5. **AFD Full (/analizador-lexico/afd-full)** - Construir AFD Completo
6. **AFD Short (/analizador-lexico/afd-short)** - Construir AFD Óptimo (Determinista)
7. **AF a ER (/analizador-lexico/af-to-er)** - Convertir Autómata a Expresión Regular
8. **Reconocer Cadena (/analizador-lexico/reconocer)** - Validar cadena con AFD y mostrar transiciones
9. **ASD (/asd)** - Analizador Sintáctico Descendente (LL)
10. **ASA (/asa)** - Analizador Sintáctico Ascendente (LR)

---

## 🗂️ Estructura de Rutas del Proyecto

```
/workspaces/compimc/
├── app/
│   ├── page.tsx                                    # Ruta: / (Home principal con cards)
│   ├── layout.tsx                                  # Layout con sidebar global
│   ├── general/
│   │   └── page.tsx                                # Ruta: /general (Análisis completo)
│   ├── analizador-lexico/
│   │   ├── page.tsx                                # Ruta: /analizador-lexico (Landing AL)
│   │   ├── er-to-af/
│   │   │   └── page.tsx                            # Ruta: /analizador-lexico/er-to-af
│   │   ├── afd-full/
│   │   │   └── page.tsx                            # Ruta: /analizador-lexico/afd-full
│   │   ├── afd-short/
│   │   │   └── page.tsx                            # Ruta: /analizador-lexico/afd-short
│   │   ├── af-to-er/
│   │   │   └── page.tsx                            # Ruta: /analizador-lexico/af-to-er
│   │   └── reconocer/
│   │       └── page.tsx                            # Ruta: /analizador-lexico/reconocer
│   ├── asd/
│   │   └── page.tsx                                # Ruta: /asd (Análisis Sint. Descendente)
│   └── asa/
│       └── page.tsx                                # Ruta: /asa (Análisis Sint. Ascendente)
├── components/
│   ├── layout/
│   │   ├── main-sidebar.tsx                        # Sidebar principal (logo, general, AL, ASD, ASA, Historial)
│   │   ├── hero-section.tsx                        # Hero reutilizable con título/subtítulo
│   │   ├── history-panel.tsx                       # Panel de historial (derecha)
│   │   └── footer.tsx                              # Footer global
│   ├── home/
│   │   ├── feature-card.tsx                        # Cards de funcionalidades principales
│   │   └── feature-grid.tsx                        # Grid de cards
│   ├── analizador-lexico/
│   │   ├── language-input.tsx                      # Input de lenguajes (L = {a, d})
│   │   ├── regex-input.tsx                         # Input para expresión regular
│   │   ├── syntax-tree-visual.tsx                  # Árbol sintáctico visual
│   │   ├── automata-graph-react-flow.tsx           # Grafo con React Flow
│   │   ├── state-symbol-table.tsx                  # Tabla Estado/Símbolo
│   │   ├── transition-path-display.tsx             # Display de transiciones (estado1->a->estado2)
│   │   ├── string-recognition.tsx                  # Componente reconocer cadena
│   │   └── equation-solver.tsx                     # Resolver ecuaciones (AF to ER)
│   ├── analizador-sintactico/
│   │   ├── terminals-input.tsx                     # Input símbolos terminales
│   │   ├── grammar-input.tsx                       # Input gramática (producciones)
│   │   ├── precedence-table.tsx                    # Tabla de precedencia
│   │   ├── goto-table.tsx                          # Tabla Ir
│   │   ├── productions-table.tsx                   # Tabla de producciones
│   │   ├── first-follow-table.tsx                  # Tabla de Primeros/Siguientes (ASD)
│   │   ├── parsing-table.tsx                       # Tabla M de parsing
│   │   └── stack-trace-table.tsx                   # Tabla Pila/Entrada/Salida
│   ├── general/
│   │   ├── lexical-analysis.tsx                    # Sección análisis léxico
│   │   ├── syntax-analysis.tsx                     # Sección análisis sintáctico
│   │   ├── intermediate-code.tsx                   # Generación código intermedio
│   │   ├── code-optimization.tsx                   # Optimización de código
│   │   ├── object-code.tsx                         # Código objeto
│   │   └── tokens-table.tsx                        # Tabla Token/Lexema/Tipo
│   ├── shared/
│   │   ├── collapsible-section.tsx                 # Sección colapsable (+ título)
│   │   ├── action-button.tsx                       # Botones de acción (Analizar, Enviar, etc)
│   │   ├── result-status.tsx                       # Status de resultado (aceptada/rechazada)
│   │   └── copy-button.tsx                         # Botón copiar
│   └── ui/                                         # Componentes UI shadcn ya existentes
├── lib/
│   ├── algorithms/
│   │   ├── lexical/
│   │   │   ├── er-to-af.ts                         # Construir ER de AF
│   │   │   ├── afd-construction.ts                 # AFD full/short
│   │   │   ├── af-to-er.ts                         # AF a Expresión Regular
│   │   │   ├── string-recognition.ts               # Reconocer cadena
│   │   │   └── regex-parser.ts                     # Parser de ER
│   │   ├── syntax/
│   │   │   ├── descendente.ts                      # Análisis descendente
│   │   │   ├── ascendente.ts                       # Análisis ascendente
│   │   │   ├── first-follow.ts                     # Cálculo First/Follow
│   │   │   └── precedence.ts                       # Cálculo de precedencia
│   │   └── general/
│   │       ├── lexical-phase.ts                    # Fase léxica completa
│   │       ├── syntax-phase.ts                     # Fase sintáctica completa
│   │       ├── intermediate-code-gen.ts            # Generación código intermedio
│   │       └── optimization.ts                     # Optimización
│   ├── types/
│   │   ├── automata.ts                             # Types para autómatas
│   │   ├── grammar.ts                              # Types para gramáticas
│   │   ├── token.ts                                # Types para tokens
│   │   └── analysis.ts                             # Types para análisis
│   ├── context/
│   │   ├── compiler-context.tsx                    # Context global del compilador
│   │   └── history-context.tsx                     # Context del historial
│   └── utils/
│       ├── graph-converter.ts                      # Conversión a React Flow
│       ├── table-generator.ts                      # Generar tablas
│       └── export.ts                               # Exportar resultados
└── hooks/
    ├── use-lexical-analyzer.ts                     # Hook analizador léxico
    ├── use-syntax-analyzer.ts                      # Hook analizador sintáctico
    ├── use-compiler.ts                             # Hook compilador completo
    └── use-history.ts                              # Hook historial
```

---

## 📝 Plan de Desarrollo Detallado

### FASE 1: Configuración Base y Tipos (2-3 horas)

#### 1.1 Definir Tipos Base

**Archivo**: `lib/types/automata.ts`

```typescript
// Tipos fundamentales para el sistema de autómatas
interface State {
  id: string;
  label: string;
  isInitial: boolean;
  isFinal: boolean;
  position?: { x: number; y: number };
}

interface Transition {
  from: string;
  to: string;
  symbol: string;
  id: string;
}

interface Automaton {
  id: string;
  states: State[];
  transitions: Transition[];
  alphabet: string[];
  type: 'NFA' | 'DFA' | 'EPSILON_NFA';
  name?: string;
}

interface AutomatonConfig {
  languages: string[]; // Ej: ["L={a,d}", "L={a,d}*"]
  regex: string; // Ej: "(a|b)+abb"
  algorithm: 'er-to-af' | 'afd-full' | 'afd-short' | 'af-to-er' | 'recognize';
  showSteps?: boolean;
}

interface RecognitionResult {
  accepted: boolean;
  transitions: {
    from: string;
    symbol: string;
    to: string;
  }[];
  message: string; // "aceptada" o "rechazada"
}
```

**Archivo**: `lib/types/grammar.ts`

```typescript
// Tipos para análisis sintáctico
interface Production {
  id: string;
  left: string; // No terminal (ej: "E")
  right: string[]; // Producción (ej: ["E", "or", "T"])
}

interface Grammar {
  terminals: string[]; // Símbolos terminales (ej: ["a", "b", "as"])
  nonTerminals: string[]; // No terminales (ej: ["E", "T", "F"])
  productions: Production[]; // Lista de producciones
  startSymbol: string; // Símbolo inicial
}

interface FirstFollow {
  nonTerminal: string;
  first: string[]; // Primeros
  follow: string[]; // Siguientes
}

interface ParsingTableEntry {
  production: Production | null;
  action?: 'accept' | 'error';
}

interface ParsingTable {
  [nonTerminal: string]: {
    [terminal: string]: ParsingTableEntry;
  };
}

interface ParseStep {
  stack: string[];
  input: string[];
  output: string;
  action: string;
}
```

**Archivo**: `lib/types/graph.ts`

```typescript
// Tipos para la visualización con Cytoscape
interface GraphNode {
  data: {
    id: string;
    label: string;
    isInitial: boolean;
    isFinal: boolean;
  };
  position: { x: number; y: number };
  classes: string[];
}

interface GraphEdge {
  data: {
    id: string;
    source: string;
    target: string;
    label: string;
  };
  classes: string[];
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
```

**Archivo**: `lib/types/token.ts`

```typescript
// Tipos para análisis léxico (página General)
interface Token {
  type: string; // Tipo de token (ej: "OPERADOR", "NUMERO", "ID")
  lexeme: string; // Lexema (ej: "+", "123", "variable")
  value?: any; // Valor opcional
}

interface LexicalAnalysisResult {
  tokens: Token[];
  errors: string[];
}
```

**Archivo**: `lib/types/analysis.ts`

```typescript
// Tipos para el compilador completo (página General)
interface CompilerInput {
  source: string; // Código fuente (ej: "2 + 3 * a + c^2/c + 5 - a/a + c")
  mode: 'analisis' | 'sintesis';
}

interface IntermediateCodeInstruction {
  number: number;
  instruction: string;
}

interface OptimizationStep {
  number: number;
  instruction: string;
  action: string; // Acción realizada (ej: "eliminado", "coalescido")
}

interface ObjectCodeInstruction {
  number: number;
  instruction: string; // Código ensamblador
}

interface CompilerResult {
  lexical: LexicalAnalysisResult;
  syntaxTree?: any; // Árbol sintáctico
  intermediateCode: IntermediateCodeInstruction[];
  optimizedCode: OptimizationStep[];
  objectCode: ObjectCodeInstruction[];
}

interface AlgorithmStep {
  stepNumber: number;
  description: string;
  data: any; // Datos específicos del paso
  highlightedElements?: string[];
}
```

**Archivo**: `lib/types/history.ts`

```typescript
// Tipos para el historial
interface HistoryEntry {
  id: string;
  timestamp: number;
  section: string; // "general", "AL", "ASD", "ASA"
  input: string; // Input usado
  result?: any; // Resultado del análisis
}
```

#### 1.2 Configurar Context API

**Archivo**: `lib/context/compiler-context.tsx`

```typescript
// Context global para manejar el estado de la aplicación
interface CompilerContextType {
  // Estado de análisis léxico
  currentAutomaton: Automaton | null;
  lexicalConfig: AutomatonConfig | null;
  recognitionResult: RecognitionResult | null;
  
  // Estado de análisis sintáctico
  currentGrammar: Grammar | null;
  parsingTable: ParsingTable | null;
  parseSteps: ParseStep[];
  
  // Estado del compilador completo
  compilerResult: CompilerResult | null;
  
  // Estados generales
  isProcessing: boolean;
  error: string | null;
  
  // Métodos
  setLexicalConfig: (config: AutomatonConfig) => void;
  buildAutomaton: () => Promise<void>;
  recognizeString: (input: string) => Promise<RecognitionResult>;
  
  setGrammar: (grammar: Grammar) => void;
  analyzeGrammar: () => Promise<void>;
  parseString: (input: string) => Promise<ParseStep[]>;
  
  compileSource: (input: CompilerInput) => Promise<void>;
  
  resetState: () => void;
}
```

**Archivo**: `lib/context/history-context.tsx`

```typescript
// Context para el historial
interface HistoryContextType {
  history: HistoryEntry[];
  showHistoryPanel: boolean;
  addToHistory: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
  toggleHistoryPanel: () => void;
  loadHistoryEntry: (id: string) => void;
}
```

---

### FASE 2: Componentes de UI Base (3-4 horas)

#### 2.1 Layout Components

**Archivo**: `components/layout/navbar.tsx`

**Características**:
- Logo de la aplicación
- Menú de navegación con las rutas principales
- Indicador del estado actual (procesando, completado, error)
- Botón de tema oscuro/claro
- Búsqueda rápida de funcionalidades

**Tecnologías**: Tailwind CSS, Framer Motion para animaciones

---

**Archivo**: `components/layout/sidebar.tsx`

**Características**:
- Lista de pasos del proceso (workflow)
- Indicadores visuales de progreso
- Links a cada sección
- Colapsable en mobile
- Estado activo destacado

---

#### 2.2 Componentes de Formulario

**Archivo**: `components/forms/config-form.tsx`

**Características**:
- Input para expresión regular con validación
- Input para cadena de prueba
- Selector de algoritmo (Thompson, Subset Construction, Minimización)
- Checkbox para "Mostrar pasos intermedios"
- Botón de "Ejecutar" con estado de carga
- Validación en tiempo real
- Ejemplos precargados (dropdown)

**Campos**:
1. **Expresión Regular** (textarea con syntax highlighting)
   - Validación de sintaxis
   - Mensajes de error descriptivos
   - Sugerencias de autocompletado

2. **Cadena de Entrada** (input text)
   - Validación según el alfabeto detectado
   - Indicador de longitud

3. **Algoritmo** (select/combobox)
   - Thompson (RE → ε-NFA)
   - Subset Construction (NFA → DFA)
   - Minimización de DFA

4. **Opciones Avanzadas** (collapsible)
   - Mostrar transiciones ε
   - Animar construcción
   - Velocidad de animación
   - Exportar resultados

---

### FASE 3: Algoritmos Core (8-10 horas)

#### 3.1 Analizador Léxico - Parser de Expresiones Regulares

**Archivo**: `lib/algorithms/lexical/regex-parser.ts`

**Funcionalidades**:
- Tokenización de la expresión regular
- Construcción de árbol sintáctico visual
- Validación de sintaxis
- Manejo de operadores: `*`, `+`, `?`, `|`, `.`, `()`, `[]`
- Conversión a notación postfija (Shunting Yard)
- Cálculo de posiciones para símbolos
- Cálculo de primeros y siguientes

**Métodos principales**:
```typescript
function parseRegex(regex: string): ParseTree
function buildSyntaxTree(regex: string): TreeNode // Para visualización
function validateRegex(regex: string): ValidationResult
function getAlphabet(languages: string[]): string[]
function calculatePositions(tree: TreeNode): Map<number, string>
function calculateFirstLast(tree: TreeNode): { first: Set<number>, last: Set<number> }
```

---

#### 3.2 ER a AF (Expresión Regular a Autómata Finito)

**Archivo**: `lib/algorithms/lexical/er-to-af.ts`

**Descripción**: Construye un autómata finito a partir de una expresión regular

**Pasos del Algoritmo**:
1. Parsear la expresión regular
2. Construir árbol sintáctico
3. Calcular funciones:
   - `anulable()`: Si el nodo puede generar ε
   - `primeros()`: Primeros símbolos
   - `siguientes()`: Símbolos que pueden seguir
4. Construir tabla de transiciones
5. Generar autómata finito

**Métodos principales**:
```typescript
function erToAF(regex: string, languages: string[]): Automaton
function calculateAnulable(node: TreeNode): boolean
function calculatePrimeros(node: TreeNode): Set<number>
function calculateSiguientes(node: TreeNode): Map<number, Set<number>>
function buildTransitionTable(tree: TreeNode, alphabet: string[]): Map<string, Map<string, string>>
```

---

#### 3.3 AFD Full (Construcción Completa)

**Archivo**: `lib/algorithms/lexical/afd-construction.ts`

**Descripción**: Construye un AFD completo (puede tener estados inalcanzables)

**Pasos del Algoritmo**:
1. Partir de ER o AF inicial
2. Aplicar algoritmo de construcción de subconjuntos
3. Generar todos los estados posibles
4. Crear tabla de transiciones completa
5. Retornar AFD sin minimizar

**Métodos principales**:
```typescript
function buildAFDFull(regex: string, languages: string[]): Automaton
function getAllPossibleStates(alphabet: string[], stateCount: number): Set<string>[]
```

---

#### 3.4 AFD Short (Autómata Óptimo)

**Archivo**: `lib/algorithms/lexical/afd-construction.ts`

**Descripción**: Construye un AFD óptimo (minimizado)

**Pasos del Algoritmo**:
1. Construir AFD completo
2. Eliminar estados inalcanzables
3. Aplicar algoritmo de minimización
4. Combinar estados equivalentes
5. Retornar AFD mínimo

**Métodos principales**:
```typescript
function buildAFDShort(regex: string, languages: string[]): Automaton
function minimizeDFA(dfa: Automaton): Automaton
function removeUnreachableStates(dfa: Automaton): Automaton
function mergeEquivalentStates(dfa: Automaton): Automaton
```

---

#### 3.5 Reconocedor de Cadenas

**Archivo**: `lib/algorithms/lexical/string-recognition.ts`

**Descripción**: Valida si una cadena es aceptada por un AFD

**Pasos del Algoritmo**:
1. Iniciar en el estado inicial
2. Para cada símbolo de la cadena:
   - Buscar transición desde estado actual con símbolo
   - Mover al nuevo estado
   - Registrar la transición (para visualización)
3. Verificar si el estado final es de aceptación
4. Retornar resultado con camino completo

**Métodos principales**:
```typescript
function recognizeString(automaton: Automaton, input: string): RecognitionResult
function simulateStep(currentState: string, symbol: string, automaton: Automaton): string | null
```

---

#### 3.6 AF a ER (Autómata a Expresión Regular)

**Archivo**: `lib/algorithms/lexical/af-to-er.ts`

**Descripción**: Convierte un autómata finito en expresión regular equivalente

**Pasos del Algoritmo**:
1. Tomar el autómata de entrada
2. Crear sistema de ecuaciones (método de Arden)
3. Calcular fronteras:
   - Para cada estado, determinar transiciones
   - Generar ecuaciones del sistema
4. Resolver ecuaciones paso a paso:
   - Aplicar sustituciones
   - Simplificar expresiones
   - Eliminar recursión con lema de Arden
5. Obtener expresión regular final

**Métodos principales**:
```typescript
function afToER(automaton: Automaton): { regex: string, steps: EquationStep[], frontiers: Frontier[] }
function generateEquations(automaton: Automaton): Equation[]
function calculateFrontiers(automaton: Automaton): Frontier[]
function solveEquations(equations: Equation[]): EquationStep[]
function applyArdenLemma(equation: Equation): string
```

---

#### 3.7 Análisis Sintáctico Descendente (LL)

**Archivo**: `lib/algorithms/syntax/descendente.ts`

**Descripción**: Implementa parsing descendente predictivo

**Pasos del Algoritmo**:
1. Recibir gramática y símbolos terminales
2. Calcular conjuntos First para cada no terminal
3. Calcular conjuntos Follow para cada no terminal
4. Construir tabla de parsing M
5. Validar que sea gramática LL(1)

**Métodos principales**:
```typescript
function analyzeDescendente(grammar: Grammar): {
  firstFollow: FirstFollow[],
  parsingTable: ParsingTable,
  isLL1: boolean
}
function calculateFirst(grammar: Grammar): Map<string, Set<string>>
function calculateFollow(grammar: Grammar, first: Map<string, Set<string>>): Map<string, Set<string>>
function buildParsingTable(grammar: Grammar, first: Map, follow: Map): ParsingTable
function parseStringLL(grammar: Grammar, table: ParsingTable, input: string): ParseStep[]
```

---

#### 3.8 Análisis Sintáctico Ascendente (LR)

**Archivo**: `lib/algorithms/syntax/ascendente.ts`

**Descripción**: Implementa parsing ascendente (LR)

**Pasos del Algoritmo**:
1. Recibir gramática
2. Calcular tabla de precedencia
3. Construir tabla Ir (goto)
4. Generar tabla de acciones (shift/reduce)
5. Validar gramática LR

**Métodos principales**:
```typescript
function analyzeAscendente(grammar: Grammar): {
  precedenceTable: PrecedenceTable,
  gotoTable: GotoTable,
  actionTable: ActionTable
}
function calculatePrecedence(grammar: Grammar): PrecedenceTable
function buildGotoTable(grammar: Grammar): GotoTable
function parseStringLR(grammar: Grammar, tables: any, input: string): ParseStep[]
```

---

#### 3.9 Compilador Completo

**Archivo**: `lib/algorithms/general/compiler.ts`

**Descripción**: Pipeline completo de compilación

**Fases**:
1. **Análisis Léxico**: Tokenización
2. **Análisis Sintáctico**: Construcción del árbol
3. **Código Intermedio**: Generación de código de 3 direcciones
4. **Optimización**: Aplicar reglas de optimización
5. **Código Objeto**: Generación de ensamblador

**Métodos principales**:
```typescript
function compile(input: CompilerInput): CompilerResult
function lexicalAnalysis(source: string): Token[]
function syntaxAnalysis(tokens: Token[]): SyntaxTree
function generateIntermediateCode(tree: SyntaxTree): IntermediateCodeInstruction[]
function optimizeCode(code: IntermediateCodeInstruction[]): OptimizationStep[]
function generateObjectCode(optimized: OptimizationStep[]): ObjectCodeInstruction[]
```

---

### FASE 4: Componentes de Visualización (5-6 horas)

#### 4.1 Grafo del Autómata (Cytoscape)

**Archivo**: `components/automata/automata-graph.tsx`

**Características**:
- Renderizado del autómata usando Cytoscape.js
- Nodos:
  - Estado inicial: flecha de entrada
  - Estados finales: doble círculo
  - Estados normales: círculo simple
  - Colores diferenciados por tipo
- Aristas:
  - Flechas dirigidas
  - Labels con símbolos de transición
  - Transiciones ε destacadas
  - Múltiples transiciones agrupadas
- Interactividad:
  - Zoom con rueda del mouse
  - Pan con arrastre
  - Click en nodos/aristas para detalles
  - Highlight de caminos
- Layout automático (dagre, cose-bilkent)
- Animaciones de construcción paso a paso

**Configuración de Cytoscape**:
```typescript
const cytoscapeConfig = {
  style: [
    {
      selector: 'node',
      style: {
        'background-color': '#667eea',
        'label': 'data(label)',
        'text-valign': 'center',
        'text-halign': 'center',
        'width': 50,
        'height': 50,
      }
    },
    {
      selector: 'node[isInitial]',
      style: {
        'border-width': 3,
        'border-color': '#48bb78',
      }
    },
    {
      selector: 'node[isFinal]',
      style: {
        'border-width': 6,
        'border-style': 'double',
      }
    },
    {
      selector: 'edge',
      style: {
        'curve-style': 'bezier',
        'target-arrow-shape': 'triangle',
        'label': 'data(label)',
        'width': 2,
      }
    }
  ],
  layout: {
    name: 'dagre',
    rankDir: 'LR',
  }
}
```

---

**Archivo**: `components/automata/automata-controls.tsx`

**Características**:
- Controles de zoom (+, -, reset, fit)
- Botón de export (PNG, SVG, JSON)
- Selector de layout (dagre, circle, grid, cose)
- Toggle para mostrar/ocultar labels
- Slider de velocidad de animación
- Botón de play/pause para animación paso a paso

---

#### 4.2 Tablas de Análisis

**Archivo**: `components/tables/transition-table.tsx`

**Características**:
- Tabla de transiciones del autómata
- Formato: | Estado | Símbolo | Estado(s) Destino |
- Filtros por estado o símbolo
- Ordenamiento por columnas
- Highlight de transiciones seleccionadas en el grafo
- Export a CSV/Excel
- Búsqueda dentro de la tabla

**Ejemplo de datos**:
```
| Estado | a | b | ε |
|--------|---|---|---|
| q0     | q1| - | - |
| q1     | - | q2| q3|
| q2     | q2| q2| - |
```

---

**Archivo**: `components/tables/states-table.tsx`

**Características**:
- Lista de todos los estados
- Información: ID, Tipo (inicial/final/normal), Transiciones salientes/entrantes
- Click para highlight en el grafo
- Estadísticas por estado
- Agrupación por tipo

---

#### 4.3 Árbol Sintáctico

**Archivo**: `components/trees/syntax-tree.tsx`

**Características**:
- Representación jerárquica del árbol de análisis
- Nodos:
  - Operadores: `*`, `+`, `|`, `.`
  - Hojas: símbolos del alfabeto
- Expandir/colapsar ramas
- Highlight del subárbol al hover
- Animación de construcción
- Navegación breadcrumb

**Tecnología sugerida**: React Flow o D3.js

---

### FASE 5: Páginas Principales (6-8 horas)

#### 5.1 Página Principal (/) - HOME

**Archivo**: `app/page.tsx`

**Layout completo**:
```
┌────────────┬──────────────────────────┬──────────────┐
│  Sidebar   │     Main Content         │   History    │
│            │                          │   Panel      │
│  [Logo]    │   ┌────────────────────┐ │              │
│            │   │  Hero Section      │ │  historial   │
│  general   │   │  CompiMC           │ │  hecho con   │
│  AL        │   │                    │ │  localStorage│
│  ASD       │   │  [Historial] →     │ │              │
│  ASA       │   └────────────────────┘ │  [section]   │
│            │                          │  [input]     │
│  Historial │   ┌────────────────────┐ │              │
│            │   │  Hero Interior     │ │  [section]   │
│            │   │  título atrayente  │ │  [input]     │
│            │   │  moderno           │ │              │
│            │   │  subtítulo y info  │ │              │
│            │   │  [General]         │ │              │
│            │   └────────────────────┘ │              │
│            │                          │              │
│            │   ┌──────┬──────────┐   │              │
│            │   │Gener.│Analizador│   │              │
│            │   │      │  léxico  │   │              │
│            │   └──────┴──────────┘   │              │
│            │   ┌──────┬──────────┐   │              │
│            │   │Analiz│Analizador│   │              │
│            │   │sintác│sintáctico│   │              │
│            │   │desc. │ascendente│   │              │
│            │   └──────┴──────────┘   │              │
│            │                          │              │
│            │   Footer                 │              │
└────────────┴──────────────────────────┴──────────────┘
```

**Componentes**:
1. **Sidebar Principal** (`MainSidebar`)
   - Logo en la parte superior (lleva al home)
   - Botones de navegación:
     - `general` → `/general`
     - `AL` → `/analizador-lexico`
     - `ASD` → `/asd`
     - `ASA` → `/asa`
     - `Historial` → expande panel derecho

2. **Hero Section Superior**
   - Título: "CompiMC"
   - Botón "Historial" → toggle panel derecho
   - Descripción: "historial hecho con localStorage"

3. **Hero Interior**
   - Título atractivo moderno
   - Subtítulo e información de la página
   - Botón "General" destacado

4. **Grid de Features** (4 cards en 2x2)
   - **General**: Análisis completo
   - **Analizador léxico**: Autómatas finitos
   - **Analizador sintáctico descendente**: Parsing LL
   - **Analizador sintáctico ascendente**: Parsing LR

5. **Panel de Historial** (derecha, colapsable)
   - Lista de análisis previos guardados en localStorage
   - Cada item tiene:
     - Sección de análisis
     - Input usado
   - Botón "resetear historial" al tope

6. **Footer**
   - Información del proyecto

---

#### 5.2 Página General (/general)

**Archivo**: `app/general/page.tsx`

**Layout**:
```
┌────────────┬──────────────────────────┬──────────────┐
│  Sidebar   │     Main Content         │   History    │
│            │                          │              │
│  general ✓ │   Hero General           │              │
│  AL        │   texto referente        │              │
│  ASD       │                          │              │
│  ASA       │   ┌────────────────────┐ │              │
│            │   │ Input del usuario  │ │              │
│  Historial │   │ 2 + 3 * a + c^2... │ [copiar]      │
│            │   └────────────────────┘ │              │
│            │   [=] [+] [-] ...        │              │
│            │                          │              │
│            │   [Análisis] [Síntesis]  │              │
│            │                          │              │
│            │   + Análisis Léxico      │              │
│            │   agregar otros tokens   │              │
│            │   ┌────────────────────┐ │              │
│            │   │ [=] [+] [-] ...    │ │              │
│            │   │                    │ │              │
│            │   │ Token│Lexema│Tipo  │ │              │
│            │   │ ─────┼──────┼────  │ │              │
│            │   │      │      │      │ │              │
│            │   └────────────────────┘ │              │
│            │                          │              │
│            │   + Análisis Sintáctico  │              │
│            │   (árbol visual)         │              │
│            │   [copiar]               │              │
│            │                          │              │
│            │   + Código Intermedio    │              │
│            │   No. │ Instrucción      │              │
│            │   [copiar]               │              │
│            │                          │              │
│            │   + Optimización código  │              │
│            │   No. │ Instr │acción... │              │
│            │   [copiar]               │              │
│            │                          │              │
│            │   + Código objeto        │              │
│            │   código ensamblador     │              │
│            │   No. │ Instrucción      │              │
│            │   [copiar]               │              │
└────────────┴──────────────────────────┴──────────────┘
```

**Características**:
1. **Hero Section**: Título "Hero General" con texto referente
2. **Input Principal**: Campo grande para entrada del usuario (ej: `2 + 3 * a + c^2/c + 5 - a/a + c`)
3. **Slider de Símbolos**: Botones con símbolos disponibles `[=] [+] [-] ...` 
4. **Tabs de Modo**: `[Análisis]` (activo) y `[Síntesis]`
5. **Secciones Colapsables** (con `+` para expandir):
   - **Análisis Léxico**: 
     - Agregar tokens manualmente
     - Slider de tokens
     - Tabla: Token | Lexema | Tipo
   - **Análisis Sintáctico**: 
     - Árbol visual del análisis
     - Botón copiar imagen
   - **Generación de código intermedio**:
     - Tabla: No. | Instrucción
     - Botón copiar
   - **Optimización de código**:
     - Explicación de reglas aplicadas
     - Tabla: No. | Instrucción | acción hecha
     - Botón copiar
   - **Generación de código objeto**:
     - Código ensamblador
     - Tabla: No. | Instrucción
     - Botón copiar

**Notas**: 
- Cada sección se puede ordenar por columnas (si es tabla)
- Paginación de 18 en 18

---

#### 5.3 Página Analizador Léxico (/analizador-lexico)

**Archivo**: `app/analizador-lexico/page.tsx`

**Layout**:
```
┌────────────┬──────────────────────────┬──────────────┐
│  Sidebar   │     Main Content         │   History    │
│            │                          │              │
│  general   │   Hero                   │              │
│  AL ✓      │   [Historial]            │              │
│  ASD       │                          │              │
│  ASA       │   Analizador Léxico      │              │
│            │   subtítulo y info       │              │
│  Historial │                          │              │
│            │   ┌──────┬──────────┐   │              │
│            │   │ER→AF │AFD full  │   │              │
│            │   │      │          │   │              │
│            │   └──────┴──────────┘   │              │
│            │   ┌──────┬──────────┐   │              │
│            │   │AFD   │Reconocer │   │              │
│            │   │short │cadena    │   │              │
│            │   └──────┴──────────┘   │              │
│            │                          │              │
│            │   más contenido de       │              │
│            │   la temática            │              │
│            │                          │              │
│            │   Footer                 │              │
└────────────┴──────────────────────────┴──────────────┘
```

**Características**:
1. **Hero Section**: "Analizador Léxico" con subtítulo
2. **Botón Historial**: Toggle panel derecho
3. **Grid de Opciones** (2x2):
   - **Construir ER de AF**: `/analizador-lexico/er-to-af`
   - **Construir AFD full**: `/analizador-lexico/afd-full`
   - **Construir AFD short**: `/analizador-lexico/afd-short` (óptimo)
   - **Reconocer cadena**: `/analizador-lexico/reconocer`
4. **Sección Informativa**: Más contenido sobre la temática
5. **Footer**

---

#### 5.4 Página AFD Short (/analizador-lexico/afd-short)

**Archivo**: `app/analizador-lexico/afd-short/page.tsx`

**Layout**:
```
┌────────────┬──────────────────────────┬──────────────┐
│  Sidebar   │     Main Content         │   History    │
│            │                          │              │
│  AL ✓      │   Hero [Historial]       │              │
│            │   AFD Óptimo             │              │
│            │   Autómata Finito Det.   │              │
│            │   Óptimo 4rbol sintáctico│              │
│            │                          │              │
│            │   Lenguajes              │              │
│            │   [L={a,d}] [L={a,d}*]   │              │
│            │   [L={a,d}] ...          │              │
│            │                          │              │
│            │   (a|b)+abb              │              │
│            │   [=] [+] [-] ...        │              │
│            │                          │              │
│            │   + Árbol Sintáctico     │              │
│            │   ┌────────────────────┐ │              │
│            │   │   Grafo Visual     │ │              │
│            │   │     (React Flow)   │ │[copiar]     │
│            │   │        *           │ │              │
│            │   │      /   \         │ │              │
│            │   │    (.) (+)         │ │              │
│            │   │   / │ │  \         │ │              │
│            │   │  a  b a   b        │ │              │
│            │   │                    │ │              │
│            │   │ mostrar primeros,  │ │              │
│            │   │ síguientes         │ │              │
│            │   └────────────────────┘ │              │
│            │                          │              │
│            │   posicion() símbolos    │              │
│            │   ┌────────────────────┐ │              │
│            │   │ Tabla Estado│símb. │ │              │
│            │   │ ──────┼─────┼───── │ │              │
│            │   │ ->A   │ a   │ b    │ │              │
│            │   │  B    │ B   │ D    │ │              │
│            │   │  C    │ B   │ C    │ │              │
│            │   │  D    │ H   │      │ │              │
│            │   │ *E    │void │      │ │              │
│            │   └────────────────────┘ │              │
│            │                          │              │
│            │   se usa react-flow      │              │
│            │   ┌────────────────────┐ │              │
│            │   │    (0)             │ │              │
│            │   │   ↙   ↘            │ │              │
│            │   │  (1)  (2)          │ │              │
│            │   │   ↓    ↓           │ │              │
│            │   │       ...          │ │              │
│            │   │  [copiar]          │ │              │
│            │   └────────────────────┘ │              │
│            │                          │              │
│            │   Footer                 │              │
└────────────┴──────────────────────────┴──────────────┘
```

**Características**:
1. **Hero**: "Autómata Finito Determinista Óptimo árbol sintáctico"
2. **Inputs de Lenguajes**: Tags removibles (L={a,d})
3. **Input Regex**: `(a|b)+abb` con slider de símbolos
4. **Sección Árbol Sintáctico** (colapsable):
   - Grafo visual con React Flow
   - Muestra estructura del árbol
   - Botón copiar
   - Info: "mostrar primeros, síguientes"
5. **Tabla de Estados/Símbolos**:
   - Cabecera: Estado | a | b
   - Indica estado inicial (->), finales (*)
   - Muestra transiciones
6. **Grafo del AFD** (React Flow):
   - Nodos numerados (círculos)
   - Aristas con labels
   - Botón copiar
7. **Footer**

---

#### 5.5 Página Reconocer Cadena (/analizador-lexico/reconocer)

**Archivo**: `app/analizador-lexico/reconocer/page.tsx`

**Layout**:
```
┌────────────┬──────────────────────────┬──────────────┐
│  Sidebar   │     Main Content         │   History    │
│            │                          │              │
│  AL ✓      │   Hero [Historial]       │              │
│            │   Reconocer una Cadena   │              │
│            │   subtítulo y info       │              │
│            │                          │              │
│            │   Lenguajes              │              │
│            │   [L={a,d}] [L={a,d}*]   │              │
│            │   [L={a,d}] ...          │              │
│            │                          │              │
│            │   (a|b)+abb      [enviar]│              │
│            │                          │              │
│            │   + AFD óptimo           │              │
│            │   se usó react-flow      │              │
│            │   ┌────────────────────┐ │              │
│            │   │       1            │ │              │
│            │   │     ↙   ↘          │ │              │
│            │   │   (0)   (3)        │ │              │
│            │   │    ↓     ↓         │ │              │
│            │   │    2    ...        │ │              │
│            │   │   [copiar]         │ │              │
│            │   └────────────────────┘ │              │
│            │                          │              │
│            │   cadena a reconocer     │              │
│            │   aaaabbbb      [enviar] │              │
│            │                          │              │
│            │   estado1 -> a -> estado2│              │
│            │   estado1 -> a -> estado2│              │
│            │   estado1 -> a -> estado2│              │
│            │   estado1 -> a -> estado2│              │
│            │            ...           │              │
│            │   aceptada              │              │
│            │                          │              │
│            │   Footer                 │              │
└────────────┴──────────────────────────┴──────────────┘
```

**Características**:
1. **Hero**: "Reconocer una Cadena"
2. **Inputs de Lenguajes**: Tags removibles
3. **Input Regex**: Con botón [enviar] para generar AFD
4. **Sección AFD óptimo** (colapsable):
   - Grafo React Flow del autómata
   - Botón copiar
5. **Input Cadena a Reconocer**: 
   - Campo de texto: `aaaabbbb`
   - Botón [enviar] para procesar
6. **Resultado de Transiciones**:
   - Lista de pasos: `estado1 -> a -> estado2`
   - Resultado final: "aceptada" o "rechazada"
   - Scroll si hay muchas transiciones
7. **Footer**

---

#### 5.6 Página AF a ER (/analizador-lexico/af-to-er)

**Archivo**: `app/analizador-lexico/af-to-er/page.tsx`

**Layout**:
```
┌────────────┬──────────────────────────┬──────────────┐
│  Sidebar   │     Main Content         │   History    │
│            │                          │              │
│  AL ✓      │   Hero [Historial]       │              │
│            │   AF a Expresión Regular │              │
│            │   subtítulo y info       │              │
│            │                          │              │
│            │   Lenguajes              │              │
│            │   [L={a,d}] [L={a,d}*]   │              │
│            │   [L={a,d}] ...          │              │
│            │                          │              │
│            │   se usa react-flow      │              │
│            │   ┌────────────────────┐ │              │
│            │   │       1            │ │              │
│            │   │     ↙   ↘          │ │              │
│            │   │   (0)   (3)        │ │              │
│            │   │    ↓     ↓         │ │              │
│            │   │    2    ...        │ │              │
│            │   │   [copiar]         │ │              │
│            │   └────────────────────┘ │              │
│            │                          │              │
│            │   ┌────────────────────┐ │              │
│            │   │ Tabla Estado│Símb. │ │              │
│            │   │ ──────┼─────┼───── │ │              │
│            │   │ ->A   │ a   │ b    │ │              │
│            │   │  B    │ B   │ D    │ │              │
│            │   │  C    │ B   │ C    │ │              │
│            │   │ *E    │void │      │ │              │
│            │   └────────────────────┘ │              │
│            │                          │              │
│            │   Fronteras generadas    │              │
│            │   ┌────────────────────┐ │              │
│            │   │ (A)  ...           │ │              │
│            │   │ (B)  ...           │ │              │
│            │   │ (C)  ...           │ │              │
│            │   │ ...                │ │              │
│            │   └────────────────────┘ │              │
│            │                          │              │
│            │   realizar ecuaciones    │              │
│            │   ┌────────────────────┐ │              │
│            │   │                    │ │              │
│            │   │  se muestra paso a │ │              │
│            │   │  paso el proceso   │ │              │
│            │   │  de resolver las   │ │              │
│            │   │  ecuaciones con las│ │              │
│            │   │  fronteras         │ │              │
│            │   │                    │ │              │
│            │   └────────────────────┘ │              │
│            │   [◀] [▶]               │              │
│            │                          │              │
│            │   ER: (a|b)* + ...       │              │
│            │   para (mark | more )?   │              │
│            │                          │              │
│            │   Footer                 │              │
└────────────┴──────────────────────────┴──────────────┘
```

**Características**:
1. **Hero**: "Automata Finito a Expresión Regular"
2. **Inputs de Lenguajes**: Tags removibles
3. **Grafo del AF** (React Flow):
   - Visualización del autómata de entrada
   - Botón copiar
4. **Tabla de Estados/Símbolos**:
   - Muestra transiciones del AF
5. **Fronteras Generadas**:
   - Lista de fronteras calculadas
   - Formato: `(A) ...`, `(B) ...`
6. **Resolver Ecuaciones**:
   - Sección con pasos de resolución
   - Navegación paso a paso: `[◀] [▶]`
   - Muestra el proceso detallado
7. **Resultado ER**:
   - Expresión regular resultante
   - Texto explicativo
8. **Footer**

#### 5.7 Página ASA (/asa)

**Archivo**: `app/asa/page.tsx`

**Layout**:
```
┌────────────┬──────────────────────────┬──────────────┐
│  Sidebar   │     Main Content         │   History    │
│            │                          │              │
│  ASA ✓     │   Hero ASA [Historial]   │              │
│            │   Analizador Sintáctico  │              │
│            │   Ascendente             │              │
│            │   subtítulo y info       │              │
│            │                          │              │
│            │   símbolos terminales    │   Gramática  │
│            │   a, b, as               │  E -> E or T │
│            │                          │  T -> T and F│
│            │                          │  F -> id | (E)│
│            │   [Analizar]             │  [+] [-]     │
│            │                          │              │
│            │   [Precedencia] [Ir]     │              │
│            │                          │              │
│            │   + Valores              │              │
│            │   ┌────────────────────┐ │              │
│            │   │No term│Primer│Sig. │ │              │
│            │   │───────┼──────┼─────│ │              │
│            │   │  A    │ 1, 2 │     │ │              │
│            │   │  B    │      │     │ │              │
│            │   │  C    │      │     │ │              │
│            │   │  D    │ vacio│     │ │              │
│            │   └────────────────────┘ │              │
│            │                          │              │
│            │   + Tabla M              │              │
│            │   ┌────────────────────┐ │              │
│            │   │No term│  a  │  b   │ │              │
│            │   │────\──┼─────┼──────│ │              │
│            │   │  A    │     │      │ │              │
│            │   │  B    │     │      │ │              │
│            │   │  C    │     │      │ │              │
│            │   │  D    │     │      │ │              │
│            │   └────────────────────┘ │              │
│            │                          │              │
│            │   + Reconocer Cadena     │              │
│            │   cadena a reconocer     │              │
│            │                  [enviar]│              │
│            │   ┌────────────────────┐ │              │
│            │   │ Pila│Entrada│Salida│ │              │
│            │   │─────┼───────┼──────│ │              │
│            │   │     │       │      │ │              │
│            │   │     │       │      │ │              │
│            │   └────────────────────┘ │              │
│            │   [◀] [▶]               │              │
│            │                          │              │
│            │   Footer                 │              │
└────────────┴──────────────────────────┴──────────────┘
```

**Características**:
1. **Hero**: "Analizador Sintáctico Ascendente"
2. **Inputs**:
   - **Símbolos terminales**: `a, b, as`
   - **Gramática**: Lista de producciones
     - `E -> E or T | T`
     - `T -> T and F | F`
     - `F -> id | ( E )`
   - Botones [+] [-] para agregar/quitar producciones
3. **Botón Analizar**: Procesa la gramática
4. **Tabs**: `[Precedencia]` y `[Ir]`
5. **Sección Valores** (colapsable):
   - Tabla: No terminal | Primeros | Siguientes
6. **Tabla M** (colapsable):
   - Tabla de parsing
   - Cabecera con terminales
   - Filas con no terminales
7. **Sección Reconocer Cadena** (colapsable):
   - Input para cadena a reconocer
   - Botón [enviar]
   - Tabla: Pila | Entrada | Salida
   - Navegación paso a paso: `[◀] [▶]`
8. **Footer**

**Nota**: "cuando se extraiga la opcion manual, se puede ver el paso a paso si se genera se salta a la tabla de precedencia con las nuevas relaciones que puede actualizar cuando se extraiga la opcion automático"

---

#### 5.8 Página ASD (/asd)

**Archivo**: `app/asd/page.tsx`

**Layout**:
```
┌────────────┬──────────────────────────┬──────────────┐
│  Sidebar   │     Main Content         │   History    │
│            │                          │              │
│  ASD ✓     │   Hero ASD [Historial]   │              │
│            │   Analizador Sintáctico  │              │
│            │   Descendente            │              │
│            │   subtítulo y info       │              │
│            │                          │              │
│            │   símbolos terminales    │   Gramática  │
│            │   a, b, as               │  E -> E or T │
│            │                          │  T -> T and F│
│            │                          │  F -> id | (E)│
│            │   [Analizar]             │  [+] [-]     │
│            │                          │              │
│            │   + Valores              │              │
│            │   ┌────────────────────┐ │              │
│            │   │No term│Primer│Sig. │ │              │
│            │   │───────┼──────┼─────│ │              │
│            │   │  A    │ 1, 2 │     │ │              │
│            │   │  B    │      │     │ │              │
│            │   │  C    │      │     │ │              │
│            │   │  D    │ vacio│     │ │              │
│            │   └────────────────────┘ │              │
│            │                          │              │
│            │   + Tabla M              │              │
│            │   ┌────────────────────┐ │              │
│            │   │No term│  a  │  b   │ │              │
│            │   │────\──┼─────┼──────│ │              │
│            │   │  A    │     │      │ │              │
│            │   │  B    │     │      │ │              │
│            │   │  C    │     │      │ │              │
│            │   │  D    │     │      │ │              │
│            │   └────────────────────┘ │              │
│            │                          │              │
│            │   + Reconocer Cadena     │              │
│            │   cadena a reconocer     │              │
│            │                  [enviar]│              │
│            │   ┌────────────────────┐ │              │
│            │   │ Pila│Entrada│Salida│ │              │
│            │   │─────┼───────┼──────│ │              │
│            │   │     │       │      │ │              │
│            │   │     │       │      │ │              │
│            │   └────────────────────┘ │              │
│            │   [◀] [▶]               │              │
│            │                          │              │
│            │   Footer                 │              │
└────────────┴──────────────────────────┴──────────────┘
```

**Características**:
Similar a ASA pero con algoritmo descendente (LL):
1. **Hero**: "Analizador Sintáctico Descendente"
2. **Inputs de Gramática**: Igual que ASA
3. **Botón Analizar**
4. **Sección Valores** (colapsable):
   - Cálculo de First y Follow
5. **Tabla M** (colapsable):
   - Tabla de parsing LL
6. **Sección Reconocer Cadena** (colapsable):
   - Simulación de parsing descendente
   - Tabla Pila/Entrada/Salida
7. **Footer**

---

### FASE 6: Hooks Personalizados (2-3 horas)

#### 6.1 Hook de Autómata

**Archivo**: `hooks/use-automata.ts`

```typescript
function useAutomata() {
  const [automaton, setAutomaton] = useState<Automaton | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildAutomaton = async (config: AutomatonConfig) => {
    // Ejecuta el algoritmo y actualiza el estado
  };

  const testString = (input: string): boolean => {
    // Valida si la cadena es aceptada
  };

  const getTransitionTable = () => {
    // Genera la tabla de transiciones
  };

  return {
    automaton,
    isProcessing,
    error,
    buildAutomaton,
    testString,
    getTransitionTable,
  };
}
```

---

#### 6.2 Hook de Grafo

**Archivo**: `hooks/use-graph.ts`

```typescript
function useGraph(automaton: Automaton | null) {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [highlightedPath, setHighlightedPath] = useState<string[]>([]);

  useEffect(() => {
    if (automaton) {
      const data = convertAutomatonToGraph(automaton);
      setGraphData(data);
    }
  }, [automaton]);

  const highlightPath = (path: string[]) => {
    setHighlightedPath(path);
  };

  const resetHighlight = () => {
    setHighlightedPath([]);
  };

  return {
    graphData,
    selectedNode,
    setSelectedNode,
    highlightedPath,
    highlightPath,
    resetHighlight,
  };
}
```

---

### FASE 7: Utilidades y Helpers (2-3 horas)

#### 7.1 Conversión Autómata → Grafo

**Archivo**: `lib/utils/graph-layout.ts`

```typescript
function convertAutomatonToGraph(automaton: Automaton): GraphData {
  const nodes: GraphNode[] = automaton.states.map(state => ({
    data: {
      id: state.id,
      label: state.label,
      isInitial: state.isInitial,
      isFinal: state.isFinal,
    },
    position: state.position || { x: 0, y: 0 },
    classes: getNodeClasses(state),
  }));

  const edges: GraphEdge[] = automaton.transitions.map(trans => ({
    data: {
      id: trans.id,
      source: trans.from,
      target: trans.to,
      label: trans.symbol,
    },
    classes: getEdgeClasses(trans),
  }));

  return { nodes, edges };
}
```

---

#### 7.2 Exportación de Resultados

**Archivo**: `lib/utils/export.ts`

```typescript
function exportToJSON(automaton: Automaton): string {
  return JSON.stringify(automaton, null, 2);
}

function exportToPNG(cytoscapeInstance: any): Promise<Blob> {
  return cytoscapeInstance.png({ full: true });
}

function exportToCSV(transitionTable: any[][]): string {
  // Convierte la tabla a formato CSV
}

function exportToPDF(result: AlgorithmResult): Promise<Blob> {
  // Genera un PDF con todo el análisis
}
```

---

### FASE 8: Integración y Testing (3-4 horas)

#### 8.1 Integración de Componentes

- Conectar todos los componentes con el Context
- Asegurar flujo de datos correcto
- Implementar navegación entre páginas
- Verificar persistencia de estado

#### 8.2 Validaciones

- Validar expresiones regulares
- Verificar sintaxis de entrada
- Manejo de errores en algoritmos
- Mensajes de error descriptivos

#### 8.3 Optimizaciones

- Memoización de cálculos pesados
- Lazy loading de componentes
- Optimización de re-renders
- Caching de resultados

---

### FASE 9: Mejoras UX/UI (2-3 horas)

#### 9.1 Animaciones

- Transiciones suaves entre páginas
- Animación de construcción del autómata
- Loading states atractivos
- Feedback visual de acciones

#### 9.2 Responsive Design

- Adaptar layouts para mobile
- Sidebar colapsable
- Tablas con scroll horizontal
- Touch gestures para el grafo

#### 9.3 Accesibilidad

- Navegación por teclado
- ARIA labels
- Contraste de colores
- Screen reader support

---

### FASE 10: Funcionalidades Extra (3-4 horas)

#### 10.1 Ejemplos Precargados

- Librería de expresiones regulares comunes
- Casos de uso típicos
- Tutoriales interactivos

#### 10.2 Historial

- Guardar configuraciones previas
- Historial de simulaciones
- Favoritos

#### 10.3 Compartir

- Generar URL con configuración
- Compartir resultados
- Embed del grafo

#### 10.4 Modo Educativo

- Explicaciones paso a paso
- Hints y ayudas contextuales
- Quiz interactivo

---

## 🎨 Diseño Visual

### Paleta de Colores

```css
:root {
  --primary: #667eea;
  --secondary: #764ba2;
  --accent: #f093fb;
  --success: #48bb78;
  --error: #f56565;
  --warning: #ed8936;
  --info: #4299e1;
  
  --bg-primary: #ffffff;
  --bg-secondary: #f7fafc;
  --text-primary: #2d3748;
  --text-secondary: #718096;
  
  /* Dark mode */
  --dark-bg-primary: #1a202c;
  --dark-bg-secondary: #2d3748;
  --dark-text-primary: #f7fafc;
  --dark-text-secondary: #cbd5e0;
}
```

### Tipografía

- **Principal**: DM Sans (ya configurada)
- **Monospace**: Geist Mono (para código)
- **Tamaños**:
  - Headings: 2xl, xl, lg
  - Body: base, sm
  - Code: sm, xs

---

## 📦 Dependencias Necesarias

### Ya Instaladas
- ✅ Next.js 16
- ✅ React 19
- ✅ TypeScript 5
- ✅ Tailwind CSS 4
- ✅ Cytoscape.js (para visualización alternativa)
- ✅ react-cytoscapejs
- ✅ @tabler/icons-react (iconos)
- ✅ shadcn/ui components

### A Instalar (Principales)
```bash
# Visualización de grafos (principal)
pnpm add reactflow @xyflow/react

# Animaciones
pnpm add framer-motion

# Notificaciones
pnpm add react-hot-toast sonner

# Gestión de estado (opcional, ya que usaremos Context API)
pnpm add zustand

# Iconos adicionales
pnpm add lucide-react

# Tablas
pnpm add @tanstack/react-table

# Exportación
pnpm add html-to-image
pnpm add jspdf
pnpm add file-saver

# Utilidades
pnpm add date-fns
pnpm add nanoid
```

### Dependencias de Desarrollo
```bash
pnpm add -D @types/file-saver
pnpm add -D @types/cytoscape
```

---

## 🚀 Orden de Implementación Sugerido

### Sprint 1 - Fundamentos (Semana 1)
1. ✅ Configuración del proyecto base
2. ⏳ Definir todos los tipos TypeScript (automata, grammar, token, analysis, history)
3. ⏳ Implementar Context API (CompilerContext, HistoryContext)
4. ⏳ Crear componentes de layout base:
   - `MainSidebar` (logo + navegación)
   - `HeroSection` (reutilizable)
   - `HistoryPanel` (panel derecho)
   - `Footer`
5. ⏳ Página principal `/` (Home con cards)
6. ⏳ Sistema de historial con localStorage

### Sprint 2 - Analizador Léxico Básico (Semana 2)
1. ⏳ Implementar parser de regex y árbol sintáctico
2. ⏳ Algoritmo ER a AF
3. ⏳ Algoritmo AFD Short (óptimo)
4. ⏳ Componentes compartidos:
   - `LanguageInput` (tags de lenguajes)
   - `RegexInput` (input con slider de símbolos)
   - `CollapsibleSection`
   - `ActionButton`
5. ⏳ Página `/analizador-lexico` (landing)
6. ⏳ Página `/analizador-lexico/afd-short`

### Sprint 3 - Visualización con React Flow (Semana 3)
1. ⏳ Integrar React Flow para grafos
2. ⏳ Componente `AutomataGraphReactFlow`
3. ⏳ Componente `SyntaxTreeVisual`
4. ⏳ Componente `StateSymbolTable`
5. ⏳ Algoritmo AFD Full
6. ⏳ Página `/analizador-lexico/afd-full`
7. ⏳ Página `/analizador-lexico/er-to-af`

### Sprint 4 - Reconocimiento y Conversión (Semana 4)
1. ⏳ Algoritmo de reconocimiento de cadenas
2. ⏳ Algoritmo AF a ER (con fronteras y ecuaciones)
3. ⏳ Componente `StringRecognition`
4. ⏳ Componente `TransitionPathDisplay`
5. ⏳ Componente `EquationSolver`
6. ⏳ Página `/analizador-lexico/reconocer`
7. ⏳ Página `/analizador-lexico/af-to-er`

### Sprint 5 - Análisis Sintáctico (Semana 5)
1. ⏳ Algoritmo First y Follow
2. ⏳ Algoritmo parsing descendente (LL)
3. ⏳ Algoritmo parsing ascendente (LR)
4. ⏳ Componentes sintácticos:
   - `TerminalsInput`
   - `GrammarInput`
   - `FirstFollowTable`
   - `ParsingTable`
   - `PrecedenceTable`
   - `StackTraceTable`
5. ⏳ Página `/asd` (Descendente)
6. ⏳ Página `/asa` (Ascendente)

### Sprint 6 - Compilador Completo (Semana 6)
1. ⏳ Implementar análisis léxico para compilador
2. ⏳ Generación de código intermedio
3. ⏳ Optimización de código
4. ⏳ Generación de código objeto
5. ⏳ Componentes generales:
   - `LexicalAnalysis`
   - `SyntaxAnalysis`
   - `IntermediateCode`
   - `CodeOptimization`
   - `ObjectCode`
   - `TokensTable`
6. ⏳ Página `/general` (pipeline completo)

### Sprint 7 - Pulido y Features Extra (Semana 7)
1. ⏳ Sistema de exportación (copiar, JSON, PNG)
2. ⏳ Animaciones y transiciones
3. ⏳ Responsive design completo
4. ⏳ Navegación paso a paso mejorada
5. ⏳ Validaciones y manejo de errores
6. ⏳ Testing de componentes críticos

### Sprint 8 - Testing e Integración Final (Semana 8)
1. ⏳ Testing end-to-end
2. ⏳ Optimizaciones de rendimiento
3. ⏳ Accesibilidad (ARIA, navegación por teclado)
4. ⏳ Documentación de usuario
5. ⏳ Ejemplos precargados
6. ⏳ Deploy y configuración de producción

---

## 📋 Checklist de Completitud

### Funcionalidades Core - Analizador Léxico
- [ ] Parser de expresiones regulares con árbol sintáctico
- [ ] Algoritmo ER a AF (Expresión Regular a Autómata)
- [ ] AFD Full (completo sin minimizar)
- [ ] AFD Short (óptimo minimizado)
- [ ] AF a ER (Autómata a Expresión Regular con ecuaciones)
- [ ] Reconocimiento de cadenas con traza de transiciones
- [ ] Cálculo de funciones anulable, primeros, siguientes
- [ ] Cálculo de posiciones en el árbol

### Funcionalidades Core - Analizador Sintáctico
- [ ] Análisis descendente (LL)
- [ ] Análisis ascendente (LR)
- [ ] Cálculo de First y Follow
- [ ] Construcción de tabla de parsing M
- [ ] Tabla de precedencia
- [ ] Tabla Ir (goto)
- [ ] Simulación paso a paso con pila

### Funcionalidades Core - Compilador General
- [ ] Análisis léxico (tokenización)
- [ ] Análisis sintáctico (árbol)
- [ ] Generación de código intermedio
- [ ] Optimización de código
- [ ] Generación de código objeto (ensamblador)

### Visualización
- [ ] Grafos con React Flow (autómatas y árboles)
- [ ] Tabla de estados/símbolos
- [ ] Tabla de transiciones
- [ ] Árbol sintáctico visual
- [ ] Display de camino de reconocimiento
- [ ] Navegación paso a paso
- [ ] Botones de copiar/exportar

### Páginas
- [ ] Home (/) - Landing con cards
- [ ] General (/general) - Compilador completo
- [ ] AL Landing (/analizador-lexico)
- [ ] ER a AF (/analizador-lexico/er-to-af)
- [ ] AFD Full (/analizador-lexico/afd-full)
- [ ] AFD Short (/analizador-lexico/afd-short)
- [ ] AF a ER (/analizador-lexico/af-to-er)
- [ ] Reconocer (/analizador-lexico/reconocer)
- [ ] ASD (/asd) - Descendente
- [ ] ASA (/asa) - Ascendente

### Layout y Navegación
- [ ] Sidebar principal (logo, general, AL, ASD, ASA, Historial)
- [ ] Panel de historial colapsable (derecha)
- [ ] Hero sections reutilizables
- [ ] Footer global
- [ ] Navegación fluida entre páginas
- [ ] Estado activo en sidebar

### UX/UI
- [ ] Secciones colapsables (+ para expandir)
- [ ] Inputs de lenguajes con tags removibles
- [ ] Sliders de símbolos disponibles
- [ ] Botones de acción (Analizar, Enviar, Copiar)
- [ ] Tabs para alternar modos
- [ ] Loading states
- [ ] Mensajes de error descriptivos
- [ ] Animaciones y transiciones
- [ ] Responsive design completo
- [ ] Theme claro/oscuro (opcional)

### Extras
- [ ] Sistema de historial con localStorage
- [ ] Botones copiar en cada sección
- [ ] Exportar resultados (JSON, PNG)
- [ ] Navegación paso a paso (◀ ▶)
- [ ] Indicadores de estado (aceptada/rechazada)
- [ ] Ejemplos precargados
- [ ] Ordenamiento de tablas por columnas
- [ ] Paginación (18 en 18)

---

## 🔧 Comandos Útiles

```bash
# Desarrollo
pnpm dev

# Build
pnpm build

# Lint
pnpm lint

# Type check
tsc --noEmit

# Instalar todas las dependencias nuevas
pnpm add framer-motion react-hot-toast zustand lucide-react @tanstack/react-table jspdf html2canvas file-saver
```

---

## 📚 Recursos Adicionales

### Documentación
- [Cytoscape.js Docs](https://js.cytoscape.org/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Algoritmos
- Thompson Construction: Compilers - Principles, Techniques, and Tools (Dragon Book)
- Subset Construction: Introduction to Automata Theory (Hopcroft, Ullman)
- DFA Minimization: Theory of Computation

### Inspiración
- Regex101.com (para parser visual)
- FSM Designer (para layouts de grafos)
- Automaton Simulator (para UX)

---

## ✅ Criterios de Éxito

1. **Funcional**: Todos los algoritmos funcionan correctamente
2. **Visual**: Interfaz clara y atractiva
3. **Interactivo**: Grafo manipulable, animaciones fluidas
4. **Educativo**: Explicaciones claras de cada paso
5. **Robusto**: Manejo de errores y casos edge
6. **Performante**: Respuesta rápida incluso con autómatas grandes
7. **Responsive**: Funciona en desktop, tablet y mobile
8. **Accesible**: Navegación por teclado, lectores de pantalla

---

## 🎯 Próximos Pasos Inmediatos

1. **Instalar dependencias faltantes**
2. **Crear estructura de carpetas completa**
3. **Definir todos los tipos TypeScript**
4. **Implementar Context API**
5. **Crear layout base (Navbar + Sidebar)**
6. **Comenzar con el parser de regex**

---

## 📝 Notas Finales

Este plan está diseñado para ser implementado de manera iterativa. Cada fase puede completarse de forma independiente, permitiendo probar y validar funcionalidades antes de avanzar.

**Prioridad**: 
1. Core funcional (algoritmos)
2. Visualización básica
3. UX/UI pulido
4. Features extra

**Tiempo estimado total**: 40-50 horas de desarrollo

---

## 🔥 Notas Importantes de Implementación

### React Flow vs Cytoscape

**Usar React Flow** para:
- Grafos del autómata (AFD, AF, etc.)
- Árbol sintáctico visual
- Mejor integración con React
- Más fácil de estilizar
- Controles nativos de zoom/pan

**Cytoscape** (ya instalado):
- Mantener como alternativa
- Puede usarse para layouts más complejos si React Flow no es suficiente

### Componentes Clave

1. **Secciones Colapsables**: Todas las secciones expandibles usan el patrón `+ Título` que al hacer click muestra el contenido.

2. **Inputs de Lenguajes**: Son tags removibles con formato `L={a,d}` que permiten definir múltiples lenguajes.

3. **Sliders de Símbolos**: Botones horizontales `[=] [+] [-] [*] ...` para insertar símbolos rápidamente en inputs.

4. **Navegación Paso a Paso**: Botones `[◀]` y `[▶]` para navegar entre pasos de algoritmos.

5. **Panel de Historial**: Se guarda en localStorage y se muestra/oculta al hacer click en "Historial".

### Flujo de Usuario Típico

**Analizador Léxico**:
1. Usuario va a `/analizador-lexico`
2. Selecciona opción (ej: AFD Short)
3. Ingresa lenguajes y expresión regular
4. Click en generar/analizar
5. Ve resultado: árbol sintáctico + tabla + grafo
6. Puede copiar o continuar con reconocer cadena

**Analizador Sintáctico**:
1. Usuario va a `/asd` o `/asa`
2. Ingresa símbolos terminales y gramática
3. Click en "Analizar"
4. Ve tablas: First/Follow, Tabla M o Precedencia
5. Ingresa cadena a reconocer
6. Ve simulación paso a paso en tabla Pila/Entrada/Salida

**Compilador General**:
1. Usuario va a `/general`
2. Ingresa expresión compleja (ej: `2 + 3 * a + c^2/c`)
3. Usa slider para agregar símbolos
4. Click en "Análisis" o "Síntesis"
5. Ve cada fase expandible:
   - Léxico → Tokens
   - Sintáctico → Árbol
   - Código intermedio → Instrucciones
   - Optimización → Cambios
   - Código objeto → Ensamblador

---

*Documento actualizado el 14 de diciembre de 2025*
*Proyecto: CompiMC - Simulador de Compiladores y Analizadores*
*Basado en análisis detallado de wireframes del frontend*

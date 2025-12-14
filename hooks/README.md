# Hooks Personalizados - CompiMC

Implementación completa de la **Fase 6** del plan de desarrollo: hooks personalizados para manejar la lógica de los análisis léxico, sintáctico y compilación completa.

## 📚 Índice

1. [useAutomata](#useautomata) - Manejo de autómatas finitos
2. [useGraph](#usegraph) - Visualización de grafos con React Flow
3. [useSyntaxAnalyzer](#usesyntaxanalyzer) - Análisis sintáctico LL y LR
4. [useCompilerFull](#usecompilerfull) - Pipeline completo de compilación
5. [useHistory](#usehistory) - Gestión del historial

---

## useAutomata

Hook para manejar autómatas finitos (AFD, AFN, construcción y reconocimiento).

### Importación

```typescript
import { useAutomata } from '@/hooks';
```

### Retorno

```typescript
interface UseAutomataReturn {
  // Estado
  automaton: Automaton | null;
  isProcessing: boolean;
  error: string | null;
  recognitionResult: RecognitionResult | null;
  
  // Funciones
  buildAutomaton: (config: AutomatonConfig) => Promise<void>;
  testString: (input: string) => Promise<RecognitionResult | null>;
  getTransitionTable: () => TransitionTable | null;
  convertToER: () => Promise<{ regex: string; steps: any[] } | null>;
  clearAutomaton: () => void;
  clearError: () => void;
}
```

### Uso

```typescript
function MyComponent() {
  const { 
    automaton, 
    isProcessing, 
    error,
    buildAutomaton,
    testString,
    getTransitionTable,
  } = useAutomata();

  // Construir autómata desde expresión regular
  const handleBuild = async () => {
    await buildAutomaton({
      regex: '(a|b)*abb',
      languages: ['L={a,b}'],
      algorithm: 'afd-short',
    });
  };

  // Reconocer cadena
  const handleTest = async () => {
    const result = await testString('aabb');
    console.log(result?.accepted); // true o false
  };

  // Obtener tabla de transiciones
  const table = getTransitionTable();

  return (
    <div>
      {isProcessing && <p>Procesando...</p>}
      {error && <p>Error: {error}</p>}
      {automaton && <p>Autómata generado: {automaton.states.length} estados</p>}
    </div>
  );
}
```

### Algoritmos soportados

- `thompson`: Construcción de AFN usando el método de Thompson
- `afd-full`: AFD completo (sin minimizar)
- `afd-short`: AFD minimizado (óptimo)

---

## useGraph

Hook para convertir autómatas en formato React Flow y gestionar visualización.

### Importación

```typescript
import { useGraph } from '@/hooks';
```

### Retorno

```typescript
interface UseGraphReturn {
  nodes: FlowNode[];
  edges: FlowEdge[];
  selectedNode: string | null;
  highlightedPath: string[];
  
  setSelectedNode: (nodeId: string | null) => void;
  highlightPath: (path: string[]) => void;
  highlightRecognitionPath: (result: RecognitionResult) => void;
  resetHighlight: () => void;
  centerOnNode: (nodeId: string) => void;
}
```

### Uso

```typescript
import { ReactFlow } from '@xyflow/react';
import { useAutomata, useGraph } from '@/hooks';

function AutomataGraph() {
  const { automaton } = useAutomata();
  const { 
    nodes, 
    edges, 
    highlightPath,
    resetHighlight 
  } = useGraph(automaton);

  return (
    <div style={{ width: '100%', height: '500px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
      />
      <button onClick={() => highlightPath(['q0', 'q1', 'q2'])}>
        Resaltar camino
      </button>
      <button onClick={resetHighlight}>
        Limpiar resaltado
      </button>
    </div>
  );
}
```

### Características

- Conversión automática de `Automaton` a formato React Flow
- Nodos estilizados según tipo (inicial, final, normal)
- Agrupación de transiciones múltiples
- Highlighting de caminos
- Animación de aristas

---

## useSyntaxAnalyzer

Hook para análisis sintáctico descendente (LL) y ascendente (LR).

### Importación

```typescript
import { useSyntaxAnalyzer } from '@/hooks';
```

### Retorno

```typescript
interface UseSyntaxAnalyzerReturn {
  // Estado
  grammar: Grammar | null;
  mode: 'LL' | 'LR' | null;
  firstFollow: FirstFollow[] | null;
  parsingTable: ParsingTable | null;
  precedenceTable: PrecedenceTable | null;
  gotoTable: GotoTable | null;
  actionTable: ActionTable | null;
  parsingResult: ParsingResult | null;
  isManualMode: boolean;
  isProcessing: boolean;
  error: string | null;

  // Funciones
  setGrammar: (grammar: Grammar) => void;
  analyzeLL: () => Promise<void>;
  analyzeLR: (manual: boolean) => Promise<void>;
  parseString: (input: string) => Promise<ParsingResult | null>;
  setManualMode: (manual: boolean) => void;
  clearAnalysis: () => void;
  clearError: () => void;
}
```

### Uso - Análisis Descendente (LL)

```typescript
function LLAnalyzer() {
  const {
    grammar,
    firstFollow,
    parsingTable,
    parsingResult,
    setGrammar,
    analyzeLL,
    parseString,
  } = useSyntaxAnalyzer();

  const handleAnalyze = async () => {
    // Definir gramática
    setGrammar({
      terminals: ['a', 'b', 'c'],
      nonTerminals: ['S', 'A', 'B'],
      productions: [
        { id: 'p1', left: 'S', right: ['A', 'B'] },
        { id: 'p2', left: 'A', right: ['a'] },
        { id: 'p3', left: 'B', right: ['b'] },
      ],
      startSymbol: 'S',
    });

    // Ejecutar análisis LL
    await analyzeLL();
  };

  const handleParse = async () => {
    const result = await parseString('ab');
    console.log(result?.accepted); // true o false
  };

  return (
    <div>
      <button onClick={handleAnalyze}>Analizar Gramática</button>
      <button onClick={handleParse}>Parsear Cadena</button>
      
      {firstFollow && (
        <div>
          <h3>First & Follow</h3>
          {firstFollow.map(ff => (
            <div key={ff.nonTerminal}>
              {ff.nonTerminal}: First={ff.first.join(',')} Follow={ff.follow.join(',')}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Uso - Análisis Ascendente (LR)

```typescript
function LRAnalyzer() {
  const {
    precedenceTable,
    isManualMode,
    analyzeLR,
    setManualMode,
    parseString,
  } = useSyntaxAnalyzer();

  const handleAnalyzeManual = async () => {
    setManualMode(true);
    await analyzeLR(true); // Genera pasos manuales
  };

  const handleAnalyzeAuto = async () => {
    setManualMode(false);
    await analyzeLR(false); // Genera tabla automáticamente
  };

  return (
    <div>
      <button onClick={handleAnalyzeManual}>Modo Manual</button>
      <button onClick={handleAnalyzeAuto}>Modo Automático</button>
      
      {precedenceTable && (
        <div>
          <h3>Tabla de Precedencia</h3>
          {/* Renderizar tabla */}
        </div>
      )}
    </div>
  );
}
```

---

## useCompilerFull

Hook para el pipeline completo de compilación.

### Importación

```typescript
import { useCompilerFull } from '@/hooks';
```

### Retorno

```typescript
interface UseCompilerFullReturn {
  sourceCode: string;
  result: CompilerResult | null;
  currentPhase: 'idle' | 'lexical' | 'syntax' | 'intermediate' | 'optimization' | 'codegen' | 'complete';
  progress: number;
  isProcessing: boolean;
  error: string | null;

  setSourceCode: (code: string) => void;
  compile: (mode: 'analisis' | 'sintesis') => Promise<void>;
  compilePhase: (phase: 'lexical' | 'syntax' | 'intermediate' | 'optimization' | 'codegen') => Promise<void>;
  clearCompiler: () => void;
  clearError: () => void;
}
```

### Uso - Compilación Completa

```typescript
function Compiler() {
  const {
    sourceCode,
    result,
    currentPhase,
    progress,
    isProcessing,
    setSourceCode,
    compile,
  } = useCompilerFull();

  const handleCompile = async () => {
    setSourceCode('2 + 3 * a + c^2/c');
    await compile('sintesis'); // Compilación completa
  };

  return (
    <div>
      <textarea 
        value={sourceCode}
        onChange={(e) => setSourceCode(e.target.value)}
      />
      <button onClick={handleCompile} disabled={isProcessing}>
        Compilar
      </button>
      
      {isProcessing && (
        <div>
          <p>Fase actual: {currentPhase}</p>
          <progress value={progress} max={100} />
        </div>
      )}

      {result && (
        <div>
          <h3>Tokens</h3>
          {result.lexical.tokens.map((token, i) => (
            <div key={i}>{token.type}: {token.lexeme}</div>
          ))}

          <h3>Código Intermedio</h3>
          {result.intermediateCode.map((inst) => (
            <div key={inst.number}>{inst.instruction}</div>
          ))}

          <h3>Código Objeto</h3>
          {result.objectCode.map((inst) => (
            <div key={inst.number}>{inst.instruction}</div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Uso - Compilación por Fases

```typescript
function PhaseCompiler() {
  const { compilePhase, result } = useCompilerFull();

  const handleLexical = () => compilePhase('lexical');
  const handleSyntax = () => compilePhase('syntax');
  const handleIntermediate = () => compilePhase('intermediate');
  const handleOptimization = () => compilePhase('optimization');
  const handleCodegen = () => compilePhase('codegen');

  return (
    <div>
      <button onClick={handleLexical}>Análisis Léxico</button>
      <button onClick={handleSyntax}>Análisis Sintáctico</button>
      <button onClick={handleIntermediate}>Código Intermedio</button>
      <button onClick={handleOptimization}>Optimización</button>
      <button onClick={handleCodegen}>Código Objeto</button>
    </div>
  );
}
```

---

## useHistory

Hook para gestionar el historial de análisis.

### Importación

```typescript
import { useHistory } from '@/hooks';
```

### Retorno

```typescript
interface UseHistoryReturn {
  history: HistoryEntry[];
  filteredHistory: HistoryEntry[];
  currentFilter: HistoryFilter | null;

  addEntry: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void;
  removeEntry: (id: string) => void;
  clearHistory: () => void;
  loadEntry: (id: string) => HistoryEntry | null;
  updateEntry: (id: string, updates: Partial<HistoryEntry>) => void;
  setFilter: (filter: HistoryFilter | null) => void;
  clearFilter: () => void;
  searchHistory: (term: string) => HistoryEntry[];
}
```

### Uso

```typescript
function HistoryPanel() {
  const {
    history,
    filteredHistory,
    addEntry,
    removeEntry,
    clearHistory,
    setFilter,
  } = useHistory();

  // Agregar al historial
  const handleSave = () => {
    addEntry({
      type: 'lexical',
      input: '(a|b)*abb',
      result: automaton,
      metadata: {
        algorithm: 'thompson',
        duration: 150,
        success: true,
      },
    });
  };

  // Filtrar por tipo
  const handleFilterLexical = () => {
    setFilter({ type: 'lexical' });
  };

  return (
    <div>
      <button onClick={handleSave}>Guardar en Historial</button>
      <button onClick={clearHistory}>Limpiar Todo</button>
      <button onClick={handleFilterLexical}>Solo Léxico</button>

      <ul>
        {filteredHistory.map((entry) => (
          <li key={entry.id}>
            {entry.type} - {entry.input}
            <button onClick={() => removeEntry(entry.id)}>Eliminar</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 🎯 Integración con Context

Todos los hooks utilizan el `CompilerContext` y `HistoryContext` para persistir el estado globalmente. Asegúrate de envolver tu aplicación con los providers:

```typescript
// app/layout.tsx
import { CompilerProvider } from '@/lib/context/compiler-context';
import { HistoryProvider } from '@/lib/context/history-context';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <CompilerProvider>
          <HistoryProvider>
            {children}
          </HistoryProvider>
        </CompilerProvider>
      </body>
    </html>
  );
}
```

---

## 📝 Notas Importantes

1. **Persistencia**: El estado se mantiene en el context y no se pierde al cambiar de página (dentro del mismo layout)

2. **Historial**: Se guarda automáticamente en `localStorage` con la clave `compimc-history`

3. **Error Handling**: Todos los hooks tienen manejo de errores integrado. Usa `clearError()` para limpiar mensajes de error.

4. **Async Operations**: Las funciones principales son async y deben ser awaited o manejadas con `.then()`

5. **TypeScript**: Todos los hooks están completamente tipados. Usa el autocompletado de tu IDE.

---

## 🚀 Próximos Pasos

Con estos hooks implementados, la **Fase 6** está completa. Los siguientes pasos según el plan son:

- **Fase 7**: Utilidades y Helpers (conversión de grafos, exportación)
- **Fase 8**: Integración y Testing
- **Fase 9**: Mejoras UX/UI
- **Fase 10**: Funcionalidades Extra

---

## 📚 Referencias

- [CompilerContext](/lib/context/compiler-context.tsx)
- [HistoryContext](/lib/context/history-context.tsx)
- [Tipos](/lib/types)
- [Algoritmos](/lib/algorithms)
- [Plan de Desarrollo](/docs/PLAN_DESARROLLO.md)

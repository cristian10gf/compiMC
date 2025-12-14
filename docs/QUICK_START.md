# Quick Start - CompiMC

## 🚀 Inicio Rápido

### 1. Instalar Dependencias Principales

```bash
# Visualización de grafos (PRINCIPAL - reemplaza a Cytoscape)
pnpm add reactflow @xyflow/react

# Animaciones y notificaciones
pnpm add framer-motion react-hot-toast

# Utilidades
pnpm add lucide-react @tanstack/react-table html-to-image jspdf file-saver date-fns nanoid

# Dev dependencies
pnpm add -D @types/file-saver
```

### 2. Crear Estructura de Carpetas

```bash
# Páginas
mkdir -p app/general
mkdir -p app/analizador-lexico/{er-to-af,afd-full,afd-short,af-to-er,reconocer}
mkdir -p app/asd
mkdir -p app/asa

# Componentes
mkdir -p components/{layout,home,analizador-lexico,analizador-sintactico,general,shared}

# Algoritmos
mkdir -p lib/algorithms/{lexical,syntax,general}

# Types
mkdir -p lib/types

# Context
mkdir -p lib/context

# Hooks
mkdir -p hooks
```

### 3. Orden de Implementación Recomendado

#### Fase 1: Fundamentos (Día 1-2)
1. Definir tipos en `lib/types/`:
   - `automata.ts`
   - `grammar.ts`
   - `token.ts`
   - `analysis.ts`
   - `history.ts`

2. Crear Context API:
   - `lib/context/compiler-context.tsx`
   - `lib/context/history-context.tsx`

3. Layout base:
   - `components/layout/main-sidebar.tsx`
   - `components/layout/hero-section.tsx`
   - `components/layout/history-panel.tsx`
   - `app/layout.tsx` (actualizar con sidebar)

4. Página home:
   - `app/page.tsx`

#### Fase 2: Analizador Léxico Básico (Día 3-4)
1. Algoritmos base:
   - `lib/algorithms/lexical/regex-parser.ts`
   - `lib/algorithms/lexical/er-to-af.ts`
   - `lib/algorithms/lexical/afd-construction.ts`

2. Componentes léxicos:
   - `components/analizador-lexico/language-input.tsx`
   - `components/analizador-lexico/regex-input.tsx`
   - `components/analizador-lexico/automata-graph-react-flow.tsx`
   - `components/analizador-lexico/state-symbol-table.tsx`

3. Páginas:
   - `app/analizador-lexico/page.tsx`
   - `app/analizador-lexico/afd-short/page.tsx`

#### Fase 3: Visualización (Día 5-6)
1. Configurar React Flow:
   - Crear estilos base
   - Componentes de nodos y aristas personalizados
   - Layouts automáticos

2. Completar páginas léxicas:
   - `app/analizador-lexico/er-to-af/page.tsx`
   - `app/analizador-lexico/afd-full/page.tsx`
   - `app/analizador-lexico/reconocer/page.tsx`
   - `app/analizador-lexico/af-to-er/page.tsx`

#### Fase 4: Análisis Sintáctico (Día 7-8)
1. Algoritmos sintácticos:
   - `lib/algorithms/syntax/first-follow.ts`
   - `lib/algorithms/syntax/descendente.ts`
   - `lib/algorithms/syntax/ascendente.ts`

2. Componentes sintácticos:
   - `components/analizador-sintactico/terminals-input.tsx`
   - `components/analizador-sintactico/grammar-input.tsx`
   - `components/analizador-sintactico/first-follow-table.tsx`
   - `components/analizador-sintactico/parsing-table.tsx`
   - `components/analizador-sintactico/stack-trace-table.tsx`

3. Páginas:
   - `app/asd/page.tsx`
   - `app/asa/page.tsx`

#### Fase 5: Compilador General (Día 9-10)
1. Algoritmos completos:
   - `lib/algorithms/general/lexical-phase.ts`
   - `lib/algorithms/general/syntax-phase.ts`
   - `lib/algorithms/general/intermediate-code-gen.ts`
   - `lib/algorithms/general/optimization.ts`

2. Componentes generales:
   - `components/general/lexical-analysis.tsx`
   - `components/general/syntax-analysis.tsx`
   - `components/general/intermediate-code.tsx`
   - `components/general/code-optimization.tsx`
   - `components/general/object-code.tsx`

3. Página:
   - `app/general/page.tsx`

---

## 📋 Checklist de Archivos Prioritarios

### Tipos (Día 1)
- [ ] `lib/types/automata.ts`
- [ ] `lib/types/grammar.ts`
- [ ] `lib/types/token.ts`
- [ ] `lib/types/analysis.ts`
- [ ] `lib/types/history.ts`

### Context (Día 1)
- [ ] `lib/context/compiler-context.tsx`
- [ ] `lib/context/history-context.tsx`

### Layout (Día 1-2)
- [ ] `components/layout/main-sidebar.tsx`
- [ ] `components/layout/hero-section.tsx`
- [ ] `components/layout/history-panel.tsx`
- [ ] `components/shared/collapsible-section.tsx`
- [ ] `components/shared/action-button.tsx`
- [ ] `app/layout.tsx` (actualizar)
- [ ] `app/page.tsx` (home)

### Analizador Léxico Core (Día 3-4)
- [ ] `lib/algorithms/lexical/regex-parser.ts`
- [ ] `lib/algorithms/lexical/er-to-af.ts`
- [ ] `lib/algorithms/lexical/afd-construction.ts`
- [ ] `components/analizador-lexico/language-input.tsx`
- [ ] `components/analizador-lexico/regex-input.tsx`
- [ ] `components/analizador-lexico/automata-graph-react-flow.tsx`
- [ ] `app/analizador-lexico/page.tsx`
- [ ] `app/analizador-lexico/afd-short/page.tsx`

---

## 🎨 Guía de Estilos

### Colores Principales
```css
--primary: #667eea (morado azulado)
--accent: #f093fb (rosado)
--success: #48bb78 (verde)
--warning: #ed8936 (naranja)
--error: #f56565 (rojo)
```

### Componentes UI Reutilizables

**Sección Colapsable**:
```tsx
<CollapsibleSection title="Árbol Sintáctico" defaultOpen={false}>
  {/* Contenido */}
</CollapsibleSection>
```

**Input de Lenguajes**:
```tsx
<LanguageInput 
  languages={["L={a,d}", "L={a,d}*"]} 
  onChange={setLanguages}
/>
```

**Slider de Símbolos**:
```tsx
<SymbolSlider 
  symbols={['=', '+', '-', '*', '/', '(', ')', ...]}
  onSelect={(symbol) => insertSymbol(symbol)}
/>
```

**Botón de Acción**:
```tsx
<ActionButton 
  variant="primary" 
  onClick={handleAnalyze}
  loading={isProcessing}
>
  Analizar
</ActionButton>
```

**Botón Copiar**:
```tsx
<CopyButton content={graphData} label="copiar" />
```

---

## 🔧 Configuración de React Flow

```tsx
import ReactFlow, { 
  Controls, 
  Background, 
  MiniMap 
} from 'reactflow';
import 'reactflow/dist/style.css';

// Ejemplo de uso básico
const AutomataGraph = ({ automaton }: { automaton: Automaton }) => {
  const nodes = automaton.states.map(state => ({
    id: state.id,
    data: { label: state.label },
    position: state.position || { x: 0, y: 0 },
    style: {
      background: state.isFinal ? '#48bb78' : '#667eea',
      border: state.isInitial ? '3px solid #000' : 'none',
    }
  }));

  const edges = automaton.transitions.map(trans => ({
    id: trans.id,
    source: trans.from,
    target: trans.to,
    label: trans.symbol,
    animated: true,
  }));

  return (
    <div style={{ height: '400px' }}>
      <ReactFlow nodes={nodes} edges={edges}>
        <Controls />
        <Background />
        <MiniMap />
      </ReactFlow>
    </div>
  );
};
```

---

## 💾 Sistema de Historial

```tsx
// Guardar en historial
const saveToHistory = (section: string, input: string, result: any) => {
  const entry: HistoryEntry = {
    id: nanoid(),
    timestamp: Date.now(),
    section,
    input,
    result
  };
  
  const history = JSON.parse(localStorage.getItem('compimc-history') || '[]');
  history.push(entry);
  localStorage.setItem('compimc-history', JSON.stringify(history));
};

// Cargar historial
const loadHistory = (): HistoryEntry[] => {
  return JSON.parse(localStorage.getItem('compimc-history') || '[]');
};

// Limpiar historial
const clearHistory = () => {
  localStorage.removeItem('compimc-history');
};
```

---

## 🧪 Testing

```bash
# Instalar testing libraries (opcional para sprint final)
pnpm add -D @testing-library/react @testing-library/jest-dom jest jest-environment-jsdom
```

---

## 📚 Referencias Útiles

- [React Flow Docs](https://reactflow.dev/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Framer Motion](https://www.framer.com/motion/)

---

## ⚠️ Notas Importantes

1. **React Flow vs Cytoscape**: Usar React Flow como principal para mejor integración con React.

2. **localStorage**: Todo el historial se guarda en localStorage con la key `compimc-history`.

3. **Navegación paso a paso**: Usar botones `[◀]` y `[▶]` para navegar entre pasos de algoritmos.

4. **Secciones colapsables**: Todas las secciones expandibles tienen un `+` al inicio del título.

5. **Panel de historial**: Se muestra/oculta con el botón "Historial" en el hero o sidebar.

6. **Validación**: Validar todas las entradas antes de ejecutar algoritmos.

7. **Manejo de errores**: Mostrar mensajes descriptivos con react-hot-toast.

---

*Documento creado: 14 de diciembre de 2025*

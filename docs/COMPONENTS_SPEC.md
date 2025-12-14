# Especificación de Componentes - CompiMC

> Guía detallada de todos los componentes necesarios para el proyecto

## 📁 Estructura de Componentes

```
components/
├── layout/                      # Componentes de estructura
│   ├── main-sidebar.tsx
│   ├── hero-section.tsx
│   ├── history-panel.tsx
│   └── footer.tsx
├── home/                        # Componentes de home
│   ├── feature-card.tsx
│   └── feature-grid.tsx
├── analizador-lexico/          # Componentes AL
│   ├── language-input.tsx
│   ├── regex-input.tsx
│   ├── syntax-tree-visual.tsx
│   ├── automata-graph-react-flow.tsx
│   ├── state-symbol-table.tsx
│   ├── transition-path-display.tsx
│   ├── string-recognition.tsx
│   └── equation-solver.tsx
├── analizador-sintactico/      # Componentes AS
│   ├── terminals-input.tsx
│   ├── grammar-input.tsx
│   ├── precedence-table.tsx
│   ├── goto-table.tsx
│   ├── productions-table.tsx
│   ├── first-follow-table.tsx
│   ├── parsing-table.tsx
│   └── stack-trace-table.tsx
├── general/                     # Componentes compilador
│   ├── lexical-analysis.tsx
│   ├── syntax-analysis.tsx
│   ├── intermediate-code.tsx
│   ├── code-optimization.tsx
│   ├── object-code.tsx
│   └── tokens-table.tsx
├── shared/                      # Componentes compartidos
│   ├── collapsible-section.tsx
│   ├── action-button.tsx
│   ├── result-status.tsx
│   ├── copy-button.tsx
│   └── symbol-slider.tsx
└── ui/                         # shadcn/ui (ya existentes)
```

---

## 🏗️ Layout Components

### MainSidebar

**Ubicación**: `components/layout/main-sidebar.tsx`

**Props**:
```typescript
interface MainSidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}
```

**Estructura**:
```tsx
<aside className="w-[120px] bg-white border-r">
  <div className="logo-container">
    <Link href="/">
      <Image src="/logo.svg" alt="Logo" />
    </Link>
  </div>
  
  <nav className="menu-items">
    <SidebarButton 
      label="general" 
      href="/general" 
      active={currentPath === '/general'} 
    />
    <SidebarButton 
      label="AL" 
      href="/analizador-lexico" 
      active={currentPath.startsWith('/analizador-lexico')} 
    />
    <SidebarButton 
      label="ASD" 
      href="/asd" 
      active={currentPath === '/asd'} 
    />
    <SidebarButton 
      label="ASA" 
      href="/asa" 
      active={currentPath === '/asa'} 
    />
    <SidebarButton 
      label="Historial" 
      onClick={toggleHistoryPanel} 
    />
  </nav>
</aside>
```

**Estilos**:
- Ancho fijo: 120px
- Items centrados verticalmente
- Botón activo con background destacado
- Hover effects

---

### HeroSection

**Ubicación**: `components/layout/hero-section.tsx`

**Props**:
```typescript
interface HeroSectionProps {
  title: string;
  subtitle?: string;
  showHistoryButton?: boolean;
  onHistoryClick?: () => void;
}
```

**Estructura**:
```tsx
<section className="hero-section">
  {showHistoryButton && (
    <Button 
      variant="outline" 
      className="history-btn"
      onClick={onHistoryClick}
    >
      Historial
    </Button>
  )}
  
  <h1 className="hero-title">{title}</h1>
  {subtitle && <p className="hero-subtitle">{subtitle}</p>}
</section>
```

**Variantes**:
- Con/sin botón de historial
- Con/sin subtítulo
- Tamaños de título ajustables

---

### HistoryPanel

**Ubicación**: `components/layout/history-panel.tsx`

**Props**:
```typescript
interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}
```

**Estructura**:
```tsx
<aside className={`history-panel ${isOpen ? 'open' : 'closed'}`}>
  <div className="panel-header">
    <h3>historial hecho con localStorage</h3>
    <Button variant="ghost" size="sm" onClick={clearHistory}>
      resetear historial
    </Button>
  </div>
  
  <div className="history-list">
    {history.map(entry => (
      <HistoryItem 
        key={entry.id}
        section={entry.section}
        input={entry.input}
        timestamp={entry.timestamp}
        onClick={() => loadEntry(entry.id)}
      />
    ))}
  </div>
</aside>
```

**Características**:
- Ancho: 300px
- Slide in/out animation
- Scroll interno si hay muchos items
- Items clickeables para cargar

---

## 🏠 Home Components

### FeatureCard

**Ubicación**: `components/home/feature-card.tsx`

**Props**:
```typescript
interface FeatureCardProps {
  title: string;
  description?: string;
  href: string;
  icon?: React.ReactNode;
}
```

**Estructura**:
```tsx
<Link href={href}>
  <Card className="feature-card hover:shadow-lg transition">
    {icon && <div className="icon">{icon}</div>}
    <h3 className="title">{title}</h3>
    {description && <p className="description">{description}</p>}
  </Card>
</Link>
```

---

## 🔤 Analizador Léxico Components

### LanguageInput

**Ubicación**: `components/analizador-lexico/language-input.tsx`

**Props**:
```typescript
interface LanguageInputProps {
  languages: string[];
  onChange: (languages: string[]) => void;
  placeholder?: string;
}
```

**Estructura**:
```tsx
<div className="language-input">
  <label>Lenguajes</label>
  <div className="tags-container">
    {languages.map((lang, idx) => (
      <Tag 
        key={idx}
        label={lang}
        onRemove={() => removeLanguage(idx)}
      />
    ))}
    <input 
      type="text"
      placeholder="L = {a, d}"
      onKeyDown={handleAddLanguage}
    />
  </div>
</div>
```

**Características**:
- Tags removibles con X
- Enter para agregar nuevo lenguaje
- Validación de formato
- Autocompletado opcional

---

### RegexInput

**Ubicación**: `components/analizador-lexico/regex-input.tsx`

**Props**:
```typescript
interface RegexInputProps {
  value: string;
  onChange: (value: string) => void;
  symbols?: string[];
  showSymbolSlider?: boolean;
}
```

**Estructura**:
```tsx
<div className="regex-input-container">
  <Input 
    value={value}
    onChange={onChange}
    placeholder="(a|b)+abb"
    className="regex-input"
  />
  
  {showSymbolSlider && (
    <SymbolSlider 
      symbols={symbols || DEFAULT_SYMBOLS}
      onSelect={(symbol) => insertAtCursor(symbol)}
    />
  )}
</div>
```

**Características**:
- Syntax highlighting opcional
- Validación en tiempo real
- Slider de símbolos integrado

---

### AutomataGraphReactFlow

**Ubicación**: `components/analizador-lexico/automata-graph-react-flow.tsx`

**Props**:
```typescript
interface AutomataGraphReactFlowProps {
  automaton: Automaton;
  highlightedNodes?: string[];
  highlightedEdges?: string[];
  onNodeClick?: (nodeId: string) => void;
  showCopyButton?: boolean;
}
```

**Estructura**:
```tsx
<div className="graph-container">
  <ReactFlow
    nodes={nodes}
    edges={edges}
    onNodeClick={onNodeClick}
    fitView
  >
    <Controls />
    <Background />
    <MiniMap />
  </ReactFlow>
  
  {showCopyButton && (
    <CopyButton 
      className="absolute top-2 right-2"
      onCopy={exportAsImage}
    />
  )}
</div>
```

**Características**:
- Nodos personalizados (inicial, final, normal)
- Aristas con labels
- Zoom y pan
- Export a imagen
- Highlight dinámico

---

### SyntaxTreeVisual

**Ubicación**: `components/analizador-lexico/syntax-tree-visual.tsx`

**Props**:
```typescript
interface SyntaxTreeVisualProps {
  tree: ParseTree;
  showFirstLast?: boolean;
  onNodeClick?: (nodeId: string) => void;
}
```

**Estructura**:
```tsx
<div className="tree-container">
  <ReactFlow
    nodes={treeNodes}
    edges={treeEdges}
    nodeTypes={customNodeTypes}
    fitView
  >
    <Controls />
    <Background />
  </ReactFlow>
  
  {showFirstLast && (
    <div className="info-panel">
      <p>mostrar primeros, síguientes</p>
    </div>
  )}
</div>
```

---

### StateSymbolTable

**Ubicación**: `components/analizador-lexico/state-symbol-table.tsx`

**Props**:
```typescript
interface StateSymbolTableProps {
  states: State[];
  alphabet: string[];
  transitions: Map<string, Map<string, string>>;
  highlightCell?: { state: string, symbol: string };
}
```

**Estructura**:
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Estado</TableHead>
      {alphabet.map(symbol => (
        <TableHead key={symbol}>{symbol}</TableHead>
      ))}
    </TableRow>
  </TableHeader>
  <TableBody>
    {states.map(state => (
      <TableRow key={state.id}>
        <TableCell>
          {state.isInitial && '→'}
          {state.isFinal && '*'}
          {state.label}
        </TableCell>
        {alphabet.map(symbol => (
          <TableCell 
            key={symbol}
            className={isHighlighted(state, symbol) ? 'highlight' : ''}
          >
            {transitions.get(state.id)?.get(symbol) || '-'}
          </TableCell>
        ))}
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

### TransitionPathDisplay

**Ubicación**: `components/analizador-lexico/transition-path-display.tsx`

**Props**:
```typescript
interface TransitionPathDisplayProps {
  transitions: RecognitionResult['transitions'];
  accepted: boolean;
}
```

**Estructura**:
```tsx
<div className="transition-path">
  {transitions.map((trans, idx) => (
    <div key={idx} className="transition-step">
      {trans.from} → {trans.symbol} → {trans.to}
    </div>
  ))}
  
  <ResultStatus accepted={accepted} />
</div>
```

---

### EquationSolver

**Ubicación**: `components/analizador-lexico/equation-solver.tsx`

**Props**:
```typescript
interface EquationSolverProps {
  equations: Equation[];
  currentStep: number;
  onStepChange: (step: number) => void;
}
```

**Estructura**:
```tsx
<div className="equation-solver">
  <div className="equation-display">
    {equations[currentStep].display}
  </div>
  
  <div className="explanation">
    {equations[currentStep].explanation}
  </div>
  
  <div className="navigation">
    <Button 
      onClick={() => onStepChange(currentStep - 1)}
      disabled={currentStep === 0}
    >
      ◀
    </Button>
    <span>{currentStep + 1} / {equations.length}</span>
    <Button 
      onClick={() => onStepChange(currentStep + 1)}
      disabled={currentStep === equations.length - 1}
    >
      ▶
    </Button>
  </div>
</div>
```

---

## 📐 Analizador Sintáctico Components

### GrammarInput

**Ubicación**: `components/analizador-sintactico/grammar-input.tsx`

**Props**:
```typescript
interface GrammarInputProps {
  productions: Production[];
  onChange: (productions: Production[]) => void;
}
```

**Estructura**:
```tsx
<div className="grammar-input">
  <label>Gramática</label>
  {productions.map((prod, idx) => (
    <div key={idx} className="production-row">
      <Input 
        value={prod.left}
        onChange={(e) => updateProduction(idx, 'left', e.target.value)}
        placeholder="E"
      />
      <span>→</span>
      <Input 
        value={prod.right.join(' ')}
        onChange={(e) => updateProduction(idx, 'right', e.target.value.split(' '))}
        placeholder="E or T | T"
      />
      <Button 
        variant="ghost" 
        size="icon"
        onClick={() => removeProduction(idx)}
      >
        -
      </Button>
    </div>
  ))}
  
  <Button onClick={addProduction}>+</Button>
</div>
```

---

### FirstFollowTable

**Ubicación**: `components/analizador-sintactico/first-follow-table.tsx`

**Props**:
```typescript
interface FirstFollowTableProps {
  data: FirstFollow[];
}
```

**Estructura**:
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>No terminal</TableHead>
      <TableHead>Primeros</TableHead>
      <TableHead>Siguientes</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {data.map(row => (
      <TableRow key={row.nonTerminal}>
        <TableCell>{row.nonTerminal}</TableCell>
        <TableCell>{row.first.join(', ') || 'vacío'}</TableCell>
        <TableCell>{row.follow.join(', ')}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

### ParsingTable

**Ubicación**: `components/analizador-sintactico/parsing-table.tsx`

**Props**:
```typescript
interface ParsingTableProps {
  table: ParsingTable;
  nonTerminals: string[];
  terminals: string[];
}
```

**Estructura**:
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>No term \ term</TableHead>
      {terminals.map(term => (
        <TableHead key={term}>{term}</TableHead>
      ))}
    </TableRow>
  </TableHeader>
  <TableBody>
    {nonTerminals.map(nonTerm => (
      <TableRow key={nonTerm}>
        <TableCell>{nonTerm}</TableCell>
        {terminals.map(term => (
          <TableCell key={term}>
            {table[nonTerm]?.[term]?.production?.right.join(' ') || ''}
          </TableCell>
        ))}
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

### StackTraceTable

**Ubicación**: `components/analizador-sintactico/stack-trace-table.tsx`

**Props**:
```typescript
interface StackTraceTableProps {
  steps: ParseStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
}
```

**Estructura**:
```tsx
<div className="stack-trace">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Pila</TableHead>
        <TableHead>Entrada</TableHead>
        <TableHead>Salida</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {steps.slice(0, currentStep + 1).map((step, idx) => (
        <TableRow 
          key={idx}
          className={idx === currentStep ? 'current' : ''}
        >
          <TableCell>{step.stack.join(' ')}</TableCell>
          <TableCell>{step.input.join(' ')}</TableCell>
          <TableCell>{step.output}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
  
  <div className="navigation">
    <Button onClick={() => onStepChange(currentStep - 1)}>◀</Button>
    <Button onClick={() => onStepChange(currentStep + 1)}>▶</Button>
  </div>
</div>
```

---

## 🔧 Shared Components

### CollapsibleSection

**Ubicación**: `components/shared/collapsible-section.tsx`

**Props**:
```typescript
interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  icon?: React.ReactNode;
}
```

**Estructura**:
```tsx
<div className="collapsible-section">
  <button 
    className="section-header"
    onClick={() => setIsOpen(!isOpen)}
  >
    <span className="icon">{isOpen ? '-' : '+'}</span>
    <span className="title">{title}</span>
    {icon}
  </button>
  
  {isOpen && (
    <div className="section-content">
      {children}
    </div>
  )}
</div>
```

---

### ActionButton

**Ubicación**: `components/shared/action-button.tsx`

**Props**:
```typescript
interface ActionButtonProps {
  variant: 'primary' | 'secondary' | 'outline';
  children: React.ReactNode;
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
}
```

---

### CopyButton

**Ubicación**: `components/shared/copy-button.tsx`

**Props**:
```typescript
interface CopyButtonProps {
  content: string | (() => Promise<Blob>);
  label?: string;
  onCopy?: () => void;
}
```

**Estructura**:
```tsx
<Button 
  variant="outline"
  size="sm"
  onClick={handleCopy}
  className="copy-button"
>
  {copied ? (
    <><Check className="w-4 h-4" /> Copiado</>
  ) : (
    <><Copy className="w-4 h-4" /> {label || 'copiar'}</>
  )}
</Button>
```

---

### SymbolSlider

**Ubicación**: `components/shared/symbol-slider.tsx`

**Props**:
```typescript
interface SymbolSliderProps {
  symbols: string[];
  onSelect: (symbol: string) => void;
}
```

**Estructura**:
```tsx
<div className="symbol-slider">
  {symbols.map(symbol => (
    <Button
      key={symbol}
      variant="outline"
      size="sm"
      onClick={() => onSelect(symbol)}
    >
      {symbol}
    </Button>
  ))}
  <span>...</span>
</div>
```

---

## 📊 General Components

### TokensTable

**Ubicación**: `components/general/tokens-table.tsx`

**Props**:
```typescript
interface TokensTableProps {
  tokens: Token[];
}
```

**Estructura**:
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Token</TableHead>
      <TableHead>Lexema</TableHead>
      <TableHead>Tipo</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {tokens.map((token, idx) => (
      <TableRow key={idx}>
        <TableCell>{token.type}</TableCell>
        <TableCell>{token.lexeme}</TableCell>
        <TableCell>{token.value || '-'}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

### IntermediateCode

**Ubicación**: `components/general/intermediate-code.tsx`

**Props**:
```typescript
interface IntermediateCodeProps {
  instructions: IntermediateCodeInstruction[];
}
```

---

### CodeOptimization

**Ubicación**: `components/general/code-optimization.tsx`

**Props**:
```typescript
interface CodeOptimizationProps {
  steps: OptimizationStep[];
}
```

---

## 🎨 Estilos Comunes

### Clases Reutilizables

```css
/* Containers */
.page-container { @apply max-w-7xl mx-auto px-4 py-8; }
.section-container { @apply bg-white rounded-lg shadow p-6 mb-6; }

/* Buttons */
.btn-primary { @apply bg-primary text-white hover:bg-primary/90; }
.btn-secondary { @apply bg-secondary text-white hover:bg-secondary/90; }

/* Tables */
.table-container { @apply overflow-x-auto; }
.table-cell-highlight { @apply bg-yellow-100 font-bold; }

/* Inputs */
.input-container { @apply mb-4; }
.input-label { @apply block text-sm font-medium mb-2; }

/* Status */
.status-accepted { @apply text-green-600 font-bold; }
.status-rejected { @apply text-red-600 font-bold; }
```

---

*Documento creado: 14 de diciembre de 2025*

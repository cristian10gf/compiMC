# Fase 5 - Páginas Principales ✅

## Resumen

Se han implementado todas las páginas principales de la aplicación siguiendo el patrón de Server Components de Next.js 13+, con separación clara entre componentes de servidor (para SEO y metadata) y componentes cliente (para interactividad).

## Estructura de Páginas

### Patrón Implementado

Cada página sigue la estructura:

```
/app/[ruta]/
  ├── page.tsx          # Server Component (metadata, SEO, estructura HTML)
  └── page-client.tsx   # Client Component (estado, interactividad)
```

**Beneficios:**
- Mejor SEO con metadata estática
- Componentes cliente solo donde se necesitan
- HTML semántico correcto
- Mejor rendimiento inicial

## Páginas Implementadas

### 1. Home (`/`)

**Archivo:** `/app/page.tsx`

**Características:**
- Server Component con metadata export
- Hero section con título y descripción
- Grid de 3 feature cards:
  - Analizador Léxico
  - Analizador Sintáctico
  - Compilador General
- Links usando componente Next.js Link
- Semántica HTML5 correcta (section, article, nav)

**Componentes usados:**
- `FeatureGrid`
- `FeatureCard`
- `Link` (next/link)

---

### 2. Analizador Léxico Landing (`/analizador-lexico`)

**Archivo:** `/app/analizador-lexico/page.tsx`

**Características:**
- Server Component
- Hero section descriptiva
- Grid de 4 opciones:
  - ER a AFN (Thompson)
  - AFD Óptimo
  - AF a ER
  - Reconocer Cadena
- Enlaces a subpáginas

**Componentes usados:**
- `FeatureCard`
- `Card` (shadcn/ui)

---

### 3. ER a AFN (`/analizador-lexico/er-to-af`)

**Archivos:**
- `/app/analizador-lexico/er-to-af/page.tsx` (server)
- `/app/analizador-lexico/er-to-af/page-client.tsx` (client)

**Características:**
- Input de lenguajes (L={a,b})
- Input de expresión regular
- Symbol Slider para insertar símbolos
- Construcción de AFN usando Thompson
- Visualizaciones:
  - Árbol sintáctico
  - Tabla de transiciones
  - Grafo del autómata

**Algoritmos integrados:**
- `buildSyntaxTree()`
- `regexToAFN()`

**Componentes usados:**
- `LanguageInput`
- `SymbolSlider`
- `SyntaxTreeVisual`
- `TransitionTable`
- `AutomataGraph`
- `CollapsibleSection`

**Estado:**
- useState para regex, languages, resultados
- useHistory para guardar en historial
- Manejo de errores con try/catch

---

### 4. AFD Óptimo (`/analizador-lexico/afd-short`)

**Archivos:**
- `/app/analizador-lexico/afd-short/page.tsx` (server)
- `/app/analizador-lexico/afd-short/page-client.tsx` (client)

**Características:**
- Similar a ER a AFN
- Construcción de AFD minimizado
- Tabla de transiciones del AFD
- Grafo visual con estados minimizados

**Algoritmos integrados:**
- `buildSyntaxTree()`
- `constructAFDOptimo()`

**Componentes usados:**
- `LanguageInput`
- `SymbolSlider`
- `SyntaxTreeVisual`
- `TransitionTable`
- `AutomataGraph`

---

### 5. Reconocer Cadena (`/analizador-lexico/reconocer`)

**Archivos:**
- `/app/analizador-lexico/reconocer/page.tsx` (server)
- `/app/analizador-lexico/reconocer/page-client.tsx` (client)

**Características:**
- Construcción de AFD primero
- Input de cadena a reconocer
- Symbol Slider con alfabeto del autómata
- Visualización paso a paso del reconocimiento
- Reproductor con controles (play, pause, step)

**Algoritmos integrados:**
- `buildSyntaxTree()`
- `constructAFDOptimo()`
- `recognizeString()`

**Componentes usados:**
- `LanguageInput`
- `AutomataGraph` (con estados resaltados)
- `StringRecognition` (con autoPlay)
- `SymbolSlider`

**Funcionalidad especial:**
- Dos fases: construir autómata → reconocer cadena
- Resaltado de path en grafo durante reconocimiento
- Resultado final: aceptada/rechazada

---

### 6. AF a ER (`/analizador-lexico/af-to-er`)

**Archivos:**
- `/app/analizador-lexico/af-to-er/page.tsx` (server)
- `/app/analizador-lexico/af-to-er/page-client.tsx` (client)

**Características:**
- Definición manual del autómata:
  - Estados (comma-separated)
  - Alfabeto (LanguageInput)
  - Estado inicial
  - Estados finales
  - Transiciones (multiline textarea)
- Conversión mediante método de Arden
- Resultado: expresión regular equivalente
- Pasos de conversión detallados

**Algoritmos integrados:**
- `afToRegex()`

**Componentes usados:**
- `LanguageInput`
- `CollapsibleSection`
- Parser de transiciones custom

**Formato de transiciones:**
```
q0 a q1
q1 b q2
q2 a q0
```

---

### 7. Análisis Sintáctico Descendente (`/asd`)

**Archivos:**
- `/app/asd/page.tsx` (server)
- `/app/asd/page-client.tsx` (client)

**Características:**
- Input de gramática con producciones
- Análisis LL(1) predictivo
- Tabs con 3 vistas:
  - **Tabla M**: Tabla de análisis LL
  - **Traza**: Stack × Input × Action
  - **Conjuntos**: FIRST y FOLLOW

**Algoritmos integrados:**
- `analyzeDescendente()`

**Componentes usados:**
- `GrammarInput`
- `ParsingTable`
- `StackTraceTable`
- `Tabs` (shadcn/ui)
- `CollapsibleSection`

**Formato de gramática:**
```typescript
[
  { left: 'S', right: ['a', 'A'] },
  { left: 'A', right: ['b'] }
]
```

---

### 8. Análisis Sintáctico Ascendente (`/asa`)

**Archivos:**
- `/app/asa/page.tsx` (server)
- `/app/asa/page-client.tsx` (client)

**Características:**
- Input de gramática
- Análisis LR (shift-reduce)
- Tabs con 3 vistas:
  - **Precedencia**: Tabla de operadores (<, >, =, ·)
  - **Traza**: Stack × Input × Action
  - **Items LR**: Conjuntos de items canónicos

**Algoritmos integrados:**
- `analyzeAscendente()`

**Componentes usados:**
- `GrammarInput`
- `PrecedenceTable`
- `StackTraceTable`
- `Tabs`
- `CollapsibleSection`

**Ejemplo de gramática:**
```typescript
[
  { left: 'E', right: ['E', '+', 'T'] },
  { left: 'E', right: ['T'] },
  { left: 'T', right: ['T', '*', 'F'] },
  { left: 'T', right: ['F'] },
  { left: 'F', right: ['(', 'E', ')'] },
  { left: 'F', right: ['id'] }
]
```

---

### 9. Compilador General (`/general`)

**Archivos:**
- `/app/general/page.tsx` (server)
- `/app/general/page-client.tsx` (client)

**Características:**
- Textarea para código fuente
- Pipeline completo de compilación
- Tabs con 2 fases:
  - **Análisis**:
    - Tokens (léxico)
    - Árbol sintáctico (sintáctico)
    - Errores semánticos
  - **Síntesis**:
    - Código intermedio (3 direcciones)
    - Pasos de optimización
    - Código optimizado
    - Código objeto (ensamblador)

**Algoritmos integrados:**
- `compile()` (pipeline completo)

**Componentes usados:**
- `TokensTable`
- `SyntaxTreeVisual`
- `CodeTable` (reutilizable)
- `OptimizationTable`
- `Tabs`
- `CollapsibleSection`

**Ejemplo de entrada:**
```
a = b + c * d
```

**Salidas:**
- Tokens: identificadores, operadores, asignación
- Árbol: jerarquía de operaciones
- Código 3D: `t1 = c * d`, `t2 = b + t1`, `a = t2`
- Optimizado: eliminación de código muerto
- Ensamblador: MOV, ADD, MUL, etc.

---

## Componente Auxiliar Creado

### Tabs (shadcn/ui)

**Archivo:** `/components/ui/tabs.tsx`

**Componentes exportados:**
- `Tabs` (TabsPrimitive.Root)
- `TabsList`
- `TabsTrigger`
- `TabsContent`

**Uso:**
```tsx
<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Contenido 1</TabsContent>
  <TabsContent value="tab2">Contenido 2</TabsContent>
</Tabs>
```

**Usado en:**
- `/asd` (Tabla M / Traza / Conjuntos)
- `/asa` (Precedencia / Traza / Items LR)
- `/general` (Análisis / Síntesis)

---

## Patrones de Diseño

### Server/Client Separation

**Server Component (`page.tsx`):**
```tsx
import { Metadata } from 'next';
import ClientPage from './page-client';

export const metadata: Metadata = {
  title: '...',
  description: '...',
};

export default function Page() {
  return (
    <>
      <section className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold">Título</h1>
        <p className="text-muted-foreground">Descripción</p>
      </section>
      <section className="container mx-auto px-4 pb-8">
        <ClientPage />
      </section>
    </>
  );
}
```

**Client Component (`page-client.tsx`):**
```tsx
'use client';

import { useState } from 'react';
import { useHistory } from '@/lib/context';

export default function ClientPage() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const { addEntry } = useHistory();

  const handleProcess = async () => {
    // Lógica de procesamiento
    setResult(processedData);
    addEntry({ type, input, timestamp, success });
  };

  return (
    <div className="space-y-6">
      {/* Formularios y controles */}
      {/* Visualización de resultados */}
    </div>
  );
}
```

### Estructura de Resultados

Todas las páginas siguen este patrón:

1. **Card de Configuración**
   - Inputs
   - Botón de acción
   - Mensaje de error (si aplica)

2. **Resultados con CollapsibleSection**
   - Título descriptivo
   - defaultOpen para vista inmediata
   - Componentes de visualización

3. **Tabs para múltiples vistas** (opcional)
   - Organización lógica de información
   - Un tab por tipo de resultado

### Manejo de Estado

```tsx
const [loading, setLoading] = useState(false);
const [result, setResult] = useState(null);
const [error, setError] = useState<string | null>(null);

const handleAction = async () => {
  try {
    setLoading(true);
    setError(null);
    const data = await algorithm(input);
    setResult(data);
  } catch (err: any) {
    setError(err.message || 'Error');
  } finally {
    setLoading(false);
  }
};
```

### Integración con Historial

```tsx
import { useHistory } from '@/lib/context';

const { addEntry } = useHistory();

// Después de procesar
addEntry({
  type: 'lexical' | 'syntactic' | 'general',
  input: userInput,
  timestamp: Date.now(),
  success: processingResult.success,
});
```

---

## Semántica HTML

Todas las páginas usan:
- `<section>` para bloques de contenido
- `<h1>` para título principal (una vez por página)
- `<p>` para descripciones
- `<label>` con `htmlFor` para inputs
- `<div>` solo para layout (flexbox, grid)
- No `<div>` innecesarios

Ejemplo:
```tsx
<section className="container mx-auto px-4 py-6">
  <div className="mx-auto max-w-4xl">
    <h1 className="text-3xl font-bold">Título</h1>
    <p className="text-muted-foreground">Descripción</p>
  </div>
</section>
```

---

## Estilos y Tokens Semánticos

Todas las páginas usan:
- `bg-muted` / `bg-background` / `bg-card`
- `text-foreground` / `text-muted-foreground`
- `border` / `border-input` / `border-destructive`
- `rounded-md` / `rounded-lg`
- `space-y-{n}` para espaciado vertical
- `container mx-auto px-4` para márgenes responsivos

No se usan valores hardcoded de colores, solo tokens de Tailwind.

---

## Navegación

### Rutas Implementadas

```
/                           → Home
/analizador-lexico          → Landing léxico
  /er-to-af                 → ER a AFN (Thompson)
  /afd-short                → AFD Óptimo
  /af-to-er                 → AF a ER (Arden)
  /reconocer                → Reconocer cadena
/asd                        → Análisis sintáctico descendente (LL)
/asa                        → Análisis sintáctico ascendente (LR)
/general                    → Compilador completo
```

### Links de Navegación

Todos usan `Link` de Next.js:
```tsx
import Link from 'next/link';

<Link href="/ruta" className="...">
  Texto del enlace
</Link>
```

---

## Responsividad

Todas las páginas son responsive:
- `sm:` para pantallas pequeñas (640px+)
- `lg:` para pantallas grandes (1024px+)
- `max-w-4xl` para limitar ancho en pantallas grandes
- `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- Botones con `w-full sm:w-auto`

---

## Accesibilidad

- Labels asociados a inputs
- Botones con estados disabled
- Focus visible (ring-offset-background, ring-ring)
- Contraste adecuado (text-foreground, bg-background)
- Mensajes de error visibles (bg-destructive/10)

---

## Performance

- Server Components por defecto (sin JS en el cliente)
- Client Components solo para interactividad
- Metadata estática para SEO
- Code splitting automático de Next.js
- Lazy loading de componentes pesados (React Flow)

---

## Integración con Algoritmos

Cada página importa los algoritmos necesarios:

```tsx
// Léxico
import { buildSyntaxTree } from '@/lib/algorithms/lexical/regex-parser';
import { regexToAFN } from '@/lib/algorithms/lexical/er-to-af';
import { constructAFDOptimo } from '@/lib/algorithms/lexical/afd-construction';
import { recognizeString } from '@/lib/algorithms/lexical/string-recognition';
import { afToRegex } from '@/lib/algorithms/lexical/af-to-er';

// Sintáctico
import { analyzeDescendente } from '@/lib/algorithms/syntax/descendente';
import { analyzeAscendente } from '@/lib/algorithms/syntax/ascendente';

// General
import { compile } from '@/lib/algorithms/general/compiler';
```

---

## Testing

Para probar las páginas:

1. **Desarrollo local:**
   ```bash
   pnpm dev
   ```

2. **Navegar a cada ruta:**
   - `http://localhost:3000/`
   - `http://localhost:3000/analizador-lexico`
   - `http://localhost:3000/analizador-lexico/er-to-af`
   - etc.

3. **Verificar:**
   - Metadata en pestaña del navegador
   - Formularios interactivos
   - Resultados visibles
   - Sin errores en consola
   - Historial guardado

---

## Próximos Pasos

- [ ] Tests unitarios de páginas
- [ ] Tests E2E con Playwright
- [ ] Optimización de imágenes (si se agregan)
- [ ] PWA (si se requiere)
- [ ] Analytics (si se requiere)

---

## Resumen de Archivos Creados

**Páginas (18 archivos):**
1. `/app/page.tsx` (actualizado)
2. `/app/analizador-lexico/page.tsx`
3. `/app/analizador-lexico/er-to-af/page.tsx`
4. `/app/analizador-lexico/er-to-af/page-client.tsx`
5. `/app/analizador-lexico/afd-short/page.tsx`
6. `/app/analizador-lexico/afd-short/page-client.tsx`
7. `/app/analizador-lexico/reconocer/page.tsx`
8. `/app/analizador-lexico/reconocer/page-client.tsx`
9. `/app/analizador-lexico/af-to-er/page.tsx`
10. `/app/analizador-lexico/af-to-er/page-client.tsx`
11. `/app/asd/page.tsx`
12. `/app/asd/page-client.tsx`
13. `/app/asa/page.tsx`
14. `/app/asa/page-client.tsx`
15. `/app/general/page.tsx`
16. `/app/general/page-client.tsx`

**Componentes UI (1 archivo):**
17. `/components/ui/tabs.tsx`

**Documentación (1 archivo):**
18. `/docs/FASE_5_COMPLETADA.md` (este archivo)

---

## Conclusión

✅ **Fase 5 completada exitosamente**

Todas las páginas principales de la aplicación están implementadas siguiendo:
- Patrón Server/Client Components de Next.js 13+
- Integración completa con algoritmos de Fase 3
- Uso de componentes de visualización de Fase 4
- Semántica HTML correcta
- Estilos consistentes con diseño del proyecto
- Responsive y accesible
- SEO optimizado con metadata

La aplicación está lista para desarrollo posterior o despliegue.

# Cambios en la Conversión AF → ER

## Resumen de Cambios

Se ha actualizado la página de conversión de Autómata Finito a Expresión Regular para usar el **método de eliminación de estados** en lugar del método algebraico de Arden.

## 🔄 Archivos Modificados

### 1. `/lib/algorithms/lexical/af-to-er.ts`

**Nuevas funcionalidades:**

- ✅ Implementación del **método de eliminación de estados** (`afToERByStateElimination`)
- ✅ Mantiene las ecuaciones de Arden para referencia
- ✅ Genera pasos detallados del proceso de eliminación
- ✅ Función de comparación entre ambos métodos (`afToERBothMethods`)

**Interfaces añadidas:**

```typescript
interface RegexTransition {
  from: string;
  to: string;
  regex: string;
}

interface StateEliminationStep {
  stepNumber: number;
  description: string;
  action: 'init' | 'add-states' | 'eliminate' | 'final';
  eliminatedState?: string;
  transitions: RegexTransition[];
  currentStates: string[];
  explanation: string;
}
```

### 2. `/hooks/use-automata.ts`

**Cambios:**

- ✅ Importa `afToERByStateElimination` en lugar de solo `afToER`
- ✅ Actualiza `convertToER` para usar el método de eliminación de estados
- ✅ Retorna `ardenEquations` además de `steps` y `regex`

**Antes:**
```typescript
const result = afToER(lexical.automaton.automatonAFD);
```

**Después:**
```typescript
const result = afToERByStateElimination(lexical.automaton.automatonAFD);
```

### 3. `/app/analizador-lexico/af-to-er/page-client.tsx`

**Cambios principales:**

1. **Imports actualizados:**
   - ✅ Usa `useAutomata` hook
   - ✅ Importa solo `createExampleAutomaton` del algoritmo
   - ✅ Elimina tipos no necesarios

2. **Estado y lógica:**
   - ✅ Integra el hook `useAutomata`
   - ✅ Actualiza la estructura de `result` para incluir `ardenEquations`
   - ✅ Simplifica el manejo de estados usando el hook

3. **UI actualizada:**
   - ✅ Nueva descripción explicando el método de eliminación de estados
   - ✅ Sección de ecuaciones de Arden como referencia
   - ✅ Nueva visualización de pasos de eliminación de estados
   - ✅ Muestra transiciones en cada paso
   - ✅ Elimina sección de fronteras (ya no necesaria)

## 🎯 Ventajas del Nuevo Método

### Método de Eliminación de Estados vs Método de Arden

| Aspecto | Arden | Eliminación de Estados |
|---------|-------|------------------------|
| **Complejidad** | O(n⁴) variable | O(n³) predecible |
| **Pasos** | Muchos (sustituciones) | Pocos (eliminaciones) |
| **ER resultante** | Compleja | Simple y legible |
| **Trazabilidad** | Difícil | Fácil de seguir |
| **Implementación** | Compleja | Directa |

## 📋 Características de la Nueva UI

### Sección 1: Ecuaciones de Arden (Referencia)
- Muestra las ecuaciones generadas automáticamente
- Sirve como referencia del autómata original
- Indica estados iniciales (→) y finales (*)

### Sección 2: Procedimiento de Eliminación de Estados
- **Paso 1:** Transiciones iniciales del autómata
- **Paso 2:** Agregar estado inicial I
- **Paso 3:** Agregar estado final F
- **Pasos 4-N:** Eliminación de cada estado original
- **Paso final:** ER resultante

Cada paso muestra:
- Número de paso y tipo de acción
- Explicación del proceso
- Transiciones actualizadas (excluyendo transiciones vacías ∅)
- Estados actuales en el autómata

## 🧪 Ejemplo de Uso

```typescript
// Autómata que acepta cadenas que comienzan con "ab"
const automaton = {
  states: [
    { id: 'q0', label: 'q0', isInitial: true, isFinal: false },
    { id: 'q1', label: 'q1', isInitial: false, isFinal: false },
    { id: 'q2', label: 'q2', isInitial: false, isFinal: true },
  ],
  transitions: [
    { from: 'q0', to: 'q1', symbol: 'a' },
    { from: 'q1', to: 'q2', symbol: 'b' },
    { from: 'q2', to: 'q2', symbol: 'a' },
    { from: 'q2', to: 'q2', symbol: 'b' },
  ],
};

// Ecuaciones de Arden generadas:
// →q0 = aq1
//  q1 = bq2
// *q2 = (a|b)q2 | ε

// ER resultante por eliminación de estados:
// ab(a|b)*
```

## 🔍 Proceso de Eliminación

### Algoritmo

```
1. Estados: I, q0, q1, q2, F
2. Eliminar q0: I → q1 con "a"
3. Eliminar q1: I → q2 con "ab"
4. Eliminar q2: I → F con "ab(a|b)*"
5. Resultado: ab(a|b)*
```

### Fórmula de Eliminación

Para eliminar estado `q` en la transición `p→r`:

```
R(p→r)_nueva = R(p→q)·R(q→q)*·R(q→r) + R(p→r)_anterior
```

## 📚 Documentación

Ver [AF_TO_ER_METHODS.md](./AF_TO_ER_METHODS.md) para documentación completa sobre ambos métodos y sus diferencias.

## ✅ Tests

Ejecutar el script de demostración:

```bash
npx tsx test-af-to-er.ts
```

Este script muestra:
- Ecuaciones de Arden generadas
- Proceso completo de eliminación de estados
- ER final y ejemplos de cadenas aceptadas/rechazadas

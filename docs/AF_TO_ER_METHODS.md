# Conversión de Autómata Finito a Expresión Regular

Este módulo implementa dos métodos para convertir un Autómata Finito (AF) a una Expresión Regular (ER) equivalente:

## 📚 Métodos Implementados

### 1. **Método de Arden** (Ecuaciones Algebraicas)

Utiliza el **Teorema de Arden**: Si `X = A·X | B`, entonces `X = A*·B` (siempre que ε ∉ A).

**Proceso:**
1. Crear una ecuación para cada estado basada en sus transiciones salientes
2. Resolver el sistema sustituyendo variables
3. Aplicar el Lema de Arden para eliminar recursiones
4. La ER final es la expresión del estado inicial

**Ventajas:**
- Enfoque algebraico elegante
- Útil para entender las relaciones entre estados

**Limitaciones:**
- Puede generar expresiones muy complejas antes de simplificar
- Requiere múltiples sustituciones iterativas

### 2. **Método de Eliminación de Estados** ⭐ (Recomendado)

Basado en los artículos de [Baeldung](https://www.baeldung.com/cs/finite-automata-to-regular-expressions) y [Educative.io](https://www.educative.io/answers/how-to-convert-finite-automata-to-regular-expressions).

**Algoritmo:**

```
1. Agregar nuevo estado inicial I con transición ε → estado_inicial_original
2. Agregar nuevo estado final F con transiciones ε desde todos los estados finales
3. Para cada estado q a eliminar (excepto I y F):
   - Para cada par de estados (p, r) donde p→q y q→r:
     R(p→r) = R(p→q)·R(q→q)*·R(q→r) + R(p→r)
4. La ER final es R(I→F)
```

**Ventajas:**
- Genera expresiones más simples y legibles
- Pasos claramente definidos y fáciles de seguir
- Complejidad predecible: O(n³) donde n es el número de estados

## 🎯 Ejemplo Práctico

### Autómata de Entrada

```
Estados: q0 (inicial), q1, q2 (final)
Alfabeto: {a, b}
Transiciones:
  δ(q0, a) = q1
  δ(q1, b) = q2
  δ(q2, a) = q2
  δ(q2, b) = q2
```

**Lenguaje aceptado:** Cadenas que comienzan con "ab"

### Paso 1: Ecuaciones de Arden (Generación Inicial)

```
→q0 = aq1              (desde q0 con 'a' vamos a q1)
 q1 = bq2              (desde q1 con 'b' vamos a q2)
*q2 = (a|b)q2 | ε      (q2 acepta 'a' o 'b' y vuelve a sí mismo, ε porque es final)
```

### Paso 2: Eliminación de Estados

#### 2.1 Agregar estados nuevos

```
Estados: I, q0, q1, q2, F
Transiciones:
  I → q0: ε
  q0 → q1: a
  q1 → q2: b
  q2 → q2: a|b
  q2 → F: ε
```

#### 2.2 Eliminar q0

```
R(I→q1) = R(I→q0)·R(q0→q0)*·R(q0→q1) + R(I→q1)
        = ε·ε·a + ∅
        = a
```

Estados: I, q1, q2, F

#### 2.3 Eliminar q1

```
R(I→q2) = R(I→q1)·R(q1→q1)*·R(q1→q2) + R(I→q2)
        = a·ε·b + ∅
        = ab
```

Estados: I, q2, F

#### 2.4 Eliminar q2

```
R(I→F) = R(I→q2)·R(q2→q2)*·R(q2→F) + R(I→F)
       = ab·(a|b)*·ε + ∅
       = ab(a|b)*
```

Estados: I, F

### ✅ Resultado Final

```
ER = ab(a|b)*
```

Esta expresión acepta todas las cadenas que comienzan con "ab" seguidas de cualquier combinación de 'a' y 'b'.

## 💻 Uso en Código

### Opción 1: Solo Método de Eliminación de Estados

```typescript
import { afToERByStateElimination } from '@/lib/algorithms/lexical/af-to-er';

const result = afToERByStateElimination(automaton);

console.log(result.regex);           // "ab(a|b)*"
console.log(result.steps);           // Array de pasos detallados
console.log(result.ardenEquations);  // Ecuaciones iniciales de Arden
```

### Opción 2: Comparar Ambos Métodos

```typescript
import { afToERBothMethods } from '@/lib/algorithms/lexical/af-to-er';

const result = afToERBothMethods(automaton);

console.log(result.ardenResult.regex);              // ER por Arden
console.log(result.stateEliminationResult.regex);   // ER por eliminación
console.log(result.equivalent);                     // ¿Son equivalentes?
```

## 🧪 Ejecutar Demo

```bash
npx tsx test-af-to-er.ts
```

Este script muestra:
1. Ecuaciones de Arden generadas inicialmente
2. Proceso paso a paso del método de eliminación de estados
3. Expresión regular final
4. Ejemplos de cadenas aceptadas y rechazadas

## 📊 Comparación de Métodos

| Característica | Arden | Eliminación de Estados |
|---------------|-------|------------------------|
| **Complejidad** | Variable | O(n³) predecible |
| **Legibilidad de ER** | Media-Baja | Alta |
| **Pasos necesarios** | Muchos | Pocos |
| **Implementación** | Compleja | Simple |
| **Trazabilidad** | Difícil | Fácil |

## 🔍 Referencias

1. [Baeldung - Finite Automata to Regular Expressions](https://www.baeldung.com/cs/finite-automata-to-regular-expressions)
2. [Educative.io - How to Convert Finite Automata to Regular Expressions](https://www.educative.io/answers/how-to-convert-finite-automata-to-regular-expressions)
3. Teorema de Arden (1961) - "A note on Boolean Matrix Equations"

## 🎓 Conceptos Clave

### Teorema de Arden
Si `X = αX | β` y ε ∉ α, entonces `X = α*β`

### Fórmula de Eliminación
Al eliminar estado `q` en la transición `p→r`:
```
R(p→r)_nueva = R(p→q)·R(q→q)*·R(q→r) + R(p→r)_anterior
```

### Simplificaciones
- ε·a = a·ε = a
- ∅|a = a|∅ = a
- ε* = ε
- ∅* = ε

## 🚀 Próximas Mejoras

- [ ] Optimización adicional de expresiones regulares
- [ ] Visualización gráfica del proceso
- [ ] Soporte para autómatas con transiciones epsilon
- [ ] Generación de casos de prueba automáticos

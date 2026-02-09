# CompiMC

Sistema educativo interactivo para el aprendizaje y simulación de análisis de compiladores. Visualiza autómatas, árboles de derivación y tablas de parsing en tiempo real.

## Características Principales

### Analizador Léxico
- **Construcción de Autómatas**: AFD completo y óptimo mediante algoritmo de Thompson
- **Conversión ER ↔ AF**: Transformación bidireccional entre expresiones regulares y autómatas
- **Reconocimiento de Cadenas**: Validación y visualización paso a paso de transiciones
- **Visualización Interactiva**: Grafos de autómatas con Cytoscape.js
- **Árboles Sintácticos**: Visualización de árboles de expresiones regulares
- **Tablas de Transiciones**: Followpos, subconjuntos y más

### Análisis Sintáctico Descendente (ASD)
- Cálculo automático de conjuntos **First** y **Follow**
- Construcción de **tabla de parsing LL(1)**
- Análisis por **precedencia de operadores**
- **Traza de pila** paso a paso
- Validación de gramáticas

### Análisis Sintáctico Ascendente (ASA)
- Análisis **LR(0)**, **SLR(1)** y **LALR(1)**
- Visualización de **autómata LR** (conjuntos canónicos)
- Tablas **Action/GoTo**
- Traza de análisis shift-reduce
- Detección de conflictos

### Compilador General
- Pipeline completo: Léxico → Sintáctico → Código Intermedio → Optimización → Código Objeto
- Tabla de tokens y lexemas
- Generación de código de tres direcciones
- Optimización de código
- Generación de código ensamblador

## Tecnologías

| Categoría | Tecnología |
|-----------|------------|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + TypeScript 5 |
| Estilos | Tailwind CSS 4 + shadcn/ui |
| Grafos | Cytoscape.js |
| Estado | Context API + nuqs |
| Iconos | Lucide React + Tabler Icons |
| Animaciones | tw-animate-css |

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/compimc.git
cd compimc

# Instalar dependencias
pnpm install

# Ejecutar en desarrollo
pnpm dev
```

Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

## Estructura del Proyecto

```
app/
├── page.tsx                    # Home
├── general/                    # Compilador completo
├── analizador-lexico/          # Módulos de análisis léxico
│   ├── afd-full/               # AFD completo
│   ├── afd-short/              # AFD óptimo
│   ├── af-to-er/               # Autómata → Expresión Regular
│   └── reconocer/              # Reconocimiento de cadenas
├── asd/                        # Análisis sintáctico descendente
└── asa/                        # Análisis sintáctico ascendente

components/
├── analizador-lexico/          # Componentes léxicos
├── analizador-sintactico/      # Componentes sintácticos
├── general/                    # Componentes del compilador
├── layout/                     # Layout y navegación
└── ui/                         # shadcn/ui

lib/
├── algorithms/                 # Algoritmos de compilación
├── types/                      # Definiciones TypeScript
├── context/                    # Context API
└── utils/                      # Utilidades

hooks/                          # Hooks personalizados
├── use-automata.ts             # Construcción y manipulación de autómatas
├── use-compiler.ts             # Pipeline de compilación
├── use-syntax-analysis.ts      # Análisis sintáctico
└── use-history.ts              # Historial de análisis
```

## Scripts Disponibles

```bash
pnpm dev      # Servidor de desarrollo
pnpm build    # Build de producción
pnpm start    # Servidor de producción
pnpm lint     # Linting con ESLint
```

## Capturas de Pantalla

| Analizador Léxico | Análisis Sintáctico | Compilador General |
|-------------------|---------------------|-------------------|
| Visualización de autómatas y tablas de transiciones | Tablas First/Follow y parsing LL/LR | Pipeline completo de compilación |

## Documentación

La documentación completa del proyecto se encuentra en la carpeta `/docs`:

- [Plan de Desarrollo](docs/PLAN_DESARROLLO.md) - Arquitectura y fases del proyecto
- [Quick Start](docs/QUICK_START.md) - Guía de inicio rápido
- [Especificación de Componentes](docs/COMPONENTS_SPEC.md) - Detalle de todos los componentes

## Licencia

Este proyecto está bajo la licencia especificada en el archivo [LICENSE](LICENSE).

---

Desarrollado con fines educativos para el aprendizaje de teoría de compiladores.

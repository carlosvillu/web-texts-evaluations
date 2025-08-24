# CLAUDE.md - Guía de Desarrollo Consistente

## Principios de Desarrollo para Claude Code

Claude Code debe comportarse como un **programador pragmático** que aplica los principios YAGNI (You Aren't Gonna Need It) y KISS (Keep It Simple, Stupid). Esto significa:

### Desarrollo Pragmático

- **Evitar código verboso**: No crear clases enormes con métodos innecesarios
- **Aplicar YAGNI**: Solo implementar lo que se necesita para la feature actual
- **Aplicar KISS**: Mantener el código simple y directo
- **Foco en la feature**: Todos los métodos de una clase deben contribuir directamente a la funcionalidad en desarrollo
- **Evitar sobre-ingeniería**: No anticipar requisitos futuros que no están definidos

### Reglas de Código

- Crear clases con muchos métodos solo si todos contribuyen a la feature actual
- Evitar abstracciones prematuras
- Priorizar legibilidad sobre patrones complejos
- Implementar solo lo mínimo viable para completar la tarea

## Evaluador de Textos Educativos

### 🎯 Información del Proyecto

- **Nombre**: Web SPA para Evaluación Automatizada de Textos Educativos
- **Stack**: React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Arquitectura**: SPA con SSE para tiempo real
- **Objetivo**: Procesar CSVs de 3000+ filas con métricas ICC en tiempo real

### 📋 Comandos de Desarrollo

```bash
# Desarrollo
npm run dev

# Build producción
npm run build

# Preview build
npm run preview

# Linting (si se configura)
npm run lint

# Testing (si se configura)
npm run test
```

### 🏗️ Estructura del Proyecto

```
text-evaluation-web/
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.ts
├── tsconfig.json
├── index.html
├── .env.example
├── README.md
├── public/
│   └── favicon.ico
├── src/
│   ├── main.tsx                 # Entrada de la aplicación
│   ├── App.tsx                  # Componente principal con estado global
│   ├── index.css                # Estilos globales + Tailwind imports
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components (button, card, etc.)
│   │   ├── ConfigurationSection.tsx      # Config endpoint + CSV separator
│   │   ├── FileUploadSection.tsx         # Drag & drop + CSV parsing
│   │   ├── VirtualTable.tsx              # Tabla virtual para 3000+ filas
│   │   ├── ProcessingController.tsx      # Control SSE + progress
│   │   ├── MetricsPanel.tsx              # ICC + estadísticas tiempo real
│   │   └── ResultsExporter.tsx           # Descarga CSV enriquecido
│   ├── hooks/
│   │   ├── useLocalStorage.ts            # Persistencia configuraciones
│   │   ├── useSSE.ts                     # Server-Sent Events handler
│   │   └── useVirtualTable.ts            # Configuración tabla virtual
│   ├── services/
│   │   ├── api.ts                        # Cliente API + comunicación backend
│   │   ├── csvParser.ts                  # Papaparse + validación CSV
│   │   └── metrics.ts                    # Cálculo ICC(3,1) + estadísticas
│   ├── utils/
│   │   ├── formatters.ts                 # Formateo números, fechas, métricas
│   │   └── validators.ts                 # Validación URLs, CSV, datos
│   ├── types/
│   │   ├── app.ts                        # Tipos principales de la aplicación
│   │   └── ui.ts                         # Tipos para componentes UI
│   └── lib/
│       └── utils.ts                      # shadcn/ui utilities (clsx, cn)
```

### 🔧 Tecnologías y Dependencias

#### Core

- **React**: ^18.2.0 (Hooks, Context, Virtual DOM)
- **React-DOM**: ^18.2.0 (Renderizado)
- **Vite**: ^5.0.0 (Build tool + dev server)

#### UI/Styling

- **Tailwind CSS**: ^3.4.0 (Utility-first CSS)
- **shadcn/ui**: Componentes base (Button, Card, Input, Progress, Alert, Badge, Tabs)
- **Lucide React**: ^0.300.0 (Iconos)
- **class-variance-authority**: ^0.7.0 (Variants de componentes)
- **clsx + tailwind-merge**: Para merge de clases CSS

#### Data Management

- **Papaparse**: ^5.4.1 (CSV parsing + validación)
- **@tanstack/react-virtual**: ^3.0.0 (Virtualización tablas grandes)
- **@tanstack/react-table**: ^8.11.0 (Funcionalidad tabla)

#### Radix UI (Base de shadcn/ui)

- **@radix-ui/react-alert-dialog**: ^1.0.5
- **@radix-ui/react-slot**: ^1.0.2
- **@radix-ui/react-progress**: ^1.0.3

### 📊 Arquitectura de Estado

#### Estado Global (App.tsx)

```typescript
const [appState, setAppState] = useState<AppState>({
  config: {
    endpoint: localStorage.getItem("endpoint") || "",
    separator: localStorage.getItem("separator") || ";",
  },
  data: {
    original: [], // Datos CSV cargados
    results: [], // Resultados del modelo API
    merged: [], // Datos combinados para export
  },
  processing: {
    isActive: false,
    jobId: null,
    progress: { completed: 0, total: 0, percentage: 0 },
    timeRemaining: null,
  },
  metrics: {
    icc: null,
    meanDeviation: null,
    stdDeviation: null,
    reliabilityMet: false, // ICC > 0.8
    processedCount: 0,
  },
});
```

#### Flujo de Datos

1. **Config** → LocalStorage persistence
2. **CSV Upload** → Parse + Validate → Update data.original
3. **Process Start** → API call → Get jobId → Start SSE
4. **SSE Events** → Update results + metrics en tiempo real
5. **Export** → Merge original + results → Download CSV

### 🔗 Integración con API

#### Endpoints Esperados

```typescript
// Iniciar procesamiento
POST /evaluate
Body: { data: [{ id_alumno, curso, consigna, respuesta }] }
Response: { job_id: "uuid" }

// Stream de resultados
GET /stream/{job_id}
SSE Events:
- batch_complete: { results: [...], progress: { completed, total } }
- complete: { message: "Processing completed" }
- error: { error: "Error message" }
```

#### Estructura de Datos

##### CSV Input (requerido)

```typescript
{
  id_participante: string,    // → id_alumno en API
  respuesta: string,          // → respuesta en API
  curso: string,              // → curso en API
  pregunta: string,           // → consigna en API
  evaluacion_1: number,       // Evaluación humana 1
  evaluacion_2?: number,      // Evaluación humana 2 (opcional)
  evaluacion_3?: number       // Evaluación humana 3 (opcional)
}
```

##### API Response

```typescript
{
  id_alumno: string,
  nota: number,               // Evaluación del modelo (0-10)
  confianza?: number,         // Nivel de confianza (opcional)
  tiempo_procesamiento?: number
}
```

##### Resultado Enriquecido (para export)

```typescript
{
  ...originalRow,             // Todos los campos del CSV original
  evaluacion_modelo: number,  // API nota
  mediana_humana: number,     // Calculada de evaluacion_1,2,3
  desviacion: number          // |evaluacion_modelo - mediana_humana|
}
```

### 📈 Métricas y Cálculos

#### ICC(3,1) - Coeficiente de Correlación Intraclase

```typescript
// ICC(3,1): Single rater, consistency
// Compara modelo vs mediana de evaluaciones humanas
function calculateICC31(modelScores: number[], humanMedians: number[]): number {
  const n = modelScores.length;

  // Calcular medias
  const mean1 = modelScores.reduce((a, b) => a + b) / n;
  const mean2 = humanMedians.reduce((a, b) => a + b) / n;
  const grandMean = (mean1 + mean2) / 2;

  // Calcular sumas de cuadrados
  let SST = 0,
    SSW = 0,
    SSB = 0;

  for (let i = 0; i < n; i++) {
    const rowMean = (modelScores[i] + humanMedians[i]) / 2;
    SSB += 2 * Math.pow(rowMean - grandMean, 2);
    SSW += Math.pow(modelScores[i] - rowMean, 2);
    SSW += Math.pow(humanMedians[i] - rowMean, 2);
    SST += Math.pow(modelScores[i] - grandMean, 2);
    SST += Math.pow(humanMedians[i] - grandMean, 2);
  }

  const MSB = SSB / (n - 1);
  const MSW = SSW / n;

  const icc = (MSB - MSW) / (MSB + MSW);
  return Math.max(0, Math.min(1, icc)); // Clamp 0-1
}

// Interpretación ICC
function getICCInterpretation(icc: number): string {
  if (icc < 0.5) return "Pobre";
  if (icc < 0.75) return "Moderado";
  if (icc < 0.9) return "Bueno";
  return "Excelente";
}
```

#### Mediana de Evaluaciones Humanas

```typescript
function calculateMedian(row: any): number | null {
  const scores = [row.evaluacion_1, row.evaluacion_2, row.evaluacion_3].filter(
    (v) => v !== null && v !== undefined && v !== "",
  );

  if (scores.length === 0) return null;

  scores.sort((a, b) => a - b);
  const mid = Math.floor(scores.length / 2);

  return scores.length % 2 !== 0
    ? scores[mid]
    : (scores[mid - 1] + scores[mid]) / 2;
}
```

### 🎨 Guía de Estilo UI

#### Paleta de Colores (Tailwind)

```css
/* Tema principal */
--primary: blue-600 /* Botones primarios, enlaces */ --secondary: slate-600
  /* Elementos secundarios */ --success: green-600
  /* Estados exitosos, ICC bueno */ --warning: amber-600
  /* Advertencias, ICC moderado */ --danger: red-600 /* Errores, ICC pobre */
  --background: white /* Fondo principal */ --surface: gray-50
  /* Fondo de cards */ --text: gray-900 /* Texto principal */ --border: gray-200
  /* Bordes, divisores */;
```

#### Layout Principal

```
┌──────────────────────────────────────────────┐
│  📊 Evaluador de Textos Educativos          │
├──────────────────────────────────────────────┤
│  ⚙️ Configuración (ConfigurationSection)     │
│  📁 Cargar CSV (FileUploadSection)           │
│  📊 Métricas (MetricsPanel)                  │
│  ████████░░░░ Progreso (ProcessingController)│
│  [Tabs: Datos | Resultados] (VirtualTable)  │
│  [Procesar] [Descargar] (Controles)         │
└──────────────────────────────────────────────┘
```

#### Breakpoints Responsive

- **sm**: 640px+ (móvil grande)
- **md**: 768px+ (tablet)
- **lg**: 1024px+ (desktop pequeño)
- **xl**: 1280px+ (desktop grande)

### 🚀 Performance y Optimización

#### Virtualización de Tablas

```typescript
// Configuración react-virtual para 3000+ filas
const virtualizer = useVirtualizer({
  count: data.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 35, // Altura estimada por fila
  overscan: 10, // Filas extra renderizadas
});
```

#### Memoización Critical

```typescript
// Cálculos pesados
const metrics = useMemo(() => {
  if (results.length === 0) return null;
  return calculateMetrics(results, originalData);
}, [results, originalData]);

// Handlers frecuentes
const handleProgressUpdate = useCallback((newProgress) => {
  setProcessingState((prev) => ({ ...prev, progress: newProgress }));
}, []);
```

#### Límites y Configuraciones

- **Tamaño máximo CSV**: 50MB
- **Filas máximas**: 3000 (soft limit)
- **Batch size SSE**: 10 items (API-defined)
- **Timeout conexión**: 30s inicial, ∞ durante streaming
- **Debounce métricas**: 500ms máximo
- **Altura tabla**: 400px fijo

### 🐛 Manejo de Errores

#### Patrón Global de Errores

```typescript
const handleError = (error: Error, context: string) => {
  console.error(`Error in ${context}:`, error);

  // UI feedback simple
  alert(`Error: ${error.message || error}`);

  // Reset estado específico
  if (context === "processing") {
    setProcessingState((prev) => ({
      ...prev,
      isActive: false,
      status: "error",
    }));
  }

  if (context === "sse") {
    // Intentar reconectar SSE automáticamente
    // después de 3 segundos
  }
};

// Try-catch en operaciones críticas
try {
  const response = await fetch(`${endpoint}/evaluate`, options);
  if (!response.ok) throw new Error(response.statusText);
  const data = await response.json();
  return data;
} catch (error) {
  handleError(error, "api-call");
  throw error;
}
```

#### Estados de Error en UI

- **CSV Parse Error**: "Error al procesar CSV. Verifica formato y columnas."
- **API Connection Error**: "No se puede conectar al servidor. Verifica la URL."
- **SSE Connection Error**: "Conexión perdida. Reconectando..."
- **Processing Error**: "Error durante el procesamiento. Ver detalles."

### 🔄 Hooks Personalizados

#### useSSE Hook

```typescript
const useSSE = (url: string | null, onMessage: (data: any) => void, onError: (error: Event) => void, onComplete: (data: any) => void) => {
  useEffect(() => {
    if (!url) return;

    const eventSource = new EventSource(url);

    eventSource.addEventListener("batch_complete", (e) => {
      const data = JSON.parse(e.data);
      onMessage(data);
    });

    eventSource.addEventListener("complete", (e) => {
      const data = JSON.parse(e.data);
      onComplete(data);
      eventSource.close();
    });

    eventSource.onerror = (error) => {
      onError(error);
      eventSource.close();
    };

    return () => eventSource.close();
  }, [url, onMessage, onError, onComplete]);
};
```

#### useLocalStorage Hook

```typescript
const useLocalStorage = <T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
};
```

### ✅ Testing y Validación

#### Criterios de Aceptación por Fase

Consultar PRD.md para criterios específicos de cada fase.

#### Métricas de Performance

- **Carga CSV 3000 filas**: < 2 segundos
- **Renderizado tabla**: 60 FPS
- **Memoria con 3000 filas**: < 200MB
- **Actualización métricas**: < 100ms
- **Error rate SSE**: < 1%

### 🔧 Scripts y Comandos Útiles

#### Instalación Inicial

```bash
npm create vite@latest text-evaluation-web -- --template react-ts
cd text-evaluation-web
npm install

# Dependencias principales
npm install papaparse @tanstack/react-virtual @tanstack/react-table
npm install clsx tailwind-merge lucide-react class-variance-authority

# Radix UI para shadcn/ui
npm install @radix-ui/react-alert-dialog @radix-ui/react-slot @radix-ui/react-progress

# Dev dependencies
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# shadcn/ui setup
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input progress alert badge tabs
```

#### Desarrollo

```bash
# Servidor de desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

### 🚨 Reglas de Desarrollo OBLIGATORIAS

#### Pre-commit Requirements

**NUNCA hacer commit sin antes ejecutar:**

```bash
# 1. Ejecutar linter y auto-fix
npx eslint --fix src

# 2. Verificar que no quedan errores de linting
npx eslint src

# 3. Verificar que no hay errores de tipado TypeScript
npx tsc --noEmit

# 4. Solo entonces hacer commit
git add .
git commit -m "mensaje del commit"
```

#### Proceso de Commit Obligatorio

1. **✅ Linting**: `npx eslint --fix src` debe ejecutarse SIN errores
2. **✅ TypeScript**: `npx tsc --noEmit` debe ejecutarse SIN errores de tipado
3. **✅ Build**: `npm run build` debe completarse sin errores
4. **✅ Verificación**: El proyecto debe arrancar con `npm run dev`
5. **✅ Commit**: Solo entonces proceder con git commit

#### Reglas ESLint Críticas

- **No variables no utilizadas** (excepto con prefijo `_`)
- **Componentes no pueden exportar funciones/constantes junto con el componente**
- **Fast refresh debe funcionar correctamente**
- **Imports deben usar aliases `@/` cuando sea posible**

#### Estructura de Exports Correcta

```typescript
// ✅ CORRECTO - Solo componente
export { ComponentName }

// ✅ CORRECTO - Constantes en archivo separado
// component-variants.ts
export const componentVariants = cva(...)

// ❌ INCORRECTO - Componente + constantes juntos
export { Component, componentVariants }
```

### 📚 Referencias y Documentación

#### Enlaces Útiles

- [React Virtual - TanStack](https://tanstack.com/virtual)
- [React Table - TanStack](https://tanstack.com/table)
- [shadcn/ui Docs](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Papaparse](https://www.papaparse.com)
- [Server-Sent Events MDN](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)

#### Patrones de Desarrollo

1. **Component-First**: Cada funcionalidad es un componente reutilizable
2. **Hook-Based**: Lógica compleja en hooks personalizados
3. **Service Layer**: API calls y processing en servicios separados
4. **State-Up**: Estado compartido en App.tsx, props down
5. **Error Boundaries**: Manejo graceful de errores en cada nivel

---

**Última actualización**: Agosto 2025  
**Versión CLAUDE.md**: 1.0


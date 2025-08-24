# Product Requirements Document (PRD)
## Evaluador de Textos Educativos - Plan de Desarrollo

### Información del Proyecto
- **Nombre**: Web SPA para Evaluación Automatizada de Textos Educativos
- **Versión**: 1.0 - Prueba de Concepto
- **Stack**: React + Vite + Tailwind CSS + shadcn/ui
- **Objetivo**: Interfaz para procesar CSVs masivos y visualizar evaluaciones automáticas con métricas ICC

---

## FASE 1: Project Setup & Configuration
**Duración estimada**: 2-3 horas  
**Objetivo**: Establecer la base técnica del proyecto

### 1.1 Inicialización del Proyecto
- [ ] **1.1.1** Crear proyecto Vite con template React
  ```bash
  npm create vite@latest text-evaluation-web -- --template react
  ```
- [ ] **1.1.2** Configurar package.json con dependencias principales
  - React 18.2.0+, React-DOM 18.2.0+
  - Papaparse 5.4.1+, @tanstack/react-virtual 3.0.0+, @tanstack/react-table 8.11.0+
- [ ] **1.1.3** Instalar y configurar Tailwind CSS
  ```bash
  npm install -D tailwindcss postcss autoprefixer
  npx tailwindcss init -p
  ```
- [ ] **1.1.4** Configurar shadcn/ui
  ```bash
  npx shadcn-ui@latest init
  npx shadcn-ui@latest add button card input progress alert badge tabs
  ```

### 1.2 Configuración del Entorno
- [ ] **1.2.1** Configurar vite.config.js con aliases (@)
- [ ] **1.2.2** Configurar tailwind.config.js con tema personalizado
- [ ] **1.2.3** Configurar postcss.config.js
- [ ] **1.2.4** Crear .env.example con variables de entorno

### 1.3 Estructura de Carpetas
- [ ] **1.3.1** Crear estructura base de carpetas:
  ```
  src/
  ├── components/
  │   ├── ui/               # shadcn/ui components
  │   └── [custom components]
  ├── hooks/
  ├── services/
  ├── utils/
  └── lib/
  ```
- [ ] **1.3.2** Crear archivos de entrada básicos (main.jsx, App.jsx, index.css)

**Criterios de Aceptación Fase 1:**
- ✅ Proyecto inicializa sin errores con `npm run dev`
- ✅ Tailwind CSS funciona correctamente
- ✅ shadcn/ui componentes se importan sin problemas
- ✅ Estructura de carpetas creada

---

## FASE 2: Core Infrastructure & Utilities
**Duración estimada**: 4-5 horas  
**Objetivo**: Implementar la infraestructura base y utilidades

### 2.1 Utilidades Base
- [ ] **2.1.1** Crear `src/utils/formatters.js`
  - Formateo de números, fechas, tiempos
  - Formateo de métricas (ICC, desviaciones)
- [ ] **2.1.2** Crear `src/utils/validators.js`
  - Validación de URLs de endpoint
  - Validación de estructura CSV
  - Validación de datos de entrada
- [ ] **2.1.3** Crear `src/lib/utils.js` (shadcn/ui utilities)
  - clsx, tailwind-merge utilities

### 2.2 Hooks Personalizados
- [ ] **2.2.1** Crear `src/hooks/useLocalStorage.js`
  - Hook para persistencia en localStorage
  - Manejo de serialización/deserialización
- [ ] **2.2.2** Crear `src/hooks/useSSE.js`
  - Hook para manejo de Server-Sent Events
  - Gestión de conexión, reconexión, errores
  - Event listeners para 'batch_complete' y 'complete'
- [ ] **2.2.3** Crear `src/hooks/useVirtualTable.js`
  - Hook para configuración de tabla virtual
  - Manejo de scroll, paginación virtual

### 2.3 Servicios Core
- [ ] **2.3.1** Crear `src/services/api.js`
  - Cliente API para comunicación con backend
  - Funciones para iniciar procesamiento
  - Manejo de errores HTTP
- [ ] **2.3.2** Crear `src/services/csvParser.js`
  - Parsing de CSV con Papaparse
  - Mapeo de columnas requeridas
  - Validación de estructura de datos
- [ ] **2.3.3** Crear `src/services/metrics.js`
  - Implementación de cálculo ICC(3,1)
  - Cálculo de medianas por fila
  - Cálculo de desviaciones y estadísticas

### 2.4 Implementaciones Críticas
- [ ] **2.4.1** Función calculateICC31() completa
  ```javascript
  function calculateICC31(modelScores, humanMedians) {
    // Implementación ICC(3,1) - Single rater, consistency
    // Basado en modelo de efectos mixtos de dos vías
  }
  ```
- [ ] **2.4.2** Función calculateMedian() para evaluaciones humanas
- [ ] **2.4.3** Función de mapeo CSV → API format

**Criterios de Aceptación Fase 2:**
- ✅ Todos los hooks funcionan independientemente
- ✅ Servicios API y CSV parser procesan datos correctamente
- ✅ Cálculo ICC devuelve valores entre 0-1
- ✅ localStorage persiste configuraciones

---

## FASE 3: UI Components Development
**Duración estimada**: 6-8 horas  
**Objetivo**: Desarrollar todos los componentes de interfaz

### 3.1 Componentes Base (shadcn/ui)
- [ ] **3.1.1** Verificar y personalizar Button component
- [ ] **3.1.2** Verificar y personalizar Card component
- [ ] **3.1.3** Verificar y personalizar Input component
- [ ] **3.1.4** Verificar y personalizar Progress component
- [ ] **3.1.5** Verificar y personalizar Alert component
- [ ] **3.1.6** Verificar y personalizar Badge component
- [ ] **3.1.7** Verificar y personalizar Tabs component

### 3.2 ConfigurationSection Component
- [ ] **3.2.1** Crear `src/components/ConfigurationSection.jsx`
  ```typescript
  interface ConfigProps {
    endpointUrl: string;
    csvSeparator: string;
    onConfigChange: (config) => void;
  }
  ```
- [ ] **3.2.2** Implementar persistencia en localStorage
- [ ] **3.2.3** Indicador visual de conexión válida
- [ ] **3.2.4** Validación de URL en tiempo real
- [ ] **3.2.5** Selector de separador CSV (;, ,, |)

### 3.3 FileUploadSection Component
- [ ] **3.3.1** Crear `src/components/FileUploadSection.jsx`
- [ ] **3.3.2** Implementar drag & drop área
- [ ] **3.3.3** Integrar con csvParser service
- [ ] **3.3.4** Preview de primeras 5 filas cargadas
- [ ] **3.3.5** Validación de columnas requeridas:
  - id_participante, respuesta, curso, pregunta
  - evaluacion_1, evaluacion_2?, evaluacion_3?
- [ ] **3.3.6** Manejo de errores de parsing

### 3.4 VirtualTable Component
- [ ] **3.4.1** Crear `src/components/VirtualTable.jsx`
- [ ] **3.4.2** Configurar @tanstack/react-virtual
- [ ] **3.4.3** Configurar @tanstack/react-table
- [ ] **3.4.4** Implementar renderizado de 3000+ filas
- [ ] **3.4.5** Configurar columnas dinámicas
- [ ] **3.4.6** Scroll horizontal y vertical
- [ ] **3.4.7** Altura fija de 400px

### 3.5 Componentes Adicionales
- [ ] **3.5.1** Crear `src/components/ProcessingController.jsx`
  - Estado de procesamiento (idle, processing, completed, error)
  - Botón de inicio/parada
  - Manejo de jobId
- [ ] **3.5.2** Crear `src/components/MetricsPanel.jsx`
  - Display de ICC(3,1) con interpretación
  - Display de desviación media y estándar
  - Contador de procesados vs total
  - Badge de fiabilidad (reliable/unreliable)
- [ ] **3.5.3** Crear `src/components/ResultsExporter.jsx`
  - Botón de descarga CSV
  - Generación de CSV enriquecido
  - Progress de descarga

**Criterios de Aceptación Fase 3:**
- ✅ Todos los componentes renderizan sin errores
- ✅ VirtualTable maneja 3000+ filas fluidamente
- ✅ Drag & drop funciona correctamente
- ✅ ConfigurationSection persiste datos
- ✅ MetricsPanel muestra cálculos en tiempo real

---

## FASE 4: Processing & Metrics System
**Duración estimada**: 5-6 horas  
**Objetivo**: Implementar el sistema de procesamiento y métricas

### 4.1 ProcessingController Logic
- [ ] **4.1.1** Implementar estado de procesamiento
  ```javascript
  interface ProcessingState {
    jobId: string | null;
    status: 'idle' | 'processing' | 'completed' | 'error';
    progress: { completed: number; total: number; percentage: number; };
    results: EvaluationResult[];
  }
  ```
- [ ] **4.1.2** Integrar con useSSE hook
- [ ] **4.1.3** Manejo de eventos SSE:
  - 'batch_complete': actualizar resultados parciales
  - 'complete': finalizar procesamiento
  - 'error': manejo de errores
- [ ] **4.1.4** Estimación de tiempo restante
- [ ] **4.1.5** Botón de cancelación de procesamiento

### 4.2 MetricsPanel Logic
- [ ] **4.2.1** Integrar con metrics service
- [ ] **4.2.2** Cálculo en tiempo real de ICC(3,1)
- [ ] **4.2.3** Cálculo de desviaciones (media, estándar)
- [ ] **4.2.4** Interpretación de ICC:
  ```javascript
  function getICCInterpretation(icc) {
    if (icc < 0.5) return "Pobre";
    if (icc < 0.75) return "Moderado"; 
    if (icc < 0.9) return "Bueno";
    return "Excelente";
  }
  ```
- [ ] **4.2.5** Estado de fiabilidad (ICC > 0.8)
- [ ] **4.2.6** Actualización cada 500ms máximo (debouncing)

### 4.3 Progress Tracking
- [ ] **4.3.1** Barra de progreso visual
- [ ] **4.3.2** Contador de items procesados/total
- [ ] **4.3.3** Estimación de tiempo restante
- [ ] **4.3.4** Display de velocidad de procesamiento

### 4.4 Results Management
- [ ] **4.4.1** Estructura de resultados enriquecidos:
  ```javascript
  const enrichedResult = {
    ...originalRow,
    evaluacion_modelo: apiResult.nota,
    mediana_humana: calculateMedian(originalRow),
    desviacion: Math.abs(apiResult.nota - calculateMedian(originalRow))
  };
  ```
- [ ] **4.4.2** Actualización incremental de resultados
- [ ] **4.4.3** Merge de datos originales + resultados modelo

**Criterios de Aceptación Fase 4:**
- ✅ SSE conecta y recibe datos correctamente
- ✅ Métricas se actualizan en tiempo real
- ✅ Progress bar refleja estado actual
- ✅ Resultados se almacenan correctamente

---

## FASE 5: Integration & State Management
**Duración estimada**: 4-5 horas  
**Objetivo**: Integrar todos los componentes y manejar estado global

### 5.1 App.jsx Principal
- [ ] **5.1.1** Crear estructura principal de App.jsx
- [ ] **5.1.2** Implementar estado global:
  ```javascript
  const [appState, setAppState] = useState({
    config: { endpoint: '', separator: ';' },
    data: { original: [], results: [], merged: [] },
    processing: { isActive: false, jobId: null, progress: 0 },
    metrics: { icc: null, meanDeviation: null, reliabilityMet: false }
  });
  ```
- [ ] **5.1.3** Integrar ConfigurationSection
- [ ] **5.1.4** Integrar FileUploadSection
- [ ] **5.1.5** Integrar tablas virtuales con tabs
- [ ] **5.1.6** Integrar ProcessingController
- [ ] **5.1.7** Integrar MetricsPanel
- [ ] **5.1.8** Integrar ResultsExporter

### 5.2 Data Flow Management
- [ ] **5.2.1** Flujo: Config → CSV Load → Process → Results
- [ ] **5.2.2** Callbacks entre componentes
- [ ] **5.2.3** Sincronización de estado
- [ ] **5.2.4** Propagación de actualizaciones

### 5.3 SSE Integration
- [ ] **5.3.1** Conectar SSE con estado global
- [ ] **5.3.2** Actualizar métricas en tiempo real
- [ ] **5.3.3** Actualizar tabla de resultados
- [ ] **5.3.4** Manejo de reconexión automática

### 5.4 Error Handling
- [ ] **5.4.1** Implementar manejo global de errores:
  ```javascript
  const handleError = (error, context) => {
    console.error(`Error in ${context}:`, error);
    alert(`Error: ${error.message || error}`);
    if (context === 'processing') {
      setProcessingState(prev => ({ ...prev, isActive: false, status: 'error' }));
    }
  };
  ```
- [ ] **5.4.2** Try-catch en operaciones críticas
- [ ] **5.4.3** Fallbacks para componentes
- [ ] **5.4.4** Estados de error en UI

### 5.5 Layout & Responsive
- [ ] **5.5.1** Layout principal responsive
- [ ] **5.5.2** Configurar breakpoints Tailwind
- [ ] **5.5.3** Adaptar componentes a móvil/tablet
- [ ] **5.5.4** Tabla virtual responsive

**Criterios de Aceptación Fase 5:**
- ✅ Flujo completo funciona end-to-end
- ✅ Estado se sincroniza correctamente
- ✅ Errores se manejan gracefully
- ✅ UI es responsive en diferentes tamaños

---

## FASE 6: Testing & Optimization
**Duración estimada**: 3-4 horas  
**Objetivo**: Optimizar rendimiento y pulir la experiencia

### 6.1 Memory Usage Optimization
- [ ] **6.1.1** Optimizar renderizado de tabla virtual
- [ ] **6.1.2** Implementar useMemo en cálculos pesados:
  ```javascript
  const metrics = useMemo(() => {
    if (results.length === 0) return null;
    return calculateMetrics(results, originalData);
  }, [results, originalData]);
  ```
- [ ] **6.1.3** useCallback para handlers frecuentes
- [ ] **6.1.4** Cleanup de event listeners
- [ ] **6.1.5** Garbage collection de datos grandes

### 6.2 Final UI/UX Refinements
- [ ] **6.2.1** Pulir transiciones y animaciones
- [ ] **6.2.2** Mejorar feedback visual en estados de carga
- [ ] **6.2.3** Refinar responsive design
- [ ] **6.2.4** Optimizar accesibilidad básica
- [ ] **6.2.5** Loading states mejorados
- [ ] **6.2.6** Error messages más user-friendly
- [ ] **6.2.7** Polish general de la interfaz

**Criterios de Aceptación Fase 6:**
- ✅ Aplicación consume < 200MB con 3000 filas
- ✅ UI/UX es fluida y profesional
- ✅ Loading states son claros
- ✅ Errores son comprensibles para el usuario

---

## Deliverables Finales

### Archivos Core
- `src/App.jsx` - Componente principal
- `src/main.jsx` - Entrada de la aplicación
- `src/index.css` - Estilos globales

### Componentes UI
- `src/components/ConfigurationSection.jsx`
- `src/components/FileUploadSection.jsx`  
- `src/components/VirtualTable.jsx`
- `src/components/ProcessingController.jsx`
- `src/components/MetricsPanel.jsx`
- `src/components/ResultsExporter.jsx`

### Hooks & Services
- `src/hooks/useLocalStorage.js`
- `src/hooks/useSSE.js` 
- `src/hooks/useVirtualTable.js`
- `src/services/api.js`
- `src/services/csvParser.js`
- `src/services/metrics.js`

### Utilities
- `src/utils/formatters.js`
- `src/utils/validators.js`
- `src/lib/utils.js`

### Configuración
- `package.json` - Dependencias y scripts
- `vite.config.js` - Configuración de Vite
- `tailwind.config.js` - Configuración de Tailwind
- `postcss.config.js` - Configuración de PostCSS

## Métricas de Éxito del PoC

| Métrica | Objetivo | Crítico |
|---------|----------|---------|
| Tiempo carga CSV 3000 filas | < 2 seg | < 5 seg |
| Renderizado tabla virtual | 60 FPS | 30 FPS |
| Consumo memoria con 3000 filas | < 200MB | < 500MB |
| Actualización métricas | < 100ms | < 500ms |
| Tasa de error en SSE | < 1% | < 5% |

## Timeline Estimado
- **Fase 1**: 2-3 horas
- **Fase 2**: 4-5 horas  
- **Fase 3**: 6-8 horas
- **Fase 4**: 5-6 horas
- **Fase 5**: 4-5 horas
- **Fase 6**: 3-4 horas
- **Total**: 24-31 horas (~3-4 días de desarrollo)
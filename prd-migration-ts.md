# PRD: Migración Completa a TypeScript

## 🎯 Overview del Proyecto

### Estado Actual
- **Tecnología**: React 19 + Vite + JavaScript/JSX
- **UI Framework**: Tailwind CSS + shadcn/ui
- **Configuración**: ESLint, PostCSS, Vite configurados para JS
- **Estructura**: 11 archivos JS/JSX en `src/`, configuración base establecida
- **Dependencias TS**: `@types/react` y `@types/react-dom` ya instalados

### Objetivo de la Migración
Convertir completamente el proyecto de JavaScript/JSX a **TypeScript/TSX** manteniendo:
- ✅ Funcionalidad 100% intacta
- ✅ Configuración de desarrollo existente
- ✅ Estructura de archivos definida en CLAUDE.md
- ✅ Performance y experiencia de desarrollo
- ✅ Compatibilidad con todas las dependencias actuales

### Beneficios Esperados
- **Type Safety**: Prevención de errores en tiempo de desarrollo
- **IntelliSense Mejorado**: Mejor autocompletado y navegación de código
- **Refactoring Seguro**: Cambios con confianza gracias al tipado
- **Documentación Viva**: Los tipos sirven como documentación
- **Escalabilidad**: Base sólida para futuras funcionalidades

---

## 📊 Análisis Técnico Actual

### Archivos a Migrar (12 total)

#### Configuración Base (6 archivos)
- `vite.config.js` → `vite.config.ts`
- `eslint.config.js` → configurar para TS/TSX
- `tailwind.config.js` → `tailwind.config.ts`
- `postcss.config.js` → `postcss.config.ts`
- `jsconfig.json` → `tsconfig.json`
- `components.json` → actualizar configuración `"tsx": true`

#### Código Fuente (6 archivos)
- `src/main.jsx` → `src/main.tsx`
- `src/App.jsx` → `src/App.tsx`
- `src/lib/utils.js` → `src/lib/utils.ts`
- `src/components/ui/button-variants.js` → `src/components/ui/button-variants.ts`
- `src/components/ui/badge-variants.js` → `src/components/ui/badge-variants.ts`
- 7 componentes `.jsx` → `.tsx`

### Dependencias Adicionales Requeridas
```bash
npm install -D typescript @types/papaparse
```

---

## 🚀 Fases de Migración

### **Fase 1: Fundación TypeScript** 
*Duración estimada: 30-45 minutos*

#### Tareas Principales
1. **Instalar dependencias TypeScript**
   - `npm install -D typescript @types/papaparse`
   - Verificar compatibilidad de todas las dependencias existentes

2. **Configurar tsconfig.json**
   - Reemplazar `jsconfig.json` por `tsconfig.json`
   - Configurar strict mode y opciones de compilación
   - Mantener path mapping `@/*` → `./src/*`
   - Configurar JSX transform para React 19

3. **Actualizar Vite Configuration**
   - Migrar `vite.config.js` → `vite.config.ts`
   - Añadir tipado explícito para configuración de Vite
   - Verificar que path aliasing funcione correctamente

4. **Configurar shadcn/ui para TypeScript**
   - Actualizar `components.json`: cambiar `"tsx": false` → `"tsx": true`
   - Actualizar referencia de Tailwind: `"tailwind.config.js"` → `"tailwind.config.ts"`
   - Verificar que futuros componentes generados usen TSX

#### Subtareas Detalladas

**1.1 tsconfig.json Configuration**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["DOM", "DOM.Iterable", "ES6"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": false,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

**1.2 Vite Config Migration**
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```
- Importar `path` explícitamente para el alias
- Mantener configuración de React plugin exacta
- TypeScript automáticamente infiere tipos de `defineConfig`

**1.3 components.json Configuration**
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true, // ← Cambiar de false a true
  "tailwind": {
    "config": "tailwind.config.ts", // ← Actualizar referencia
    "css": "src/index.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

#### Criterios de Aceptación Fase 1
- [x] TypeScript instalado y configurado
- [x] `tsconfig.json` válido y funcional
- [x] `components.json` configurado para TSX
- [x] `npm run dev` arranca sin errores
- [x] Path aliasing `@/` funciona
- [x] Vite acepta archivos TS/TSX
- [x] shadcn/ui generará componentes en TSX en el futuro

---

### **Fase 2: Configuración de Desarrollo**
*Duración estimada: 20-30 minutos*

#### Tareas Principales
1. **Actualizar ESLint para TypeScript**
   - Extender configuración actual para soportar TS/TSX
   - Añadir reglas específicas de TypeScript
   - Mantener configuración de React hooks y refresh

2. **Migrar configuraciones adicionales** ⚠️ **CRÍTICO**
   - `tailwind.config.js` → `tailwind.config.ts` (mantener configuración completa de shadcn/ui)
   - `postcss.config.js` → `postcss.config.ts` 
   - Verificar que todas las CSS variables de colores se preservan

#### Subtareas Detalladas

**2.1 ESLint Configuration Update**
```javascript
// eslint.config.js - agregar soporte TS/TSX
{
  files: ['**/*.{js,jsx,ts,tsx}'],
  // ... configuración existente
}
```

**2.2 Tailwind Config Migration**
```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // ← Incluir .ts y .tsx
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      colors: {
        // ⚠️ IMPORTANTE: Mantener TODA la configuración de colores actual
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        // ... resto de colores (copiar exactos del archivo actual)
      }
    }
  },
  plugins: [require("tailwindcss-animate")], // ← Mantener plugin
}

export default config
```

**2.3 PostCSS Config Migration**
```typescript
// postcss.config.ts
import type { Config } from 'postcss'

const config: Config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}

export default config
```

#### Criterios de Aceptación Fase 2
- [x] `npm run lint` funciona con archivos TS/TSX
- [x] `tailwind.config.ts` compila sin errores
- [x] `postcss.config.ts` funciona correctamente
- [x] Todos los colores de shadcn/ui se mantienen
- [x] `tailwindcss-animate` plugin sigue funcionando
- [x] Content array incluye archivos `.ts` y `.tsx`
- [x] No hay conflictos entre herramientas
- [x] Autocompletado de Tailwind funciona en componentes

---

### **Fase 3: Tipos Base y Utilitarios**
*Duración estimada: 45-60 minutos*

#### Tareas Principales
1. **Crear sistema de tipos base**
   - Definir tipos para el estado de la aplicación
   - Tipos para configuración y datos CSV
   - Interfaces para API y SSE
   - Tipos para componentes UI

2. **Migrar utilitarios**
   - `src/lib/utils.js` → `src/lib/utils.ts`
   - `button-variants.js` → `button-variants.ts`
   - `badge-variants.js` → `badge-variants.ts`

#### Subtareas Detalladas

**3.1 Definir Tipos de Dominio**
```typescript
// src/types/app.ts
export interface AppConfig {
  endpoint: string;
  separator: string;
}

export interface CSVRow {
  id_participante: string;
  respuesta: string;
  curso: string;
  pregunta: string;
  evaluacion_1: number;
  evaluacion_2?: number;
  evaluacion_3?: number;
}

export interface APIResponse {
  id_alumno: string;
  nota: number;
  confianza?: number;
  tiempo_procesamiento?: number;
}

export interface ProcessingState {
  isActive: boolean;
  jobId: string | null;
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
  timeRemaining: number | null;
}

export interface MetricsState {
  icc: number | null;
  meanDeviation: number | null;
  stdDeviation: number | null;
  reliabilityMet: boolean;
  processedCount: number;
}

export interface DataState {
  original: CSVRow[];
  results: APIResponse[];
  merged: (CSVRow & APIResponse)[];
}

export interface AppState {
  config: AppConfig;
  data: DataState;
  processing: ProcessingState;
  metrics: MetricsState;
}
```

**3.2 Tipos para Componentes UI**
```typescript
// src/types/ui.ts
export interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}

export interface BadgeProps {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}
```

**3.3 Migrar Archivos de Variants**
- Añadir tipado explícito a class-variance-authority
- Mantener funcionalidad exacta
- Export con tipos correctos

#### Criterios de Aceptación Fase 3
- [x] Todos los tipos base definidos
- [x] Utilitarios migrados sin errores
- [x] Autocompletado funciona en toda la app
- [x] No hay errores de TypeScript

---

### **Fase 4: Migración de Componentes UI**
*Duración estimada: 60-90 minutos*

#### Tareas Principales
1. **Migrar componentes shadcn/ui uno por uno**
   - Mantener funcionalidad exacta
   - Añadir tipado apropiado para props
   - Preservar forwards refs cuando aplique
   - Validar que styled-system funciona

2. **Orden de migración sugerido**
   1. `alert.jsx` → `alert.tsx`
   2. `badge.jsx` → `badge.tsx` 
   3. `button.jsx` → `button.tsx`
   4. `card.jsx` → `card.tsx`
   5. `input.jsx` → `input.tsx`
   6. `progress.jsx` → `progress.tsx`
   7. `tabs.jsx` → `tabs.tsx`

#### Subtareas Detalladas

**4.1 Patrón de Migración de Componentes**
```typescript
// Ejemplo: button.tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { buttonVariants } from "./button-variants"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)

Button.displayName = "Button"

export { Button }
```

**4.2 Validaciones por Componente**
- Verificar que props son tipados correctamente
- Mantener compatibilidad con Radix UI
- Asegurar que forwardRef funciona
- Validar estilos de Tailwind

#### Criterios de Aceptación Fase 4
- [x] Todos los componentes UI migrados
- [x] Props tipados correctamente
- [x] ForwardRef funciona donde aplique
- [x] Estilos se mantienen intactos
- [x] No hay errores de compilación

---

### **Fase 5: Aplicación Principal**
*Duración estimada: 30-45 minutos*

#### Tareas Principales
1. **Migrar main.jsx → main.tsx**
   - Mantener configuración de React 19
   - Verificar que StrictMode funciona
   - Actualizar referencia en index.html

2. **Migrar App.jsx → App.tsx**
   - Tipar el estado completo de la aplicación
   - Usar interfaces definidas en Fase 3
   - Mantener funcionalidad exacta

#### Subtareas Detalladas

**5.1 Main.tsx Migration**
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

const rootElement = document.getElementById('root')!
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

**5.2 App.tsx Migration**
```typescript
import { useState } from 'react'
import type { AppState } from '@/types/app'

function App() {
  const [appState, setAppState] = useState<AppState>({
    config: {
      endpoint: localStorage.getItem("endpoint") || "",
      separator: localStorage.getItem("separator") || ";",
    },
    data: {
      original: [],
      results: [],
      merged: [],
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
      reliabilityMet: false,
      processedCount: 0,
    },
  });

  // ... resto del componente
}
```

**5.3 Actualizar Referencias**
- `index.html`: cambiar script src a `/src/main.tsx`
- Verificar que imports funcionan correctamente

#### Criterios de Aceptación Fase 5
- [ ] `main.tsx` funciona correctamente
- [ ] `App.tsx` compila sin errores
- [ ] Estado completamente tipado
- [ ] Aplicación arranca en desarrollo
- [ ] No hay regresiones visuales

---

### **Fase 6: Verificación Final y Optimización**
*Duración estimada: 20-30 minutos*

#### Tareas Principales
1. **Verificaciones de compilación**
   - `tsc --noEmit` sin errores
   - `npm run lint` pasa completamente
   - `npm run build` funciona
   - `npm run dev` arranca correctamente

2. **Limpieza y optimización**
   - Remover archivos JS/JSX obsoletos
   - Verificar imports y exports
   - Optimizar tipos si es necesario
   - Documentar cambios

#### Subtareas Detalladas

**6.1 Scripts de Verificación**
```bash
# Verificar tipos
npx tsc --noEmit

# Verificar linting
npm run lint

# Test build production
npm run build

# Test dev server
npm run dev
```

**6.2 Actualizar package.json si es necesario**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build", // ← Verificar tipos antes del build
    "lint": "eslint .",
    "preview": "vite preview",
    "type-check": "tsc --noEmit" // ← Añadir script específico
  }
}
```
- Añadir script `type-check` para verificaciones manuales
- Considerar añadir verificación de tipos antes del build de producción

#### Criterios de Aceptación Fase 6
- [ ] Compilación TypeScript exitosa
- [ ] Linting pasa sin errores
- [ ] Build de producción funciona
- [ ] Development server arranca
- [ ] No hay archivos JS/JSX residuales
- [ ] Funcionalidad 100% preservada

---

## ⚠️ Consideraciones y Riesgos

### Riesgos Identificados

1. **Pérdida de Configuración de Tailwind** ⚠️ **ALTO RIESGO**
   - **Riesgo**: Al migrar `tailwind.config.js`, se pierda la configuración completa de colores CSS variables de shadcn/ui
   - **Mitigación**: Copiar EXACTAMENTE toda la configuración existente, verificar que todos los colores siguen funcionando

2. **Incompatibilidades de Dependencias**
   - **Riesgo**: Alguna dependencia no soporta TypeScript
   - **Mitigación**: Verificar `@types/` packages, usar `declare module` si es necesario

3. **Configuración de Build**
   - **Riesgo**: Vite no compila correctamente archivos TS
   - **Mitigación**: Probar build en cada fase, mantener configuración mínima

4. **Tipos Complejos de Radix UI**
   - **Riesgo**: ForwardRef y props complejos en shadcn/ui
   - **Mitigación**: Seguir patrones oficiales de shadcn/ui en TypeScript

5. **Performance de Compilación**
   - **Riesgo**: TypeScript puede hacer más lento el desarrollo
   - **Mitigación**: Configurar opciones de compilación optimizadas

6. **Plugin tailwindcss-animate**
   - **Riesgo**: El plugin puede no funcionar correctamente después de la migración
   - **Mitigación**: Verificar que `require("tailwindcss-animate")` sigue funcionando en TS config

### Mitigaciones Preventivas

- **Testing Incremental**: Probar funcionalidad después de cada fase
- **Backup**: Mantener branch con versión JS como respaldo
- **Documentación**: Registrar cambios importantes durante migración
- **Rollback Plan**: Preparar plan de reversión si hay problemas críticos

---

## 🎯 Criterios de Éxito Global

### Funcionales
- [ ] Aplicación arranca sin errores en desarrollo
- [ ] Build de producción se genera correctamente
- [ ] Todos los componentes UI mantienen su comportamiento
- [ ] IntelliSense funciona en todo el código
- [ ] Autocompletado de props en componentes

### Técnicos  
- [ ] Cero errores de TypeScript (`tsc --noEmit`)
- [ ] ESLint pasa sin warnings
- [ ] Cobertura de tipos > 95%
- [ ] Performance de desarrollo mantenida
- [ ] Tamaño de bundle no incrementado significativamente

### Experiencia de Desarrollo
- [ ] Mejor detección de errores en tiempo de desarrollo
- [ ] Refactoring más seguro y confiable
- [ ] Documentación implícita vía tipos
- [ ] Integración IDE mejorada

---

## 📚 Referencias y Recursos

### Documentación Oficial
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite TypeScript Guide](https://vitejs.dev/guide/features.html#typescript)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [shadcn/ui TypeScript Examples](https://ui.shadcn.com/docs/installation/vite)

### Herramientas Útiles
- `tsc --noEmit --watch` - Verificación de tipos en tiempo real
- VS Code TypeScript extension - IntelliSense y refactoring
- TypeScript Error Translator - Mejor comprensión de errores

---

**Última actualización**: Agosto 2025  
**Versión PRD**: 1.0  
**Estimación total**: 4-6 horas de trabajo concentrado
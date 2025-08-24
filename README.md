# 📊 Evaluador de Textos Educativos

Web SPA para evaluación automatizada de textos educativos con métricas de fiabilidad en tiempo real.

## 🎯 Descripción del Proyecto

Esta aplicación permite:
- Cargar CSVs con respuestas de estudiantes (hasta 3000+ filas)
- Procesarlos mediante API con evaluación automática
- Visualizar métricas de fiabilidad ICC(3,1) en tiempo real
- Exportar resultados enriquecidos con evaluaciones del modelo

## 🚀 Instalación Rápida

### Prerrequisitos
- Node.js 18+ 
- npm o yarn

### Pasos de instalación

```bash
# Clonar el repositorio
git clone https://github.com/carlosvillu/web-texts-evaluations.git
cd web-texts-evaluations

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en http://localhost:5173/

## 🛠️ Stack Tecnológico

- **Frontend**: React 19 + Vite
- **Styling**: Tailwind CSS v3 + shadcn/ui
- **Data Management**: @tanstack/react-virtual + @tanstack/react-table
- **CSV Processing**: Papaparse
- **Real-time**: Server-Sent Events (SSE)

## 📁 Estructura del Proyecto

```
src/
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── ConfigurationSection.jsx    # Config endpoint + CSV separator
│   ├── FileUploadSection.jsx       # Drag & drop + CSV parsing
│   ├── VirtualTable.jsx            # Tabla virtual para 3000+ filas
│   ├── ProcessingController.jsx    # Control SSE + progress
│   ├── MetricsPanel.jsx            # ICC + estadísticas tiempo real
│   └── ResultsExporter.jsx         # Descarga CSV enriquecido
├── hooks/
│   ├── useLocalStorage.js          # Persistencia configuraciones
│   ├── useSSE.js                   # Server-Sent Events handler
│   └── useVirtualTable.js          # Configuración tabla virtual
├── services/
│   ├── api.js                      # Cliente API
│   ├── csvParser.js                # Papaparse + validación CSV
│   └── metrics.js                  # Cálculo ICC(3,1) + estadísticas
└── utils/
    ├── formatters.js               # Formateo números, métricas
    └── validators.js               # Validación URLs, CSV, datos
```

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia servidor de desarrollo

# Producción
npm run build        # Build para producción
npm run preview      # Preview del build

# Calidad de código
npm run lint         # Ejecuta ESLint
```

## 📊 Formato CSV Esperado

El CSV debe contener las siguientes columnas:

| Columna | Tipo | Requerida | Descripción |
|---------|------|-----------|-------------|
| `id_participante` | string | ✅ | Identificador único del estudiante |
| `respuesta` | string | ✅ | Texto de la respuesta del estudiante |
| `curso` | string | ✅ | Curso o asignatura |
| `pregunta` | string | ✅ | Enunciado de la pregunta |
| `evaluacion_1` | number | ✅ | Primera evaluación humana (0-10) |
| `evaluacion_2` | number | ❌ | Segunda evaluación humana (opcional) |
| `evaluacion_3` | number | ❌ | Tercera evaluación humana (opcional) |

### Ejemplo CSV:
```csv
id_participante;respuesta;curso;pregunta;evaluacion_1;evaluacion_2;evaluacion_3
EST001;"La fotosíntesis es el proceso...";"Biología";"Explica la fotosíntesis";8;7;8
EST002;"El agua se compone de...";"Química";"¿Qué es el agua?";9;8;9
```

## 🔗 Configuración API

### Variables de Entorno

Crea un archivo `.env` basado en `.env.example`:

```bash
# API Configuration
VITE_API_ENDPOINT=https://your-api-endpoint.com

# Development Settings
VITE_CSV_MAX_SIZE=50
VITE_MAX_ROWS=3000
VITE_BATCH_SIZE=10
```

### Endpoints Esperados

La API debe implementar:

```javascript
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

## 📈 Métricas de Rendimiento

### Objetivos del PoC
- **Carga CSV 3000 filas**: < 2 segundos
- **Renderizado tabla virtual**: 60 FPS
- **Memoria con 3000 filas**: < 200MB
- **Actualización métricas**: < 100ms
- **Error rate SSE**: < 1%

## 🔄 Desarrollo por Fases

El proyecto sigue un desarrollo estructurado en 6 fases:

1. **✅ Fase 1**: Project Setup & Configuration
2. **🔄 Fase 2**: Core Infrastructure & Utilities
3. **⏳ Fase 3**: UI Components Development
4. **⏳ Fase 4**: Processing & Metrics System
5. **⏳ Fase 5**: Integration & State Management
6. **⏳ Fase 6**: Testing & Optimization

Ver `PRD.md` para detalles completos de cada fase.

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'feat: agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es de código abierto bajo la licencia MIT.

## 📚 Documentación Adicional

- [`PRD.md`](./PRD.md) - Product Requirements Document detallado
- [`CLAUDE.md`](./CLAUDE.md) - Guía de desarrollo para Claude Code
- [`project-definition.md`](./project-definition.md) - Definición técnica del proyecto

---

**Versión**: 1.0 - Prueba de Concepto  
**Stack**: React 19 + Vite + Tailwind CSS v3 + shadcn/ui  
**Última actualización**: Agosto 2025

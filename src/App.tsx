import { useState, useCallback, useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConfigurationSection } from '@/components/ConfigurationSection'
import { FileUploadSection } from '@/components/FileUploadSection'
import { VirtualTable } from '@/components/VirtualTable'
import { ProcessingController } from '@/components/ProcessingController'
import { MetricsPanel } from '@/components/MetricsPanel'
import { ResultsExporter } from '@/components/ResultsExporter'
import { combineDataWithResults } from '@/services/metrics'
import type { AppState, CSVRow, APIResponse, ConfigState, ProcessingState } from '@/types/app'

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

  // Configuration handlers
  const handleConfigChange = useCallback((config: ConfigState) => {
    setAppState(prev => ({
      ...prev,
      config,
    }));

    // Persist to localStorage
    localStorage.setItem("endpoint", config.endpoint);
    localStorage.setItem("separator", config.separator);
  }, []);

  // CSV data handlers
  const handleDataLoaded = useCallback((data: CSVRow[]) => {
    setAppState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        original: data,
        results: [], // Clear previous results
        merged: [],
      },
      // Reset processing and metrics when new data is loaded
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
    }));
  }, []);

  // Processing handlers
  const handleProcessingStateChange = useCallback((updates: Partial<ProcessingState>) => {
    setAppState(prev => ({
      ...prev,
      processing: {
        ...prev.processing,
        ...updates,
      },
    }));
  }, []);

  // Results handlers
  const handleResultsUpdate = useCallback((newResults: APIResponse[]) => {
    setAppState(prev => {
      // Combine new results with existing ones, avoiding duplicates
      const existingIds = new Set(prev.data.results.map(r => r.id_alumno));
      const uniqueNewResults = newResults.filter(r => !existingIds.has(r.id_alumno));
      const allResults = [...prev.data.results, ...uniqueNewResults];

      // Calculate merged data
      const merged = combineDataWithResults(prev.data.original, allResults);

      return {
        ...prev,
        data: {
          ...prev.data,
          results: allResults,
          merged,
        },
        metrics: {
          ...prev.metrics,
          processedCount: allResults.length,
        },
      };
    });
  }, []);

  // Processing completion handler
  const handleProcessingComplete = useCallback(() => {
    console.log('Processing completed successfully');
    // Additional completion logic can be added here
  }, []);

  // Computed values
  const { hasData, hasResults, canProcess } = useMemo(() => ({
    hasData: appState.data.original.length > 0,
    hasResults: appState.data.results.length > 0,
    canProcess: appState.data.original.length > 0 && appState.config.endpoint.trim() !== '',
  }), [appState.data.original.length, appState.data.results.length, appState.config.endpoint]);

  // Table columns for original data
  const originalColumns = useMemo(() => {
    if (appState.data.original.length === 0) return [];
    const firstRow = appState.data.original[0];
    return Object.keys(firstRow).map(key => ({
      id: key,
      header: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      accessorKey: key,
    }));
  }, [appState.data.original]);

  // Table columns for results
  const resultsColumns = useMemo(() => {
    if (appState.data.merged.length === 0) return [];
    const firstRow = appState.data.merged[0];
    return Object.keys(firstRow).map(key => ({
      id: key,
      header: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      accessorKey: key,
    }));
  }, [appState.data.merged]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-4 px-4 max-w-7xl">
        {/* Header */}
        <header className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📊 Evaluador de Textos Educativos
          </h1>
          <p className="text-gray-600 text-sm">
            SPA para Evaluación Automatizada con Métricas ICC en Tiempo Real
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Configuration Section */}
            <ConfigurationSection
              config={appState.config}
              onConfigChange={handleConfigChange}
            />

            {/* File Upload Section */}
            <FileUploadSection
              separator={appState.config.separator}
              onDataLoaded={handleDataLoaded}
            />

            {/* Metrics Panel */}
            <MetricsPanel
              originalData={appState.data.original}
              results={appState.data.results}
              metrics={appState.metrics}
            />

            {/* Results Exporter */}
            {hasResults && (
              <ResultsExporter
                data={appState.data.merged}
                isProcessing={appState.processing.isActive}
              />
            )}
          </div>

          {/* Right Column - Processing & Data Visualization */}
          <div className="lg:col-span-2 space-y-6">
            {/* Processing Controller */}
            <ProcessingController
              data={appState.data.original}
              endpointUrl={appState.config.endpoint}
              processing={appState.processing}
              onProcessingStateChange={handleProcessingStateChange}
              onResultsUpdate={handleResultsUpdate}
              onComplete={handleProcessingComplete}
            />

            {/* Data Visualization Tabs */}
            {hasData && (
              <Tabs defaultValue="original" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="original" className="flex items-center gap-2">
                    📄 Datos Originales
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                      {appState.data.original.length}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="results" className="flex items-center gap-2">
                    📊 Resultados
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                      {appState.data.results.length}
                    </span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="original" className="mt-4">
                  <VirtualTable
                    data={appState.data.original}
                    columns={originalColumns}
                    height={500}
                    title="Datos CSV Cargados"
                    subtitle={`${appState.data.original.length} filas cargadas`}
                  />
                </TabsContent>

                <TabsContent value="results" className="mt-4">
                  {hasResults ? (
                    <VirtualTable
                      data={appState.data.merged}
                      columns={resultsColumns}
                      height={500}
                      title="Resultados del Modelo"
                      subtitle={`${appState.data.results.length} de ${appState.data.original.length} procesados (${Math.round((appState.data.results.length / appState.data.original.length) * 100)}%)`}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-96 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                      <div className="text-4xl mb-4">📊</div>
                      <h3 className="text-lg font-medium mb-2">No hay resultados aún</h3>
                      <p className="text-sm text-center max-w-sm">
                        {!canProcess 
                          ? "Configura el endpoint y carga datos CSV para comenzar"
                          : "Presiona 'Iniciar Procesamiento' para obtener evaluaciones del modelo"
                        }
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}

            {/* No data state */}
            {!hasData && (
              <div className="flex flex-col items-center justify-center h-96 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <div className="text-4xl mb-4">📁</div>
                <h3 className="text-lg font-medium mb-2">Bienvenido al Evaluador</h3>
                <p className="text-sm text-center max-w-sm">
                  Comienza configurando tu endpoint y cargando un archivo CSV con datos de evaluaciones educativas
                </p>
                <div className="mt-4 text-xs text-gray-400">
                  Fase 4: Processing & Metrics System - PoC
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
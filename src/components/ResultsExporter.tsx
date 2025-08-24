import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Check, AlertCircle } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { calculateMedian } from '@/services/metrics';
import { formatTimestamp } from '@/utils/formatters';
import type { CSVRow, APIResponse } from '@/types/app';

interface ResultsExporterProps {
  originalData: CSVRow[];
  results: APIResponse[];
  isProcessingComplete: boolean;
}

interface EnrichedResult extends CSVRow {
  evaluacion_modelo: number;
  mediana_humana: number | null;
  desviacion: number | null;
  confianza?: number;
  tiempo_procesamiento?: number;
  timestamp_exportacion: string;
}

export function ResultsExporter({ originalData, results, isProcessingComplete }: ResultsExporterProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const generateEnrichedData = (): EnrichedResult[] => {
    const enrichedData: EnrichedResult[] = [];
    const timestamp = formatTimestamp(new Date());

    originalData.forEach((originalRow) => {
      const result = results.find(r => r.id_alumno === originalRow.id_participante);
      
      if (result) {
        // Has model evaluation
        const mediana = calculateMedian(originalRow);
        const desviacion = mediana !== null ? Math.abs(result.nota - mediana) : null;

        enrichedData.push({
          ...originalRow,
          evaluacion_modelo: result.nota,
          mediana_humana: mediana,
          desviacion,
          confianza: result.confianza,
          tiempo_procesamiento: result.tiempo_procesamiento,
          timestamp_exportacion: timestamp,
        });
      } else {
        // No model evaluation yet
        const mediana = calculateMedian(originalRow);

        enrichedData.push({
          ...originalRow,
          evaluacion_modelo: -1, // Indicates not processed
          mediana_humana: mediana,
          desviacion: null,
          timestamp_exportacion: timestamp,
        });
      }
    });

    return enrichedData;
  };

  const convertToCSV = (data: EnrichedResult[]): string => {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    
    const csvRows = data.map(row => {
      return headers.map(header => {
        const value = row[header as keyof EnrichedResult];
        
        if (value === null || value === undefined) {
          return '';
        }
        
        if (typeof value === 'string' && (value.includes(',') || value.includes('\n') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        
        return String(value);
      }).join(',');
    });

    return [csvHeaders, ...csvRows].join('\n');
  };

  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setExportProgress(0);
      setExportError(null);
      setExportSuccess(null);

      // Simulate progress for UX (since generation is fast)
      setExportProgress(20);
      await new Promise(resolve => setTimeout(resolve, 100));

      const enrichedData = generateEnrichedData();
      setExportProgress(60);
      await new Promise(resolve => setTimeout(resolve, 100));

      const csvContent = convertToCSV(enrichedData);
      setExportProgress(80);
      await new Promise(resolve => setTimeout(resolve, 100));

      const timestamp = formatTimestamp(new Date()).replace(/[:\s]/g, '-');
      const filename = `evaluacion-textos-${timestamp}.csv`;
      
      downloadCSV(csvContent, filename);
      setExportProgress(100);

      setExportSuccess(`✅ Exportado: ${filename} (${enrichedData.length} filas)`);
      
      // Reset progress after 3 seconds
      setTimeout(() => {
        setExportProgress(0);
        setExportSuccess(null);
      }, 3000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setExportError(`Error al exportar: ${errorMessage}`);
    } finally {
      setIsExporting(false);
    }
  };

  const getExportStats = () => {
    const processedCount = results.length;
    const unprocessedCount = originalData.length - processedCount;
    const completionPercentage = originalData.length > 0 
      ? Math.round((processedCount / originalData.length) * 100) 
      : 0;

    return {
      totalRows: originalData.length,
      processedCount,
      unprocessedCount,
      completionPercentage,
    };
  };

  const stats = getExportStats();
  const canExport = originalData.length > 0;
  const hasResults = results.length > 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          📥 Exportar Resultados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Export Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-2xl font-mono text-blue-600">{stats.totalRows}</div>
            <div className="text-gray-600">Filas totales</div>
          </div>
          
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-2xl font-mono text-green-600">{stats.processedCount}</div>
            <div className="text-gray-600">Procesadas</div>
          </div>
          
          <div className="bg-yellow-50 p-3 rounded-lg">
            <div className="text-2xl font-mono text-yellow-600">{stats.unprocessedCount}</div>
            <div className="text-gray-600">Pendientes</div>
          </div>
          
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="text-2xl font-mono text-purple-600">{stats.completionPercentage}%</div>
            <div className="text-gray-600">Completado</div>
          </div>
        </div>

        {/* Status Messages */}
        {exportSuccess && (
          <Alert>
            <Check className="h-4 w-4" />
            <div>
              <p className="font-medium">Exportación exitosa</p>
              <p className="text-sm">{exportSuccess}</p>
            </div>
          </Alert>
        )}

        {exportError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <div>
              <p className="font-medium">Error en exportación</p>
              <p className="text-sm">{exportError}</p>
            </div>
          </Alert>
        )}

        {/* Progress Bar */}
        {isExporting && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Generando archivo...</span>
              <span>{exportProgress}%</span>
            </div>
            <Progress value={exportProgress} className="w-full" />
          </div>
        )}

        {/* Export Information */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <h4 className="font-medium">El archivo CSV incluirá:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>✅ Todos los campos originales del CSV cargado</li>
            <li>✅ Evaluación del modelo (nota de 0-10)</li>
            <li>✅ Mediana de evaluaciones humanas calculada</li>
            <li>✅ Desviación absoluta (modelo vs mediana humana)</li>
            {hasResults && (
              <>
                <li>✅ Nivel de confianza del modelo (si disponible)</li>
                <li>✅ Tiempo de procesamiento por item (si disponible)</li>
              </>
            )}
            <li>✅ Timestamp de exportación</li>
          </ul>
          
          {!isProcessingComplete && (
            <div className="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded text-sm">
              <p className="text-yellow-800">
                ⚠️ El procesamiento aún no está completo. Las filas no procesadas 
                tendrán evaluacion_modelo = -1
              </p>
            </div>
          )}
        </div>

        {/* Export Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isProcessingComplete && (
              <Badge variant="default" className="text-green-600">
                ✅ Procesamiento Completo
              </Badge>
            )}
            {hasResults && !isProcessingComplete && (
              <Badge variant="outline">
                ⏳ Procesamiento en Curso
              </Badge>
            )}
          </div>

          <Button
            onClick={handleExport}
            disabled={!canExport || isExporting}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {isExporting 
              ? 'Exportando...' 
              : hasResults 
              ? 'Descargar Resultados' 
              : 'Descargar Datos'
            }
          </Button>
        </div>

        {/* Help Text */}
        {!canExport && (
          <p className="text-sm text-gray-500">
            ⚠️ Carga datos CSV para habilitar la exportación
          </p>
        )}

        {canExport && !hasResults && (
          <p className="text-sm text-gray-500">
            ℹ️ Puedes exportar los datos originales con medianas calculadas, 
            o esperar a que complete el procesamiento para incluir las evaluaciones del modelo
          </p>
        )}
      </CardContent>
    </Card>
  );
}
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, TrendingUp, Target, Users } from 'lucide-react';
import { calculateICC31, calculateMedian, getICCInterpretation } from '@/services/metrics';
import type { CSVRow, APIResponse, MetricsState } from '@/types/app';

interface MetricsPanelProps {
  originalData: CSVRow[];
  results: APIResponse[];
  metrics: MetricsState;
}

interface CalculatedMetrics {
  icc: number | null;
  iccInterpretation: string;
  meanDeviation: number | null;
  stdDeviation: number | null;
  reliabilityMet: boolean;
  processedCount: number;
  processedPercentage: number;
  validComparisons: number;
}

export function MetricsPanel({ originalData, results, metrics }: MetricsPanelProps) {
  const calculatedMetrics = useMemo<CalculatedMetrics>(() => {
    if (results.length === 0) {
      return {
        icc: null,
        iccInterpretation: 'Sin datos',
        meanDeviation: null,
        stdDeviation: null,
        reliabilityMet: false,
        processedCount: 0,
        processedPercentage: 0,
        validComparisons: 0,
      };
    }

    // Match results with original data and calculate medians
    const comparisons: Array<{ modelScore: number; humanMedian: number }> = [];
    
    results.forEach((result) => {
      const originalRow = originalData.find(
        (row) => row.id_participante === result.id_alumno
      );
      
      if (originalRow) {
        const humanMedian = calculateMedian(originalRow);
        if (humanMedian !== null) {
          comparisons.push({
            modelScore: result.nota,
            humanMedian,
          });
        }
      }
    });

    if (comparisons.length === 0) {
      return {
        icc: null,
        iccInterpretation: 'Sin comparaciones válidas',
        meanDeviation: null,
        stdDeviation: null,
        reliabilityMet: false,
        processedCount: results.length,
        processedPercentage: originalData.length > 0 ? Math.round((results.length / originalData.length) * 100) : 0,
        validComparisons: 0,
      };
    }

    // Calculate ICC(3,1)
    const modelScores = comparisons.map(c => c.modelScore);
    const humanMedians = comparisons.map(c => c.humanMedian);
    const icc = calculateICC31(modelScores, humanMedians);
    const iccInfo = getICCInterpretation(icc);
    const iccInterpretation = iccInfo.interpretation;

    // Calculate deviations
    const deviations = comparisons.map(c => Math.abs(c.modelScore - c.humanMedian));
    const meanDeviation = deviations.reduce((sum, dev) => sum + dev, 0) / deviations.length;
    
    // Calculate standard deviation
    const variance = deviations.reduce((sum, dev) => {
      const diff = dev - meanDeviation;
      return sum + (diff * diff);
    }, 0) / deviations.length;
    const stdDeviation = Math.sqrt(variance);

    const reliabilityMet = icc !== null && icc > 0.8;
    const processedPercentage = originalData.length > 0 ? Math.round((results.length / originalData.length) * 100) : 0;

    return {
      icc,
      iccInterpretation,
      meanDeviation,
      stdDeviation,
      reliabilityMet,
      processedCount: results.length,
      processedPercentage,
      validComparisons: comparisons.length,
    };
  }, [originalData, results]);

  const getICCBadgeVariant = (icc: number | null): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (icc === null) return 'outline';
    if (icc >= 0.9) return 'default'; // Excelente - blue
    if (icc >= 0.75) return 'secondary'; // Bueno - gray
    if (icc >= 0.5) return 'outline'; // Moderado - outline
    return 'destructive'; // Pobre - red
  };

  const getICCColor = (icc: number | null): string => {
    if (icc === null) return 'text-gray-500';
    if (icc >= 0.9) return 'text-blue-600';
    if (icc >= 0.75) return 'text-green-600';
    if (icc >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDeviationColor = (deviation: number | null): string => {
    if (deviation === null) return 'text-gray-500';
    if (deviation <= 1) return 'text-green-600';
    if (deviation <= 2) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            📊 Métricas de Fiabilidad
          </div>
          {calculatedMetrics.reliabilityMet && (
            <Badge variant="default" className="text-green-600">
              ✅ Fiable
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* ICC Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              <span className="font-medium">ICC(3,1)</span>
            </div>
            <Badge variant={getICCBadgeVariant(calculatedMetrics.icc)}>
              {calculatedMetrics.icc !== null ? calculatedMetrics.icc.toFixed(3) : '-'}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span>Interpretación:</span>
            <span className={`font-medium ${getICCColor(calculatedMetrics.icc)}`}>
              {calculatedMetrics.iccInterpretation}
            </span>
          </div>

          {calculatedMetrics.icc !== null && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Pobre</span>
                <span>Moderado</span>
                <span>Bueno</span>
                <span>Excelente</span>
              </div>
              <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="absolute inset-0 flex">
                  <div className="flex-1 bg-red-400"></div>
                  <div className="flex-1 bg-yellow-400"></div>
                  <div className="flex-1 bg-green-400"></div>
                  <div className="flex-1 bg-blue-400"></div>
                </div>
                <div
                  className="absolute top-0 h-full w-1 bg-black"
                  style={{ left: `${calculatedMetrics.icc * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Deviation Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Desviación Media</span>
            </div>
            <div className={`text-2xl font-mono ${getDeviationColor(calculatedMetrics.meanDeviation)}`}>
              {calculatedMetrics.meanDeviation !== null ? calculatedMetrics.meanDeviation.toFixed(2) : '-'}
            </div>
            <div className="text-xs text-gray-500">
              Diferencia promedio modelo vs humano
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <BarChart className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Desviación Estándar</span>
            </div>
            <div className="text-2xl font-mono text-gray-700">
              {calculatedMetrics.stdDeviation !== null ? calculatedMetrics.stdDeviation.toFixed(2) : '-'}
            </div>
            <div className="text-xs text-gray-500">
              Variabilidad en las diferencias
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="font-medium">Progreso de Evaluación</span>
            </div>
            <span className="text-sm text-gray-600">
              {calculatedMetrics.processedPercentage}%
            </span>
          </div>
          
          <Progress value={calculatedMetrics.processedPercentage} className="w-full" />
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="font-mono text-lg">{calculatedMetrics.processedCount}</div>
              <div className="text-gray-500">Procesados</div>
            </div>
            <div className="text-center">
              <div className="font-mono text-lg">{originalData.length}</div>
              <div className="text-gray-500">Total</div>
            </div>
            <div className="text-center">
              <div className="font-mono text-lg">{calculatedMetrics.validComparisons}</div>
              <div className="text-gray-500">Válidos</div>
            </div>
          </div>
        </div>

        {/* Reliability Status */}
        <div className={`p-3 rounded-lg ${
          calculatedMetrics.reliabilityMet 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-gray-50 border border-gray-200'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              calculatedMetrics.reliabilityMet ? 'bg-green-500' : 'bg-gray-400'
            }`}></div>
            <span className="font-medium">
              Estado de Fiabilidad
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {calculatedMetrics.reliabilityMet
              ? '✅ El modelo muestra fiabilidad excelente (ICC > 0.8)'
              : calculatedMetrics.icc !== null
              ? `⚠️ Fiabilidad ${calculatedMetrics.iccInterpretation.toLowerCase()} (ICC = ${calculatedMetrics.icc.toFixed(3)})`
              : '⏳ Esperando datos para evaluar fiabilidad'
            }
          </p>
        </div>

        {/* Debug Info (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="text-xs text-gray-500">
            <summary className="cursor-pointer">Debug Info</summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded overflow-x-auto">
              {JSON.stringify({
                originalDataLength: originalData.length,
                resultsLength: results.length,
                validComparisons: calculatedMetrics.validComparisons,
                metricsState: metrics,
              }, null, 2)}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
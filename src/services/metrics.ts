/**
 * Servicio para cálculo de métricas de evaluación (ICC, desviaciones, estadísticas)
 */

import { CSVRow, APIResponse } from "@/types/app";

/**
 * Resultado completo de métricas calculadas
 */
export interface MetricsResult {
  icc: number | null;
  meanDeviation: number | null;
  stdDeviation: number | null;
  reliabilityMet: boolean;
  processedCount: number;
  stats: {
    modelMean: number;
    humanMean: number;
    correlation: number;
    minDeviation: number;
    maxDeviation: number;
    validPairs: number;
  } | null;
  interpretation: {
    iccInterpretation: string;
    reliabilityMessage: string;
    qualityLevel: 'poor' | 'moderate' | 'good' | 'excellent' | 'unknown';
  };
}

/**
 * Calcular mediana de evaluaciones humanas para una fila
 */
export const calculateMedian = (row: CSVRow): number | null => {
  const scores = [
    row.evaluacion_1,
    row.evaluacion_2,
    row.evaluacion_3
  ].filter((v): v is number => 
    v !== null && v !== undefined && !isNaN(v)
  );

  if (scores.length === 0) return null;

  scores.sort((a, b) => a - b);
  const mid = Math.floor(scores.length / 2);

  return scores.length % 2 !== 0
    ? scores[mid]
    : (scores[mid - 1] + scores[mid]) / 2;
};

/**
 * Calcular ICC(3,1) - Single rater, consistency
 * Compara modelo vs mediana de evaluaciones humanas
 */
export const calculateICC31 = (
  modelScores: number[], 
  humanMedians: number[]
): number | null => {
  if (modelScores.length !== humanMedians.length || modelScores.length < 2) {
    return null;
  }

  const n = modelScores.length;

  // Calcular medias
  const mean1 = modelScores.reduce((a, b) => a + b) / n;
  const mean2 = humanMedians.reduce((a, b) => a + b) / n;
  const grandMean = (mean1 + mean2) / 2;

  // Calcular sumas de cuadrados
  let SST = 0; // Total sum of squares
  let SSW = 0; // Within sum of squares  
  let SSB = 0; // Between sum of squares

  for (let i = 0; i < n; i++) {
    const rowMean = (modelScores[i] + humanMedians[i]) / 2;
    
    // Between subjects (diferencia de la media de cada sujeto vs gran media)
    SSB += 2 * Math.pow(rowMean - grandMean, 2);
    
    // Within subjects (variación dentro de cada sujeto)
    SSW += Math.pow(modelScores[i] - rowMean, 2);
    SSW += Math.pow(humanMedians[i] - rowMean, 2);
    
    // Total (cada puntaje vs gran media)
    SST += Math.pow(modelScores[i] - grandMean, 2);
    SST += Math.pow(humanMedians[i] - grandMean, 2);
  }

  // Calcular mean squares
  const MSB = SSB / (n - 1); // Between subjects mean square
  const MSW = SSW / n;       // Within subjects mean square

  // ICC(3,1) = (MSB - MSW) / (MSB + MSW)
  const denominator = MSB + MSW;
  if (denominator === 0) return null;

  const icc = (MSB - MSW) / denominator;
  
  // Clamp entre 0 y 1 (ICC no puede ser negativo en este contexto)
  return Math.max(0, Math.min(1, icc));
};

/**
 * Obtener interpretación del ICC
 */
export const getICCInterpretation = (icc: number | null): {
  interpretation: string;
  qualityLevel: 'poor' | 'moderate' | 'good' | 'excellent' | 'unknown';
  color: string;
} => {
  if (icc === null) {
    return {
      interpretation: "No calculado",
      qualityLevel: "unknown",
      color: "text-gray-500"
    };
  }

  if (icc < 0.5) {
    return {
      interpretation: "Pobre",
      qualityLevel: "poor",
      color: "text-red-600"
    };
  }

  if (icc < 0.75) {
    return {
      interpretation: "Moderado",
      qualityLevel: "moderate", 
      color: "text-amber-600"
    };
  }

  if (icc < 0.9) {
    return {
      interpretation: "Bueno",
      qualityLevel: "good",
      color: "text-blue-600"
    };
  }

  return {
    interpretation: "Excelente",
    qualityLevel: "excellent",
    color: "text-green-600"
  };
};

/**
 * Calcular desviación estándar
 */
export const calculateStandardDeviation = (values: number[]): number | null => {
  if (values.length < 2) return null;

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / (values.length - 1);
  
  return Math.sqrt(variance);
};

/**
 * Calcular correlación de Pearson
 */
export const calculateCorrelation = (x: number[], y: number[]): number | null => {
  if (x.length !== y.length || x.length < 2) return null;

  const n = x.length;
  const meanX = x.reduce((sum, val) => sum + val, 0) / n;
  const meanY = y.reduce((sum, val) => sum + val, 0) / n;

  let numerator = 0;
  let denomX = 0;
  let denomY = 0;

  for (let i = 0; i < n; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    
    numerator += diffX * diffY;
    denomX += diffX * diffX;
    denomY += diffY * diffY;
  }

  const denominator = Math.sqrt(denomX * denomY);
  if (denominator === 0) return null;

  return numerator / denominator;
};

/**
 * Combinar datos originales con resultados del modelo
 */
export const combineDataWithResults = (
  originalData: CSVRow[],
  apiResults: APIResponse[]
): Array<CSVRow & APIResponse & { 
  mediana_humana: number | null;
  desviacion: number | null;
}> => {
  return originalData.map(originalRow => {
    // Buscar resultado correspondiente por ID
    const result = apiResults.find(r => r.id_alumno === originalRow.id_participante);
    
    const mediana_humana = calculateMedian(originalRow);
    const desviacion = result && mediana_humana !== null 
      ? Math.abs(result.nota - mediana_humana)
      : null;

    return {
      ...originalRow,
      ...(result || {}),
      mediana_humana,
      desviacion
    } as CSVRow & APIResponse & { mediana_humana: number | null; desviacion: number | null };
  });
};

/**
 * Calcular métricas completas a partir de datos combinados
 */
export const calculateMetrics = (
  originalData: CSVRow[],
  apiResults: APIResponse[]
): MetricsResult => {
  const processedCount = apiResults.length;
  
  if (processedCount === 0) {
    return {
      icc: null,
      meanDeviation: null,
      stdDeviation: null,
      reliabilityMet: false,
      processedCount: 0,
      stats: null,
      interpretation: {
        iccInterpretation: "No calculado",
        reliabilityMessage: "Sin datos procesados",
        qualityLevel: "unknown"
      }
    };
  }

  // Preparar datos para cálculos
  const validPairs: Array<{ model: number; human: number; deviation: number }> = [];

  for (const originalRow of originalData) {
    const result = apiResults.find(r => r.id_alumno === originalRow.id_participante);
    if (!result) continue;

    const humanMedian = calculateMedian(originalRow);
    if (humanMedian === null) continue;

    validPairs.push({
      model: result.nota,
      human: humanMedian,
      deviation: Math.abs(result.nota - humanMedian)
    });
  }

  if (validPairs.length < 2) {
    return {
      icc: null,
      meanDeviation: null,
      stdDeviation: null,
      reliabilityMet: false,
      processedCount,
      stats: null,
      interpretation: {
        iccInterpretation: "Datos insuficientes",
        reliabilityMessage: "Se necesitan al menos 2 pares válidos",
        qualityLevel: "unknown"
      }
    };
  }

  // Extraer arrays para cálculos
  const modelScores = validPairs.map(p => p.model);
  const humanScores = validPairs.map(p => p.human);
  const deviations = validPairs.map(p => p.deviation);

  // Calcular métricas principales
  const icc = calculateICC31(modelScores, humanScores);
  const meanDeviation = deviations.reduce((sum, dev) => sum + dev, 0) / deviations.length;
  const stdDeviation = calculateStandardDeviation(deviations);
  const reliabilityMet = icc !== null && icc > 0.8;

  // Estadísticas adicionales
  const stats = {
    modelMean: modelScores.reduce((sum, score) => sum + score, 0) / modelScores.length,
    humanMean: humanScores.reduce((sum, score) => sum + score, 0) / humanScores.length,
    correlation: calculateCorrelation(modelScores, humanScores) || 0,
    minDeviation: Math.min(...deviations),
    maxDeviation: Math.max(...deviations),
    validPairs: validPairs.length
  };

  // Interpretación
  const iccInfo = getICCInterpretation(icc);
  const interpretation = {
    iccInterpretation: iccInfo.interpretation,
    reliabilityMessage: reliabilityMet 
      ? "El modelo muestra alta fiabilidad (ICC > 0.8)"
      : "El modelo necesita mejoras de fiabilidad (ICC ≤ 0.8)",
    qualityLevel: iccInfo.qualityLevel
  };

  return {
    icc,
    meanDeviation,
    stdDeviation,
    reliabilityMet,
    processedCount,
    stats,
    interpretation
  };
};

/**
 * Hook-like function para cálculo incremental de métricas
 * Útil para actualizaciones en tiempo real durante SSE
 */
export const createMetricsCalculator = (originalData: CSVRow[]) => {
  let currentResults: APIResponse[] = [];

  return {
    updateResults: (newResults: APIResponse[]) => {
      currentResults = [...newResults];
      return calculateMetrics(originalData, currentResults);
    },
    addResults: (additionalResults: APIResponse[]) => {
      // Evitar duplicados por ID
      const existingIds = new Set(currentResults.map(r => r.id_alumno));
      const uniqueNew = additionalResults.filter(r => !existingIds.has(r.id_alumno));
      currentResults = [...currentResults, ...uniqueNew];
      return calculateMetrics(originalData, currentResults);
    },
    getCurrentMetrics: () => calculateMetrics(originalData, currentResults),
    reset: () => {
      currentResults = [];
    }
  };
};
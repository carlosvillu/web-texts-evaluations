export interface AppConfig {
  endpoint: string;
  separator: string;
}

export type ConfigState = AppConfig;

export interface CSVRow extends Record<string, unknown> {
  id_participante: string;
  respuesta: string;
  curso: string;
  pregunta: string;
  evaluacion_1: number;
  evaluacion_2?: number;
  evaluacion_3?: number;
}

export interface APIResponse extends Record<string, unknown> {
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
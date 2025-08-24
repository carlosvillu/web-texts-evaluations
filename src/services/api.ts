/**
 * Cliente API para comunicación con el backend de evaluación
 */

import { CSVRow, APIResponse } from "@/types/app";

export interface EvaluationRequest {
  items: Array<{
    id_alumno: string;
    curso: string;
    consigna: string;
    respuesta: string;
  }>;
}

export interface EvaluationStartResponse {
  job_id: string;
}

export interface APIError {
  error: string;
  code?: string;
  details?: unknown;
}

/**
 * Configuración del cliente API
 */
export class APIClient {
  private baseURL: string;
  private timeout: number;

  constructor(baseURL: string, timeout: number = 30000) {
    this.baseURL = baseURL.replace(/\/$/, ''); // Remover trailing slash
    this.timeout = timeout;
  }

  /**
   * Actualizar la URL base del API
   */
  updateBaseURL(newBaseURL: string) {
    this.baseURL = newBaseURL.replace(/\/$/, '');
  }

  /**
   * Realizar petición HTTP con manejo de errores
   */
  private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // Si no puede parsear JSON, usar el mensaje por defecto
        }

        throw new Error(errorMessage);
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Timeout de ${this.timeout}ms excedido`);
        }
        throw error;
      }
      
      throw new Error('Error desconocido en la petición');
    }
  }

  /**
   * Probar conectividad con el servidor
   */
  async testConnection(): Promise<{ success: boolean; error?: string; responseTime?: number }> {
    const startTime = Date.now();
    
    try {
      // Intentar hacer un simple GET al endpoint base o /health
      const _response = await this.fetchWithTimeout(`${this.baseURL}/health`, {
        method: 'GET',
      });
      
      const responseTime = Date.now() - startTime;
      
      return {
        success: true,
        responseTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error de conexión',
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * Iniciar evaluación enviando datos CSV
   */
  async startEvaluation(csvData: CSVRow[]): Promise<EvaluationStartResponse> {
    if (!csvData || csvData.length === 0) {
      throw new Error('No hay datos para evaluar');
    }

    // Mapear datos CSV al formato esperado por la API
    const requestData: EvaluationRequest = {
      items: csvData.map(row => ({
        id_alumno: row.id_participante,
        curso: row.curso,
        consigna: row.pregunta,
        respuesta: row.respuesta,
      }))
    };

    try {
      const response = await this.fetchWithTimeout(`${this.baseURL}/evaluate`, {
        method: 'POST',
        body: JSON.stringify(requestData),
      });

      const result: EvaluationStartResponse = await response.json();
      
      if (!result.job_id) {
        throw new Error('Respuesta del servidor inválida: falta job_id');
      }

      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error iniciando evaluación: ${error.message}`);
      }
      throw new Error('Error desconocido iniciando evaluación');
    }
  }

  /**
   * Obtener URL para SSE stream
   */
  getStreamURL(jobId: string): string {
    return `${this.baseURL}/stream/${jobId}`;
  }

  /**
   * Cancelar un trabajo de evaluación (si está disponible)
   */
  async cancelEvaluation(jobId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const _response = await this.fetchWithTimeout(`${this.baseURL}/cancel/${jobId}`, {
        method: 'POST',
      });

      const result = await _response.json();
      return { success: true, message: result.message };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error cancelando evaluación'
      };
    }
  }

  /**
   * Obtener estado de un trabajo (si está disponible)
   */
  async getJobStatus(jobId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress?: { completed: number; total: number };
    error?: string;
  }> {
    try {
      const _response = await this.fetchWithTimeout(`${this.baseURL}/status/${jobId}`);
      return await _response.json();
    } catch (error) {
      throw new Error(`Error obteniendo estado: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }
}

/**
 * Instancia global del cliente API
 */
let apiClientInstance: APIClient | null = null;

/**
 * Obtener o crear instancia del cliente API
 */
export const getAPIClient = (baseURL?: string): APIClient => {
  if (!apiClientInstance || (baseURL && baseURL !== apiClientInstance['baseURL'])) {
    if (!baseURL) {
      throw new Error('URL base del API es requerida');
    }
    apiClientInstance = new APIClient(baseURL);
  }
  return apiClientInstance;
};

/**
 * Funciones de conveniencia
 */

export const testAPIConnection = async (baseURL: string) => {
  const client = new APIClient(baseURL);
  return await client.testConnection();
};

export const startEvaluation = async (baseURL: string, csvData: CSVRow[]) => {
  const client = getAPIClient(baseURL);
  return await client.startEvaluation(csvData);
};

export const getStreamURL = (baseURL: string, jobId: string) => {
  const client = getAPIClient(baseURL);
  return client.getStreamURL(jobId);
};

export const cancelEvaluation = async (baseURL: string, jobId: string) => {
  const client = getAPIClient(baseURL);
  return await client.cancelEvaluation(jobId);
};

export const getJobStatus = async (baseURL: string, jobId: string) => {
  const client = getAPIClient(baseURL);
  return await client.getJobStatus(jobId);
};


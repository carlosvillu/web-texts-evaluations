/**
 * Hook para manejo de Server-Sent Events (SSE)
 * Gestiona la conexión, reconexión automática y manejo de errores
 */

import { useEffect, useRef, useCallback, useState } from "react";

export interface SSEConfig {
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
  timeout?: number;
}

export interface SSEState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  reconnectCount: number;
}

export interface SSECallbacks {
  onMessage?: (data: unknown, eventType: string) => void;
  onBatchComplete?: (data: unknown) => void;
  onComplete?: (data: unknown) => void;
  onError?: (error: Event | string) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

const DEFAULT_CONFIG: SSEConfig = {
  maxReconnectAttempts: 5,
  reconnectInterval: 3000, // 3 segundos
  timeout: 30000 // 30 segundos
};

/**
 * Hook personalizado para manejo de Server-Sent Events
 */
export const useSSE = (
  url: string | null,
  callbacks: SSECallbacks = {},
  config: SSEConfig = {}
) => {
  const {
    onMessage,
    onBatchComplete,
    onComplete,
    onError,
    onOpen,
    onClose
  } = callbacks;

  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  
  const [state, setState] = useState<SSEState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    reconnectCount: 0
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const urlRef = useRef<string | null>(null);

  // Limpiar timeouts
  const clearTimeouts = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
  }, []);

  // Cerrar conexión
  const closeConnection = useCallback(() => {
    clearTimeouts();
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    setState(prev => ({
      ...prev,
      isConnected: false,
      isConnecting: false
    }));
  }, [clearTimeouts]);

  // Configurar event handlers para EventSource  
  const setupEventHandlers = useCallback((eventSource: EventSource) => {
    // Event: conexión abierta
    eventSource.onopen = () => {
      clearTimeout(connectionTimeoutRef.current!);
      setState(prev => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        error: null,
        reconnectCount: 0 // Reset contador en conexión exitosa
      }));
      onOpen?.();
    };

    // Event: mensaje genérico
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage?.(data, "message");
      } catch (error) {
        console.warn("Error parseando mensaje SSE:", error);
        onError?.("Error parseando datos del servidor");
      }
    };

    // Event: batch_complete
    eventSource.addEventListener("batch_complete", (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage?.(data, "batch_complete");
        onBatchComplete?.(data);
      } catch (error) {
        console.warn("Error parseando batch_complete:", error);
        onError?.("Error procesando lote de resultados");
      }
    });

    // Event: complete
    eventSource.addEventListener("complete", (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage?.(data, "complete");
        onComplete?.(data);
        
        // Cerrar conexión al completar
        setTimeout(() => closeConnection(), 1000);
      } catch (error) {
        console.warn("Error parseando complete:", error);
        onError?.("Error finalizando procesamiento");
      }
    });

    // Event: error
    eventSource.onerror = (error) => {
      console.error("Error SSE:", error);
      
      setState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        error: "Error de conexión con el servidor"
      }));

      onError?.(error);
      
      // Intentar reconectar solo si no es un cierre manual
      if (eventSource.readyState !== EventSource.CLOSED) {
        // Reconectar inline para evitar dependency cycle
        setState(prevState => {
          if (prevState.reconnectCount >= mergedConfig.maxReconnectAttempts!) {
            onError?.("Máximo número de intentos de reconexión alcanzado");
            return {
              ...prevState,
              isConnecting: false,
              error: "Conexión perdida. No se pudo reconectar automáticamente."
            };
          }

          const newReconnectCount = prevState.reconnectCount + 1;
          
          // Programar reconexión
          reconnectTimeoutRef.current = setTimeout(() => {
            if (urlRef.current) {
              const newEventSource = new EventSource(urlRef.current);
              eventSourceRef.current = newEventSource;
              setupEventHandlers(newEventSource);
            }
          }, mergedConfig.reconnectInterval);

          return {
            ...prevState,
            reconnectCount: newReconnectCount,
            isConnecting: true,
            error: `Reintentando conexión (${newReconnectCount}/${mergedConfig.maxReconnectAttempts})...`
          };
        });
      } else {
        onClose?.();
      }
    };
  }, [onOpen, onMessage, onBatchComplete, onComplete, onError, onClose, closeConnection, mergedConfig.maxReconnectAttempts, mergedConfig.reconnectInterval]);


  // Conectar a SSE
  const connectToSSE = useCallback((sseUrl: string) => {
    // Cerrar conexión existente
    closeConnection();
    
    setState(prev => ({
      ...prev,
      isConnecting: true,
      error: null
    }));

    try {
      const eventSource = new EventSource(sseUrl);
      eventSourceRef.current = eventSource;
      urlRef.current = sseUrl;

      // Timeout para conexión inicial
      connectionTimeoutRef.current = setTimeout(() => {
        if (!eventSourceRef.current || eventSourceRef.current.readyState !== EventSource.OPEN) {
          eventSource.close();
          setState(prev => ({
            ...prev,
            isConnecting: false,
            error: "Timeout de conexión"
          }));
          onError?.("Timeout de conexión");
        }
      }, mergedConfig.timeout);

      setupEventHandlers(eventSource);

    } catch (error) {
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: "Error creando conexión SSE"
      }));
      onError?.(error as string);
    }
  }, [closeConnection, mergedConfig.timeout, onError, setupEventHandlers]);

  // Conectar cuando cambie la URL
  useEffect(() => {
    if (url && url !== urlRef.current) {
      connectToSSE(url);
    } else if (!url) {
      closeConnection();
    }

    // Cleanup al desmontar
    return closeConnection;
  }, [url, connectToSSE, closeConnection]);

  // Función manual para reconectar
  const reconnect = useCallback(() => {
    if (urlRef.current) {
      setState(prev => ({ ...prev, reconnectCount: 0 }));
      connectToSSE(urlRef.current);
    }
  }, [connectToSSE]);

  // Función manual para desconectar
  const disconnect = useCallback(() => {
    urlRef.current = null;
    closeConnection();
    onClose?.();
  }, [closeConnection, onClose]);

  return {
    ...state,
    connect: connectToSSE,
    disconnect,
    reconnect
  };
};

/**
 * Hook especializado para el procesamiento de evaluaciones
 */
export const useProcessingSSE = (
  jobId: string | null,
  baseUrl: string,
  onProgress?: (progress: { completed: number; total: number; results: unknown[] }) => void,
  onComplete?: (data: unknown) => void,
  onError?: (error: string) => void
) => {
  const sseUrl = jobId ? `${baseUrl}/stream/${jobId}` : null;

  return useSSE(
    sseUrl,
    {
      onBatchComplete: (data) => {
        const parsedData = data as { results?: unknown[]; progress?: { completed?: number; total?: number } };
        if (parsedData.results && parsedData.progress) {
          onProgress?.({
            completed: parsedData.progress.completed || 0,
            total: parsedData.progress.total || 0,
            results: parsedData.results
          });
        }
      },
      onComplete: (data) => {
        onComplete?.(data);
      },
      onError: (error) => {
        const errorMessage = typeof error === "string" 
          ? error 
          : "Error de conexión durante el procesamiento";
        onError?.(errorMessage);
      }
    },
    {
      maxReconnectAttempts: 3,
      reconnectInterval: 2000,
      timeout: 10000
    }
  );
};
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
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Use refs to avoid recreating callbacks and causing dependency cycles
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;
  
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
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      setState(prev => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        error: null,
        reconnectCount: 0 // Reset contador en conexión exitosa
      }));
      callbacksRef.current.onOpen?.();
    };

    // Event: mensaje genérico - aquí vienen los eventos batch_complete
    eventSource.onmessage = (event) => {
      console.log("🔥 SSE onmessage event received:", event);
      console.log("🔥 Raw event.data:", event.data);
      try {
        const data = JSON.parse(event.data);
        console.log("🔥 Parsed JSON data:", data);
        
        // Llamar onMessage genérico
        callbacksRef.current.onMessage?.(data, "message");
        
        // Si es un evento batch_complete, llamar el handler específico
        if (data.event === "batch_complete") {
          console.log("🔥 Detected batch_complete event, calling onBatchComplete with:", data);
          callbacksRef.current.onBatchComplete?.(data);
          console.log("🔥 onBatchComplete called");
        }
        
        // Si es un evento complete, llamar el handler específico y cerrar conexión
        if (data.event === "complete") {
          console.log("🔥 Detected complete event, calling onComplete with:", data);
          callbacksRef.current.onComplete?.(data);
          
          // Cerrar conexión al completar
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
          }
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
          }
          
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
          }
          
          setState(prev => ({
            ...prev,
            isConnected: false,
            isConnecting: false
          }));
        }
      } catch (error) {
        console.warn("Error parseando mensaje SSE:", error);
        callbacksRef.current.onError?.("Error parseando datos del servidor");
      }
    };


    // Event: error
    eventSource.onerror = (error) => {
      console.error("Error SSE:", error);
      
      setState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        error: "Error de conexión con el servidor"
      }));

      callbacksRef.current.onError?.(error);
      
      // Intentar reconectar solo si no es un cierre manual
      if (eventSource.readyState !== EventSource.CLOSED) {
        // Reconectar inline para evitar dependency cycle
        setState(prevState => {
          if (prevState.reconnectCount >= mergedConfig.maxReconnectAttempts!) {
            callbacksRef.current.onError?.("Máximo número de intentos de reconexión alcanzado");
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
        callbacksRef.current.onClose?.();
      }
    };
  }, [mergedConfig.maxReconnectAttempts, mergedConfig.reconnectInterval]);


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
          callbacksRef.current.onError?.("Timeout de conexión");
        }
      }, mergedConfig.timeout);

      setupEventHandlers(eventSource);

    } catch (error) {
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: "Error creando conexión SSE"
      }));
      callbacksRef.current.onError?.(error as string);
    }
  }, [closeConnection, mergedConfig.timeout, setupEventHandlers]);

  // Conectar cuando cambie la URL
  useEffect(() => {
    if (url && url !== urlRef.current) {
      connectToSSE(url);
    } else if (!url) {
      closeConnection();
    }

    // Cleanup al desmontar
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [url, connectToSSE]);

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
    callbacksRef.current.onClose?.();
  }, [closeConnection]);

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
        console.log('useProcessingSSE received data:', data);
        
        // Los datos vienen como { event: "batch_complete", data: { results: [...], progress: {...} } }
        // Necesitamos extraer data.data
        const eventData = data as { data?: { results?: unknown[]; progress?: { completed?: number; total?: number } } };
        const actualData = eventData.data;
        
        console.log('Extracted actualData:', actualData);
        
        if (actualData?.results && actualData.progress) {
          onProgress?.({
            completed: actualData.progress.completed || 0,
            total: actualData.progress.total || 0,
            results: actualData.results
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
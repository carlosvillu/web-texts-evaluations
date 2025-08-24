import { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { Play, Square, Clock, Activity, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { useSSE } from '@/hooks/useSSE';
import { startEvaluation } from '@/services/api';
import type { CSVRow, APIResponse, ProcessingState } from '@/types/app';

interface ProcessingControllerProps {
  data: CSVRow[];
  endpointUrl: string;
  processing: ProcessingState;
  onProcessingStateChange: (state: Partial<ProcessingState>) => void;
  onResultsUpdate: (results: APIResponse[]) => void;
  onComplete: () => void;
}

interface SSEData {
  results?: APIResponse[];
  progress?: {
    completed: number;
    total: number;
  };
  message?: string;
  error?: string;
}

export function ProcessingController({
  data,
  endpointUrl,
  processing,
  onProcessingStateChange,
  onResultsUpdate,
  onComplete,
}: ProcessingControllerProps) {
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'reconnecting'>('disconnected');
  const [lastActivityTime, setLastActivityTime] = useState<number>(Date.now());
  const [processingRate, setProcessingRate] = useState<number | null>(null);
  
  const sseUrl = processing.jobId ? `${endpointUrl}/stream/${processing.jobId}` : null;
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rateCalculationRef = useRef<{ times: number[], counts: number[] }>({ times: [], counts: [] });

  // Enhanced SSE message handler with rate calculation
  const handleSSEMessage = useCallback((data: unknown) => {
    const sseData = data as SSEData;
    const now = Date.now();
    setLastActivityTime(now);
    setConnectionStatus('connected');
    setError(null);
    
    if (sseData.results) {
      onResultsUpdate(sseData.results);
      
      // Calculate processing rate
      const newCount = sseData.progress?.completed || 0;
      const rateData = rateCalculationRef.current;
      rateData.times.push(now);
      rateData.counts.push(newCount);
      
      // Keep only last 5 measurements for rate calculation
      if (rateData.times.length > 5) {
        rateData.times.shift();
        rateData.counts.shift();
      }
      
      // Calculate rate if we have at least 2 measurements
      if (rateData.times.length >= 2 && startTime) {
        const timeSpan = (rateData.times[rateData.times.length - 1] - rateData.times[0]) / 1000;
        const itemsSpan = rateData.counts[rateData.counts.length - 1] - rateData.counts[0];
        if (timeSpan > 0 && itemsSpan > 0) {
          setProcessingRate(itemsSpan / timeSpan);
        }
      }
    }

    if (sseData.progress) {
      const percentage = Math.round((sseData.progress.completed / sseData.progress.total) * 100);
      const timeRemaining = calculateTimeRemaining(
        startTime,
        sseData.progress.completed,
        sseData.progress.total
      );

      onProcessingStateChange({
        progress: {
          completed: sseData.progress.completed,
          total: sseData.progress.total,
          percentage,
        },
        timeRemaining,
      });
    }
  }, [onResultsUpdate, onProcessingStateChange, startTime]);

  // Enhanced SSE error handler
  const handleSSEError = useCallback((error: Event | string) => {
    console.error('SSE Error:', error);
    setConnectionStatus('reconnecting');
    setError('Conexión perdida. Intentando reconectar...');
    
    // Don't stop processing immediately, let the SSE hook handle reconnection
    // Only stop if reconnection fails completely
  }, []);

  // Enhanced SSE complete handler
  const handleSSEComplete = useCallback(() => {
    setConnectionStatus('disconnected');
    setProcessingRate(null);
    rateCalculationRef.current = { times: [], counts: [] };
    
    onProcessingStateChange({
      isActive: false,
      timeRemaining: 0,
    });
    
    setError(null);
    onComplete();
  }, [onProcessingStateChange, onComplete]);

  // Enhanced SSE hook usage with connection status tracking
  const sseState = useSSE(sseUrl, {
    onBatchComplete: handleSSEMessage,
    onComplete: handleSSEComplete,
    onError: handleSSEError,
    onOpen: () => {
      setConnectionStatus('connected');
      setError(null);
    },
    onClose: () => {
      setConnectionStatus('disconnected');
    },
  });

  // Monitor connection status
  useEffect(() => {
    if (sseState.isConnecting && connectionStatus !== 'connecting') {
      setConnectionStatus('connecting');
    } else if (sseState.isConnected && connectionStatus !== 'connected') {
      setConnectionStatus('connected');
      setError(null);
    } else if (sseState.error && connectionStatus === 'connected') {
      setConnectionStatus('reconnecting');
      setError(sseState.error);
    }
  }, [sseState.isConnecting, sseState.isConnected, sseState.error, connectionStatus]);

  // Activity timeout monitoring
  useEffect(() => {
    if (processing.isActive && connectionStatus === 'connected') {
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
      
      // Set timeout for 30 seconds of inactivity
      activityTimeoutRef.current = setTimeout(() => {
        const timeSinceLastActivity = Date.now() - lastActivityTime;
        if (timeSinceLastActivity > 30000) { // 30 seconds
          setError('Sin actividad por 30+ segundos. Posible problema de conexión.');
        }
      }, 31000);
    }

    return () => {
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
    };
  }, [processing.isActive, connectionStatus, lastActivityTime]);

  const calculateTimeRemaining = (
    startTime: number | null,
    completed: number,
    total: number
  ): number | null => {
    if (!startTime || completed === 0) return null;

    const elapsed = Date.now() - startTime;
    const rate = completed / elapsed;
    const remaining = (total - completed) / rate;

    return Math.max(0, remaining);
  };

  const formatTimeRemaining = (ms: number | null): string => {
    if (!ms) return '-';

    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')} min`;
    }
    return `${remainingSeconds} seg`;
  };

  const getProcessingRate = (): string => {
    if (processingRate !== null) {
      return `${processingRate.toFixed(1)} items/seg`;
    }
    
    if (!startTime || processing.progress.completed === 0) return '-';

    const elapsed = (Date.now() - startTime) / 1000;
    const rate = processing.progress.completed / elapsed;

    return `${rate.toFixed(1)} items/seg`;
  };

  const handleStartProcessing = async () => {
    if (!endpointUrl || data.length === 0) return;

    try {
      // Reset all state for new processing
      setError(null);
      setStartTime(Date.now());
      setLastActivityTime(Date.now());
      setProcessingRate(null);
      setConnectionStatus('connecting');
      rateCalculationRef.current = { times: [], counts: [] };
      
      onProcessingStateChange({
        isActive: true,
        progress: { completed: 0, total: data.length, percentage: 0 },
        timeRemaining: null,
      });

      const response = await startEvaluation(endpointUrl, data);
      
      onProcessingStateChange({
        jobId: response.job_id,
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(`Error al iniciar procesamiento: ${errorMessage}`);
      setConnectionStatus('disconnected');
      
      onProcessingStateChange({
        isActive: false,
        jobId: null,
      });
    }
  };

  const handleStopProcessing = () => {
    // Reset all processing state
    setConnectionStatus('disconnected');
    setProcessingRate(null);
    setStartTime(null);
    setError(null);
    setLastActivityTime(Date.now());
    rateCalculationRef.current = { times: [], counts: [] };
    
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }
    
    onProcessingStateChange({
      isActive: false,
      jobId: null,
      progress: { completed: 0, total: 0, percentage: 0 },
      timeRemaining: null,
    });
  };

  const canStart = !processing.isActive && data.length > 0 && endpointUrl.trim() !== '';
  const canStop = processing.isActive && processing.jobId;

  const getStatusBadge = () => {
    if (processing.isActive) {
      const connectionIcon = connectionStatus === 'connected' ? 
        <Wifi className="h-3 w-3" /> : 
        connectionStatus === 'connecting' || connectionStatus === 'reconnecting' ? 
        <Activity className="h-3 w-3 animate-spin" /> :
        <WifiOff className="h-3 w-3" />;
        
      const variant = connectionStatus === 'connected' ? "default" : "secondary";
      const statusText = connectionStatus === 'connected' ? "Procesando" :
                        connectionStatus === 'connecting' ? "Conectando..." :
                        connectionStatus === 'reconnecting' ? "Reconectando..." :
                        "Sin conexión";
      
      return <Badge variant={variant} className="flex items-center gap-1">
        {connectionIcon}
        {statusText}
      </Badge>;
    }
    
    if (processing.progress.percentage === 100) {
      return <Badge variant="outline" className="text-green-600">
        ✅ Completado
      </Badge>;
    }
    
    return <Badge variant="outline">Inactivo</Badge>;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Control de Procesamiento
          </div>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <div>
              <p className="font-medium">Error de procesamiento</p>
              <p className="text-sm">{error}</p>
            </div>
          </Alert>
        )}

        {/* Progress Section */}
        {(processing.isActive || processing.progress.percentage > 0) && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Progreso: {processing.progress.completed} / {processing.progress.total}</span>
              <span className="font-mono">{processing.progress.percentage}%</span>
            </div>
            
            <Progress value={processing.progress.percentage} className="w-full" />
            
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Tiempo restante: {formatTimeRemaining(processing.timeRemaining)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Activity className="h-4 w-4" />
                <span>Velocidad: {getProcessingRate()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={handleStartProcessing}
            disabled={!canStart}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            {processing.isActive ? 'Procesando...' : 'Iniciar Procesamiento'}
          </Button>

          {canStop && (
            <Button
              onClick={handleStopProcessing}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Square className="h-4 w-4" />
              Detener
            </Button>
          )}

          {/* Manual reconnect button when connection is lost */}
          {processing.isActive && (connectionStatus === 'reconnecting' || error) && (
            <Button
              onClick={() => sseState.reconnect?.()}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <Wifi className="h-3 w-3" />
              Reconectar
            </Button>
          )}
        </div>

        {/* Status Information */}
        <div className="bg-gray-50 p-3 rounded-md text-sm space-y-1">
          <div className="flex justify-between">
            <span>Estado:</span>
            <span className={processing.isActive ? 'text-blue-600' : 'text-gray-600'}>
              {processing.isActive ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          
          {processing.isActive && (
            <div className="flex justify-between">
              <span>Conexión:</span>
              <span className={
                connectionStatus === 'connected' ? 'text-green-600' :
                connectionStatus === 'connecting' ? 'text-blue-600' :
                connectionStatus === 'reconnecting' ? 'text-yellow-600' :
                'text-red-600'
              }>
                {connectionStatus === 'connected' ? '🟢 Conectado' :
                 connectionStatus === 'connecting' ? '🔵 Conectando...' :
                 connectionStatus === 'reconnecting' ? '🟡 Reconectando...' :
                 '🔴 Desconectado'}
              </span>
            </div>
          )}
          
          {processing.jobId && (
            <div className="flex justify-between">
              <span>Job ID:</span>
              <span className="font-mono text-xs">{processing.jobId}</span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span>Datos cargados:</span>
            <span>{data.length} filas</span>
          </div>
          
          <div className="flex justify-between">
            <span>Endpoint:</span>
            <span className="text-xs truncate max-w-48" title={endpointUrl}>
              {endpointUrl || 'No configurado'}
            </span>
          </div>

          {/* SSE Debug Info */}
          {processing.isActive && sseState.reconnectCount > 0 && (
            <div className="flex justify-between">
              <span>Reconexiones:</span>
              <span className="text-yellow-600">{sseState.reconnectCount}</span>
            </div>
          )}
        </div>

        {!canStart && !processing.isActive && (
          <div className="text-sm text-gray-500">
            {data.length === 0 && '⚠️ Carga datos CSV para comenzar'}
            {!endpointUrl.trim() && '⚠️ Configura el endpoint URL'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
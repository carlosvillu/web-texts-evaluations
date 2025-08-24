/**
 * Utilidades de formateo para números, fechas y métricas
 */

/**
 * Formatea números con decimales específicos
 */
export const formatNumber = (num: number | null, decimals: number = 2): string => {
  if (num === null || num === undefined) return "-";
  return num.toFixed(decimals);
};

/**
 * Formatea porcentajes
 */
export const formatPercentage = (value: number | null, decimals: number = 1): string => {
  if (value === null || value === undefined) return "-";
  return `${(value * 100).toFixed(decimals)}%`;
};

/**
 * Formatea métricas ICC con interpretación
 */
export const formatICC = (icc: number | null): { value: string; interpretation: string; color: string } => {
  if (icc === null) {
    return { 
      value: "-", 
      interpretation: "No calculado", 
      color: "text-gray-500" 
    };
  }

  let interpretation: string;
  let color: string;

  if (icc < 0.5) {
    interpretation = "Pobre";
    color = "text-red-600";
  } else if (icc < 0.75) {
    interpretation = "Moderado";
    color = "text-amber-600";
  } else if (icc < 0.9) {
    interpretation = "Bueno";
    color = "text-blue-600";
  } else {
    interpretation = "Excelente";
    color = "text-green-600";
  }

  return {
    value: formatNumber(icc, 3),
    interpretation,
    color
  };
};

/**
 * Formatea tiempo en segundos a formato legible
 */
export const formatDuration = (seconds: number | null): string => {
  if (seconds === null || seconds === undefined) return "-";
  
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  }
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

/**
 * Formatea velocidad de procesamiento
 */
export const formatProcessingRate = (itemsPerSecond: number | null): string => {
  if (itemsPerSecond === null || itemsPerSecond === undefined) return "-";
  return `${formatNumber(itemsPerSecond, 1)} items/s`;
};

/**
 * Formatea timestamp a fecha legible
 */
export const formatTimestamp = (timestamp: number | Date): string => {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return date.toLocaleString("es-ES", {
    year: "numeric",
    month: "2-digit", 
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
};

/**
 * Formatea tamaño de archivo en bytes a formato legible
 */
export const formatFileSize = (bytes: number): string => {
  const sizes = ["Bytes", "KB", "MB", "GB"];
  if (bytes === 0) return "0 Bytes";
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const formattedSize = (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1);
  
  return `${formattedSize} ${sizes[i]}`;
};

/**
 * Formatea contador de items (ej: "150 de 3000")
 */
export const formatItemCount = (completed: number, total: number): string => {
  return `${completed.toLocaleString()} de ${total.toLocaleString()}`;
};

/**
 * Formatea desviación con signo
 */
export const formatDeviation = (deviation: number | null, showSign: boolean = true): string => {
  if (deviation === null || deviation === undefined) return "-";
  
  const formatted = formatNumber(Math.abs(deviation), 2);
  if (!showSign || deviation === 0) return formatted;
  
  const sign = deviation > 0 ? "+" : "-";
  return `${sign}${formatted}`;
};
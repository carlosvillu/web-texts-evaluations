/**
 * Utilidades de validación para URLs, CSV y datos de entrada
 */

import { CSVRow } from "@/types/app";

/**
 * Valida si una URL es válida
 */
export const isValidUrl = (url: string): boolean => {
  if (!url || url.trim() === "") return false;
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Alias para compatibilidad
 */
export const validateUrl = isValidUrl;

/**
 * Valida si una URL es un endpoint HTTP válido
 */
export const isValidHttpEndpoint = (url: string): boolean => {
  if (!isValidUrl(url)) return false;
  
  const urlObj = new URL(url);
  return urlObj.protocol === "http:" || urlObj.protocol === "https:";
};

/**
 * Valida separador CSV
 */
export const isValidCsvSeparator = (separator: string): boolean => {
  const validSeparators = [",", ";", "|", "\t"];
  return validSeparators.includes(separator);
};

/**
 * Valida que una fila CSV tiene las columnas requeridas
 */
export const validateCSVRow = (row: Record<string, unknown>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Campos requeridos
  const requiredFields = ["id_participante", "respuesta", "curso", "pregunta", "evaluacion_1"];
  
  for (const field of requiredFields) {
    if (!row[field] || String(row[field]).trim() === "") {
      errors.push(`Campo requerido faltante: ${field}`);
    }
  }
  
  // Validar evaluacion_1 es número
  if (row.evaluacion_1 !== undefined && row.evaluacion_1 !== null && row.evaluacion_1 !== "") {
    const eval1 = parseFloat(String(row.evaluacion_1));
    if (isNaN(eval1) || eval1 < 0 || eval1 > 10) {
      errors.push("evaluacion_1 debe ser un número entre 0 y 10");
    }
  }
  
  // Validar evaluacion_2 si existe
  if (row.evaluacion_2 !== undefined && row.evaluacion_2 !== null && row.evaluacion_2 !== "") {
    const eval2 = parseFloat(String(row.evaluacion_2));
    if (isNaN(eval2) || eval2 < 0 || eval2 > 10) {
      errors.push("evaluacion_2 debe ser un número entre 0 y 10");
    }
  }
  
  // Validar evaluacion_3 si existe
  if (row.evaluacion_3 !== undefined && row.evaluacion_3 !== null && row.evaluacion_3 !== "") {
    const eval3 = parseFloat(String(row.evaluacion_3));
    if (isNaN(eval3) || eval3 < 0 || eval3 > 10) {
      errors.push("evaluacion_3 debe ser un número entre 0 y 10");
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Valida estructura completa del CSV
 */
export const validateCSVData = (data: Record<string, unknown>[]): { 
  isValid: boolean; 
  errors: string[]; 
  validRows: CSVRow[]; 
  invalidRows: number[] 
} => {
  const errors: string[] = [];
  const validRows: CSVRow[] = [];
  const invalidRows: number[] = [];
  
  if (!data || data.length === 0) {
    errors.push("El archivo CSV está vacío");
    return { isValid: false, errors, validRows, invalidRows };
  }
  
  // Verificar que tenemos las columnas requeridas en el primer elemento
  const firstRow = data[0];
  const requiredColumns = ["id_participante", "respuesta", "curso", "pregunta", "evaluacion_1"];
  const missingColumns = requiredColumns.filter(col => !(col in firstRow));
  
  if (missingColumns.length > 0) {
    errors.push(`Columnas requeridas faltantes: ${missingColumns.join(", ")}`);
    return { isValid: false, errors, validRows, invalidRows };
  }
  
  // Validar cada fila
  for (let i = 0; i < data.length; i++) {
    const rowValidation = validateCSVRow(data[i]);
    
    if (rowValidation.isValid) {
      // Convertir la fila al tipo CSVRow
      const csvRow: CSVRow = {
        id_participante: String(data[i].id_participante),
        respuesta: String(data[i].respuesta),
        curso: String(data[i].curso),
        pregunta: String(data[i].pregunta),
        evaluacion_1: parseFloat(String(data[i].evaluacion_1)),
        evaluacion_2: data[i].evaluacion_2 ? parseFloat(String(data[i].evaluacion_2)) : undefined,
        evaluacion_3: data[i].evaluacion_3 ? parseFloat(String(data[i].evaluacion_3)) : undefined,
      };
      validRows.push(csvRow);
    } else {
      invalidRows.push(i + 1); // +1 para mostrar número de fila humano-legible
      errors.push(`Fila ${i + 1}: ${rowValidation.errors.join(", ")}`);
    }
  }
  
  // Si tenemos más de 50% de filas inválidas, consideramos el CSV inválido
  const invalidPercentage = invalidRows.length / data.length;
  if (invalidPercentage > 0.5) {
    errors.unshift(`Demasiadas filas inválidas (${Math.round(invalidPercentage * 100)}%). Verifica el formato del CSV.`);
    return { isValid: false, errors, validRows, invalidRows };
  }
  
  return {
    isValid: validRows.length > 0,
    errors,
    validRows,
    invalidRows
  };
};

/**
 * Valida tamaño de archivo
 */
export const validateFileSize = (file: File, maxSizeMB: number = 50): { isValid: boolean; error?: string } => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      error: `El archivo es demasiado grande. Máximo permitido: ${maxSizeMB}MB`
    };
  }
  
  return { isValid: true };
};

/**
 * Valida tipo de archivo
 */
export const validateFileType = (file: File, allowedTypes: string[] = [".csv", "text/csv", "application/csv"]): { 
  isValid: boolean; 
  error?: string 
} => {
  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();
  
  const isValidExtension = allowedTypes.some(type => 
    type.startsWith(".") ? fileName.endsWith(type) : fileType === type
  );
  
  if (!isValidExtension) {
    return {
      isValid: false,
      error: `Tipo de archivo no válido. Solo se permiten archivos CSV.`
    };
  }
  
  return { isValid: true };
};

/**
 * Valida configuración de la aplicación
 */
export const validateAppConfig = (endpoint: string, separator: string): { 
  isValid: boolean; 
  errors: string[] 
} => {
  const errors: string[] = [];
  
  if (!isValidHttpEndpoint(endpoint)) {
    errors.push("URL del endpoint no es válida");
  }
  
  if (!isValidCsvSeparator(separator)) {
    errors.push("Separador CSV no es válido");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Valida rango de valores numéricos
 */
export const isInRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};

/**
 * Valida que un valor sea un número válido
 */
export const isValidNumber = (value: unknown): boolean => {
  const num = Number(value);
  return !isNaN(num) && isFinite(num);
};
/**
 * Servicio para parsing de CSV con Papaparse y validación de datos
 */

import Papa, { ParseResult, ParseConfig } from 'papaparse';
import { CSVRow } from '@/types/app';
import { validateCSVData, validateFileSize, validateFileType } from '@/utils/validators';

export interface CSVParseOptions {
  separator?: string;
  skipEmptyLines?: boolean;
  trimHeaders?: boolean;
  transformHeader?: (header: string) => string;
  maxRows?: number;
}

export interface CSVParseResult {
  success: boolean;
  data: CSVRow[];
  errors: string[];
  warnings: string[];
  metadata: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    columns: string[];
    fileSize: number;
    fileName: string;
    processingTime: number;
  };
}

/**
 * Configuración por defecto para parsing
 */
const DEFAULT_PARSE_OPTIONS: Required<CSVParseOptions> = {
  separator: ';',
  skipEmptyLines: true,
  trimHeaders: true,
  transformHeader: (header: string) => header.trim().toLowerCase(),
  maxRows: 5000 // Límite de seguridad
};

/**
 * Parser principal de CSV
 */
export class CSVParser {
  private options: Required<CSVParseOptions>;

  constructor(options: CSVParseOptions = {}) {
    this.options = { ...DEFAULT_PARSE_OPTIONS, ...options };
  }

  /**
   * Actualizar opciones del parser
   */
  updateOptions(newOptions: Partial<CSVParseOptions>) {
    this.options = { ...this.options, ...newOptions };
  }

  /**
   * Parsear archivo CSV
   */
  async parseFile(file: File): Promise<CSVParseResult> {
    const startTime = Date.now();
    const result: CSVParseResult = {
      success: false,
      data: [],
      errors: [],
      warnings: [],
      metadata: {
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        columns: [],
        fileSize: file.size,
        fileName: file.name,
        processingTime: 0
      }
    };

    try {
      // Validar archivo
      const fileValidation = this.validateFile(file);
      if (!fileValidation.success) {
        result.errors.push(...fileValidation.errors);
        return result;
      }

      // Parsear con Papaparse
      const parseResult = await this.parseWithPapa(file);
      
      if (parseResult.errors.length > 0) {
        result.errors.push(...parseResult.errors.map(error => 
          `Línea ${error.row}: ${error.message}`
        ));
      }

      // Validar estructura de datos
      const validation = validateCSVData(parseResult.data as Record<string, unknown>[]);
      
      result.data = validation.validRows;
      result.errors.push(...validation.errors);
      result.success = validation.isValid;

      // Metadatos
      result.metadata.totalRows = parseResult.data.length;
      result.metadata.validRows = validation.validRows.length;
      result.metadata.invalidRows = validation.invalidRows.length;
      result.metadata.columns = parseResult.data.length > 0 
        ? Object.keys(parseResult.data[0] as Record<string, unknown>) 
        : [];
      result.metadata.processingTime = Date.now() - startTime;

      // Advertencias
      if (result.metadata.invalidRows > 0) {
        result.warnings.push(
          `${result.metadata.invalidRows} filas fueron ignoradas por errores de formato`
        );
      }

      if (result.metadata.totalRows > this.options.maxRows) {
        result.warnings.push(
          `El archivo excede el límite de ${this.options.maxRows} filas. Solo se procesarán las primeras.`
        );
        result.data = result.data.slice(0, this.options.maxRows);
      }

    } catch (error) {
      result.errors.push(
        `Error parseando CSV: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
      result.metadata.processingTime = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Parsear texto CSV directamente
   */
  async parseText(csvText: string): Promise<CSVParseResult> {
    const startTime = Date.now();
    const result: CSVParseResult = {
      success: false,
      data: [],
      errors: [],
      warnings: [],
      metadata: {
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        columns: [],
        fileSize: new Blob([csvText]).size,
        fileName: 'texto-csv',
        processingTime: 0
      }
    };

    try {
      const parseResult = this.parseTextWithPapa(csvText);
      
      if (parseResult.errors.length > 0) {
        result.errors.push(...parseResult.errors.map(error => 
          `Línea ${error.row}: ${error.message}`
        ));
      }

      const validation = validateCSVData(parseResult.data as Record<string, unknown>[]);
      
      result.data = validation.validRows;
      result.errors.push(...validation.errors);
      result.success = validation.isValid;

      // Metadatos
      result.metadata.totalRows = parseResult.data.length;
      result.metadata.validRows = validation.validRows.length;
      result.metadata.invalidRows = validation.invalidRows.length;
      result.metadata.columns = parseResult.data.length > 0 
        ? Object.keys(parseResult.data[0] as Record<string, unknown>) 
        : [];
      result.metadata.processingTime = Date.now() - startTime;

    } catch (error) {
      result.errors.push(
        `Error parseando texto CSV: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    }

    return result;
  }

  /**
   * Obtener preview de las primeras filas
   */
  async getPreview(file: File, maxRows: number = 5): Promise<{
    success: boolean;
    preview: unknown[];
    columns: string[];
    error?: string;
  }> {
    try {
      const previewText = await this.readFilePreview(file, 1024 * 10); // 10KB preview
      
      const parseResult = Papa.parse(previewText, {
        delimiter: this.options.separator,
        header: true,
        skipEmptyLines: this.options.skipEmptyLines,
        transformHeader: this.options.transformHeader,
        preview: maxRows
      });

      return {
        success: true,
        preview: parseResult.data,
        columns: parseResult.meta.fields || []
      };
    } catch (error) {
      return {
        success: false,
        preview: [],
        columns: [],
        error: error instanceof Error ? error.message : 'Error generando preview'
      };
    }
  }

  /**
   * Validar archivo antes del parsing
   */
  private validateFile(file: File): { success: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validar tipo
    const typeValidation = validateFileType(file);
    if (!typeValidation.isValid) {
      errors.push(typeValidation.error!);
    }

    // Validar tamaño
    const sizeValidation = validateFileSize(file);
    if (!sizeValidation.isValid) {
      errors.push(sizeValidation.error!);
    }

    return {
      success: errors.length === 0,
      errors
    };
  }

  /**
   * Parsing con Papaparse para archivos
   */
  private parseWithPapa(file: File): Promise<ParseResult<unknown>> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        delimiter: this.options.separator,
        header: true,
        skipEmptyLines: this.options.skipEmptyLines,
        transformHeader: this.options.transformHeader,
        dynamicTyping: true, // Convertir números automáticamente
        complete: (results) => resolve(results),
        error: (error) => reject(new Error(error.message))
      });
    });
  }

  /**
   * Parsing con Papaparse para texto
   */
  private parseTextWithPapa(text: string): ParseResult<unknown> {
    return Papa.parse(text, {
      delimiter: this.options.separator,
      header: true,
      skipEmptyLines: this.options.skipEmptyLines,
      transformHeader: this.options.transformHeader,
      dynamicTyping: true
    });
  }

  /**
   * Leer preview del archivo
   */
  private readFilePreview(file: File, maxBytes: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      
      reader.onerror = () => {
        reject(new Error('Error leyendo archivo'));
      };

      // Leer solo los primeros bytes para el preview
      const blob = file.slice(0, maxBytes);
      reader.readAsText(blob, 'UTF-8');
    });
  }
}

/**
 * Instancia global del parser
 */
let parserInstance: CSVParser | null = null;

/**
 * Obtener instancia global del parser
 */
export const getCSVParser = (options?: CSVParseOptions): CSVParser => {
  if (!parserInstance || options) {
    parserInstance = new CSVParser(options);
  }
  return parserInstance;
};

/**
 * Funciones de conveniencia
 */

export const parseCSVFile = async (file: File, options?: CSVParseOptions): Promise<CSVParseResult> => {
  const parser = getCSVParser(options);
  return await parser.parseFile(file);
};

export const parseCSVText = async (text: string, options?: CSVParseOptions): Promise<CSVParseResult> => {
  const parser = getCSVParser(options);
  return await parser.parseText(text);
};

export const getCSVPreview = async (file: File, maxRows: number = 5, options?: CSVParseOptions) => {
  const parser = getCSVParser(options);
  return await parser.getPreview(file, maxRows);
};

/**
 * Utilidad para exportar datos a CSV
 */
export const exportToCSV = (data: unknown[], filename: string = 'export.csv', separator: string = ';'): void => {
  if (data.length === 0) {
    throw new Error('No hay datos para exportar');
  }

  const csv = Papa.unparse(data, {
    delimiter: separator,
    header: true
  });

  // Crear y descargar archivo
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
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
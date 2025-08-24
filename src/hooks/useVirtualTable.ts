/**
 * Hook para configuración de tabla virtual optimizada para grandes datasets
 * Utiliza @tanstack/react-virtual para renderizado eficiente
 */

import { useRef, useMemo, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { VirtualizerOptions } from "@tanstack/react-virtual";

export interface VirtualTableConfig {
  estimateSize?: number;
  overscan?: number;
  scrollPaddingStart?: number;
  scrollPaddingEnd?: number;
  enableSmoothScroll?: boolean;
}

export interface VirtualTableColumn {
  id: string;
  header: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  accessor?: string;
  formatter?: (value: unknown) => string | React.ReactNode;
  sortable?: boolean;
}

const DEFAULT_CONFIG: Required<VirtualTableConfig> = {
  estimateSize: 35, // Altura estimada por fila en px
  overscan: 10, // Filas extra a renderizar fuera del viewport
  scrollPaddingStart: 0,
  scrollPaddingEnd: 0,
  enableSmoothScroll: true
};

/**
 * Hook principal para tabla virtual
 */
export const useVirtualTable = <T extends Record<string, unknown>>(
  data: T[],
  config: VirtualTableConfig = {}
) => {
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  // Configuración del virtualizador
  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: () => mergedConfig.estimateSize,
    overscan: mergedConfig.overscan,
  });

  // Items virtuales a renderizar
  const virtualItems = virtualizer.getVirtualItems();

  // Funciones de navegación
  const scrollToIndex = useCallback((index: number, align?: "start" | "center" | "end" | "auto") => {
    virtualizer.scrollToIndex(index, { align });
  }, [virtualizer]);

  const scrollToTop = useCallback(() => {
    virtualizer.scrollToIndex(0, { align: "start" });
  }, [virtualizer]);

  const scrollToBottom = useCallback(() => {
    virtualizer.scrollToIndex(data.length - 1, { align: "end" });
  }, [virtualizer, data.length]);

  // Información de estado
  const scrollState = useMemo(() => {
    const range = virtualizer.getVirtualItems();
    return {
      startIndex: range[0]?.index ?? 0,
      endIndex: range[range.length - 1]?.index ?? 0,
      totalItems: data.length,
      visibleItems: range.length,
      isScrolling: false // TODO: implementar detección de scroll
    };
  }, [data.length, virtualizer]);

  return {
    // Referencias
    scrollElementRef,
    virtualizer,
    
    // Items virtuales
    virtualItems,
    
    // Funciones de navegación
    scrollToIndex,
    scrollToTop,
    scrollToBottom,
    
    // Estado
    scrollState,
    
    // Propiedades calculadas
    totalSize: virtualizer.getTotalSize(),
    
    // Configuración
    config: mergedConfig
  };
};

/**
 * Hook para manejo de columnas de tabla con configuración responsive
 */
export const useTableColumns = <T extends Record<string, unknown>>(
  columns: VirtualTableColumn[],
  containerWidth?: number
) => {
  const processedColumns = useMemo(() => {
    if (!containerWidth) return columns;

    let remainingWidth = containerWidth;
    const fixedColumns: VirtualTableColumn[] = [];
    const flexColumns: VirtualTableColumn[] = [];

    // Separar columnas con ancho fijo vs flexible
    columns.forEach(col => {
      if (col.width) {
        fixedColumns.push({ ...col });
        remainingWidth -= col.width;
      } else {
        flexColumns.push({ ...col });
      }
    });

    // Distribuir ancho restante entre columnas flexibles
    const flexWidth = Math.max(150, remainingWidth / flexColumns.length);
    const processedFlexColumns = flexColumns.map(col => ({
      ...col,
      width: Math.min(col.maxWidth || flexWidth * 2, Math.max(col.minWidth || 100, flexWidth))
    }));

    return [...fixedColumns, ...processedFlexColumns];
  }, [columns, containerWidth]);

  // Funciones de utilidad para columnas
  const getColumnWidth = useCallback((columnId: string) => {
    const column = processedColumns.find(col => col.id === columnId);
    return column?.width || 150;
  }, [processedColumns]);

  const getTotalWidth = useCallback(() => {
    return processedColumns.reduce((total, col) => total + (col.width || 150), 0);
  }, [processedColumns]);

  return {
    columns: processedColumns,
    getColumnWidth,
    getTotalWidth
  };
};

/**
 * Hook especializado para tabla de datos CSV
 */
export const useCSVTable = <T extends Record<string, unknown>>(
  data: T[],
  config: VirtualTableConfig = {}
) => {
  // Configuración optimizada para CSV
  const csvConfig: VirtualTableConfig = {
    estimateSize: 32, // Filas más compactas para CSV
    overscan: 15, // Más overscan para scroll suave
    enableSmoothScroll: false, // Desactivar para mejor performance
    ...config
  };

  const tableHook = useVirtualTable(data, csvConfig);

  // Funciones específicas para CSV
  const findRowByValue = useCallback((value: string, columnKey?: string) => {
    const index = data.findIndex(row => {
      if (columnKey) {
        return String(row[columnKey]).includes(value);
      }
      return Object.values(row).some(val => String(val).includes(value));
    });
    
    if (index >= 0) {
      tableHook.scrollToIndex(index, "center");
      return index;
    }
    return -1;
  }, [data, tableHook]);

  const getRowData = useCallback((index: number) => {
    return data[index] || null;
  }, [data]);

  const getSelectedRows = useCallback((selectedIndices: number[]) => {
    return selectedIndices.map(index => data[index]).filter(Boolean);
  }, [data]);

  return {
    ...tableHook,
    findRowByValue,
    getRowData,
    getSelectedRows,
    
    // Estadísticas específicas de CSV
    stats: {
      totalRows: data.length,
      isEmpty: data.length === 0,
      columns: data.length > 0 ? Object.keys(data[0]) : []
    }
  };
};

/**
 * Hook para tabla de resultados con métricas en tiempo real
 */
export const useResultsTable = <T extends Record<string, unknown>>(
  originalData: T[],
  results: unknown[],
  config: VirtualTableConfig = {}
) => {
  // Combinar datos originales con resultados
  const combinedData = useMemo(() => {
    return originalData.map((original) => {
      const result = results.find(r => 
        typeof r === 'object' && 
        r !== null && 
        'id_alumno' in r && 
        (r as { id_alumno: string }).id_alumno === (original as Record<string, unknown>).id_participante
      );
      return result ? { ...original, ...result } : original;
    });
  }, [originalData, results]);

  const tableHook = useCSVTable(combinedData, config);

  // Estadísticas de progreso
  const progressStats = useMemo(() => {
    const processed = results.length;
    const total = originalData.length;
    const percentage = total > 0 ? (processed / total) * 100 : 0;

    return {
      processed,
      total,
      remaining: total - processed,
      percentage,
      isComplete: processed >= total
    };
  }, [originalData.length, results.length]);

  return {
    ...tableHook,
    data: combinedData,
    progressStats
  };
};
/**
 * Hook para manejo de localStorage con serialización automática
 */

import { useState, useCallback } from "react";

type SetValue<T> = T | ((prevValue: T) => T);

/**
 * Hook personalizado para manejo de localStorage
 * 
 * @param key - Clave del localStorage
 * @param initialValue - Valor inicial si no existe en localStorage
 * @returns [valor, setter] - Tupla con el valor actual y función para actualizarlo
 */
export const useLocalStorage = <T>(
  key: string, 
  initialValue: T
): [T, (value: SetValue<T>) => void] => {
  
  // Estado interno que se sincroniza con localStorage
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      // SSR safety - retornar valor inicial en servidor
      return initialValue;
    }
    
    try {
      const item = window.localStorage.getItem(key);
      
      // Si no existe el item, retornar valor inicial
      if (item === null) {
        return initialValue;
      }
      
      // Intentar parsear el valor almacenado
      return JSON.parse(item);
    } catch (error) {
      console.warn(`Error leyendo localStorage key "${key}":`, error);
      return initialValue;
    }
  });
  
  // Función para actualizar el valor en estado y localStorage
  const setValue = useCallback((value: SetValue<T>) => {
    try {
      // Calcular el nuevo valor (manejar tanto valores como funciones)
      const valueToStore = value instanceof Function 
        ? (value as (prevValue: T) => T)(storedValue)
        : value;
      
      // Actualizar estado local
      setStoredValue(valueToStore);
      
      // Sincronizar con localStorage si estamos en el cliente
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error escribiendo localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);
  
  return [storedValue, setValue];
};

/**
 * Hook especializado para configuración de la aplicación
 * Maneja las configuraciones principales de forma tipada
 */
export const useAppConfig = () => {
  const [endpoint, setEndpoint] = useLocalStorage<string>("endpoint", "");
  const [separator, setSeparator] = useLocalStorage<string>("separator", ";");
  
  return {
    endpoint,
    separator,
    setEndpoint,
    setSeparator,
    // Setter combinado para actualizar toda la config de una vez
    setConfig: useCallback((config: { endpoint?: string; separator?: string }) => {
      if (config.endpoint !== undefined) setEndpoint(config.endpoint);
      if (config.separator !== undefined) setSeparator(config.separator);
    }, [setEndpoint, setSeparator])
  };
};

/**
 * Hook para manejar preferencias de UI
 */
export const useUIPreferences = () => {
  const [theme, setTheme] = useLocalStorage<"light" | "dark">("theme", "light");
  const [tableRowsPerPage, setTableRowsPerPage] = useLocalStorage<number>("tableRowsPerPage", 50);
  const [autoRefreshMetrics, setAutoRefreshMetrics] = useLocalStorage<boolean>("autoRefreshMetrics", true);
  
  return {
    theme,
    setTheme,
    tableRowsPerPage,
    setTableRowsPerPage, 
    autoRefreshMetrics,
    setAutoRefreshMetrics
  };
};

/**
 * Utility para limpiar localStorage específico de la aplicación
 */
export const clearAppStorage = (keys?: string[]) => {
  if (typeof window === "undefined") return;
  
  const defaultKeys = ["endpoint", "separator", "theme", "tableRowsPerPage", "autoRefreshMetrics"];
  const keysToRemove = keys || defaultKeys;
  
  keysToRemove.forEach(key => {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Error removiendo localStorage key "${key}":`, error);
    }
  });
};

/**
 * Utility para obtener información sobre el uso de localStorage
 */
export const getStorageInfo = () => {
  if (typeof window === "undefined") return null;
  
  try {
    const used = new Blob(Object.values(localStorage)).size;
    const quota = 5 * 1024 * 1024; // 5MB aproximado para localStorage
    
    return {
      used,
      quota,
      remaining: quota - used,
      usagePercentage: (used / quota) * 100
    };
  } catch (error) {
    console.warn("Error calculando uso de localStorage:", error);
    return null;
  }
};
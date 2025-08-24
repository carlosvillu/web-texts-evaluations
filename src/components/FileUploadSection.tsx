import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { parseCSVFile } from '@/services/csvParser';
import type { CSVRow } from '@/types/app';

interface FileUploadSectionProps {
  separator: string;
  onDataLoaded: (data: CSVRow[]) => void;
  isLoading?: boolean;
}

interface ParseResult {
  data: CSVRow[];
  preview: CSVRow[];
  totalRows: number;
  validColumns: string[];
  missingColumns: string[];
  warnings?: string[];
  errors?: string[];
}

export function FileUploadSection({ separator, onDataLoaded, isLoading = false }: FileUploadSectionProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const requiredColumns = ['id_participante', 'respuesta', 'curso', 'pregunta', 'evaluacion_1'];
  const _optionalColumns = ['evaluacion_2', 'evaluacion_3'];

  const processFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    setError(null);
    setParseResult(null);
    setFileName(file.name);

    try {
      const result = await parseCSVFile(file, { separator });
      
      if (!result.success) {
        throw new Error(result.errors.join(', '));
      }

      if (result.data.length === 0) {
        throw new Error('El archivo CSV está vacío o no contiene datos válidos');
      }

      // Use validated data from parser
      const validatedData: CSVRow[] = result.data;
      const preview = validatedData.slice(0, 5);
      const validColumns = result.metadata.columns;

      const parseResult: ParseResult = {
        data: validatedData,
        preview,
        totalRows: result.metadata.totalRows,
        validColumns,
        missingColumns: [],
        warnings: result.warnings,
        errors: result.errors,
      };

      setParseResult(parseResult);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al procesar el archivo';
      setError(errorMessage);
      setParseResult(null);
    } finally {
      setIsProcessing(false);
    }
  }, [separator]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      processFile(file);
    } else {
      setError('Por favor selecciona un archivo CSV válido');
    }
  };

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);

    const file = event.dataTransfer.files[0];
    if (file && file.type === 'text/csv') {
      processFile(file);
    } else {
      setError('Por favor arrastra un archivo CSV válido');
    }
  }, [processFile]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleLoadData = () => {
    if (parseResult) {
      onDataLoaded(parseResult.data);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          📁 Cargar Archivo CSV
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drag & Drop Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragOver
              ? 'border-blue-500 bg-blue-50'
              : isProcessing
              ? 'border-gray-300 bg-gray-50'
              : 'border-gray-300 hover:border-gray-400'
          } ${isProcessing ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="space-y-4">
            <Upload className={`mx-auto h-12 w-12 ${isProcessing ? 'text-gray-400' : 'text-gray-500'}`} />
            <div>
              <p className="text-lg font-medium">
                {isProcessing 
                  ? 'Procesando archivo...' 
                  : 'Arrastra tu archivo CSV aquí'
                }
              </p>
              <p className="text-sm text-gray-500">
                o haz clic para buscar
              </p>
            </div>
            
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              disabled={isProcessing || isLoading}
              className="hidden"
              id="csv-upload"
            />
            
            <Button
              asChild
              variant="outline"
              disabled={isProcessing || isLoading}
            >
              <label htmlFor="csv-upload" className="cursor-pointer">
                Seleccionar Archivo
              </label>
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <div>
              <p className="font-medium">Error al procesar archivo</p>
              <p className="text-sm">{error}</p>
            </div>
          </Alert>
        )}

        {/* Success and Preview */}
        {parseResult && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <div>
                <p className="font-medium">✅ Archivo procesado correctamente</p>
                <p className="text-sm">
                  {fileName} - {parseResult.totalRows} filas encontradas, {parseResult.data.length} filas válidas
                </p>
              </div>
            </Alert>

            {/* Column Validation */}
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-sm font-medium mb-2">Columnas encontradas:</p>
              <div className="flex flex-wrap gap-2">
                {parseResult.validColumns.map((col) => (
                  <span 
                    key={col}
                    className={`px-2 py-1 text-xs rounded ${
                      requiredColumns.includes(col)
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {col} {requiredColumns.includes(col) ? '(requerida)' : '(opcional)'}
                  </span>
                ))}
              </div>
            </div>

            {/* Warnings Display */}
            {parseResult.warnings && parseResult.warnings.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                <p className="text-sm font-medium text-amber-800 mb-2">Advertencias:</p>
                <ul className="text-sm text-amber-700 space-y-1">
                  {parseResult.warnings.map((warning, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Preview Table */}
            <div className="border rounded-md overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b">
                <p className="text-sm font-medium">Vista previa (primeras 5 filas):</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      {parseResult.validColumns.map((col) => (
                        <th key={col} className="px-3 py-2 text-left font-medium">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parseResult.preview.map((row, index) => (
                      <tr key={index} className="border-t">
                        {parseResult.validColumns.map((col) => (
                          <td key={col} className="px-3 py-2 border-r last:border-r-0">
                            {String(row[col as keyof CSVRow] || '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={handleLoadData}
                disabled={isLoading}
              >
                {isLoading ? 'Cargando...' : 'Cargar Datos'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
import { useMemo, useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type Table as TableType,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { CSVRow, APIResponse } from '@/types/app';

interface VirtualTableProps {
  data: CSVRow[] | (CSVRow & Partial<APIResponse>)[];
  title: string;
  showResults?: boolean;
}

type TableRow = CSVRow & Partial<APIResponse>;

export function VirtualTable({ data, title, showResults = false }: VirtualTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const columns = useMemo<ColumnDef<TableRow>[]>(() => {
    const baseColumns: ColumnDef<TableRow>[] = [
      {
        accessorKey: 'id_participante',
        header: 'ID Participante',
        size: 120,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'curso',
        header: 'Curso',
        size: 100,
      },
      {
        accessorKey: 'pregunta',
        header: 'Pregunta',
        size: 200,
        cell: ({ getValue }) => {
          const value = getValue() as string;
          return (
            <div className="truncate" title={value}>
              {value}
            </div>
          );
        },
      },
      {
        accessorKey: 'respuesta',
        header: 'Respuesta',
        size: 300,
        cell: ({ getValue }) => {
          const value = getValue() as string;
          return (
            <div className="truncate" title={value}>
              {value}
            </div>
          );
        },
      },
      {
        accessorKey: 'evaluacion_1',
        header: 'Eval. 1',
        size: 80,
        cell: ({ getValue }) => {
          const value = getValue() as number;
          return <span className="font-mono">{value?.toFixed(1) || '-'}</span>;
        },
      },
    ];

    // Add optional human evaluations
    const row = data[0] as TableRow;
    if (row?.evaluacion_2 !== undefined) {
      baseColumns.push({
        accessorKey: 'evaluacion_2',
        header: 'Eval. 2',
        size: 80,
        cell: ({ getValue }) => {
          const value = getValue() as number;
          return <span className="font-mono">{value?.toFixed(1) || '-'}</span>;
        },
      });
    }

    if (row?.evaluacion_3 !== undefined) {
      baseColumns.push({
        accessorKey: 'evaluacion_3',
        header: 'Eval. 3',
        size: 80,
        cell: ({ getValue }) => {
          const value = getValue() as number;
          return <span className="font-mono">{value?.toFixed(1) || '-'}</span>;
        },
      });
    }

    // Add result columns if showing results
    if (showResults) {
      baseColumns.push(
        {
          accessorKey: 'nota',
          header: 'Modelo',
          size: 80,
          cell: ({ getValue }) => {
            const value = getValue() as number;
            return value !== undefined ? (
              <Badge variant="secondary" className="font-mono">
                {value.toFixed(1)}
              </Badge>
            ) : (
              <span className="text-gray-400">-</span>
            );
          },
        },
        {
          id: 'mediana_humana',
          header: 'Mediana',
          size: 80,
          cell: ({ row }) => {
            const evaluaciones = [
              row.original.evaluacion_1,
              row.original.evaluacion_2,
              row.original.evaluacion_3,
            ].filter(v => v !== undefined && v !== null) as number[];

            if (evaluaciones.length === 0) return <span className="text-gray-400">-</span>;

            evaluaciones.sort((a, b) => a - b);
            const mid = Math.floor(evaluaciones.length / 2);
            const median = evaluaciones.length % 2 !== 0
              ? evaluaciones[mid]
              : (evaluaciones[mid - 1] + evaluaciones[mid]) / 2;

            return <span className="font-mono">{median.toFixed(1)}</span>;
          },
        },
        {
          id: 'desviacion',
          header: 'Desviación',
          size: 90,
          cell: ({ row }) => {
            const nota = row.original.nota;
            if (nota === undefined) return <span className="text-gray-400">-</span>;

            const evaluaciones = [
              row.original.evaluacion_1,
              row.original.evaluacion_2,
              row.original.evaluacion_3,
            ].filter(v => v !== undefined && v !== null) as number[];

            if (evaluaciones.length === 0) return <span className="text-gray-400">-</span>;

            evaluaciones.sort((a, b) => a - b);
            const mid = Math.floor(evaluaciones.length / 2);
            const median = evaluaciones.length % 2 !== 0
              ? evaluaciones[mid]
              : (evaluaciones[mid - 1] + evaluaciones[mid]) / 2;

            const desviacion = Math.abs(nota - median);
            const color = desviacion <= 1 ? 'text-green-600' : desviacion <= 2 ? 'text-yellow-600' : 'text-red-600';

            return <span className={`font-mono ${color}`}>{desviacion.toFixed(2)}</span>;
          },
        },
        {
          accessorKey: 'confianza',
          header: 'Confianza',
          size: 90,
          cell: ({ getValue }) => {
            const value = getValue() as number;
            return value !== undefined ? (
              <span className="font-mono text-xs">{(value * 100).toFixed(1)}%</span>
            ) : (
              <span className="text-gray-400">-</span>
            );
          },
        }
      );
    }

    return baseColumns;
  }, [data, showResults]);

  const table = useReactTable({
    data: data as TableRow[],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const { rows } = table.getRowModel();

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35,
    overscan: 10,
  });

  const items = virtualizer.getVirtualItems();

  const totalWidth = columns.reduce((sum, col) => sum + (col.size || 150), 0);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <Badge variant="outline">{data.length} filas</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md overflow-hidden">
          <div
            ref={parentRef}
            className="h-[400px] overflow-auto"
            style={{ contain: 'strict' }}
          >
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: `${Math.max(totalWidth, 800)}px`,
                position: 'relative',
              }}
            >
              {/* Header */}
              <div
                className="flex bg-gray-100 border-b sticky top-0 z-10"
                style={{ minWidth: `${totalWidth}px` }}
              >
                {table.getHeaderGroups()[0].headers.map((header) => (
                  <div
                    key={header.id}
                    className="px-3 py-2 text-left text-xs font-medium text-gray-700 border-r last:border-r-0 bg-gray-100"
                    style={{ 
                      width: `${header.column.getSize()}px`,
                      minWidth: `${header.column.getSize()}px`,
                      flex: 'none'
                    }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </div>
                ))}
              </div>

              {/* Virtual Rows */}
              {items.map((virtualRow) => {
                const row = rows[virtualRow.index];
                return (
                  <div
                    key={row.id}
                    className="flex border-b hover:bg-gray-50"
                    style={{
                      position: 'absolute',
                      top: `${virtualRow.start}px`,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      minWidth: `${totalWidth}px`,
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <div
                        key={cell.id}
                        className="px-3 py-1 text-sm border-r last:border-r-0 flex items-center"
                        style={{ 
                          width: `${cell.column.getSize()}px`,
                          minWidth: `${cell.column.getSize()}px`,
                          flex: 'none'
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Table Stats */}
        <div className="mt-2 text-xs text-gray-500 flex justify-between">
          <span>Mostrando filas {items[0]?.index + 1 || 0}-{items[items.length - 1]?.index + 1 || 0} de {data.length}</span>
          <span>Altura de fila: 35px | Overscan: 10</span>
        </div>
      </CardContent>
    </Card>
  );
}
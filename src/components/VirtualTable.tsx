import { useMemo, useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface VirtualTableProps {
  data: Record<string, unknown>[];
  columns: ColumnDef<Record<string, unknown>>[];
  title: string;
  subtitle?: string;
  height?: number;
}

export function VirtualTable({ 
  data, 
  columns, 
  title, 
  subtitle, 
  height = 400 
}: VirtualTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Memoize table creation for performance
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const { rows } = table.getRowModel();

  // Virtual scrolling setup
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 45, // Slightly smaller row height
    overscan: 10, // Render more items outside viewport for smooth scrolling
  });

  const virtualRows = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0]?.start || 0 : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - (virtualRows[virtualRows.length - 1]?.end || 0)
      : 0;

  // Calculate column widths dynamically
  const totalWidth = useMemo(() => {
    return table.getAllColumns().reduce((sum, column) => {
      return sum + (column.getSize?.() || 150);
    }, 0);
  }, [table]);

  if (data.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {subtitle && (
            <p className="text-sm text-gray-600">{subtitle}</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <div className="text-4xl mb-4">📄</div>
            <h3 className="text-lg font-medium mb-2">Sin datos</h3>
            <p className="text-sm text-center">No hay información para mostrar</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div>
            <span>{title}</span>
            {subtitle && (
              <p className="text-sm font-normal text-gray-600 mt-1">{subtitle}</p>
            )}
          </div>
          <Badge variant="outline">
            {data.length.toLocaleString()} {data.length === 1 ? 'fila' : 'filas'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          ref={parentRef}
          className="w-full overflow-auto border rounded-md bg-white"
          style={{
            height: `${height}px`,
            contain: 'strict',
          }}
        >
          <div style={{ width: `${Math.max(totalWidth, 800)}px` }}>
            <table className="w-full">
              <thead className="sticky top-0 bg-gray-50 z-10 shadow-sm">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b border-gray-200">
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50"
                        style={{ 
                          width: header.getSize(),
                          minWidth: header.getSize(),
                        }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {paddingTop > 0 && (
                  <tr>
                    <td style={{ height: `${paddingTop}px` }} />
                  </tr>
                )}
                {virtualRows.map((virtualRow) => {
                  const row = rows[virtualRow.index];
                  return (
                    <tr
                      key={row.id}
                      className="border-b border-gray-100 hover:bg-blue-50 transition-colors duration-150"
                      style={{
                        height: `${virtualRow.size}px`,
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td 
                          key={cell.id} 
                          className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap"
                          style={{ 
                            width: cell.column.getSize(),
                            minWidth: cell.column.getSize(),
                          }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  );
                })}
                {paddingBottom > 0 && (
                  <tr>
                    <td style={{ height: `${paddingBottom}px` }} />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Performance info for development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-2 text-xs text-gray-500 flex justify-between">
            <span>Renderizando: {virtualRows.length} de {rows.length} filas</span>
            <span>Altura virtual: {totalSize}px</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
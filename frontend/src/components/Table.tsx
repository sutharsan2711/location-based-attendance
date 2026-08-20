import React, { ReactNode } from 'react';

interface Column<T> {
  header: string;
  render: (row: T, index: number) => ReactNode;
  className?: string;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T, index: number) => string | number;
  emptyMessage?: string;
  loading?: boolean;
}

function Table<T>({
  data,
  columns,
  keyExtractor,
  emptyMessage = 'No records found.',
  loading = false,
}: TableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
      <table className="w-full border-collapse text-left text-sm text-slate-600">
        <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} scope="col" className={`px-6 py-4 font-semibold ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 border-t border-slate-100">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center">
                <div className="flex justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent"></div>
                </div>
                <p className="mt-2 text-xs text-slate-400">Loading data...</p>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-400 text-sm">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr key={keyExtractor(row, rowIdx)} className="hover:bg-slate-50/50 transition-colors">
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className={`px-6 py-4 whitespace-nowrap text-slate-700 ${col.className || ''}`}>
                    {col.render(row, rowIdx)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;

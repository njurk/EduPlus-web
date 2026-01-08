import type { ReactNode } from 'react';
import { clsx } from 'clsx';

export interface Column<T> {
    header: string;
    accessor?: keyof T;
    render?: (item: T, index: number) => ReactNode; 
    className?: string;
    headerClassName?: string;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    isLoading?: boolean;
    emptyMessage?: string;
    onRowClick?: (item: T) => void;
}

export const DataTable = <T extends { id: number | string }>({
    data,
    columns,
    isLoading,
    emptyMessage = "Brak danych",
    onRowClick
}: DataTableProps<T>) => {

    if (isLoading) {
        return (
            <div className="p-12 text-center text-neutral-400 flex flex-col items-center gap-2">
                Ładowanie...
            </div>
        );
    }

    return (
        <div className="overflow-x-auto bg-white">
            <table className="w-full text-left border-collapse font-sans">
                <thead className="bg-neutral-50 text-neutral-600 uppercase text-xs font-semibold border-b">
                    <tr>
                        {columns.map((col, idx) => (
                            <th key={idx} className={clsx("px-4 py-3", col.headerClassName || col.className)}>
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-sm">
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className="p-8 text-center text-neutral-400">
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        data.map((item, idx) => (
                            <tr
                                key={item.id}
                                onClick={() => onRowClick && onRowClick(item)}
                                className={clsx("transition-colors", onRowClick ? "cursor-pointer hover:bg-neutral-50" : "hover:bg-neutral-50")}
                            >
                                {columns.map((col, colIdx) => (
                                    <td key={colIdx} className={clsx("px-4 py-3 text-neutral-900", col.className)}>
                                        {col.render ? col.render(item, idx) : (col.accessor ? String(item[col.accessor]) : '-')}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};
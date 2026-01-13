import { useState, useMemo } from 'react';
import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
    pageSize?: number;
}

export const DataTable = <T extends { id: number | string }>({
    data,
    columns,
    isLoading,
    emptyMessage = "Brak danych",
    onRowClick,
    pageSize = 20
}: DataTableProps<T>) => {
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(data.length / pageSize);

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return data.slice(start, start + pageSize);
    }, [data, currentPage, pageSize]);

    useMemo(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(1);
        }
    }, [data.length, totalPages, currentPage]);

    if (isLoading) {
        return (
            <div className="p-12 text-center text-neutral-400 flex flex-col items-center gap-2">
                Ładowanie...
            </div>
        );
    }

    return (
        <div className="flex flex-col">
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
                        {paginatedData.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="p-8 text-center text-neutral-400">
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((item, idx) => (
                                <tr
                                    key={item.id}
                                    onClick={() => onRowClick && onRowClick(item)}
                                    className={clsx("transition-colors", onRowClick ? "cursor-pointer hover:bg-neutral-50" : "hover:bg-neutral-50")}
                                >
                                    {columns.map((col, colIdx) => (
                                        <td key={colIdx} className={clsx("px-4 py-3 text-neutral-900", col.className)}>
                                            {col.render ? col.render(item, (currentPage - 1) * pageSize + idx) : (col.accessor ? String(item[col.accessor]) : '-')}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t bg-neutral-50/50">
                    <span className="text-sm text-neutral-500">
                        Strona {currentPage} z {totalPages} ({data.length} rekordów)
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-1.5 rounded border border-neutral-200 bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-sm font-medium text-neutral-700 min-w-[60px] text-center">
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-1.5 rounded border border-neutral-200 bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

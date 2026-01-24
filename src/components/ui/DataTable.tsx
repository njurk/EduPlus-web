import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';

export interface Column<T> {
    header: string;
    accessor?: keyof T;
    render?: (item: T, index: number) => ReactNode;
    className?: string;
    headerClassName?: string;
    sortKey?: string;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    isLoading?: boolean;
    emptyMessage?: string;
    onRowClick?: (item: T) => void;
    sortBy?: string;
    sortDesc?: boolean;
    onSort?: (field: string) => void;
}

export const DataTable = <T extends { id: number | string }>({
    data,
    columns,
    isLoading,
    emptyMessage = "Brak danych",
    onRowClick,
    sortBy,
    sortDesc,
    onSort
}: DataTableProps<T>) => {
    if (isLoading) {
        return <LoadingSpinner className="py-12" />;
    }

    return (
        <div className="flex flex-col">
            <div className="overflow-x-auto bg-white">
                <table className="w-full text-left border-collapse font-sans">
                    <thead className="bg-neutral-50 text-neutral-600 uppercase text-xs font-semibold border-b">
                        <tr>
                            {columns.map((col, idx) => (
                                <th
                                    key={idx}
                                    className={clsx(
                                        "px-4 py-3",
                                        col.headerClassName || col.className,
                                        col.sortKey && onSort && "cursor-pointer hover:bg-neutral-100 select-none"
                                    )}
                                    onClick={() => col.sortKey && onSort && onSort(col.sortKey)}
                                >
                                    <span className="flex items-center gap-1">
                                        {col.header}
                                        {col.sortKey && onSort && (
                                            sortBy === col.sortKey
                                                ? (sortDesc ? <ArrowDown size={14} /> : <ArrowUp size={14} />)
                                                : <ArrowUpDown size={14} className="opacity-40" />
                                        )}
                                    </span>
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
        </div>
    );
};

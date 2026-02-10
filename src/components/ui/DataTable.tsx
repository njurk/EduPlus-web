import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';

export interface Column<T> {
    header: string;
    accessor?: keyof T;
    sortKey?: string;
    className?: string;
    headerClassName?: string;
    muted?: boolean;
    bold?: boolean;
    render?: (item: T, index: number) => ReactNode;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    sortBy?: string;
    sortDesc?: boolean;
    onSort?: (field: string) => void;
    onRowClick?: (item: T) => void;
    isLoading?: boolean;
    emptyMessage?: string;
}

const tableStyles = "w-full text-left border-collapse font-sans";
const theadStyles = "bg-neutral-50 text-neutral-600 uppercase text-xs font-semibold border-b";

export const DataTable = <T extends { id: number | string }>({
    columns, data, sortBy, sortDesc, onSort, onRowClick,
    isLoading, emptyMessage = "Brak danych"
}: DataTableProps<T>) => {

    if (isLoading) return <LoadingSpinner className="py-12" />;

    const rowHover = onRowClick ? "cursor-pointer hover:bg-neutral-50" : "hover:bg-neutral-50";

    return (
        <div className="flex flex-col">
            <div className="overflow-x-auto bg-white">
                <table className={tableStyles}>
                    <thead className={theadStyles}>
                        <tr>
                            {columns.map((col, idx) => {
                                const isSortable = col.sortKey && onSort;
                                const headerClass = clsx(
                                    "px-4 py-1.5",
                                    col.headerClassName || col.className,
                                    isSortable && "cursor-pointer hover:bg-neutral-100 select-none"
                                );
                                return (
                                    <th key={idx} className={headerClass} onClick={() => isSortable && onSort(col.sortKey!)}>
                                        <span className="flex items-center gap-1">
                                            {col.header}
                                            {isSortable && (
                                                sortBy === col.sortKey
                                                    ? (sortDesc ? <ArrowDown size={14} /> : <ArrowUp size={14} />)
                                                    : <ArrowUpDown size={14} className="opacity-40" />
                                            )}
                                        </span>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 text-sm">
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="p-8 text-center text-neutral-400">{emptyMessage}</td>
                            </tr>
                        ) : data.map((item, idx) => (
                            <tr key={item.id} onClick={() => onRowClick?.(item)} className={clsx("transition-colors", rowHover)}>
                                {columns.map((col, colIdx) => (
                                    <td key={colIdx} className={clsx("px-4 py-1", col.muted ? "text-neutral-500" : "text-neutral-900", col.bold && "font-medium", col.className)}>
                                        {col.render ? col.render(item, idx) : (col.accessor ? String(item[col.accessor]) : '-')}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

import type { ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import { SearchBar } from './SearchBar';

export interface FilterOption {
    value: string | number;
    label: string;
}

interface FilterSelectProps {
    label?: string;
    value: string | number | null | undefined;
    onChange: (value: string | number | null) => void;
    options: FilterOption[];
    placeholder?: string;
    minWidth?: string;
    parseAsNumber?: boolean;
}

export const FilterSelect = ({ label, value, onChange, options, placeholder = 'Wszystkie', minWidth = '120px', parseAsNumber = true }: FilterSelectProps) => (
    <div className="flex items-center gap-2">
        {label && <label className="text-xs text-neutral-500 whitespace-nowrap">{label}</label>}
        <select
            value={value ?? ''}
            onChange={e => onChange(e.target.value ? (parseAsNumber ? Number(e.target.value) : e.target.value) : null)}
            className="border border-neutral-300 rounded-xs px-2 h-8 text-sm bg-white"
            style={{ minWidth }}
        >
            <option value="">{placeholder}</option>
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
    </div>
);

interface FilterDateProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
}

export const FilterDate = ({ label, value, onChange }: FilterDateProps) => (
    <div className="flex items-center gap-2">
        {label && <label className="text-xs text-neutral-500 whitespace-nowrap">{label}</label>}
        <input
            type="date"
            value={value}
            onChange={e => onChange(e.target.value)}
            className="border border-neutral-300 rounded-xs px-2 h-8 text-sm bg-white"
        />
    </div>
);

interface FilterToolbarProps {
    search?: { value: string; onChange: (v: string) => void; placeholder?: string };
    onReset?: () => void;
    showResetButton?: boolean;
    children?: ReactNode;
    rightContent?: ReactNode;
    className?: string;
}

export const FilterToolbar = ({ search, onReset, showResetButton = true, children, rightContent, className = '' }: FilterToolbarProps) => {
    const hasActiveFilters = showResetButton && onReset;

    return (
        <div className={`p-3 border-b flex flex-wrap items-center gap-3 ${className}`}>
            {search && <SearchBar value={search.value} onChange={search.onChange} placeholder={search.placeholder} className="max-w-xs" />}
            {children}
            {hasActiveFilters && (
                <button
                    onClick={onReset}
                    className="flex items-center gap-1 text-xs text-neutral-500 hover:text-primary transition-colors px-2 py-1 rounded hover:bg-neutral-100"
                    title="Resetuj filtry"
                >
                    <RotateCcw size={14} />
                    <span className="hidden sm:inline">Reset</span>
                </button>
            )}
            {rightContent && <div className="ml-auto flex items-center gap-2">{rightContent}</div>}
        </div>
    );
};

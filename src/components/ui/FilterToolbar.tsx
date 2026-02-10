import type { ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { Select } from './Select';

export interface FilterOption {
    label: string;
    value: string | number;
}

interface FilterSelectProps {
    options: FilterOption[];
    value: string | number | null | undefined;
    onChange: (value: string | number | null) => void;
    label?: string;
    placeholder?: string;
    minWidth?: string;
    parseAsNumber?: boolean;
}

export const FilterSelect = ({ options, value, onChange, label, placeholder = 'Wszystkie', minWidth = '120px', parseAsNumber = true }: FilterSelectProps) => (
    <div className="flex items-center gap-2">
        {label && <label className="text-xs text-neutral-500 whitespace-nowrap">{label}</label>}
        <Select
            options={options}
            value={value}
            onChange={v => onChange(v ? (parseAsNumber ? Number(v) : v) : null)}
            placeholder={placeholder}
            className={minWidth ? `min-w-[${minWidth}]` : ''}
        />
    </div>
);

interface FilterDateProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
}

export const FilterDate = ({ value, onChange, label }: FilterDateProps) => (
    <div className="flex items-center gap-2">
        {label && <label className="text-xs text-neutral-500 whitespace-nowrap">{label}</label>}
        <input type="date" value={value} onChange={e => onChange(e.target.value)} className="border border-neutral-300 rounded-xs px-2 py-1 text-sm bg-white" />
    </div>
);

interface FilterToolbarProps {
    children?: ReactNode;
    rightContent?: ReactNode;
    search?: { value: string; onChange: (v: string) => void; placeholder?: string };
    onReset?: () => void;
    showResetButton?: boolean;
    className?: string;
}

export const FilterToolbar = ({ children, rightContent, search, onReset, showResetButton = true, className = '' }: FilterToolbarProps) => {
    const showReset = showResetButton && onReset;

    return (
        <div className={`p-3 border-b flex flex-wrap items-center gap-3 ${className}`}>
            {search && <SearchBar value={search.value} onChange={search.onChange} placeholder={search.placeholder} className="max-w-xs" />}
            {children}
            {showReset && (
                <button onClick={onReset} className="flex items-center gap-1 text-xs text-neutral-500 hover:text-primary transition-colors px-2 py-1 rounded hover:bg-neutral-100">
                    <RotateCcw size={14} />
                    <span className="hidden sm:inline">Reset</span>
                </button>
            )}
            {rightContent && <div className="ml-auto flex items-center gap-2">{rightContent}</div>}
        </div>
    );
};

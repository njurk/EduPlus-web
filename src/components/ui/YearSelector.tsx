import type { SchoolYear } from '../../types';

interface YearSelectorProps {
    years: SchoolYear[];
    selectedYear: number | null;
    onChange: (yearId: number) => void;
    className?: string;
}

export const YearSelector = ({ years, selectedYear, onChange, className }: YearSelectorProps) => (
    <select
        className={`px-2 py-1 border border-neutral-300 rounded-xs text-sm bg-white ${className || ''}`}
        value={selectedYear || ''}
        onChange={(e) => onChange(+e.target.value)}
    >
        {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
    </select>
);
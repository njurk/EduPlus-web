import type { SchoolYear } from '../../types';
import { Select } from './Select';

interface YearSelectorProps {
    years: SchoolYear[];
    selectedYear: number | null;
    onChange: (yearId: number) => void;
    className?: string;
}

export const YearSelector = ({ years, selectedYear, onChange, className }: YearSelectorProps) => (
    <Select
        options={years.map(y => ({ value: y.id, label: y.name }))}
        value={selectedYear}
        onChange={v => onChange(+v)}
        className={className}
    />
);
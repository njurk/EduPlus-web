import type { SemesterDto } from '../../types';
import { Select } from './Select';

interface SemesterSelectorProps {
    semesters: SemesterDto[];
    selectedOrder: number | null;
    onChange: (order: number | null) => void;
    showAll?: boolean;
    className?: string;
}

export const SemesterSelector = ({ semesters, selectedOrder, onChange, showAll = false, className }: SemesterSelectorProps) => (
    <Select
        options={semesters.map(s => ({ value: s.order, label: s.name }))}
        value={selectedOrder}
        onChange={v => onChange(v ? +v : null)}
        placeholder={showAll ? 'Wszystkie semestry' : (semesters.length === 0 ? 'Brak semestrów' : undefined)}
        disabled={semesters.length === 0}
        className={className}
    />
);
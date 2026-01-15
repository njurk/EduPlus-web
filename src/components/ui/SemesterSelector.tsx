import type { SemesterDto } from '../../types';

interface SemesterSelectorProps {
    semesters: SemesterDto[];
    selectedOrder: number | null;
    onChange: (order: number | null) => void;
    showAll?: boolean;
    className?: string;
}

export const SemesterSelector = ({ semesters, selectedOrder, onChange, showAll = false, className }: SemesterSelectorProps) => (
    <select
        className={`px-2 py-1 border border-neutral-300 rounded-xs text-sm bg-white disabled:opacity-50 ${className || ''}`}
        value={selectedOrder || ''}
        onChange={(e) => onChange(e.target.value ? +e.target.value : null)}
        disabled={semesters.length === 0}
    >
        {showAll && <option value="">Wszystkie</option>}
        {semesters.map(s => <option key={s.id} value={s.order}>{s.name}</option>)}
        {semesters.length === 0 && <option value="">Brak</option>}
    </select>
);
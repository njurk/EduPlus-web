import { Filter } from 'lucide-react';
import type { SemesterDto } from '../../types';

interface SemesterSelectorProps {
    semesters: SemesterDto[];
    selectedOrder: number | null;
    onChange: (order: number) => void;
}

export const SemesterSelector = ({ semesters, selectedOrder, onChange }: SemesterSelectorProps) => {
    return (
        <div className="flex items-center gap-2 h-10 bg-white border border-neutral-300 px-3 rounded-sm shadow-sm">
            <Filter className="text-primary shrink-0" size={18} />
            <select
                className="bg-transparent text-sm font-medium text-neutral-700 focus:outline-none cursor-pointer w-full border-none p-0 focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed"
                value={selectedOrder || ''}
                onChange={(e) => onChange(+e.target.value)}
                disabled={semesters.length === 0}
            >
                {semesters.map(s => (
                    <option key={s.id} value={s.order}>
                        {s.name}
                    </option>
                ))}
                {semesters.length === 0 && <option value="">Brak semestrów</option>}
            </select>
        </div>
    );
};
import { Calendar } from 'lucide-react';
import type { SchoolYear } from '../../types';

interface YearSelectorProps {
    years: SchoolYear[];
    selectedYear: number | null;
    onChange: (yearId: number) => void;
}

export const YearSelector = ({ years, selectedYear, onChange }: YearSelectorProps) => {
    return (
        <div className="flex items-center gap-2 h-10 bg-white border border-neutral-300 px-3 rounded-sm shadow-sm hover:border-neutral-400 transition-colors">
            <Calendar className="text-primary shrink-0" size={18} />
            <select
                className="bg-transparent text-sm font-medium text-neutral-700 focus:outline-none cursor-pointer w-full border-none p-0 focus:ring-0"
                value={selectedYear || ''}
                onChange={(e) => onChange(+e.target.value)}
            >
                {years.map(y => (
                    <option key={y.id} value={y.id}>
                        {y.name}
                    </option>
                ))}
            </select>
        </div>
    );
};
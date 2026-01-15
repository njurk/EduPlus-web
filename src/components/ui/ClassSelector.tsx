import type { ClassEntity } from '../../types';

interface ClassSelectorProps {
    classes: ClassEntity[];
    selectedClass: number | null;
    onChange: (classId: number | null) => void;
    showAll?: boolean;
    className?: string;
}

export const ClassSelector = ({ classes, selectedClass, onChange, showAll = false, className }: ClassSelectorProps) => (
    <select
        className={`px-2 py-1 border border-neutral-300 rounded-xs text-sm bg-white ${className || ''}`}
        value={selectedClass || ''}
        onChange={(e) => onChange(e.target.value ? +e.target.value : null)}
    >
        {showAll && <option value="">Wszystkie</option>}
        {classes.map(c => <option key={c.id} value={c.id}>{c.level}{c.letter}</option>)}
    </select>
);

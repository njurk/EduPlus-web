import type { ClassEntity } from '../../types';
import { Select } from './Select';

interface ClassSelectorProps {
    classes: ClassEntity[];
    selectedClass: number | null;
    onChange: (classId: number | null) => void;
    showAll?: boolean;
    className?: string;
}

export const ClassSelector = ({ classes, selectedClass, onChange, showAll = false, className }: ClassSelectorProps) => (
    <Select
        options={classes.map(c => ({ value: c.id, label: `${c.level}${c.letter}` }))}
        value={selectedClass}
        onChange={v => onChange(v ? +v : null)}
        placeholder={showAll ? 'Wszystkie klasy' : undefined}
        className={className}
    />
);

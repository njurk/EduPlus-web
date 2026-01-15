import { Filter } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { clsx } from 'clsx';

interface FilterField {
    name: string;
    label: string;
    type: 'date' | 'select' | 'text';
    options?: { value: string; label: string }[];
    width?: string;
}

interface FilterToolbarProps {
    fields: FilterField[];
    values: Record<string, string>;
    onChange: (name: string, value: string) => void;
    onReset: () => void;
    className?: string;
}

export const FilterToolbar = ({ fields, values, onChange, onReset, className }: FilterToolbarProps) => (
    <div className={clsx("p-3 border-b bg-neutral-50 flex flex-wrap gap-3 items-end", className)}>
        {fields.map(field => (
            <div key={field.name} className={field.width || 'w-40'}>
                <label className="text-xs font-medium text-neutral-500 mb-1 block">{field.label}</label>
                {field.type === 'date' ? (
                    <Input type="date" value={values[field.name] || ''} onChange={e => onChange(field.name, e.target.value)} className="h-8" />
                ) : field.type === 'select' ? (
                    <select
                        className="w-full border border-neutral-300 rounded-xs px-2 h-8 text-sm bg-white"
                        value={values[field.name] || ''}
                        onChange={e => onChange(field.name, e.target.value)}
                    >
                        <option value="">Wszystkie</option>
                        {field.options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                ) : (
                    <Input type="text" value={values[field.name] || ''} onChange={e => onChange(field.name, e.target.value)} className="h-8" />
                )}
            </div>
        ))}
        <Button variant="secondary" className="h-8" onClick={onReset}>
            <Filter size={12} className="mr-1" />Reset
        </Button>
    </div>
);

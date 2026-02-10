interface SelectOption {
    value: string | number;
    label: string;
}

interface SelectProps {
    options: SelectOption[];
    value: string | number | null | undefined;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

const baseClass = "border border-neutral-300 rounded-xs px-2 py-1 text-sm bg-white";

export const Select = ({ options, value, onChange, placeholder, disabled, className }: SelectProps) => (
    <select
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className={`${baseClass} ${disabled ? 'disabled:opacity-50' : ''} ${className || ''}`}
    >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
);

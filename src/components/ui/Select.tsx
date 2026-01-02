import { clsx } from 'clsx';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    options: { value: string | number; label: string }[];
}

export const Select = ({ className, options, ...props }: SelectProps) => (
    <select
        className={clsx(
            "w-full px-3 py-1.5 text-sm border border-neutral-300 focus:border-primary focus:ring-0 outline-none transition-colors rounded-none bg-white text-neutral-900",
            className
        )}
        {...props}
    >
        {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
    </select>
);
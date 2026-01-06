import { Search } from 'lucide-react';
import { Input } from './Input';
import { clsx } from 'clsx';

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export const SearchBar = ({
    value,
    onChange,
    placeholder = "Szukaj...",
    className
}: SearchBarProps) => {
    return (
        <div className={clsx("relative", className)}>
            <Search className="absolute left-3 top-2.5 text-neutral-400" size={18} />
            <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="pl-10"
            />
        </div>
    );
};
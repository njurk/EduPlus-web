import { Input } from './Input';
import { Check } from 'lucide-react';
import { clsx } from 'clsx';
import { PASSWORD_RULES } from '../../utils/validation';

interface PasswordInputProps {
    id?: string;
    name?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    label?: string;
    placeholder?: string;
    required?: boolean;
    className?: string;
    showRules?: boolean;
}

export const PasswordInput = ({
    id,
    name = "password",
    value,
    onChange,
    label = "Hasło",
    placeholder,
    required = false,
    className,
    showRules = true
}: PasswordInputProps) => {
    return (
        <div className={className}>
            <label htmlFor={id} className="label-text">
                {label} {required && <span className="text-danger">*</span>}
            </label>
            <Input
                id={id}
                name={name}
                type="password"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={clsx(value && !PASSWORD_RULES.every(r => r.test(value)) && "border-warning")}
            />

            {showRules && (
                <ul className="mt-2 space-y-1">
                    {PASSWORD_RULES.map((rule, i) => {
                        const isValid = rule.test(value || "");
                        return (
                            <li key={i} className={clsx("text-xs flex gap-2 transition-colors", isValid ? "text-success" : "text-neutral-400")}>
                                <Check size={12} className={clsx("transition-opacity", isValid ? "opacity-100" : "opacity-0")} />
                                {rule.label}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};
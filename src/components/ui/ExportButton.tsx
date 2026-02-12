import { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown } from 'lucide-react';
import { Button } from './Button';
import clsx from 'clsx';

interface ExportButtonProps {
    onExport: (format: 'pdf' | 'xlsx' | 'docx') => void;
    disabled?: boolean;
    className?: string;
    formats?: ('pdf' | 'xlsx' | 'docx')[];
}

export const ExportButton = ({ onExport, disabled, className, formats }: ExportButtonProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const allOptions = [
        { format: 'pdf' as const, label: 'PDF' },
        { format: 'xlsx' as const, label: 'Excel (xlsx)' },
        { format: 'docx' as const, label: 'Word (docx)' }
    ];
    const options = formats ? allOptions.filter(o => formats.includes(o.format)) : allOptions;

    return (
        <div className={clsx("relative", className)} ref={ref}>
            <Button
                variant="secondary"
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled}
                className="flex items-center gap-2"
            >
                <Download size={16} />
                Eksport
                <ChevronDown size={14} className={clsx("transition-transform", isOpen && "rotate-180")} />
            </Button>

            {isOpen && (
                <div className="absolute right-0 mt-1 bg-white border border-neutral-200 rounded-xs shadow-sm z-50 min-w-[150px]">
                    {options.map(({ format, label }) => (
                        <button
                            key={format}
                            onClick={() => {
                                onExport(format);
                                setIsOpen(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-100 transition-colors"
                        >
                            {label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

import { useState, useRef, useEffect } from 'react';
import { Download, FileText, Table, FileSpreadsheet, ChevronDown, FileType } from 'lucide-react';
import { Button } from './Button';
import clsx from 'clsx';

interface ExportButtonProps {
    onExport: (format: 'pdf' | 'xlsx' | 'csv' | 'docx') => void;
    disabled?: boolean;
    className?: string;
}

export const ExportButton = ({ onExport, disabled, className }: ExportButtonProps) => {
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

    const options = [
        { format: 'pdf' as const, label: 'PDF', icon: FileText },
        { format: 'xlsx' as const, label: 'Excel (xlsx)', icon: FileSpreadsheet },
        { format: 'docx' as const, label: 'Word (docx)', icon: FileType },
        { format: 'csv' as const, label: 'CSV', icon: Table }
    ];

    return (
        <div className={clsx("relative", className)} ref={ref}>
            <Button
                variant="secondary"
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled}
                className="flex items-center gap-2"
            >
                <Download size={16} />
                Eksportuj
                <ChevronDown size={14} className={clsx("transition-transform", isOpen && "rotate-180")} />
            </Button>

            {isOpen && (
                <div className="absolute right-0 mt-1 bg-white border border-neutral-200 rounded-xs shadow-lg z-50 min-w-[150px]">
                    {options.map(({ format, label, icon: Icon }) => (
                        <button
                            key={format}
                            onClick={() => {
                                onExport(format);
                                setIsOpen(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-neutral-100 transition-colors"
                        >
                            <Icon size={14} className="text-neutral-500" />
                            {label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

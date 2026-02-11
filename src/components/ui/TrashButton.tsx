import { Trash2, ArrowLeft } from 'lucide-react';
import { clsx } from 'clsx';

interface TrashButtonProps {
    isTrashActive: boolean;
    onToggle: () => void;
    label?: string;
    className?: string;
}

export const TrashButton = ({ isTrashActive, onToggle, label = 'Kosz', className }: TrashButtonProps) => (
    <button
        onClick={onToggle}
        className={clsx(
            "flex items-center gap-1.5 px-2 py-1 text-sm font-medium rounded-xs border transition-colors",
            isTrashActive
                ? "bg-neutral-800 text-white border-neutral-800"
                : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50",
            className
        )}
    >
        {isTrashActive ? <><ArrowLeft size={14} />Powrót</> : <><Trash2 size={14} />{label}</>}
    </button>
);
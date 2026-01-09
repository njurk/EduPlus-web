import { Trash2, ArrowLeft } from 'lucide-react';
import { clsx } from 'clsx';

interface TrashButtonProps {
    isTrashActive: boolean;
    onToggle: () => void;
    className?: string;
}

export const TrashButton = ({ isTrashActive, onToggle, className }: TrashButtonProps) => {
    return (
        <button
            onClick={onToggle}
            className={clsx(
                "flex items-center justify-center gap-2 h-10 px-4 text-sm font-medium rounded-sm shadow-sm transition-all focus:outline-none",
                isTrashActive
                    ? "bg-neutral-800 hover:bg-neutral-900 text-white border border-neutral-800"
                    : "bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-300 hover:border-neutral-400",
                className
            )}
        >
            {isTrashActive ? (
                <>
                    <ArrowLeft size={16} /> <span>Powrót</span>
                </>
            ) : (
                <>
                    <Trash2 size={18} /> <span>Kosz</span>
                </>
            )}
        </button>
    );
};
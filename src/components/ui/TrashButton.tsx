import { Button } from './Button';
import { Trash2, XCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface TrashButtonProps {
    isTrashActive: boolean;
    onToggle: () => void;
    className?: string;
}

export const TrashButton = ({ isTrashActive, onToggle, className }: TrashButtonProps) => {
    return (
        <Button 
            variant={isTrashActive ? "primary" : "secondary"} 
            onClick={onToggle} 
            className={clsx(
                isTrashActive && "bg-neutral-800 hover:bg-neutral-900 border-neutral-800 text-white",
                className
            )}
        >
            {isTrashActive ? (
                <>
                    <XCircle size={16} className="mr-2"/> Powrót
                </>
            ) : (
                <>
                    <Trash2 size={16} className="mr-2"/> Kosz
                </>
            )}
        </Button>
    );
};
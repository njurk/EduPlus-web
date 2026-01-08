import { useEffect } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal = ({ isOpen, onClose, title, children, footer, maxWidth = 'md' }: ModalProps) => {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const widthClass = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl'
    }[maxWidth];

    return (
        <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center p-4 backdrop-blur-[1px] animate-in fade-in duration-200">
            <div className={clsx("bg-white border border-neutral-300 w-full flex flex-col max-h-[90vh] shadow-xl rounded-lg overflow-hidden", widthClass)}>
                <div className="p-4 border-b flex justify-between items-center bg-neutral-50">
                    <h3 className="font-bold text-sm uppercase text-neutral-600 tracking-wide">{title}</h3>
                    <button onClick={onClose} className="text-neutral-400 hover:text-neutral-800 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-0">
                    {children}
                </div>

                {footer && (
                    <div className="p-4 border-t bg-neutral-50 flex justify-end gap-2 items-center">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};
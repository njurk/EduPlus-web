import { RefreshCcw } from 'lucide-react';

interface LoadingSpinnerProps {
    text?: string;
    className?: string;
}

export const LoadingSpinner = ({ text = 'Ładowanie...', className = '' }: LoadingSpinnerProps) => (
    <div className={`flex items-center justify-center h-32 text-neutral-400 ${className}`}>
        <RefreshCcw className="animate-spin mr-2" size={16} />
        {text}
    </div>
);

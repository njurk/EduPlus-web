import { Modal } from './Modal';
import { Button } from '../ui/Button';
import { formatDate } from '../../utils/formatters';

interface DetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    data: Record<string, any>;
    labels?: Record<string, string>;
    excludeKeys?: string[];
}

export const DetailsModal = ({
    isOpen,
    onClose,
    title,
    data,
    labels = {},
    excludeKeys = ['id', 'password', 'isActive', 'updatedAt']
}: DetailsModalProps) => {
    const formatValue = (key: string, value: any) => {
        if (value === null || value === undefined || value === '') return <span className="text-neutral-400 font-light">-</span>;
        if (typeof value === 'boolean') return value ? 'Tak' : 'Nie';
        const lowerKey = key.toLowerCase();
        if (lowerKey.endsWith('date') || lowerKey.endsWith('at') || lowerKey === 'date') return formatDate(value);
        if (Array.isArray(value)) return value.join(', ');
        return String(value);
    };

    const keys = Object.keys(data).filter(k => !excludeKeys.includes(k));

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            footer={<Button onClick={onClose}>Zamknij</Button>}
        >
            <div className="space-y-4 px-6">
                <div className="grid grid-cols-1 gap-y-3">
                    {keys.map(key => (
                        <div key={key} className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-neutral-100 last:border-0">
                            <span className="text-sm text-neutral-500 font-medium mb-1 sm:mb-0">
                                {labels[key] || key}
                            </span>
                            <span className="text-sm text-neutral-800 font-semibold text-right break-words max-w-xs">
                                {formatValue(key, data[key])}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </Modal>
    );
};

import { Modal } from './Modal';
import { Button } from '../ui/Button';
import { formatFullDate } from '../../utils/formatters';

interface DetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    data: Record<string, any>;
    labels?: Record<string, string>;
    excludeKeys?: string[];
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
    customFooter?: React.ReactNode;
    htmlFields?: string[];
}

export const DetailsModal = ({
    isOpen,
    onClose,
    title,
    data,
    labels = {},
    excludeKeys = ['id', 'password', 'isActive', 'updatedAt'],
    maxWidth = 'md',
    customFooter,
    htmlFields = []
}: DetailsModalProps) => {
    const formatValue = (key: string, value: any) => {
        if (value === null || value === undefined || value === '') return <span className="text-neutral-400 font-light">-</span>;
        if (typeof value === 'boolean') return value ? 'Tak' : 'Nie';
        const lowerKey = key.toLowerCase();
        if (lowerKey.endsWith('date') || lowerKey.endsWith('at') || lowerKey === 'date') return formatFullDate(value);
        if (Array.isArray(value)) return value.join(', ');
        return String(value);
    };

    const keys = Object.keys(data).filter(k => !excludeKeys.includes(k));

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            footer={customFooter || <Button onClick={onClose}>Zamknij</Button>}
            maxWidth={maxWidth}
        >
            <div className="space-y-4 px-6">
                <div className="grid grid-cols-1 gap-y-3">
                    {keys.map(key => {
                        const isHtmlField = htmlFields.includes(key);
                        const value = data[key];

                        return (
                            <div key={key} className={`py-2 border-b border-neutral-100 last:border-0 ${isHtmlField ? 'block' : 'flex flex-col sm:flex-row sm:justify-between'}`}>
                                <span className="text-sm text-neutral-500 font-medium mb-1 sm:mb-0">
                                    {labels[key] || key}
                                </span>
                                {isHtmlField ? (
                                    <div className="text-sm text-neutral-800 mt-2" dangerouslySetInnerHTML={{ __html: value || '' }} />
                                ) : (
                                    <span className="text-sm text-neutral-800 font-semibold text-right break-words max-w-xs">
                                        {formatValue(key, value)}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </Modal>
    );
};

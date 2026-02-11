import { useState, useEffect } from 'react';
import { api } from '../../services/apiService';
import { Modal } from '../modals/Modal';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Check, X, Undo2 } from 'lucide-react';
import { formatDateTime, formatDateOnly } from '../../utils/formatters';
import { getExcuseStatusBadge } from '../../utils/helpers';
import type { ExcuseDetails } from '../../types';

interface ExcuseDetailModalProps {
    excuseId: number | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdated: () => void;
}

export const ExcuseDetailModal = ({ excuseId, isOpen, onClose, onUpdated }: ExcuseDetailModalProps) => {
    const [excuse, setExcuse] = useState<ExcuseDetails | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen || !excuseId) { setExcuse(null); return; }
        setLoading(true);
        api.excuses.getById(excuseId)
            .then(data => {
                setExcuse(data);
            })
            .finally(() => setLoading(false));
    }, [isOpen, excuseId]);

    const handleAccept = async (isAccepted: boolean | null) => {
        if (!excuse) return;
        await api.excuses.accept(excuse.id, isAccepted);
        onUpdated();
        const updated = await api.excuses.getById(excuse.id);
        setExcuse(updated);
    };



    const handleClose = () => {
        onClose();
    };

    const footer = excuse?.isAccepted === null ? (
        <>
            <Button variant="danger" onClick={() => handleAccept(false)}><X size={14} /> Odrzuć</Button>
            <Button onClick={() => handleAccept(true)}><Check size={14} /> Zaakceptuj</Button>
        </>
    ) : (
        <Button variant="soft" onClick={() => handleAccept(null)}><Undo2 size={14} /> Cofnij decyzję</Button>
    );

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={'Szczegóły usprawiedliwienia'} maxWidth="lg" footer={excuse ? footer : undefined}>
            {loading ? <LoadingSpinner className="py-8" /> : excuse && (
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><span className="text-neutral-500">Uczeń:</span> <span className="font-medium">{excuse.studentName}</span></div>
                        <div><span className="text-neutral-500">Rodzic:</span> <span className="font-medium">{excuse.parentName}</span></div>
                        <div>
                            <span className="text-neutral-500">Status:</span>{' '}
                            {getExcuseStatusBadge(excuse.isAccepted)}
                        </div>
                        <div><span className="text-neutral-500">Data zgłoszenia:</span> <span className="font-medium">{formatDateTime(excuse.createdAt)}</span></div>
                        {excuse.acceptedAt && (
                            <div><span className="text-neutral-500">Rozpatrzono:</span> <span className="font-medium">{formatDateTime(excuse.acceptedAt)}</span></div>
                        )}
                        {excuse.modifiedByName && (
                            <div><span className="text-neutral-500">Rozpatrzył:</span> <span className="font-medium">{excuse.modifiedByName}</span></div>
                        )}
                    </div>
                    <div className="text-sm">
                        <span className="text-neutral-500">Powód:</span>
                        <p className="mt-1 p-3 bg-neutral-50 rounded text-neutral-800">{excuse.reason}</p>
                    </div>
                    {excuse.attendances?.length > 0 && (
                        <div className="border-t pt-4">
                            <h3 className="text-sm font-semibold text-neutral-700 mb-3">Powiązane nieobecności</h3>
                            <table className="w-full text-sm border-collapse">
                                <thead className="bg-neutral-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-medium text-neutral-600">Data</th>
                                        <th className="px-3 py-2 text-left font-medium text-neutral-600">Przedmiot</th>
                                        <th className="px-3 py-2 text-left font-medium text-neutral-600">Lekcja</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100">
                                    {excuse.attendances.map(a => (
                                        <tr key={a.id}>
                                            <td className="px-3 py-2">{formatDateOnly(a.date)}</td>
                                            <td className="px-3 py-2">{a.subjectName}</td>
                                            <td className="px-3 py-2">{a.lessonHour}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
};

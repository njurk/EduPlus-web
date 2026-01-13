import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import type { Ticket } from '../../types';
import { formatDate } from '../../utils/formatters';
import { User, MessageSquare, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import { api } from '../../services/apiService';

interface TicketDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    ticket: Ticket | null;
    onTicketClosed: () => void;
}

export const TicketDetailsModal = ({ isOpen, onClose, ticket, onTicketClosed }: TicketDetailsModalProps) => {
    const [adminResponse, setAdminResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!ticket) return null;

    const handleCloseTicket = async () => {
        if (!adminResponse.trim()) {
            setError("Wprowadź odpowiedź dla zgłaszającego");
            return;
        }

        if (!window.confirm("Czy na pewno chcesz zamknąć to zgłoszenie? Ta operacja jest nieodwracalna.")) return;

        setLoading(true);
        setError(null);
        try {
            await api.tickets.close(ticket.id, { adminResponse });
            onTicketClosed();
            onClose();
        } catch (e: any) {
            setError(e.message || "Błąd podczas zamykania zgłoszenia");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Zgłoszenie #${ticket.id}`}
            maxWidth="lg"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={loading}>Zamknij okno</Button>
                    {!ticket.isClosed && (
                        <Button onClick={handleCloseTicket} disabled={loading}>
                            {loading ? 'Zamykanie...' : 'Zamknij zgłoszenie'}
                        </Button>
                    )}
                </>
            }
        >
            <div className="space-y-6">

                <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                        <User className="text-neutral-400 mt-1" size={18} />
                        <div>
                            <div className="text-xs text-neutral-500 uppercase font-semibold">Zgłaszający</div>
                            <div className="font-medium text-neutral-900">{ticket.userFullName}</div>
                            <div className="text-sm text-neutral-500">{ticket.userEmail}</div>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Clock className="text-neutral-400 mt-1" size={18} />
                        <div>
                            <div className="text-xs text-neutral-500 uppercase font-semibold">Data utworzenia</div>
                            <div className="font-medium text-neutral-900">{formatDate(ticket.createdAt)}</div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={clsx("text-xs px-2 py-0.5 rounded-full border", ticket.isClosed ? "bg-neutral-100 text-neutral-600 border-neutral-200" : "bg-warning-light text-warning-dark border-warning-light")}>
                                    {ticket.isClosed ? 'Zamknięte' : 'Otwarte'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <div className="text-xs text-neutral-500 uppercase font-semibold mb-2 flex items-center gap-2">
                        <MessageSquare size={14} /> Treść zgłoszenia
                    </div>
                    <div className="bg-white p-4 rounded border border-neutral-200 text-neutral-800 whitespace-pre-wrap">
                        <div className="font-bold mb-2 text-lg">{ticket.subject}</div>

                    </div>
                </div>


                {ticket.isClosed ? (
                    <div className="bg-success-light/30 border border-success-light p-4 rounded-lg">
                        <div className="flex items-center gap-2 text-success-dark font-bold mb-2">
                            <CheckCircle size={18} /> Rozwiązanie
                        </div>
                        <div className="text-neutral-700 whitespace-pre-wrap">{ticket.adminResponse}</div>
                        <div className="mt-2 text-xs text-neutral-500 text-right">
                            Zamknięto: {formatDate(ticket.closedAt)}
                        </div>
                    </div>
                ) : (
                    <div>
                        <div className="text-xs text-neutral-500 uppercase font-semibold mb-2">Twoja odpowiedź</div>
                        <textarea
                            className={clsx(
                                "w-full p-3 border rounded-md min-h-[120px] focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all",
                                error ? "border-danger" : "border-neutral-300"
                            )}
                            placeholder="Opisz rozwiązanie problemu lub odpowiedź dla użytkownika..."
                            value={adminResponse}
                            onChange={(e) => { setAdminResponse(e.target.value); setError(null); }}
                            disabled={loading}
                        />
                        {error && (
                            <div className="mt-2 flex items-center gap-2 text-danger text-sm">
                                <AlertCircle size={16} /> {error}
                            </div>
                        )}
                        <div className="text-xs text-neutral-500 mt-2">
                            Zamknięcie zgłoszenia wyśle automatyczną wiadomość email do użytkownika.
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

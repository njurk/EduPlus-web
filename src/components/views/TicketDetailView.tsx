import { Mail, Tag, Calendar, ArrowLeft } from 'lucide-react';
import type { Ticket } from '../../types';
import { formatDateTime } from '../../utils/formatters';

interface TicketDetailViewProps {
    ticket: Ticket;
    title: string;
    onBack: () => void;
    extraDetailsItems?: React.ReactNode;
    children: React.ReactNode;
}

export const TicketDetailView = ({
    ticket,
    title,
    onBack,
    extraDetailsItems,
    children
}: TicketDetailViewProps) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="text-neutral-500 hover:text-primary transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-xl font-bold text-neutral-800">{title}</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <div className="bg-white border border-neutral-200 rounded-lg p-6 space-y-4">
                        <h2 className="font-semibold text-neutral-800 border-b pb-2">Szczegóły</h2>

                        <div className="flex items-start gap-3">
                            <Mail size={16} className="text-neutral-400 mt-0.5" />
                            <div>
                                <p className="text-xs text-neutral-500">Email</p>
                                <p className="text-sm font-medium text-neutral-800">{ticket.email}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Tag size={16} className="text-neutral-400 mt-0.5" />
                            <div>
                                <p className="text-xs text-neutral-500">Powód</p>
                                <p className="text-sm font-medium text-neutral-800">{ticket.reasonName}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Calendar size={16} className="text-neutral-400 mt-0.5" />
                            <div>
                                <p className="text-xs text-neutral-500">Data zgłoszenia</p>
                                <p className="text-sm font-medium text-neutral-800">{formatDateTime(ticket.createdAt)}</p>
                            </div>
                        </div>

                        {extraDetailsItems}
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white border border-neutral-200 rounded-lg p-6">
                        <h2 className="font-semibold text-neutral-800 border-b pb-2 mb-4">Treść zgłoszenia</h2>
                        <div>
                            <p className="text-sm text-neutral-700 whitespace-pre-wrap">{ticket.content}</p>
                        </div>
                    </div>

                    {children}
                </div>
            </div>
        </div>
    );
};

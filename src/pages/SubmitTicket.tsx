import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/apiService';
import type { TicketReason } from '../types';
import { AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { validateTicketForm } from '../utils/validation';
import { useCMSContent } from '../hooks/useCMSContent';
import { Editor } from 'primereact/editor';

export const SubmitTicket = () => {
    const { getText } = useCMSContent('submitTicket');
    const navigate = useNavigate();
    const [reasons, setReasons] = useState<TicketReason[]>([]);
    const [email, setEmail] = useState('');
    const [reasonId, setReasonId] = useState<number | ''>('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        api.ticketReasons.getAll().then(setReasons).catch(console.error);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const validationError = validateTicketForm(email, reasonId, content);
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        try {
            await api.tickets.create({ email, reasonId: Number(reasonId), content });
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Wystąpił błąd podczas wysyłania zgłoszenia');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-sm shadow-sm p-8 max-w-md w-full text-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-neutral-800 mb-2">Zgłoszenie wysłane</h1>
                    <p className="text-neutral-600 mb-6">{getText('success.message')}</p>
                    <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                        <ArrowLeft size={16} /> Powrót
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-sm shadow-sm p-8 max-w-lg w-full">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline mb-4"
                >
                    <ArrowLeft size={16} /> Powrót
                </button>

                <h1 className="text-2xl font-bold text-neutral-800 mb-2">{getText('title')}</h1>
                <p className="text-neutral-600 mb-6 text-sm">{getText('subtitle')}</p>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-sm flex items-center gap-2 text-sm">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="jankowalski@gmail.com"
                            className="w-full px-3 py-2 border border-neutral-300 rounded-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Powód zgłoszenia</label>
                        <select
                            value={reasonId}
                            onChange={(e) => setReasonId(e.target.value ? Number(e.target.value) : '')}
                            className="w-full px-3 py-2 border border-neutral-300 rounded-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none bg-white"
                            disabled={loading}
                        >
                            <option value="">Wybierz powód...</option>
                            {reasons.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">{getText('form.description')}</label>
                        <Editor
                            value={content}
                            onTextChange={(e) => setContent(e.htmlValue || '')}
                            style={{ height: '200px' }}
                            placeholder={getText('form.descriptionPlaceholder')}
                            headerTemplate={
                                <span className="ql-formats">
                                    <button className="ql-bold" aria-label="Bold"></button>
                                    <button className="ql-italic" aria-label="Italic"></button>
                                    <button className="ql-underline" aria-label="Underline"></button>
                                    <button className="ql-list" value="ordered" aria-label="Ordered List"></button>
                                    <button className="ql-list" value="bullet" aria-label="Bullet List"></button>
                                    <button className="ql-link" aria-label="Link"></button>
                                </span>
                            }
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 bg-primary text-white font-medium rounded-sm hover:bg-primary-dark transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Wysyłanie...' : 'Wyślij zgłoszenie'}
                    </button>
                </form>
            </div>
        </div>
    );
};

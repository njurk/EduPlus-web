import { useState, useEffect } from 'react';
import { api } from '../services/apiService';
import type { TicketReason } from '../types';
import { AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { REGEX } from '../utils/validation';

export const SubmitTicket = () => {
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

        if (!email.trim() || !reasonId || !content.trim()) {
            setError('Wszystkie pola są wymagane');
            return;
        }

        if (!REGEX.EMAIL.test(email)) {
            setError('Podaj poprawny adres email');
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
            <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-neutral-800 mb-2">Zgłoszenie wysłane</h1>
                    <p className="text-neutral-600 mb-6">Twoje zgłoszenie zostało przyjęte. Odpowiedź otrzymasz na podany adres email.</p>
                    <Link to="/login" className="inline-flex items-center gap-2 text-primary hover:underline">
                        <ArrowLeft size={16} /> Powrót do strony logowania
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full">
                <Link to="/login" className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-primary mb-6">
                    <ArrowLeft size={16} /> Powrót do logowania
                </Link>

                <h1 className="text-2xl font-bold text-neutral-800 mb-2">Zgłoś problem</h1>
                <p className="text-neutral-600 mb-6 text-sm">Masz problem z logowaniem lub chcesz zgłosić inny problem? Wypełnij formularz poniżej.</p>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Twój adres email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="nazwa@example.com"
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Powód zgłoszenia</label>
                        <select
                            value={reasonId}
                            onChange={(e) => setReasonId(e.target.value ? Number(e.target.value) : '')}
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none bg-white"
                            disabled={loading}
                        >
                            <option value="">Wybierz powód...</option>
                            {reasons.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Opis problemu</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Opisz szczegółowo problem, z którym się spotykasz..."
                            rows={5}
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none resize-none"
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Wysyłanie...' : 'Wyślij zgłoszenie'}
                    </button>
                </form>
            </div>
        </div>
    );
};

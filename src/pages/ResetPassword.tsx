import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { PasswordInput } from '../components/ui/PasswordInput';
import { AlertCircle, CheckCircle, ArrowLeft, Mail } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { isPasswordValid } from '../utils/validation';

const API_URL = 'http://localhost:5107/api';

export const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [step, setStep] = useState<'request' | 'reset' | 'sent'>('request');
    const [email, setEmail] = useState('');
    const token = searchParams.get('token');
    const emailParam = searchParams.get('email');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (token) {
            setStep('reset');
            if (emailParam) setEmail(emailParam);
        }
    }, [token, emailParam]);

    const handleRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/PasswordReset/request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            if (!response.ok) {
                const text = await response.text();
                let errorMsg = "Błąd wysyłania żądania";
                try {
                    const json = JSON.parse(text);
                    errorMsg = json.message || json.title || text;
                } catch {
                    errorMsg = text || errorMsg;
                }
                throw new Error(errorMsg);
            }

            setStep('sent');
        } catch (err: any) {
            if (err.message.includes('fetch') || err.message.includes('network') || err.message.includes('ERR_')) {
                setError("Nie można połączyć się z serwerem");
            } else {
                setStep('sent');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Hasła nie są identyczne");
            return;
        }

        if (!isPasswordValid(password)) {
            setError("Hasło nie spełnia wszystkich wymagań (min. 8 znaków, duża litera, cyfra, znak specjalny)");
            return;
        }

        setError(null);
        setSuccess(null);
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/PasswordReset/reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword: password })
            });

            if (!response.ok) {
                const text = await response.text();
                let errorMsg = "Błąd resetowania hasła";
                try {
                    const json = JSON.parse(text);
                    errorMsg = json.message || json.title || text;
                } catch {
                    if (text.includes('expired') || text.includes('wygasł')) {
                        errorMsg = "Link do resetu hasła wygasł";
                    } else if (text.includes('invalid') || text.includes('nieprawidłowy')) {
                        errorMsg = "Nieprawidłowy link do resetu hasła";
                    } else {
                        errorMsg = text || errorMsg;
                    }
                }
                throw new Error(errorMsg);
            }

            setSuccess("Hasło zmienione pomyślnie");
            setTimeout(() => navigate('/login'), 2500);
        } catch (err: any) {
            if (err.message.includes('fetch') || err.message.includes('network') || err.message.includes('ERR_')) {
                setError("Nie można połączyć się z serwerem");
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4 font-sans">
            <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md border border-neutral-200">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-neutral-800">EduPlus</h1>
                    <p className="text-neutral-500 mt-1">
                        {step === 'request' && 'Resetowanie hasła'}
                        {step === 'sent' && 'Sprawdź swoją skrzynkę'}
                        {step === 'reset' && 'Ustaw nowe hasło'}
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-danger-light text-danger-text rounded flex items-start gap-2 text-sm">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="mb-4 p-3 bg-success-light text-success-dark rounded flex items-center gap-2 text-sm">
                        <CheckCircle size={16} /> {success}
                    </div>
                )}

                {step === 'request' && (
                    <form onSubmit={handleRequest} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
                            <Input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="example@gmail.com"
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full justify-center" disabled={loading}>
                            {loading ? 'Wysyłanie...' : 'Wyślij link'}
                        </Button>
                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => navigate('/login')}
                                className="text-sm text-primary hover:underline flex items-center justify-center gap-1 mx-auto"
                            >
                                <ArrowLeft size={14} /> Powrót
                            </button>
                        </div>
                    </form>
                )}

                {step === 'sent' && (
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mx-auto">
                            <Mail size={32} className="text-primary" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-neutral-700">
                                Jeśli adres <strong>{email}</strong> istnieje w naszej bazie, za chwilę otrzymasz wiadomość z linkiem do resetowania hasła.
                            </p>
                            <p className="text-sm text-neutral-500">
                                Link wygasa po 1 godzinie
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="text-sm text-primary hover:underline flex items-center justify-center gap-1 mx-auto mt-4"
                        >
                            <ArrowLeft size={14} /> Powrót
                        </button>
                    </div>
                )}

                {step === 'reset' && (
                    <form onSubmit={handleReset} className="space-y-4">
                        <input type="hidden" value={email} />
                        <PasswordInput
                            label="Nowe hasło"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            showRules
                        />
                        <PasswordInput
                            label="Powtórz hasło"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            required
                        />
                        <Button type="submit" className="w-full justify-center" disabled={loading}>
                            {loading ? 'Zapisywanie...' : 'Zmień hasło'}
                        </Button>
                    </form>
                )}
            </div>
        </div>
    );
};

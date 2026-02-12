import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { PasswordInput } from '../components/ui/PasswordInput';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { isPasswordValid } from '../utils/validation';
import { authApi } from '../services/apiService';
import { useCMSContent } from '../hooks/useCMSContent';

type Step = 'email' | 'code' | 'password' | 'done';

export const ResetPassword = () => {
    const { getText } = useCMSContent('resetPassword');
    const { getText: getSystemText } = useCMSContent('system');
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await authApi.requestPasswordReset(email);
        } catch (err: any) {
            if (err.message.includes('fetch') || err.message.includes('network') || err.message.includes('ERR_')) {
                setError("Nie można połączyć się z serwerem");
                setLoading(false);
                return;
            }
        }
        setLoading(false);
        setStep('code');
    };

    const handleValidateCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (code.trim().length !== 6) {
            setError('Kod musi mieć 6 cyfr');
            return;
        }
        setError(null);
        setLoading(true);
        try {
            await authApi.validateResetCode(code.trim());
            setStep('password');
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

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isPasswordValid(password)) {
            setError("Hasło nie spełnia wszystkich wymagań (min. 8 znaków, duża litera, cyfra, znak specjalny)");
            return;
        }
        if (password !== confirmPassword) {
            setError("Hasła nie są identyczne");
            return;
        }
        setError(null);
        setLoading(true);
        try {
            await authApi.resetPassword(code.trim(), password);
            setStep('done');
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

    const handleBack = () => {
        setError(null);
        if (step === 'email') navigate('/login');
        else if (step === 'code') setStep('email');
        else if (step === 'password') setStep('code');
    };

    return (
        <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4 font-sans">
            <div className="bg-white p-8 rounded-sm shadow-sm w-full max-w-md border border-neutral-200 relative">
                {step !== 'done' && (
                    <button
                        type="button"
                        onClick={handleBack}
                        className="absolute top-4 left-4 p-2 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 rounded-full transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                )}
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-neutral-800">{getSystemText('systemName')}</h1>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-danger-light text-danger-text rounded flex items-start gap-2 text-sm">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                {step === 'email' && (
                    <form onSubmit={handleRequest} className="space-y-4">
                        <p className="text-sm text-neutral-500 text-center mb-2">{getText('subtitle')}</p>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
                            <Input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="jankowalski@gmail.com"
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full justify-center" disabled={loading}>
                            {loading ? 'Wysyłanie...' : 'Wyślij kod'}
                        </Button>
                    </form>
                )}

                {step === 'code' && (
                    <form onSubmit={handleValidateCode} className="space-y-4">
                        <p className="text-sm text-neutral-500 text-center mb-2">
                            {getText('message.codeSent').replace('{email}', email)}
                        </p>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">Kod z emaila</label>
                            <Input
                                type="text"
                                value={code}
                                onChange={e => setCode(e.target.value)}
                                placeholder="000000"
                                maxLength={6}
                                className="text-center text-2xl tracking-[0.5em]"
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full justify-center" disabled={loading}>
                            {loading ? 'Weryfikacja...' : 'Dalej'}
                        </Button>
                    </form>
                )}

                {step === 'password' && (
                    <form onSubmit={handleReset} className="space-y-4">
                        <p className="text-sm text-neutral-500 text-center mb-2">{getText('subtitle.reset')}</p>
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

                {step === 'done' && (
                    <div className="text-center space-y-4">
                        <p className="text-neutral-700">{getText('message.success')}</p>
                        <Button onClick={() => navigate('/login')} className="w-full justify-center">
                            Powrót
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { api } from '../services/apiService';
import { AlertCircle, Lock, Mail } from 'lucide-react';
import { useCMSContent } from '../hooks/useCMSContent';

export const Login = () => {
    const { getText } = useCMSContent('login');
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await api.auth.login(formData);
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify({
                id: response.userId,
                name: response.userName,
                roles: response.roles
            }));

            navigate('/');

        } catch (err: any) {
            setError(err.message || 'Wystąpił błąd logowania');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-100 px-4 font-sans">
            <div className="max-w-md w-full bg-white rounded-s shadow-lg border border-neutral-200 overflow-hidden">
                <div className="bg-neutral-900 p-8 text-center">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <img
                            src={'/' + getText('logoUrl')}
                            alt={getText('logoAlt')}
                            className="w-14 h-14 object-contain"
                        />
                    </div>
                    <h1 className="text-2xl font-bold text-white">{getText('title')}</h1>
                </div>
                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-danger-light/50 text-danger-text text-sm p-3 rounded-md flex items-center gap-2">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1 ml-1">{getText('form.email')}</label>
                            <div className="relative">
                                <div className="absolute left-3 top-2.5 text-neutral-400">
                                    <Mail size={18} />
                                </div>
                                <Input
                                    className="pl-10"
                                    placeholder="example@gmail.com"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1 ml-1">{getText('form.password')}</label>
                            <div className="relative">
                                <div className="absolute left-3 top-2.5 text-neutral-400">
                                    <Lock size={18} />
                                </div>
                                <Input
                                    className="pl-10"
                                    placeholder="********"
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="text-right mt-1">
                                <Link to="/reset-password" className="text-xs text-primary hover:text-primary-hover hover:underline">
                                    {getText('form.forgotPassword')}
                                </Link>
                            </div>
                        </div>
                        <Button
                            className="w-full py-3 text-base justify-center mt-4"
                            disabled={loading}
                        >
                            {loading ? 'Logowanie...' : getText('button.login')}
                        </Button>
                    </form>
                </div>
                <div className="bg-neutral-50 p-4 text-center border-t border-neutral-100">
                    <p className="text-xs text-neutral-500">
                        &copy; {new Date().getFullYear()} {getText('footer')}
                    </p>
                </div>
            </div>
        </div>
    );
};
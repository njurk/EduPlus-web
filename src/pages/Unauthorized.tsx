import { useNavigate } from 'react-router-dom';
import { ShieldX } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const Unauthorized = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-100 font-sans">
            <div className="bg-white p-8 rounded-xs shadow-sm text-center max-w-md">
                <ShieldX className="mx-auto text-danger mb-4" size={48} />
                <h1 className="text-xl font-bold text-neutral-800 mb-2">Brak dostępu</h1>
                <p className="text-neutral-500 text-sm mb-6">
                    Nie masz uprawnień do wyświetlenia tej strony
                </p>
                <Button onClick={handleLogout}>Wyloguj się</Button>
            </div>
        </div>
    );
};

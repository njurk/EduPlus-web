import { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { api } from '../services/apiService';
import { Save, User, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import type { User as UserType, ChangePasswordDto, UserUpdateDto } from '../types';
import { PasswordInput } from '../components/ui/PasswordInput';
import { validateUserProfileUpdate, validatePasswordChange } from '../utils/validation';

export const Settings = () => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [profileData, setProfileData] = useState<UserType>({} as UserType);
    const [passwordData, setPasswordData] = useState<ChangePasswordDto & { confirmPassword: string }>({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;

            const parsedUser = JSON.parse(savedUser);
            setLoading(true);
            const userData = await api.users.get(parsedUser.id);
            setProfileData(userData);
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'Nie udało się pobrać danych profilu.' });
        } finally {
            setLoading(false);
        }
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        const roleIds = profileData.userRoles?.map((ur: any) => ur.roleId) || [];
        
        const updatePayload: UserUpdateDto = {
            firstName: profileData.firstName,
            lastName: profileData.lastName,
            email: profileData.email,
            phone: profileData.phone || undefined,
            street: profileData.street || undefined,
            city: profileData.city || undefined,
            postalCode: profileData.postalCode || undefined,
            isActive: true,
            roleIds: roleIds,
        };

        const validationError = validateUserProfileUpdate(updatePayload);
        if (validationError) {
            setMessage({ type: 'error', text: validationError });
            return;
        }

        setLoading(true);

        try {
            await api.users.update(profileData.id, updatePayload as any);

            const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
            localStorage.setItem('user', JSON.stringify({ 
                ...savedUser, 
                name: `${profileData.lastName} ${profileData.firstName}` 
            }));

            setMessage({ type: 'success', text: 'Dane profilowe zostały zaktualizowane.' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Wystąpił błąd podczas zapisu danych.' });
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        const validationError = validatePasswordChange(passwordData);
        if (validationError) {
            setMessage({ type: 'error', text: validationError });
            return;
        }

        setLoading(true);
        try {
            await api.users.changePassword(profileData.id, {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });

            setMessage({ type: 'success', text: 'Hasło zostało zmienione.' });
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            let errorMsg = "Nie udało się zmienić hasła.";
            if (error.message) errorMsg = error.message.replace(/^"|"$/g, '');
            setMessage({ type: 'error', text: errorMsg });
        } finally {
            setLoading(false);
        }
    };

    if (!profileData.id) return null;

    return (
        <div className="max-w-2xl mx-auto font-sans space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-neutral-800">Ustawienia konta</h1>
            </div>

            {message && (
                <div className={`p-4 rounded-md flex items-center gap-2 text-sm ${message.type === 'success' ? 'bg-success-light text-success-text' : 'bg-danger-light text-danger-text'}`}>
                    {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    {message.text}
                </div>
            )}

            <div className="space-y-8">
                <div className="bg-white border border-neutral-200 rounded shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50 flex items-center gap-2">
                        <User className="text-primary" size={20} />
                        <h2 className="text-lg font-semibold text-neutral-800">Dane osobowe</h2>
                    </div>

                    <form onSubmit={handleProfileUpdate} className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="firstName" className="label-text">Imię</label>
                                <Input
                                    id="firstName"
                                    value={profileData.firstName || ''}
                                    onChange={e => setProfileData({ ...profileData, firstName: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="lastName" className="label-text">Nazwisko</label>
                                <Input
                                    id="lastName"
                                    value={profileData.lastName || ''}
                                    onChange={e => setProfileData({ ...profileData, lastName: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="email" className="label-text">Email</label>
                            <p className='text-xs mb-1 text-neutral-400'>brak możliwości zmiany</p>
                            <Input id="email" value={profileData.email || ''} disabled className="bg-neutral-50 text-neutral-500 cursor-not-allowed" />
                        </div>
                        <div>
                            <label htmlFor="phone" className="label-text">Telefon</label>
                            <Input
                                id="phone"
                                value={profileData.phone || ''}
                                onChange={e => setProfileData({ ...profileData, phone: e.target.value })}
                                placeholder="+48 000 000 000"
                            />
                        </div>
                        <div className="border-t border-neutral-100 pt-6">
                            <p className="text-xs font-bold text-neutral-500 uppercase mb-4 tracking-wider">Adres zamieszkania</p>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="street" className="label-text">Ulica i numer</label>
                                    <Input id="street" value={profileData.street || ''} onChange={e => setProfileData({ ...profileData, street: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="col-span-1">
                                        <label htmlFor="postalCode" className="label-text">Kod pocztowy</label>
                                        <Input 
                                            id="postalCode" 
                                            value={profileData.postalCode || ''} 
                                            onChange={e => setProfileData({ ...profileData, postalCode: e.target.value })} 
                                            placeholder="00-000"
                                            pattern="\d{2}-\d{3}"
                                            title="Format: XX-XXX"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label htmlFor="city" className="label-text">Miasto</label>
                                        <Input id="city" value={profileData.city || ''} onChange={e => setProfileData({ ...profileData, city: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button disabled={loading}>
                                <Save size={16} className="mr-2" /> Zapisz zmiany
                            </Button>
                        </div>
                    </form>
                </div>
                <div className="bg-white border border-neutral-200 rounded shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50 flex items-center gap-2">
                        <Lock className="text-primary" size={20} />
                        <h2 className="text-lg font-semibold text-neutral-800">Zmiana hasła</h2>
                    </div>
                    
                    <form onSubmit={handleChangePassword} className="p-6 space-y-6">
                        <div>
                            <label htmlFor="currentPassword" className="label-text">Aktualne hasło</label>
                            <Input
                                id="currentPassword"
                                type="password"
                                value={passwordData.currentPassword}
                                onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                required
                            />
                        </div>
                        
                        <PasswordInput
                            id="newPassword"
                            label="Nowe hasło"
                            value={passwordData.newPassword}
                            onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            required
                        />

                        <div>
                            <label htmlFor="confirmPassword" className="label-text">Potwierdź hasło</label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={passwordData.confirmPassword}
                                onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                required
                            />
                        </div>
                        
                        <div className="pt-4 flex justify-end">
                            <Button variant="secondary" disabled={loading}>
                                Zmień hasło
                            </Button>
                        </div>
                    </form>
                </div>

            </div>
        </div>
    );
};
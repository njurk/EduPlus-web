import { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { api } from '../services/apiService';
import { Save, User, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import type { User as UserType, ChangePasswordDto, UserUpdateDto } from '../types';
import { PasswordInput } from '../components/ui/PasswordInput';
import { validateUserProfileUpdate, validatePasswordChange, REGEX } from '../utils/validation';

export const Settings = () => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [profileData, setProfileData] = useState<UserType>({} as UserType);
    const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

    const [passwordData, setPasswordData] = useState<ChangePasswordDto & { confirmPassword: string }>({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

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

    const validateProfileField = (field: keyof UserType, value: string): string => {
        const val = value ? value.trim() : '';
        switch (field) {
            case 'firstName':
                return !val ? "Imię jest wymagane." : "";
            case 'lastName':
                return !val ? "Nazwisko jest wymagane." : "";
            case 'postalCode':
                return (val && !REGEX.POSTAL_CODE.test(val)) ? "Niepoprawny format" : "";
            case 'phone':
                return (val && !REGEX.PHONE.test(val)) ? "Nieprawidłowy numer telefonu." : "";
            default:
                return "";
        }
    };

    const handleProfileChange = (field: keyof UserType, value: string) => {
        setProfileData(prev => ({ ...prev, [field]: value }));

        const error = validateProfileField(field, value);

        setProfileErrors(prev => {
            const newErrors = { ...prev };
            if (error) {
                newErrors[field as string] = error;
            } else {
                delete newErrors[field as string];
            }
            return newErrors;
        });
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        const updateData: Partial<UserUpdateDto> = {
            firstName: profileData.firstName,
            lastName: profileData.lastName,
            email: profileData.email,
            phone: profileData.phone,
            street: profileData.street,
            city: profileData.city,
            postalCode: profileData.postalCode,
            roleIds: profileData.userRoles?.map((ur: any) => ur.roleId) || [],
            isActive: true
        };

        const errors = validateUserProfileUpdate(updateData);
        if (Object.keys(errors).length > 0) {
            setProfileErrors(errors);
            setMessage({ type: 'error', text: 'Popraw błędy w formularzu.' });
            return;
        }

        const apiPayload = {
            ...updateData,
            phone: updateData.phone || undefined,
            street: updateData.street || undefined,
            city: updateData.city || undefined,
            postalCode: updateData.postalCode || undefined
        };

        setLoading(true);

        try {
            await api.users.update(profileData.id, apiPayload as any);

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

    const handlePasswordInputChange = (field: string, value: string) => {
        const newData = { ...passwordData, [field]: value };
        setPasswordData(newData);

        const newErrors = { ...passwordErrors };
        delete newErrors[field];

        if (field === 'currentPassword') {
            if (!value) newErrors.currentPassword = "Wprowadź aktualne hasło.";
        }

        if (field === 'newPassword' || field === 'confirmPassword') {
            if (newData.newPassword && newData.confirmPassword) {
                if (newData.newPassword !== newData.confirmPassword) {
                    newErrors.confirmPassword = "Hasła nie są identyczne.";
                } else {
                    delete newErrors.confirmPassword;
                }
            } else {
                delete newErrors.confirmPassword;
            }
        }
        setPasswordErrors(newErrors);
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setPasswordErrors({});

        const errors = validatePasswordChange(passwordData);
        if (Object.keys(errors).length > 0) {
            setPasswordErrors(errors);
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
                <h1 className="text-xl font-bold text-neutral-800">Ustawienia konta</h1>
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
                        <h2 className="text-base font-semibold text-neutral-800">Dane osobowe</h2>
                    </div>
                    <form onSubmit={handleProfileUpdate} className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="firstName" className="label-text">Imię</label>
                                <Input
                                    id="firstName"
                                    value={profileData.firstName || ''}
                                    onChange={e => handleProfileChange('firstName', e.target.value)}
                                    className={profileErrors.firstName ? 'border-danger' : ''}
                                />
                                {profileErrors.firstName && <p className="text-xs text-danger mt-1">{profileErrors.firstName}</p>}
                            </div>
                            <div>
                                <label htmlFor="lastName" className="label-text">Nazwisko</label>
                                <Input
                                    id="lastName"
                                    value={profileData.lastName || ''}
                                    onChange={e => handleProfileChange('lastName', e.target.value)}
                                    className={profileErrors.lastName ? 'border-danger' : ''}
                                />
                                {profileErrors.lastName && <p className="text-xs text-danger mt-1">{profileErrors.lastName}</p>}
                            </div>
                        </div>
                        <div>
                            <label htmlFor="email" className="label-text">Email</label>                            <Input id="email" value={profileData.email || ''} disabled className="bg-neutral-50 text-neutral-500 cursor-not-allowed" />
                        </div>
                        <div>
                            <label htmlFor="phone" className="label-text">Telefon</label>
                            <Input
                                id="phone"
                                value={profileData.phone || ''}
                                onChange={e => handleProfileChange('phone', e.target.value)}
                                placeholder="123 456 789"
                                className={profileErrors.phone ? 'border-danger' : ''}
                            />
                            {profileErrors.phone && <p className="text-xs text-danger mt-1">{profileErrors.phone}</p>}
                        </div>
                        <div className="border-t border-neutral-100 pt-6">
                            <p className="text-xs font-bold text-neutral-500 uppercase mb-4 tracking-wider">Adres zamieszkania</p>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="street" className="label-text">Ulica i numer</label>
                                    <Input id="street" value={profileData.street || ''} onChange={e => handleProfileChange('street', e.target.value)} />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="col-span-1">
                                        <label htmlFor="postalCode" className="label-text">Kod pocztowy</label>
                                        <Input
                                            id="postalCode"
                                            value={profileData.postalCode || ''}
                                            onChange={e => handleProfileChange('postalCode', e.target.value)}
                                            placeholder="00-000"
                                            className={profileErrors.postalCode ? 'border-danger' : ''}
                                        />
                                        {profileErrors.postalCode && <p className="text-xs text-danger mt-1">{profileErrors.postalCode}</p>}
                                    </div>
                                    <div className="col-span-2">
                                        <label htmlFor="city" className="label-text">Miasto</label>
                                        <Input id="city" value={profileData.city || ''} onChange={e => handleProfileChange('city', e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="pt-4 flex justify-end">
                            <Button disabled={loading}>
                                <Save size={16} className="mr-2" /> Zapisz
                            </Button>
                        </div>
                    </form>
                </div>
                <div className="bg-white border border-neutral-200 rounded shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50 flex items-center gap-2">
                        <Lock className="text-primary" size={20} />
                        <h2 className="text-base font-semibold text-neutral-800">Zmiana hasła</h2>
                    </div>
                    <form onSubmit={handleChangePassword} className="p-6 space-y-6">
                        <div>
                            <label htmlFor="currentPassword" className="label-text">Aktualne hasło</label>
                            <Input
                                id="currentPassword"
                                type="password"
                                value={passwordData.currentPassword}
                                onChange={e => handlePasswordInputChange('currentPassword', e.target.value)}
                                className={passwordErrors.currentPassword ? 'border-danger' : ''}
                            />
                            {passwordErrors.currentPassword && <p className="text-xs text-danger mt-1">{passwordErrors.currentPassword}</p>}
                        </div>
                        <div>
                            <PasswordInput
                                id="newPassword"
                                label="Nowe hasło"
                                value={passwordData.newPassword}
                                onChange={e => handlePasswordInputChange('newPassword', e.target.value)}
                                className={passwordErrors.newPassword ? 'border-danger' : ''}
                                showRules
                            />
                            {passwordErrors.newPassword && <p className="text-xs text-danger mt-1">{passwordErrors.newPassword}</p>}
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className="label-text">Potwierdź hasło</label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={passwordData.confirmPassword}
                                onChange={e => handlePasswordInputChange('confirmPassword', e.target.value)}
                                className={passwordErrors.confirmPassword ? 'border-danger' : ''}
                            />
                            {passwordErrors.confirmPassword && <p className="text-xs text-danger mt-1">{passwordErrors.confirmPassword}</p>}
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

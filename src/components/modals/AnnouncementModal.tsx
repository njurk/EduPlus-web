import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { Announcement, Role } from '../../types';
import { api } from '../../services/apiService';
import { AlertCircle } from 'lucide-react';
import { Editor } from 'primereact/editor';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

interface AnnouncementModalProps {
    isOpen: boolean;
    onClose: () => void;
    announcement?: Announcement | null;
    onSaved: () => void;
}

export const AnnouncementModal = ({ isOpen, onClose, announcement, onSaved }: AnnouncementModalProps) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
    const [forAll, setForAll] = useState(true);
    const [allRoles, setAllRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api.roles.getAll().then(setAllRoles).catch(console.error);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setTitle(announcement?.title || '');
            setDescription(announcement?.description || '');
            setError(null);
            if (announcement?.targetRoles === 'Wszyscy' || !announcement) {
                setForAll(true);
                setSelectedRoleIds([]);
            } else {
                setForAll(false);
                const roleNames = announcement.targetRoles?.split(', ') || [];
                const roleIds = allRoles.filter(r => roleNames.includes(r.name)).map(r => r.id);
                setSelectedRoleIds(roleIds);
            }
        }
    }, [isOpen, announcement, allRoles]);

    const handleSave = async () => {
        if (!title.trim() || !description.trim()) {
            setError("Wypełnij wymagane pola");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const roleIds = forAll ? [] : selectedRoleIds;
            const payload = { title, description, roleIds };
            if (announcement) {
                await api.announcements.update(announcement.id, payload);
            } else {
                await api.announcements.create(payload);
            }
            onSaved();
            onClose();
        } catch (e: any) {
            setError(e.message || "Błąd zapisu");
        } finally {
            setLoading(false);
        }
    };

    const handleRoleToggle = (roleId: number) => {
        setSelectedRoleIds(prev =>
            prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
        );
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={announcement ? "Edycja ogłoszenia" : "Nowe ogłoszenie"}
            maxWidth="lg"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={loading}>Anuluj</Button>
                    <Button onClick={handleSave} disabled={loading}>{announcement ? 'Zapisz' : 'Utwórz'}</Button>
                </>
            }
        >
            <div className="space-y-4 px-6 py-4">
                {error && (
                    <div className="p-3 bg-danger-light text-danger-text text-sm rounded flex items-center gap-2">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Tytuł <span className="text-danger">*</span></label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tytuł ogłoszenia" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Treść <span className="text-danger">*</span></label>
                    <Editor
                        value={description}
                        onTextChange={(e) => setDescription(e.htmlValue || '')}
                        style={{ height: '250px' }}
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
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Adresaci</label>
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={forAll}
                                onChange={(e) => {
                                    setForAll(e.target.checked);
                                    if (e.target.checked) setSelectedRoleIds([]);
                                }}
                                className="w-4 h-4 text-primary border-neutral-300 rounded focus:ring-primary"
                            />
                            <span className="text-sm text-neutral-700 font-medium">Wszyscy</span>
                        </label>
                        <div className="pl-6 space-y-1">
                            {allRoles.map(role => (
                                <label key={role.id} className={`flex items-center gap-2 ${forAll ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                                    <input
                                        type="checkbox"
                                        checked={forAll || selectedRoleIds.includes(role.id)}
                                        onChange={() => handleRoleToggle(role.id)}
                                        disabled={forAll}
                                        className="w-4 h-4 text-primary border-neutral-300 rounded focus:ring-primary disabled:opacity-50"
                                    />
                                    <span className={`text-sm ${forAll ? 'text-neutral-400' : 'text-neutral-600'}`}>{role.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};


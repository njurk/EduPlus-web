import { useState, useEffect } from 'react';
import { api } from '../../services/apiService';
import type { Announcement, Role } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ArrowLeft, AlertCircle, User, Users, Calendar, Clock } from 'lucide-react';
import { formatDateTime } from '../../utils/formatters';
import { Editor } from 'primereact/editor';

const editorHeader = (
    <span className="ql-formats">
        <button className="ql-bold" aria-label="Bold"></button>
        <button className="ql-italic" aria-label="Italic"></button>
        <button className="ql-underline" aria-label="Underline"></button>
        <button className="ql-list" value="ordered" aria-label="Ordered List"></button>
        <button className="ql-list" value="bullet" aria-label="Bullet List"></button>
        <button className="ql-link" aria-label="Link"></button>
    </span>
);

interface AnnouncementDetailViewProps {
    announcement: Announcement | null;
    isEditMode: boolean;
    onBack: () => void;
    onSaved: () => void;
    showAdminFields?: boolean;
}

export const AnnouncementDetailView = ({ announcement, isEditMode, onBack, onSaved, showAdminFields = false }: AnnouncementDetailViewProps) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [forAll, setForAll] = useState(true);
    const [roleIds, setRoleIds] = useState<number[]>([]);
    const [allRoles, setAllRoles] = useState<Role[]>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api.roles.getAll().then(setAllRoles).catch(console.error);
    }, []);

    useEffect(() => {
        if (isEditMode) {
            setTitle(announcement?.title || '');
            setDescription(announcement?.description || '');
            setError(null);
            if (announcement?.targetRoles === 'Wszyscy' || !announcement) {
                setForAll(true);
                setRoleIds([]);
            } else {
                setForAll(false);
                const roleNames = announcement.targetRoles?.split(', ') || [];
                setRoleIds(allRoles.filter(r => roleNames.includes(r.name)).map(r => r.id));
            }
        }
    }, [isEditMode, announcement, allRoles]);

    const handleSave = async () => {
        if (!title.trim() || !description.trim()) {
            setError('Wypełnij wymagane pola');
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const payload = { title, description, roleIds: forAll ? [] : roleIds };
            if (announcement) {
                await api.announcements.update(announcement.id, payload);
            } else {
                await api.announcements.create(payload);
            }
            onSaved();
        } catch (e: any) {
            setError(e.message || 'Błąd zapisu');
        } finally {
            setSaving(false);
        }
    };

    const heading = isEditMode
        ? (announcement ? 'Edycja ogłoszenia' : 'Nowe ogłoszenie')
        : 'Szczegóły ogłoszenia';

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="text-neutral-500 hover:text-primary transition-colors"><ArrowLeft size={20} /></button>
                <h1 className="text-xl font-bold text-neutral-800">{heading}</h1>
            </div>
            {isEditMode && error && <div className="p-3 bg-danger-light text-danger-text text-sm rounded flex items-center gap-2"><AlertCircle size={16} /> {error}</div>}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <div className="bg-white border border-neutral-200 rounded-xs p-6 space-y-4">
                        <h2 className="font-semibold text-neutral-800 border-b pb-2">Szczegóły</h2>
                        {isEditMode ? (
                            <>
                                <div>
                                    <label className="block text-xs text-neutral-500 mb-1">Tytuł <span className="text-danger">*</span></label>
                                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tytuł ogłoszenia" />
                                </div>
                                <div>
                                    <label className="block text-xs text-neutral-500 mb-2">Adresaci</label>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={forAll} onChange={(e) => { setForAll(e.target.checked); if (e.target.checked) setRoleIds([]); }} className="w-4 h-4 text-primary border-neutral-300 rounded focus:ring-primary" />
                                            <span className="text-sm text-neutral-700 font-medium">Wszyscy</span>
                                        </label>
                                        <div className="pl-6 space-y-1">
                                            {allRoles.map(role => (
                                                <label key={role.id} className={`flex items-center gap-2 ${forAll ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                                                    <input type="checkbox" checked={forAll || roleIds.includes(role.id)} onChange={() => setRoleIds(prev => prev.includes(role.id) ? prev.filter(id => id !== role.id) : [...prev, role.id])} disabled={forAll} className="w-4 h-4 text-primary border-neutral-300 rounded focus:ring-primary disabled:opacity-50" />
                                                    <span className={`text-sm ${forAll ? 'text-neutral-400' : 'text-neutral-600'}`}>{role.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                {announcement && (
                                    <>
                                        <div className="flex items-start gap-3">
                                            <User size={16} className="text-neutral-400 mt-0.5" />
                                            <div><p className="text-xs text-neutral-500">Autor</p><p className="text-sm font-medium text-neutral-800">{announcement.authorName || '-'}</p></div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <Calendar size={16} className="text-neutral-400 mt-0.5" />
                                            <div><p className="text-xs text-neutral-500">Utworzono</p><p className="text-sm font-medium text-neutral-800">{formatDateTime(announcement.createdAt)}</p></div>
                                        </div>
                                    </>
                                )}
                            </>
                        ) : announcement && (
                            <>
                                <div className="flex items-start gap-3">
                                    <User size={16} className="text-neutral-400 mt-0.5" />
                                    <div><p className="text-xs text-neutral-500">Autor</p><p className="text-sm font-medium text-neutral-800">{announcement.authorName || '-'}</p></div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Users size={16} className="text-neutral-400 mt-0.5" />
                                    <div><p className="text-xs text-neutral-500">Adresaci</p><p className="text-sm font-medium text-neutral-800">{announcement.targetRoles || 'Wszyscy'}</p></div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Calendar size={16} className="text-neutral-400 mt-0.5" />
                                    <div><p className="text-xs text-neutral-500">Utworzono</p><p className="text-sm font-medium text-neutral-800">{formatDateTime(announcement.createdAt)}</p></div>
                                </div>
                                {showAdminFields && (
                                    <>
                                        <div className="flex items-start gap-3">
                                            <Clock size={16} className="text-neutral-400 mt-0.5" />
                                            <div><p className="text-xs text-neutral-500">Edytowano</p><p className="text-sm font-medium text-neutral-800">{formatDateTime(announcement.updatedAt)}</p></div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <User size={16} className="text-neutral-400 mt-0.5" />
                                            <div><p className="text-xs text-neutral-500">Edytowane przez</p><p className="text-sm font-medium text-neutral-800">{announcement.modifiedByName || 'System'}</p></div>
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
                <div className="lg:col-span-2">
                    <div className="bg-white border border-neutral-200 rounded-xs p-6">
                        {isEditMode ? (
                            <>
                                <div className="flex items-center justify-between border-b pb-2 mb-4">
                                    <h2 className="font-semibold text-neutral-800">Treść <span className="text-danger">*</span></h2>
                                    <div className="flex gap-2">
                                        <Button variant="secondary" onClick={onBack} disabled={saving}>Anuluj</Button>
                                        <Button onClick={handleSave} disabled={saving}>{announcement ? 'Zapisz' : 'Utwórz'}</Button>
                                    </div>
                                </div>
                                <Editor value={description} onTextChange={(e) => setDescription(e.htmlValue || '')} style={{ height: '350px' }} headerTemplate={editorHeader} />
                            </>
                        ) : announcement && (
                            <>
                                <h2 className="font-semibold text-neutral-800 border-b pb-2 mb-4">{announcement.title}</h2>
                                <div className="html-content" dangerouslySetInnerHTML={{ __html: announcement.description }} />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

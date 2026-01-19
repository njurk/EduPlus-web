import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { Announcement } from '../../types';
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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setTitle(announcement?.title || '');
            setDescription(announcement?.description || '');
            setError(null);
        }
    }, [isOpen, announcement]);

    const handleSave = async () => {
        if (!title.trim() || !description.trim()) {
            setError("Wypełnij wymagane pola");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const payload = { title, description };
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
            </div>
        </Modal>
    );
};

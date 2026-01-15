import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Modal } from './Modal';
import { api } from '../../services/apiService';
import { Edit2, Trash2, Calendar, Tag, MessageSquare, Scale, User } from 'lucide-react';
import { clsx } from 'clsx';
import type { Grade, GradeType, GradeCategory, GradeDto } from '../../types';
import { validateGradeForm } from '../../utils/validation';
import { formatDate } from '../../utils/formatters';

interface GradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    studentId: number;
    subjectId: number;
    grade?: Grade & { teacherName?: string };
}

export const GradeModal = ({ isOpen, onClose, onSuccess, studentId, subjectId, grade }: GradeModalProps) => {
    const [types, setTypes] = useState<GradeType[]>([]);
    const [cats, setCats] = useState<GradeCategory[]>([]);
    const [isEditing, setIsEditing] = useState(!grade);
    const [formData, setFormData] = useState<Partial<GradeDto>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!isOpen) return;
        Promise.all([api.gradeTypes.getAll(), api.gradeCategories.getAll()])
            .then(([t, c]) => { setTypes(t); setCats(c); })
            .catch(console.error);

        setFormData({
            gradeTypeId: grade?.gradeTypeId,
            gradeCategoryId: grade?.gradeCategoryId,
            comment: grade?.comment || ''
        });
        setErrors({});
        setIsEditing(!grade);
    }, [isOpen, grade]);

    const handleSave = async () => {
        const payloadToValidate = { ...formData };
        const errs = validateGradeForm(payloadToValidate);
        if (Object.keys(errs).length) return setErrors(errs);

        const payload = {
            studentId: Number(studentId),
            subjectId: Number(subjectId),
            gradeTypeId: Number(formData.gradeTypeId),
            gradeCategoryId: Number(formData.gradeCategoryId),
            comment: formData.comment
        };

        try {
            grade ? await api.grades.update(grade.id, payload) : await api.grades.create(payload);
            onSuccess();
            onClose();
        } catch (e: any) {
            alert("Błąd zapisu: " + (e.message || "Nieznany błąd"));
        }
    };

    const handleDelete = async () => {
        if (confirm("Usunąć ocenę?")) {
            await api.grades.delete(grade!.id);
            onSuccess();
            onClose();
        }
    };

    const activeCategory = cats.find(c => c.id === (grade ? grade.gradeCategoryId : formData.gradeCategoryId));

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={!grade ? "Nowa ocena" : (isEditing ? "Edycja" : "Szczegóły")} maxWidth="sm"
            footer={isEditing ? (
                <div className="flex justify-between w-full">
                    <Button variant="secondary" onClick={() => grade ? setIsEditing(false) : onClose()}>Anuluj</Button>
                    <Button onClick={handleSave}>Zapisz</Button>
                </div>
            ) : <div className="flex justify-end w-full"><Button variant="secondary" onClick={onClose}>Zamknij</Button></div>}
        >
            <div className="p-6">
                {!isEditing && grade ? (
                    <div className="space-y-6">
                        <div className="flex justify-between items-start">
                            <div className="flex gap-4">
                                <div className="w-16 h-16 bg-primary text-white flex items-center justify-center text-3xl font-bold rounded-lg shadow-sm">
                                    {grade.gradeType?.numeric}
                                </div>
                                <div>
                                    <div className="text-xs text-neutral-500 uppercase font-bold tracking-wide">Ocena</div>
                                    <div className="font-semibold text-lg text-neutral-800">{grade.gradeType?.name}</div>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => setIsEditing(true)} className="p-2 hover:bg-neutral-100 rounded text-neutral-600 transition-colors"><Edit2 size={18} /></button>
                                <button onClick={handleDelete} className="p-2 hover:bg-danger-light/20 rounded text-danger transition-colors"><Trash2 size={18} /></button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 text-sm">
                            <div className="flex items-center gap-3">
                                <Tag size={16} className="text-neutral-400" />
                                <div><span className="text-xs text-neutral-500 block">Kategoria</span><span className="font-medium">{grade.gradeCategory?.name}</span></div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Scale size={16} className="text-neutral-400" />
                                <div><span className="text-xs text-neutral-500 block">Waga</span><span className="font-medium">{activeCategory?.weight ?? '-'}</span></div>
                            </div>
                            <div className="flex items-center gap-3">
                                <User size={16} className="text-neutral-400" />
                                <div><span className="text-xs text-neutral-500 block">Nauczyciel</span><span className="font-medium">{grade.teacherName || "Brak danych"}</span></div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Calendar size={16} className="text-neutral-400" />
                                <div><span className="text-xs text-neutral-500 block">Data wystawienia oceny</span><span className="font-medium">{formatDate(grade.createdAt)}</span></div>
                            </div>
                            <div className="flex items-start gap-3 pt-2 border-t border-neutral-200/50 mt-1">
                                <MessageSquare size={16} className="text-neutral-400 mt-1" />
                                <div className="flex-1">
                                    <span className="text-xs text-neutral-500 block">Komentarz</span>
                                    <span className={clsx("italic text-sm block break-words", !grade.comment && "text-neutral-400")}>
                                        {grade.comment ? `"${grade.comment}"` : "brak"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-neutral-700 mb-2 block">Ocena <span className="text-danger">*</span></label>
                            <div className="flex flex-wrap gap-1.5">
                                {types.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => { setFormData(p => ({ ...p, gradeTypeId: t.id })); setErrors(p => ({ ...p, gradeTypeId: '' })); }}
                                        className={clsx(
                                            "w-9 h-9 border text-xs font-bold transition-colors rounded-sm flex items-center justify-center",
                                            formData.gradeTypeId === t.id ? "bg-primary text-white border-primary" : "bg-white hover:bg-neutral-50 text-neutral-700"
                                        )}
                                    >
                                        {t.numeric}
                                    </button>
                                ))}
                            </div>
                            {errors.gradeTypeId && <span className="text-xs text-danger mt-1 block">{errors.gradeTypeId}</span>}
                        </div>
                        <div>
                            <label className="text-sm font-medium text-neutral-700 block mb-1">Kategoria <span className="text-danger">*</span></label>
                            <select
                                className="w-full border border-neutral-300 px-3 py-2 rounded-md text-sm focus:outline-none focus:border-primary bg-white"
                                value={formData.gradeCategoryId || ''}
                                onChange={e => { setFormData(p => ({ ...p, gradeCategoryId: +e.target.value })); setErrors(p => ({ ...p, gradeCategoryId: '' })); }}>
                                <option value="">Wybierz...</option>
                                {cats.map(c => <option key={c.id} value={c.id}>{c.name} (waga: {c.weight})</option>)}
                            </select>
                            {errors.gradeCategoryId && <span className="text-xs text-danger mt-1 block">{errors.gradeCategoryId}</span>}
                        </div>
                        <div>
                            <label className="text-sm font-medium text-neutral-700 block mb-1">Komentarz</label>
                            <textarea
                                className="w-full border border-neutral-300 px-3 py-2 rounded-md text-sm focus:outline-none focus:border-primary min-h-[80px]"
                                value={formData.comment || ''}
                                onChange={e => setFormData(p => ({ ...p, comment: e.target.value }))} maxLength={255} placeholder="Napisz komentarz..." />
                            {errors.comment && <span className="text-xs text-danger mt-1 block">{errors.comment}</span>}
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};
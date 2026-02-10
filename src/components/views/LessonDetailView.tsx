import { useState, useEffect } from 'react';
import { api } from '../../services/apiService';
import { ArrowLeft, BookOpen, Users, User, MapPin, Clock, Calendar, FileText, CheckCircle, Save } from 'lucide-react';
import { Button } from '../ui/Button';
import { AttendanceSquare } from '../ui/AttendanceSquare';
import { formatDateTime, formatDateOnly } from '../../utils/formatters';
import type { LessonDetailsDto, LessonAttendanceDto, User as UserType, AttendanceType } from '../../types';

const dayNames = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];

interface LessonDetailViewProps {
    lesson: LessonDetailsDto;
    attendance: LessonAttendanceDto[];
    onBack: () => void;
    onAttendanceChange?: () => void;
    onLessonUpdate?: () => void;
    editMode?: boolean;
}

export const LessonDetailView = ({ lesson, attendance: initialAttendance, onBack, onAttendanceChange, onLessonUpdate, editMode = false }: LessonDetailViewProps) => {
    const [attendanceTypes, setAttendanceTypes] = useState<AttendanceType[]>([]);
    const [attendance, setAttendance] = useState<LessonAttendanceDto[]>(initialAttendance);
    const [saving, setSaving] = useState(false);
    const [classrooms, setClassrooms] = useState<any[]>([]);
    const [statuses, setStatuses] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<UserType[]>([]);
    const [editData, setEditData] = useState({ classroomId: lesson.classroomId, statusId: lesson.statusId, topic: lesson.topic, teacherId: lesson.teacherId });

    useEffect(() => {
        if (editMode) {
            api.attendanceTypes.getAll().then(setAttendanceTypes).catch(console.error);
            api.classrooms.getAll().then(setClassrooms).catch(console.error);
            api.lessonStatuses.getAll().then(setStatuses).catch(console.error);
            api.users.getAll({ roleLevel: 2, pageSize: 1000 }).then(res => setTeachers(res.data)).catch(console.error);
        }
    }, [editMode]);

    useEffect(() => { setAttendance(initialAttendance); }, [initialAttendance]);
    useEffect(() => { setEditData({ classroomId: lesson.classroomId, statusId: lesson.statusId, topic: lesson.topic, teacherId: lesson.teacherId }); }, [lesson]);

    const [pendingChanges, setPendingChanges] = useState<Map<number, number | null>>(new Map());

    const handleAttendanceChange = (studentId: number, attendanceTypeId: number | null) => {
        if (!editMode) return;
        setPendingChanges(prev => new Map(prev).set(studentId, attendanceTypeId));
        const selectedType = attendanceTypeId ? attendanceTypes.find(t => t.id === attendanceTypeId) : null;
        setAttendance(prev => prev.map(a => a.studentId === studentId ? { ...a, attendanceTypeId: attendanceTypeId ?? undefined, attendanceTypeName: selectedType?.name ?? '', shortCode: selectedType?.shortCode ?? '', colorHex: selectedType?.colorHex ?? '' } : a));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.lessons.update(lesson.id, { classroomId: editData.classroomId, statusId: editData.statusId, topic: editData.topic, teacherId: editData.teacherId });
            for (const [studentId, typeId] of pendingChanges) {
                await api.lessons.updateAttendance(lesson.id, studentId, typeId);
            }
            onAttendanceChange?.();
            onLessonUpdate?.();
            onBack();
        } catch (e) { console.error('Błąd zapisu lekcji:', e); } finally { setSaving(false); }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="text-neutral-500 hover:text-primary transition-colors"><ArrowLeft size={20} /></button>
                    <h1 className="text-xl font-bold text-neutral-800">{editMode ? 'Edycja lekcji' : 'Podgląd lekcji'}</h1>
                </div>
                {editMode && <Button onClick={handleSave} disabled={saving}><Save size={14} className="mr-1" />{saving ? 'Zapisywanie...' : 'Zapisz'}</Button>}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <div className="bg-white border border-neutral-200 rounded-lg p-6 space-y-4">
                        <h2 className="font-semibold text-neutral-800 border-b pb-2">Szczegóły</h2>
                        <div className="flex items-start gap-3"><BookOpen size={16} className="text-neutral-400 mt-0.5" /><div><p className="text-xs text-neutral-500">Przedmiot</p><p className="text-sm font-medium text-neutral-800">{lesson.subjectName}</p></div></div>
                        <div className="flex items-start gap-3"><Users size={16} className="text-neutral-400 mt-0.5" /><div><p className="text-xs text-neutral-500">Klasa</p><p className="text-sm font-medium text-neutral-800">{lesson.className}</p></div></div>
                        <div className="flex items-start gap-3"><User size={16} className="text-neutral-400 mt-0.5" /><div className="flex-1"><p className="text-xs text-neutral-500">Nauczyciel</p>{editMode && statuses.find(s => s.id === editData.statusId)?.slug === 'substitute' ? <select value={editData.teacherId || ''} onChange={e => setEditData(d => ({ ...d, teacherId: Number(e.target.value) || d.teacherId }))} className="w-full border border-neutral-300 rounded px-2 py-1 text-sm"><option value="">Wybierz nauczyciela</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}</select> : <p className="text-sm font-medium text-neutral-800">{lesson.teacherName}</p>}</div></div>
                        <div className="flex items-start gap-3"><MapPin size={16} className="text-neutral-400 mt-0.5" /><div className="flex-1"><p className="text-xs text-neutral-500">Sala</p>{editMode ? <select value={editData.classroomId || ''} onChange={e => setEditData(d => ({ ...d, classroomId: e.target.value ? Number(e.target.value) : undefined }))} className="w-full border border-neutral-300 rounded px-2 py-1 text-sm"><option value="">Brak</option>{classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select> : <p className="text-sm font-medium text-neutral-800">{lesson.classroomName || '-'}</p>}</div></div>
                        <div className="flex items-start gap-3"><Calendar size={16} className="text-neutral-400 mt-0.5" /><div><p className="text-xs text-neutral-500">Data</p><p className="text-sm font-medium text-neutral-800">{dayNames[lesson.dayOfWeek]}, {formatDateOnly(lesson.date)}</p></div></div>
                        <div className="flex items-start gap-3"><Clock size={16} className="text-neutral-400 mt-0.5" /><div><p className="text-xs text-neutral-500">Godzina lekcyjna</p><p className="text-sm font-medium text-neutral-800">{lesson.orderNumber} / {lesson.startTime} - {lesson.endTime}</p></div></div>
                        <div className="flex items-start gap-3"><CheckCircle size={16} className="text-neutral-400 mt-0.5" /><div className="flex-1"><p className="text-xs text-neutral-500">Status</p>{editMode ? <select value={editData.statusId} onChange={e => setEditData(d => ({ ...d, statusId: Number(e.target.value) }))} className="w-full border border-neutral-300 rounded px-2 py-1 text-sm">{statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select> : <p className="text-sm font-medium text-neutral-800">{lesson.statusName}</p>}</div></div>
                        <div className="flex items-start gap-3"><FileText size={16} className="text-neutral-400 mt-0.5" /><div className="flex-1"><p className="text-xs text-neutral-500">Temat</p>{editMode ? <textarea value={editData.topic} onChange={e => setEditData(d => ({ ...d, topic: e.target.value }))} className="w-full border border-neutral-300 rounded px-2 py-1 text-sm resize-none" rows={3} placeholder="Wpisz temat lekcji..." /> : <p className="text-sm font-medium text-neutral-800">{lesson.topic || '-'}</p>}</div></div>
                        <div className="pt-4 border-t space-y-2 text-xs text-neutral-500"><p>Utworzono: {formatDateTime(lesson.createdAt)}</p><p>Edytowano: {formatDateTime(lesson.updatedAt)}</p><p>Przez: {lesson.modifiedByName || 'System'}</p></div>
                    </div>
                </div>
                <div className="lg:col-span-2">
                    <div className="bg-white border border-neutral-200 rounded-lg">
                        <div className="p-4 border-b"><h2 className="font-semibold text-neutral-800">Frekwencja</h2></div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead><tr className="bg-neutral-50 border-b"><th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 w-12">Nr</th><th className="px-4 py-3 text-left text-xs font-medium text-neutral-500">Uczeń</th><th className="px-4 py-3 text-center text-xs font-medium text-neutral-500 w-40">Obecność</th></tr></thead>
                                <tbody>
                                    {attendance.length === 0 ? <tr><td colSpan={3} className="px-4 py-8 text-center text-neutral-400">Brak uczniów w klasie</td></tr> : attendance.map(a => (
                                        <tr key={a.studentId} className="border-b hover:bg-neutral-50">
                                            <td className="px-4 py-3 text-sm text-neutral-500">{a.studentNumber}</td>
                                            <td className="px-4 py-3 text-sm font-medium text-neutral-800">{a.studentName}</td>
                                            <td className="px-4 py-3 text-center">
                                                {editMode ? (
                                                    <select
                                                        value={a.attendanceTypeId ?? ''}
                                                        onChange={e => handleAttendanceChange(a.studentId, e.target.value ? Number(e.target.value) : null)}
                                                        style={a.colorHex ? { backgroundColor: a.colorHex, color: 'white', borderColor: a.colorHex } : undefined}
                                                        className={`px-3 py-1.5 text-xs font-bold rounded border cursor-pointer transition-all min-w-[100px] ${!a.colorHex ? 'bg-white text-neutral-500 border-neutral-300' : ''}`}
                                                    >
                                                        <option value="">-</option>
                                                        {attendanceTypes.map(type => (
                                                            <option key={type.id} value={type.id}>
                                                                {type.shortCode.toUpperCase()} - {type.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : a.shortCode ? (
                                                    <AttendanceSquare
                                                        shortCode={a.shortCode.toUpperCase()}
                                                        colorHex={a.colorHex || '#e5e7eb'}
                                                        isSelected={true}
                                                        readOnly
                                                    />
                                                ) : (
                                                    <span className="text-neutral-300">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

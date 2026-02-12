import { useState, useEffect, useMemo } from 'react';
import { Download } from 'lucide-react';
import { Button } from './ui/Button';
import { Modal } from './modals/Modal';
import { Select } from './ui/Select';
import { api } from '../services/apiService';
import type { ClassEntity, SemesterDto } from '../types';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    classes?: ClassEntity[];
    fixedClassId?: number;
    semesters: SemesterDto[];
    selectedSemesterOrder: number | null;
    setSelectedSemesterOrder: (v: number | null) => void;
    selectedYearId: number | null;
}

export const ExportModal = ({
    isOpen, onClose,
    classes, fixedClassId,
    semesters, selectedSemesterOrder, setSelectedSemesterOrder,
    selectedYearId
}: ExportModalProps) => {
    const [category, setCategory] = useState<'grades' | 'attendance'>('grades');
    const [type, setType] = useState<'class' | 'student'>('class');
    const [classId, setClassId] = useState<number | null>(fixedClassId ?? null);
    const [studentId, setStudentId] = useState<number | null>(null);
    const [subjectId, setSubjectId] = useState<number | null>(null);
    const [format, setFormat] = useState<'pdf' | 'xlsx'>('pdf');
    const [students, setStudents] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);

    const currentSemester = useMemo(() =>
        semesters.find(s => s.order === selectedSemesterOrder),
        [semesters, selectedSemesterOrder]);

    const showClassSelector = !!classes;

    useEffect(() => {
        if (!isOpen) return;
        setCategory('grades');
        setType('class');
        setClassId(fixedClassId ?? null);
        setStudentId(null);
        setSubjectId(null);
        setFormat('pdf');
    }, [isOpen, fixedClassId]);

    useEffect(() => {
        const id = showClassSelector ? classId : fixedClassId;
        if (id) {
            api.classManagement.getClassDetails(id).then(details => {
                setStudents((details.students || []).sort((a: any, b: any) => a.orderNumber - b.orderNumber));
                setSubjects((details.subjects || []).map((cs: any) => ({ id: cs.subjectId, name: cs.subjectName })).filter((s: any) => s.id));
            }).catch(console.error);
        } else {
            setStudents([]);
            setSubjects([]);
        }
    }, [classId, fixedClassId, showClassSelector]);

    const effectiveClassId = showClassSelector ? classId : fixedClassId;

    const handleExport = async () => {
        if (!effectiveClassId || !currentSemester || !selectedYearId) return;
        try {
            if (category === 'grades') {
                if (type === 'class' && !subjectId) return;
                if (type === 'student' && !studentId) return;
                await api.export.downloadGrades({
                    classId: effectiveClassId,
                    semesterId: currentSemester.id,
                    schoolYearId: selectedYearId,
                    subjectId: type === 'class' ? subjectId ?? undefined : undefined,
                    studentId: type === 'student' ? studentId ?? undefined : undefined,
                    format
                });
            } else {
                if (type === 'student' && !studentId) return;
                await api.export.downloadAttendance({
                    classId: effectiveClassId,
                    semesterId: currentSemester.id,
                    schoolYearId: selectedYearId,
                    studentId: type === 'student' ? studentId ?? undefined : undefined,
                    format
                });
            }
            onClose();
        } catch (e) {
            console.error(e);
            alert('Błąd podczas eksportu');
        }
    };

    const isDisabled = () => {
        if (!effectiveClassId) return true;
        if (type === 'student' && !studentId) return true;
        if (category === 'grades' && type === 'class' && !subjectId) return true;
        return false;
    };

    const selectedClass = classes?.find(c => c.id === classId);
    const title = selectedClass
        ? `Generuj raport - klasa ${selectedClass.level}${selectedClass.letter}`
        : 'Generuj raport';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-4 p-4">
                <div>
                    <label className="label-text block mb-1">Rodzaj wykazu</label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="exportCategory" value="grades" checked={category === 'grades'} onChange={() => setCategory('grades')} className="w-4 h-4" />
                            <span className="text-sm font-medium">Wykaz ocen</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="exportCategory" value="attendance" checked={category === 'attendance'} onChange={() => setCategory('attendance')} className="w-4 h-4" />
                            <span className="text-sm font-medium">Wykaz frekwencji</span>
                        </label>
                    </div>
                </div>
                {showClassSelector && (
                    <div>
                        <label className="label-text block mb-1">Klasa *</label>
                        <Select
                            options={classes!.map(c => ({ value: c.id, label: `${c.level}${c.letter}` }))}
                            value={classId}
                            onChange={v => { setClassId(v ? Number(v) : null); setStudentId(null); setSubjectId(null); }}
                            placeholder="Wybierz klasę"
                            className="w-full"
                        />
                    </div>
                )}
                <div>
                    <label className="label-text block mb-1">Semestr</label>
                    <Select
                        options={semesters.map(s => ({ value: s.order, label: s.name }))}
                        value={selectedSemesterOrder}
                        onChange={v => setSelectedSemesterOrder(v ? Number(v) : null)}
                        className="w-full"
                    />
                </div>
                <div>
                    <label className="label-text block mb-1">Zakres</label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="exportScope" value="class" checked={type === 'class'} onChange={() => { setType('class'); setStudentId(null); }} className="w-4 h-4" />
                            <span className="text-sm font-medium">Cała klasa</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="exportScope" value="student" checked={type === 'student'} onChange={() => setType('student')} className="w-4 h-4" />
                            <span className="text-sm font-medium">Pojedynczy uczeń</span>
                        </label>
                    </div>
                </div>
                {category === 'grades' && type === 'class' && (
                    <div>
                        <label className="label-text block mb-1">Przedmiot *</label>
                        <Select
                            options={subjects.map(s => ({ value: s.id, label: s.name }))}
                            value={subjectId}
                            onChange={v => setSubjectId(v ? Number(v) : null)}
                            placeholder="Wybierz przedmiot"
                            className="w-full"
                        />
                    </div>
                )}
                {type === 'student' && (
                    <div>
                        <label className="label-text block mb-1">Uczeń *</label>
                        <Select
                            options={students.map((s: any) => ({ value: s.studentId, label: `${s.orderNumber}. ${s.student?.lastName} ${s.student?.firstName}` }))}
                            value={studentId}
                            onChange={v => setStudentId(v ? Number(v) : null)}
                            placeholder="Wybierz ucznia"
                            className="w-full"
                        />
                    </div>
                )}
                <div>
                    <label className="label-text block mb-1">Format</label>
                    <div className="flex gap-4">
                        {(['pdf', 'xlsx'] as const).map(fmt => (
                            <label key={fmt} className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="exportFormat" value={fmt} checked={format === fmt} onChange={() => setFormat(fmt)} className="w-4 h-4" />
                                <span className="text-sm font-medium uppercase">{fmt}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="secondary" onClick={onClose}>Anuluj</Button>
                    <Button onClick={handleExport} disabled={isDisabled()}>
                        <Download size={14} className="mr-1" /> Eksportuj
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

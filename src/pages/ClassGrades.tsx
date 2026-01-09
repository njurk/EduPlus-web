import { useState, useEffect, useCallback } from 'react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { DataTable } from '../components/ui/DataTable';
import { api } from '../services/apiService';
import { BookOpen, ArrowLeft, Plus, RefreshCcw, Edit2, Trash2, Calendar, Tag, MessageSquare, Scale } from 'lucide-react';
import { clsx } from 'clsx';
import type { Subject, SchoolYear, ClassEntity, Grade, GradeType, GradeCategory, StudentGradesRowDto, GradeDto, SemesterDto } from '../types';
import { validateGradeForm } from '../utils/validation';
import { formatName, formatDate } from '../utils/formatters';
import { YearSelector } from '../components/ui/YearSelector';
import { SemesterSelector } from '../components/ui/SemesterSelector';
import { ClassTile } from '../components/ui/ClassTile';

const GradeSquare = ({ grade, onClick }: { grade: Grade, onClick: () => void }) => (
    <div onClick={onClick} title={`${grade.gradeType?.numeric} (${grade.gradeCategory?.name})`}
        className="w-8 h-8 flex items-center justify-center bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-800 font-bold text-sm cursor-pointer rounded-sm">
        {grade.gradeType?.numeric}
    </div>
);

const GradeModal = ({ isOpen, onClose, onSuccess, studentId, subjectId, grade }: any) => {
    const [types, setTypes] = useState<GradeType[]>([]);
    const [cats, setCats] = useState<GradeCategory[]>([]);
    const [isEditing, setIsEditing] = useState(!grade);
    const [formData, setFormData] = useState<Partial<GradeDto>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!isOpen) return;
        Promise.all([api.gradeTypes.getAll(), api.gradeCategories.getAll()]).then(([t, c]) => { setTypes(t); setCats(c); });
        setFormData({ gradeTypeId: grade?.gradeTypeId, gradeCategoryId: grade?.gradeCategoryId, comment: grade?.comment || '' });
        setErrors({});
        setIsEditing(!grade);
    }, [isOpen, grade]);

    const handleSave = async () => {
        const payload = { ...formData, studentId, subjectId };
        const errs = validateGradeForm(payload);
        if (Object.keys(errs).length) return setErrors(errs);
        try {
            grade ? await api.grades.update(grade.id, payload) : await api.grades.create(payload);
            onSuccess(); onClose();
        } catch { alert("Błąd zapisu"); }
    };

    const handleDelete = async () => {
        if (confirm("Usunąć ocenę?")) { await api.grades.delete(grade.id); onSuccess(); onClose(); }
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
                                <button onClick={() => setIsEditing(true)} className="p-2 hover:bg-neutral-100 rounded text-neutral-600"><Edit2 size={18} /></button>
                                <button onClick={handleDelete} className="p-2 hover:bg-danger-light/20 rounded text-danger"><Trash2 size={18} /></button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-3 bg-neutral-50 p-4 rounded border border-neutral-100 text-sm">
                            <div className="flex items-center gap-3">
                                <Tag size={16} className="text-neutral-400" />
                                <div><span className="text-xs text-neutral-500 block">Kategoria</span><span className="font-medium">{grade.gradeCategory?.name}</span></div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Scale size={16} className="text-neutral-400" />
                                <div><span className="text-xs text-neutral-500 block">Waga</span><span className="font-medium">{activeCategory?.weight ?? '-'}</span></div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Calendar size={16} className="text-neutral-400" />
                                <div><span className="text-xs text-neutral-500 block">Data</span><span className="font-medium">{formatDate(grade.createdAt)}</span></div>
                            </div>
                            {grade.comment && (
                                <div className="flex items-start gap-3 pt-2 border-t border-neutral-200/50 mt-1">
                                    <MessageSquare size={16} className="text-neutral-400 mt-1" />
                                    <div><span className="text-xs text-neutral-500 block">Komentarz</span><span className="italic">"{grade.comment}"</span></div>
                                </div>
                            )}
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
                                onChange={e => setFormData(p => ({ ...p, comment: e.target.value }))} maxLength={255} placeholder="Opcjonalny komentarz..." />
                            {errors.comment && <span className="text-xs text-danger mt-1 block">{errors.comment}</span>}
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

const SubjectGradesView = ({ classId, subject, yearName, yearId, className, onBack }: any) => {
    const [data, setData] = useState<StudentGradesRowDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [semesters, setSemesters] = useState<SemesterDto[]>([]);
    const [semesterOrder, setSemesterOrder] = useState<number | null>(null);
    const [modalData, setModalData] = useState<{ open: boolean, studentId: number, grade?: Grade }>({ open: false, studentId: 0 });

    useEffect(() => {
        Promise.all([api.classManagement.getSemesters(yearId), api.grades.getCurrentSemester(yearId)])
            .then(([s, o]) => { setSemesters(s); setSemesterOrder(o); }).catch(console.error);
    }, [yearId]);

    const loadData = useCallback(async () => {
        if (!semesterOrder) return;
        setLoading(true);
        try { setData(await api.classGrades.getClassGrades(classId, subject.id, semesterOrder, yearId) || []); }
        catch (e) { console.error(e); } finally { setLoading(false); }
    }, [classId, subject.id, semesterOrder, yearId]);

    useEffect(() => { loadData(); }, [loadData]);

    if (!semesterOrder) return <div className="p-12 text-center text-neutral-400"><RefreshCcw className="animate-spin inline mr-2" /> Ładowanie...</div>;

    return (
        <div className="h-full flex flex-col">
            {modalData.open && <GradeModal isOpen={modalData.open} onClose={() => setModalData({ ...modalData, open: false })}
                onSuccess={loadData} studentId={modalData.studentId} subjectId={subject.id} grade={modalData.grade} />}

            <div className="flex justify-between items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-1 hover:bg-neutral-100 rounded text-neutral-600"><ArrowLeft size={20} /></button>
                    <div><h2 className="text-xl font-bold text-neutral-800">{subject.name}</h2><p className="text-sm text-neutral-500">{yearName} • Klasa {className}</p></div>
                </div>
                <SemesterSelector semesters={semesters} selectedOrder={semesterOrder} onChange={setSemesterOrder} />
            </div>

            <div className="bg-white border border-neutral-300 flex-1 shadow-sm">
                <DataTable data={data} isLoading={loading} emptyMessage="Brak uczniów"
                    columns={[
                        { header: 'Lp.', accessor: 'orderNumber', className: 'w-12 text-center text-neutral-500 font-mono border-r border-neutral-100' },
                        { header: 'Uczeń', render: (row) => <div className="font-medium text-neutral-900">{formatName(row)}</div>, className: 'w-64 border-r border-neutral-100' },
                        { header: 'Średnia', render: (row) => <span className={clsx("font-bold", row.average ? "text-neutral-800" : "text-neutral-300")}>{row.average ? row.average.toFixed(2) : '-'}</span>, className: 'w-24 text-center border-r border-neutral-100 bg-neutral-50/50' },
                        {
                            header: 'Oceny', render: (row) => (
                                <div className="flex flex-wrap gap-1.5 items-center p-1">
                                    {(row.grades || []).map(g => <GradeSquare key={g.id} grade={g} onClick={() => setModalData({ open: true, studentId: row.studentId, grade: g })} />)}
                                    <button onClick={() => setModalData({ open: true, studentId: row.studentId })} className="w-8 h-8 flex items-center justify-center border border-dashed border-neutral-300 text-neutral-400 hover:text-primary hover:border-primary transition-colors rounded-sm"><Plus size={16} /></button>
                                </div>
                            )
                        }
                    ]} />
            </div>
        </div>
    );
};

const ClassSubjectsView = ({ classId, yearName, className, onSelectSubject, onBack }: any) => {
    const [subjects, setSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        api.classManagement.getClassDetails(classId).then(d => setSubjects(d.subjects || [])).finally(() => setLoading(false));
    }, [classId]);

    if (loading) return <div className="p-12 text-center text-neutral-400"><RefreshCcw className="animate-spin inline mr-2" /> Ładowanie...</div>;

    return (
        <div>
            <div className="flex items-center gap-4 mb-6">
                <button onClick={onBack} className="p-1 hover:bg-neutral-100 rounded text-neutral-600"><ArrowLeft size={20} /></button>
                <div><h2 className="text-xl font-bold text-neutral-800">Klasa {className}</h2><p className="text-sm text-neutral-500">{yearName} • Wybierz przedmiot</p></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {subjects.map((item) => (
                    <div key={item.subjectId} onClick={() => onSelectSubject({ id: item.subjectId, name: item.subjectName })}
                        className="bg-white border border-neutral-300 p-6 cursor-pointer hover:border-primary hover:shadow-sm transition-all group">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-primary-light flex items-center justify-center text-primary rounded-sm transition-colors"><BookOpen size={20} /></div>
                            <h3 className="font-bold text-neutral-800">{item.subjectName}</h3>
                        </div>
                        <div className="text-xs text-neutral-500 border-t pt-2 mt-2">Nauczyciel: <span className="font-medium text-neutral-700">{item.teacherName || '-'}</span></div>
                    </div>
                ))}
                {!subjects.length && <div className="col-span-full p-8 text-center text-neutral-400 border border-dashed border-neutral-300">Brak przedmiotów</div>}
            </div>
        </div>
    );
};

export const ClassGrades = () => {
    const [years, setYears] = useState<SchoolYear[]>([]);
    const [classes, setClasses] = useState<ClassEntity[]>([]);
    const [selected, setSelected] = useState<{ year: number | null, class: number | null, subject: Subject | null }>({ year: null, class: null, subject: null });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.classManagement.getYears().then(res => {
            setYears(res);
            const today = new Date().toISOString().split('T')[0];
            const current = res.find(y => y.startDate <= today && y.endDate >= today) || res.find(y => y.isActive) || res[0];
            if (current) setSelected(p => ({ ...p, year: current.id }));
        });
    }, []);

    useEffect(() => {
        if (!selected.year) return;
        setLoading(true);
        api.classManagement.getClassesByYear(selected.year).then(res => setClasses(res.filter(c => c.isActive))).finally(() => setLoading(false));
    }, [selected.year]);

    const selectedYearName = years.find(y => y.id === selected.year)?.name || '';
    const selectedClassObj = classes.find(c => c.id === selected.class);
    const selectedClassName = selectedClassObj ? `${selectedClassObj.level}${selectedClassObj.letter}` : '';

    if (selected.class && selected.subject && selected.year)
        return <SubjectGradesView classId={selected.class} subject={selected.subject} yearName={selectedYearName} yearId={selected.year} className={selectedClassName} onBack={() => setSelected(p => ({ ...p, subject: null }))} />;

    if (selected.class)
        return <ClassSubjectsView classId={selected.class} yearName={selectedYearName} className={selectedClassName} onSelectSubject={(s: Subject) => setSelected(p => ({ ...p, subject: s }))} onBack={() => setSelected(p => ({ ...p, class: null }))} />;

    return (
        <div className="font-sans max-w-6xl mx-auto space-y-4">
            <div className="flex justify-between items-center pb-4 border-b">
                <h1 className="text-xl font-bold text-neutral-800">Dziennik ocen</h1>
                <YearSelector years={years} selectedYear={selected.year} onChange={(id) => setSelected(p => ({ ...p, year: id }))} />
            </div>
            <div className="bg-white border border-neutral-200 p-6 min-h-[400px]">
                <h2 className="text-sm font-bold text-neutral-700 uppercase tracking-wide mb-4">Wybierz klasę</h2>
                {loading ? <div className="text-center text-sm text-neutral-400">Ładowanie...</div> : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        {classes.map(cls => <ClassTile key={cls.id} data={cls} onClick={() => setSelected(p => ({ ...p, class: cls.id }))} />)}
                        {!classes.length && <div className="col-span-full text-center p-8 text-neutral-400 text-sm">Brak klas w wybranym roku.</div>}
                    </div>
                )}
            </div>
        </div>
    );
};
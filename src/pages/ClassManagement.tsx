import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { DataTable, type Column } from '../components/ui/DataTable';
import { SortFilterToolbar } from '../components/ui/SortFilterToolbar';
import { ActionButtons } from '../components/ui/ActionButtons';
import { TrashButton } from '../components/ui/TrashButton';
import { api } from '../services/apiService';
import { Calendar, Users, BookOpen, UserPlus, RefreshCcw, Search, Check, Plus, ArrowLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import type { ClassEntity, ClassDetailsDto, User, Subject, SchoolYear } from '../types';
import { validateClassForm, REGEX } from '../utils/validation';
import { formatDate, formatName } from '../utils/formatters';

const CandidateRow = memo(({ student, index, isSelected, onToggle }: { student: User, index: number, isSelected: boolean, onToggle: (id: number) => void }) => (
    <div onClick={() => onToggle(student.id)} className={clsx("flex items-center justify-between p-2 border-b cursor-pointer text-sm select-none hover:bg-neutral-100", isSelected && "bg-primary-light text-primary-text")}>
        <div className="flex gap-3">
            <span className="text-neutral-400 w-6 text-right">{index + 1}.</span>
            <div>
                <div className="font-semibold">{student.lastName} {student.firstName}</div>
                <div className="text-xs opacity-75">{student.email}</div>
            </div>
        </div>
        {isSelected && <Check size={18} className="text-primary" />}
    </div>
));

const ClassDetailsView = ({ classId, onBack }: { classId: number, onBack: () => void }) => {
    const [activeTab, setActiveTab] = useState<'students' | 'subjects'>('students');
    const [details, setDetails] = useState<ClassDetailsDto | null>(null);
    const [loading, setLoading] = useState(false);
    const [dicts, setDicts] = useState<{ students: User[], subjects: Subject[], teachers: User[] }>({ students: [], subjects: [], teachers: [] });
    const [modals, setModals] = useState({ student: false, subject: false });
    const [selections, setSelections] = useState<{ candidates: number[], subject: string, teacher: string }>({ candidates: [], subject: '', teacher: '' });
    const [studentFilters, setStudentFilters] = useState({ search: '', sortBy: 'id', sortDesc: false });
    const [subjectFilters, setSubjectFilters] = useState({ search: '', sortBy: 'subjectName', sortDesc: false });
    const [candidateSearch, setCandidateSearch] = useState('');

    const loadDetails = useCallback(async () => {
        setLoading(true);
        try { 
            const data = await api.classManagement.getClassDetails(classId, {
                sortBy: studentFilters.sortBy,
                sortDesc: studentFilters.sortDesc,
                studentSearch: studentFilters.search, 
                subjectSearch: subjectFilters.search,
                subjectSortBy: subjectFilters.sortBy,
                subjectSortDesc: subjectFilters.sortDesc
            });
            setDetails(data); 
        } 
        catch (e) { console.error(e); } 
        finally { setLoading(false); }
    }, [classId, studentFilters.sortBy, studentFilters.sortDesc, studentFilters.search, subjectFilters.search, subjectFilters.sortBy, subjectFilters.sortDesc]);

    useEffect(() => { loadDetails(); }, [loadDetails]);

    const loadDicts = async () => {
        if (dicts.students.length) return;
        const [s, sub, t] = await Promise.all([
            api.users.getAll({ roleName: 'Uczeń', onlyUnassignedParents: false }),
            api.subjects.getAll(),
            api.users.getAll({ roleName: 'Nauczyciel' })
        ]);
        setDicts({ students: s.filter(u => u.isActive), subjects: sub, teachers: t.filter(u => u.isActive) });
    };

    const toggleCandidate = useCallback((id: number) => {
        setSelections(prev => ({ ...prev, candidates: prev.candidates.includes(id) ? prev.candidates.filter(x => x !== id) : [...prev.candidates, id] }));
    }, []);

    const handleAction = async (action: () => Promise<any>, confirmMsg?: string) => {
        if (confirmMsg && !window.confirm(confirmMsg)) return;
        try { await action(); loadDetails(); } catch { alert("Wystąpił błąd"); }
    };

    const saveStudents = () => handleAction(async () => {
        await Promise.all(selections.candidates.map(id => api.classManagement.addStudentToClass(classId, id)));
        setModals({ ...modals, student: false });
        setSelections(p => ({ ...p, candidates: [] }));
    });

    const saveSubject = () => handleAction(async () => {
        if (!selections.subject || !selections.teacher) return;
        await api.classManagement.assignSubject({ classId, subjectId: +selections.subject, teacherId: +selections.teacher });
        setModals({ ...modals, subject: false });
        setSelections(p => ({ ...p, subject: '', teacher: '' }));
    });

    const assignableSubjects = useMemo(() => {
        const assignedIds = new Set(details?.subjects.map(s => s.subjectId) || []);
        return dicts.subjects.filter(s => !assignedIds.has(s.id));
    }, [dicts.subjects, details?.subjects]);

    const availableCandidates = useMemo(() => {
        const existing = new Set(details?.students.map(s => s.studentId) || []);
        const q = candidateSearch.toLowerCase();
        
        return dicts.students.filter(s => 
            !existing.has(s.id) && 
            (s.lastName.toLowerCase().includes(q) || s.firstName.toLowerCase().includes(q) || s.email.toLowerCase().includes(q))
        );
    }, [dicts.students, details?.students, candidateSearch]);

    const studentColumns: Column<any>[] = [
        { header: 'Lp.', accessor: 'orderNumber', className: 'w-12 text-neutral-500 font-mono text-center'},
        { header: 'Nazwisko i Imię', accessor: 'student', render: (row) => formatName(row.student), className: 'font-medium text-neutral-900' },
        { header: 'Email', accessor: 'student', render: (row) => row.student?.email, className: 'text-neutral-600' },
        { header: 'Utworzono', accessor: 'createdAt', render: (row) => formatDate(row.createdAt), className: 'text-xs text-neutral-500' },
        { header: 'Edytowano', accessor: 'updatedAt', render: (row) => formatDate(row.updatedAt), className: 'text-xs text-neutral-500' },
        { 
            header: 'Akcje', 
            className: 'text-right',
            render: (row) => <ActionButtons onDelete={() => handleAction(() => api.classManagement.removeStudentFromClass(row.id), "Usunąć?")} />
        }
    ];

    const subjectColumns: Column<any>[] = [
        { header: 'Przedmiot', accessor: 'subjectName', className: 'font-medium text-neutral-900 pl-4' },
        { header: 'Nauczyciel', accessor: 'teacherName', render: (row) => row.teacherName || '-' },
        { header: 'Utworzono', accessor: 'createdAt', render: (row) => formatDate(row.createdAt), className: 'text-xs text-neutral-500' },
        { header: 'Edytowano', accessor: 'updatedAt', render: (row) => formatDate(row.updatedAt), className: 'text-xs text-neutral-500' },
        { 
            header: 'Akcje', 
            className: 'text-right',
            render: (row) => <ActionButtons onDelete={() => handleAction(() => api.classManagement.removeSubjectFromClass(row.id), "Usunąć?")} />
        }
    ];

    if (!details && loading) return <div className="p-12 text-center text-neutral-400 font-sans"><RefreshCcw className="animate-spin inline mr-2" /> Ładowanie...</div>;
    if (!details) return null;

    return (
        <div className="font-sans h-full">
            <Modal
                isOpen={modals.student}
                onClose={() => setModals({ ...modals, student: false })}
                title="Przypisz uczniów"
                maxWidth="xl"
                footer={
                    <>
                        <div className="flex-1 text-xs text-neutral-500 text-left">Wybrano: <b>{selections.candidates.length}</b></div>
                        <Button variant="secondary" onClick={() => setModals({ ...modals, student: false })}>Anuluj</Button>
                        <Button onClick={saveStudents} disabled={!selections.candidates.length}>Przypisz</Button>
                    </>
                }
            >
                <div className="flex flex-col h-[50vh]">
                    <div className="p-3 border-b bg-white">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 text-neutral-400" size={16} />
                            <Input 
                                value={candidateSearch} 
                                onChange={e => setCandidateSearch(e.target.value)} 
                                placeholder="Szukaj (max 50)..." 
                                className="pl-8 text-sm" 
                                autoFocus 
                            />
                        </div>
                    </div>
                    <div className="overflow-y-auto flex-1">
                        {availableCandidates.slice(0, 50).map((s, idx) => (
                            <CandidateRow 
                                key={s.id} 
                                index={idx}
                                student={s} 
                                isSelected={selections.candidates.includes(s.id)} 
                                onToggle={toggleCandidate} 
                            />
                        ))}
                        
                        {!availableCandidates.length && <div className="p-4 text-center text-xs text-neutral-400">Brak wyników</div>}
                        
                        {availableCandidates.length > 50 && (
                            <div className="p-2 text-center text-xs text-neutral-400 bg-neutral-50 border-t">
                                Pokazano 50 z {availableCandidates.length} wyników. Użyj wyszukiwarki, aby zawęzić listę.
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={modals.subject}
                onClose={() => setModals({ ...modals, subject: false })}
                title="Przypisz przedmiot"
                maxWidth="md"
                footer={
                    <>
                         <Button variant="secondary" onClick={() => setModals({ ...modals, subject: false })}>Anuluj</Button>
                         <Button onClick={saveSubject} disabled={!selections.subject || !selections.teacher}>Zapisz</Button>
                    </>
                }
            >
                <div className="p-6 space-y-4">
                    <div>
                        <label className="label-text">Przedmiot</label>
                        <select className="w-full border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:border-primary" value={selections.subject} onChange={e => setSelections({ ...selections, subject: e.target.value })}>
                            <option value="">Wybierz...</option>
                            {assignableSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        {assignableSubjects.length === 0 && <p className="text-xs text-neutral-400 mt-1">Wszystkie dostępne przedmioty są już przypisane.</p>}
                    </div>
                    <div>
                        <label className="label-text">Nauczyciel</label>
                        <select className="w-full border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:border-primary" value={selections.teacher} onChange={e => setSelections({ ...selections, teacher: e.target.value })}>
                            <option value="">Wybierz...</option>
                            {dicts.teachers.map(t => <option key={t.id} value={t.id}>{t.lastName} {t.firstName}</option>)}
                        </select>
                    </div>
                </div>
            </Modal>

            <div className="flex items-center gap-4 mb-4">
                <button onClick={onBack} className="p-1 hover:bg-neutral-100 rounded text-neutral-600"><ArrowLeft size={20} /></button>
                <div><h2 className="text-xl font-bold text-neutral-800">Klasa {details.classInfo.level}{details.classInfo.letter}</h2></div>
            </div>

            <div className="flex border-b border-neutral-200 mb-0 bg-white">
                {[
                    { id: 'students', label: 'Uczniowie', icon: Users },
                    { id: 'subjects', label: 'Przedmioty', icon: BookOpen }
                ].map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={clsx("flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-none", activeTab === t.id ? "border-primary text-primary" : "border-transparent text-neutral-500 hover:text-black hover:border-neutral-300")}>
                        <t.icon size={16} /> {t.label}
                    </button>
                ))}
            </div>

            <div className="bg-white border border-neutral-200 border-t-0 min-h-[500px]">
                {activeTab === 'students' && (
                    <div className="flex flex-col h-full">
                        <div className="p-3 border-b flex justify-between items-center gap-4 bg-neutral-50/30">
                            <SortFilterToolbar 
                                className="p-0 border-0 flex-1" 
                                search={studentFilters.search} 
                                onSearchChange={v => setStudentFilters({ ...studentFilters, search: v })}
                                sortBy={studentFilters.sortBy} 
                                sortDesc={studentFilters.sortDesc} 
                                onSortChange={f => setStudentFilters({ ...studentFilters, sortBy: f, sortDesc: f === studentFilters.sortBy ? !studentFilters.sortDesc : false })} 
                                sortOptions={[
                                    { field: 'id', label: 'Lp.' },
                                    { field: 'lastName', label: 'Nazwisko' },
                                    { field: 'email', label: 'Email' },
                                    { field: 'updatedAt', label: 'Edytowano' },
                                    { field: 'createdAt', label: 'Utworzono' }
                                ]} 
                                hideCreate 
                            />
                            <div className="pl-4 border-l">
                                <Button onClick={() => { setCandidateSearch(''); setSelections({ ...selections, candidates: [] }); setModals({ ...modals, student: true }); loadDicts(); }}>
                                    <UserPlus size={16} className="mr-2" /> Przypisz
                                </Button>
                            </div>
                        </div>
                        <DataTable 
                            data={details.students} 
                            columns={studentColumns} 
                            emptyMessage="Brak uczniów w klasie"
                        />
                    </div>
                )}

                {activeTab === 'subjects' && (
                    <div className="flex flex-col h-full">
                        <div className="p-3 border-b flex justify-between items-center gap-4 bg-neutral-50/30">
                            <SortFilterToolbar 
                                className="p-0 border-0 flex-1" 
                                search={subjectFilters.search} 
                                onSearchChange={v => setSubjectFilters({ ...subjectFilters, search: v })} 
                                sortBy={subjectFilters.sortBy} 
                                sortDesc={subjectFilters.sortDesc} 
                                onSortChange={f => setSubjectFilters({ ...subjectFilters, sortBy: f, sortDesc: f === subjectFilters.sortBy ? !subjectFilters.sortDesc : false })} 
                                sortOptions={[
                                    { field: 'subjectName', label: 'Nazwa' },
                                    { field: 'teacherName', label: 'Nauczyciel' },
                                    { field: 'updatedAt', label: 'Edytowano' },
                                    { field: 'createdAt', label: 'Utworzono' }
                                ]} 
                                hideCreate 
                            />
                            <div className="pl-4 border-l">
                                <Button onClick={() => { setSelections({ ...selections, subject: '', teacher: '' }); setModals({ ...modals, subject: true }); loadDicts(); }}>
                                    <Plus size={16} className="mr-2" /> Przypisz
                                </Button>
                            </div>
                        </div>
                        <DataTable 
                            data={details.subjects}
                            columns={subjectColumns}
                            emptyMessage="Brak przypisanych przedmiotów"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export const ClassManagement = () => {
    const [years, setYears] = useState<SchoolYear[]>([]);
    const [classes, setClasses] = useState<ClassEntity[]>([]);
    const [selected, setSelected] = useState<{ year: number | null, class: number | null }>({ year: null, class: null });
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState<{ open: boolean, data: Partial<ClassEntity>, errors: Record<string, string> }>({ open: false, data: {}, errors: {} });
    const [showInactive, setShowInactive] = useState(false);

    useEffect(() => {
        api.classManagement.getYears().then(res => {
            setYears(res);
            const today = new Date().toISOString().split('T')[0];
            const current = res.find(y => y.startDate <= today && y.endDate >= today) || res.find(y => y.isActive) || res[0];
            if (current) setSelected(p => ({ ...p, year: current.id }));
        });
    }, []);

    const loadClasses = useCallback(() => {
        if (!selected.year) return;
        setLoading(true);
        api.classManagement.getClassesByYear(selected.year).then(res => {
            setClasses(res.filter(c => showInactive ? !c.isActive : c.isActive));
        }).catch(console.error).finally(() => setLoading(false));
    }, [selected.year, showInactive]);

    useEffect(() => { loadClasses(); }, [loadClasses]);

    const saveClass = async () => {
        const err = validateClassForm(form.data);
        if (Object.keys(err).length) return setForm(p => ({ ...p, errors: err }));
        try {
            await (form.data.id ? api.classManagement.updateClass(form.data.id, form.data) : api.classManagement.createClass({ ...form.data, schoolYearId: selected.year! }));
            setForm({ open: false, data: {}, errors: {} }); loadClasses();
        } catch (e: any) { alert(e.message || "Błąd zapisu"); }
    };

    const delClass = (id: number) => { if (window.confirm("Usunąć klasę?")) api.classManagement.deleteClass(id).then(loadClasses).catch(() => alert("Błąd usuwania")); };
    const restoreClass = (item: ClassEntity) => { if (window.confirm("Przywrócić?")) api.classManagement.updateClass(item.id, { ...item, isActive: true }).then(loadClasses).catch(() => alert("Błąd")); };

    if (selected.class) return <ClassDetailsView classId={selected.class} onBack={() => setSelected(p => ({ ...p, class: null }))} />;

    return (
        <div className="font-sans max-w-6xl mx-auto space-y-6">
             <Modal 
                isOpen={form.open} 
                onClose={() => setForm({ ...form, open: false })}
                title={form.data.id ? 'Edycja Klasy' : 'Nowa Klasa'}
                maxWidth="sm"
                footer={<><Button variant="secondary" onClick={() => setForm({ ...form, open: false })}>Anuluj</Button><Button onClick={saveClass}>Zapisz</Button></>}
             >
                <div className="grid grid-cols-2 gap-4 p-4">
                    <div>
                        <label className="label-text">Poziom</label>
                        <Input type="number" min={1} max={8} value={form.data.level || ''} onChange={e => setForm({ ...form, data: { ...form.data, level: parseInt(e.target.value) || undefined } })} />
                        {form.errors.level && <span className="text-danger text-xs">{form.errors.level}</span>}
                    </div>
                    <div>
                        <label className="label-text">Oddział</label>
                        <Input value={form.data.letter || ''} onChange={e => { const v = e.target.value.toUpperCase(); if (!v || REGEX.CLASS_LETTER.test(v)) setForm({ ...form, data: { ...form.data, letter: v } }) }} placeholder="A" />
                        {form.errors.letter && <span className="text-danger text-xs">{form.errors.letter}</span>}
                    </div>
                </div>
             </Modal>

            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-neutral-800">Struktura szkoły</h1>
                <div className="flex gap-2">
                    <div className="flex items-center gap-3 bg-white p-2 rounded border border-neutral-300">
                        <Calendar className="text-primary ml-2" size={18} />
                        <select className="bg-transparent font-semibold text-neutral-800 focus:outline-none cursor-pointer text-sm" value={selected.year || ''} onChange={e => setSelected(p => ({ ...p, year: +e.target.value }))}>
                            {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                        </select>
                    </div>
                    <TrashButton isTrashActive={showInactive} onToggle={() => setShowInactive(!showInactive)} />
                </div>
            </div>

            <div className="bg-white border border-neutral-300 p-6 min-h-[500px]">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold text-neutral-800">Lista klas {showInactive && '(Archiwum)'}</h2>
                    {!showInactive && <Button onClick={() => setForm({ open: true, data: { level: 1, letter: '', isActive: true }, errors: {} })}><Plus size={16} className="mr-2" /> Dodaj</Button>}
                </div>

                {loading ? <div className="text-center p-12 text-neutral-400"><RefreshCcw className="animate-spin inline mr-2" /> Ładowanie...</div> : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {classes.map(cls => (
                            <div key={cls.id} onClick={() => setSelected(p => ({ ...p, class: cls.id }))} className={clsx("group border border-neutral-300 p-4 cursor-pointer hover:border-primary transition-colors bg-white relative", !cls.isActive && "opacity-75 bg-neutral-50")}>
                                <div className="absolute top-2 right-2 flex gap-1 z-10" onClick={e => e.stopPropagation()}>
                                    <ActionButtons isActive={cls.isActive} onEdit={() => setForm({ open: true, data: { ...cls }, errors: {} })} onDelete={() => delClass(cls.id)} onRestore={() => restoreClass(cls)} />
                                </div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-primary-light flex items-center justify-center text-primary font-bold text-lg">{cls.level}{cls.letter}</div>
                                    <div>
                                        <div className="font-bold text-neutral-800">Klasa {cls.level}{cls.letter}</div>
                                        <div className={clsx("text-xs px-2 py-0.5 inline-block border", cls.isActive ? "bg-success-light text-success-text border-success-light" : "bg-neutral-100 text-neutral-500 border-neutral-200")}>{cls.isActive ? 'Aktywna' : 'Archiwum'}</div>
                                    </div>
                                </div>
                                <div className="border-t pt-2 flex justify-between text-xs text-neutral-500"><span className="flex items-center gap-1"><Users size={12} /> {cls.studentCount || 0} uczniów</span><ChevronRight size={14} /></div>
                            </div>
                        ))}
                        {!classes.length && <div className="col-span-full text-center p-12 border border-dashed border-neutral-300 text-neutral-400">Brak klas</div>}
                    </div>
                )}
            </div>
        </div>
    );
};
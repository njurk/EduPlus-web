import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/modals/Modal';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { SearchBar } from '../../components/ui/SearchBar';
import { ActionButtons } from '../../components/ui/ActionButtons';
import { TrashButton } from '../../components/ui/TrashButton';
import { Pagination } from '../../components/ui/Pagination';
import { api } from '../../services/apiService';
import { Users, BookOpen, UserPlus, RefreshCcw, Search, Check, Plus, ArrowLeft } from 'lucide-react';
import { clsx } from 'clsx';
import type { ClassEntity, ClassDetailsDto, User, Subject, SchoolYear, PaginatedResponse } from '../../types';
import { validateClassForm } from '../../utils/validation';
import { formatDateTime, formatName } from '../../utils/formatters';
import { YearSelector } from '../../components/ui/YearSelector';
import { useCMSContent } from '../../hooks/useCMSContent';

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
    const { getText } = useCMSContent('classManagement');
    const [activeTab, setActiveTab] = useState<'students' | 'subjects'>('students');
    const [details, setDetails] = useState<ClassDetailsDto | null>(null);
    const [, setLoading] = useState(false);

    const [dicts, setDicts] = useState<{ students: User[], subjects: Subject[], teachers: User[] }>({ students: [], subjects: [], teachers: [] });

    const [modals, setModals] = useState({ student: false, subject: false });
    const [selections, setSelections] = useState<{ candidates: number[], subject: string, teacher: string }>({ candidates: [], subject: '', teacher: '' });
    const [filters, setFilters] = useState({ studentSearch: '', subjectSearch: '' });
    const [studentSort, setStudentSort] = useState({ sortBy: 'lastName', sortDesc: false });
    const [subjectSort, setSubjectSort] = useState({ sortBy: 'subjectName', sortDesc: false });
    const [candidateSearch, setCandidateSearch] = useState('');
    const [teachersLoading, setTeachersLoading] = useState(false);

    const loadDetails = useCallback(async () => {
        setLoading(true);
        try {
            setDetails(await api.classManagement.getClassDetails(classId, {
                studentSearch: filters.studentSearch,
                subjectSearch: filters.subjectSearch,
                sortBy: studentSort.sortBy,
                sortDesc: studentSort.sortDesc,
                subjectSortBy: subjectSort.sortBy,
                subjectSortDesc: subjectSort.sortDesc
            }));
        }
        catch (e) { console.error(e); } finally { setLoading(false); }
    }, [classId, filters, studentSort, subjectSort]);

    useEffect(() => { loadDetails(); }, [loadDetails]);

    const loadDicts = async () => {
        if (dicts.subjects.length) return;
        const [usersResponse, sub] = await Promise.all([
            api.users.getAll({ roleLevel: 4, pageSize: 1000 }),
            api.subjects.getAll()
        ]);
        setDicts(prev => ({ ...prev, students: usersResponse.data.filter((u: User) => u.isActive), subjects: sub }));
    };

    useEffect(() => {
        if (!selections.subject) {
            setDicts(prev => ({ ...prev, teachers: [] }));
            return;
        }

        const fetchTeachers = async () => {
            setTeachersLoading(true);
            try {
                const teachers = await api.subjects.getTeachers(parseInt(selections.subject));
                setDicts(prev => ({ ...prev, teachers }));
                setSelections(prev => ({ ...prev, teacher: '' }));
            } catch (e) {
                console.error(e);
            } finally {
                setTeachersLoading(false);
            }
        };

        fetchTeachers();
    }, [selections.subject]);

    const handleAction = async (action: () => Promise<any>, confirmMsg?: string) => {
        if (confirmMsg && !window.confirm(confirmMsg)) return;
        try { await action(); loadDetails(); } catch { alert('Wystąpił błąd'); }
    };

    const saveStudents = () => handleAction(async () => {
        await api.classManagement.addStudentsBulk(classId, selections.candidates);
        setModals({ ...modals, student: false });
        setSelections(p => ({ ...p, candidates: [] }));
    });

    const saveSubject = () => handleAction(async () => {
        if (selections.subject && selections.teacher)
            await api.classManagement.assignSubject({ classId, subjectId: +selections.subject, teacherId: +selections.teacher });
        setModals({ ...modals, subject: false });
    });

    const availableCandidates = useMemo(() => {
        const existing = new Set(details?.students.map(s => s.studentId) || []);
        const q = candidateSearch.toLowerCase();
        return dicts.students.filter(s => !existing.has(s.id) && (s.lastName.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)));
    }, [dicts.students, details?.students, candidateSearch]);

    if (!details) return null;

    return (
        <div className="font-sans h-full">
            <Modal isOpen={modals.student} onClose={() => setModals({ ...modals, student: false })} title={getText('modal.assignStudents')} maxWidth="xl"
                footer={<><Button variant="secondary" onClick={() => setModals({ ...modals, student: false })}>Anuluj</Button><Button onClick={saveStudents} disabled={!selections.candidates.length}>Przypisz</Button></>}>
                <div className="flex flex-col h-[50vh]">
                    <div className="p-3 border-b bg-white"><div className="relative"><Search className="absolute left-2 top-2.5 text-neutral-400" size={16} /><Input value={candidateSearch} onChange={e => setCandidateSearch(e.target.value)} placeholder="Szukaj..." className="pl-8 text-sm" autoFocus /></div></div>
                    <div className="overflow-y-auto flex-1">{availableCandidates.slice(0, 50).map((s, idx) => <CandidateRow key={s.id} index={idx} student={s} isSelected={selections.candidates.includes(s.id)} onToggle={(id: number) => setSelections(p => ({ ...p, candidates: p.candidates.includes(id) ? p.candidates.filter(x => x !== id) : [...p.candidates, id] }))} />)}</div>
                </div>
            </Modal>

            <Modal isOpen={modals.subject} onClose={() => setModals({ ...modals, subject: false })} title={getText('modal.assignSubject')} maxWidth="md"
                footer={<><Button variant="secondary" onClick={() => setModals({ ...modals, subject: false })}>Anuluj</Button><Button onClick={saveSubject} disabled={!selections.subject || !selections.teacher}>Zapisz</Button></>}>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="label-text">{getText('form.subject')}</label>
                        <select className="w-full border border-neutral-300 px-3 py-2 rounded-md text-sm focus:outline-none focus:border-primary bg-white" value={selections.subject} onChange={e => setSelections({ ...selections, subject: e.target.value })}>
                            <option value="">Wybierz...</option>
                            {dicts.subjects.filter(s => !details.subjects.some(ds => ds.subjectId === s.id)).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label-text">{getText('form.teacher')}</label>
                        <select
                            className="w-full border border-neutral-300 px-3 py-2 rounded-md text-sm focus:outline-none focus:border-primary bg-white disabled:bg-neutral-100"
                            value={selections.teacher}
                            onChange={e => setSelections({ ...selections, teacher: e.target.value })}
                            disabled={!selections.subject || teachersLoading}
                        >
                            <option value="">{teachersLoading ? 'Ładowanie...' : (selections.subject ? 'Wybierz nauczyciela...' : 'Najpierw wybierz przedmiot')}</option>
                            {dicts.teachers.map(t => <option key={t.id} value={t.id}>{t.lastName} {t.firstName}</option>)}
                        </select>
                        {selections.subject && !teachersLoading && dicts.teachers.length === 0 && (
                            <p className="text-xs text-danger mt-1">Brak nauczycieli przypisanych do tego przedmiotu.</p>
                        )}
                    </div>
                </div>
            </Modal>

            <div className="flex items-center gap-4 mb-4">
                <button onClick={onBack} className="p-1 hover:bg-neutral-100 rounded text-neutral-600"><ArrowLeft size={20} /></button>
                <h2 className="text-xl font-bold text-neutral-800">klasa {details.classInfo.level}{details.classInfo.letter}</h2>
            </div>

            <div className="flex border-b border-neutral-200 bg-white">
                {[{ id: 'students', label: getText('tabs.students'), icon: Users }, { id: 'subjects', label: getText('tabs.subjects'), icon: BookOpen }].map(t => (
                    <button key={t.id} onClick={() => { setActiveTab(t.id as any); loadDetails(); }} className={clsx("flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-none uppercase", activeTab === t.id ? "border-primary text-primary" : "border-transparent text-neutral-500 hover:text-black")}>
                        <t.icon size={16} /> {t.label}
                    </button>
                ))}
            </div>

            <div className="bg-white border border-neutral-200 border-t-0 min-h-[500px]">
                {activeTab === 'students' ? (
                    <div className="flex flex-col h-full">
                        <div className="p-3 border-b flex justify-between items-center gap-4 bg-neutral-50/30">
                            <SearchBar value={filters.studentSearch} onChange={v => setFilters({ ...filters, studentSearch: v })} className="max-w-xs" />
                            <Button onClick={() => { setCandidateSearch(''); setSelections({ ...selections, candidates: [] }); setModals({ ...modals, student: true }); loadDicts(); }}><UserPlus size={16} className="mr-2" /> Przypisz</Button>
                        </div>
                        <DataTable
                            data={details.students}
                            sortBy={studentSort.sortBy}
                            sortDesc={studentSort.sortDesc}
                            onSort={f => setStudentSort(p => p.sortBy === f ? { ...p, sortDesc: !p.sortDesc } : { sortBy: f, sortDesc: true })}
                            columns={[
                                { header: getText('columns.ordinal'), sortKey: 'id', accessor: 'orderNumber', className: 'w-12 text-center' },
                                { header: getText('columns.student'), sortKey: 'lastName', render: (row) => formatName(row.student), className: 'font-medium' },
                                { header: getText('columns.email'), sortKey: 'email', render: (row) => row.student?.email },
                                { header: getText('columns.createdAt'), sortKey: 'createdat', render: (row) => formatDateTime(row.createdAt), className: 'text-xs text-neutral-500' },
                                {
                                    header: getText('columns.actions'),
                                    className: 'text-right',
                                    render: (row) => <ActionButtons onDelete={() => handleAction(() => api.classManagement.removeStudentFromClass(row.id), 'Czy na pewno chcesz usunąć tego ucznia z klasy?')} />
                                }
                            ]}
                            emptyMessage="Brak uczniów"
                        />
                    </div>
                ) : (
                    <div className="flex flex-col h-full">
                        <div className="p-3 border-b flex justify-between items-center gap-4 bg-neutral-50/30">
                            <SearchBar value={filters.subjectSearch} onChange={v => setFilters({ ...filters, subjectSearch: v })} className="max-w-xs" />
                            <Button onClick={() => { setSelections({ ...selections, subject: '', teacher: '' }); setModals({ ...modals, subject: true }); loadDicts(); }}><Plus size={16} className="mr-2" /> Przypisz</Button>
                        </div>
                        <DataTable
                            data={details.subjects}
                            sortBy={subjectSort.sortBy}
                            sortDesc={subjectSort.sortDesc}
                            onSort={f => setSubjectSort(p => p.sortBy === f ? { ...p, sortDesc: !p.sortDesc } : { sortBy: f, sortDesc: true })}
                            columns={[
                                { header: getText('columns.subject'), sortKey: 'subjectName', accessor: 'subjectName', className: 'font-medium pl-4' },
                                { header: getText('columns.teacher'), sortKey: 'teacherName', accessor: 'teacherName' },
                                { header: getText('columns.createdAt'), sortKey: 'createdat', render: (row) => formatDateTime(row.createdAt), className: 'text-xs text-neutral-500' },
                                {
                                    header: getText('columns.actions'),
                                    className: 'text-right',
                                    render: (row) => <ActionButtons onDelete={() => handleAction(() => api.classManagement.removeSubjectFromClass(row.id), 'Czy na pewno chcesz usunąć ten przedmiot z klasy?')} />
                                }
                            ]}
                            emptyMessage="Brak przedmiotów"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export const ClassManagement = () => {
    const { getText } = useCMSContent('classManagement');
    const [years, setYears] = useState<SchoolYear[]>([]);
    const [paginatedData, setPaginatedData] = useState<PaginatedResponse<ClassEntity> | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [selected, setSelected] = useState<{ year: number | null, class: number | null }>({ year: null, class: null });
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState<{ open: boolean, data: Partial<ClassEntity>, errors: Record<string, string> }>({ open: false, data: {}, errors: {} });
    const [showInactive, setShowInactive] = useState(false);
    const [filters, setFilters] = useState({ search: '', sortBy: 'class', sortDesc: false, level: '' });

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
        api.classManagement.getClassesByYear(selected.year, {
            pageNumber,
            sortBy: filters.sortBy,
            sortDesc: filters.sortDesc,
            level: filters.level ? parseInt(filters.level) : undefined,
            search: filters.search || undefined,
            includeInactive: showInactive
        }).then(res => {
            setPaginatedData(res);
        }).catch(console.error).finally(() => setLoading(false));
    }, [selected.year, showInactive, filters, pageNumber]);

    useEffect(() => { loadClasses(); }, [loadClasses]);

    useEffect(() => {
        setPageNumber(1);
    }, [filters.search, filters.level, showInactive]);

    const saveClass = async () => {
        const err = validateClassForm(form.data);
        if (Object.keys(err).length) return setForm(p => ({ ...p, errors: err }));
        try {
            await (form.data.id ? api.classManagement.updateClass(form.data.id, form.data) : api.classManagement.createClass({ ...form.data, schoolYearId: selected.year! }));
            setForm({ open: false, data: {}, errors: {} }); loadClasses();
        } catch (e: any) { alert(e.message || 'Błąd zapisu'); }
    };

    const delClass = (id: number) => { if (confirm('Usunąć?')) api.classManagement.deleteClass(id).then(loadClasses).catch(() => alert('Błąd usuwania')); };
    const restoreClass = (item: ClassEntity) => { if (confirm('Przywrócić?')) api.classManagement.updateClass(item.id, { ...item, isActive: true }).then(loadClasses).catch(() => alert('Wystąpił błąd')); };

    const classColumns: Column<ClassEntity>[] = [
        { header: getText('columns.class'), sortKey: 'class', className: 'text-neutral-800 font-medium', render: (row) => `${row.level}${row.letter}` },
        { header: getText('columns.studentCount'), sortKey: 'studentCount', render: (row) => row.studentCount || 0 },
        { header: getText('columns.createdAt'), sortKey: 'created', render: (row) => formatDateTime(row.createdAt), className: 'text-xs text-neutral-500' },
        { header: getText('columns.updatedAt'), sortKey: 'updated', render: (row) => formatDateTime(row.updatedAt), className: 'text-xs text-neutral-500' },
        { header: getText('columns.actions'), className: 'text-right', render: (row) => (<div onClick={e => e.stopPropagation()}><ActionButtons isActive={row.isActive} onEdit={() => setForm({ open: true, data: { ...row }, errors: {} })} onDelete={() => delClass(row.id)} onRestore={() => restoreClass(row)} /></div>) }
    ];


    if (selected.class) return <ClassDetailsView classId={selected.class} onBack={() => setSelected(p => ({ ...p, class: null }))} />;

    return (
        <div className="font-sans max-w-6xl mx-auto space-y-4">
            <Modal isOpen={form.open} onClose={() => setForm({ ...form, open: false })} title={form.data.id ? getText('modal.editClass') : getText('modal.newClass')} maxWidth="sm"
                footer={<><Button variant="secondary" onClick={() => setForm({ ...form, open: false })}>Anuluj</Button><Button onClick={saveClass}>Zapisz</Button></>}>
                <div className="grid grid-cols-2 gap-4 p-4">
                    <div><label className="label-text">{getText('form.level')}</label><Input type="number" min={1} max={8} value={form.data.level || ''} onChange={e => setForm({ ...form, data: { ...form.data, level: +e.target.value } })} /></div>
                    <div><label className="label-text">{getText('form.section')}</label><Input value={form.data.letter || ''} onChange={e => setForm({ ...form, data: { ...form.data, letter: e.target.value.toUpperCase() } })} /></div>
                </div>
            </Modal>

            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold text-neutral-800">{getText('title')}</h1>
                <YearSelector years={years} selectedYear={selected.year} onChange={id => setSelected(p => ({ ...p, year: id }))} />
            </div>

            <div className="bg-white border border-neutral-200 min-h-[400px] flex flex-col">
                <div className="p-3 border-b flex justify-between items-center gap-4 bg-neutral-50/30">
                    <div className="flex items-center gap-4 flex-1">
                        <SearchBar value={filters.search} onChange={v => setFilters({ ...filters, search: v })} className="max-w-xs" />
                        <select
                            value={filters.level}
                            onChange={e => setFilters({ ...filters, level: e.target.value })}
                            className="border border-neutral-300 rounded-xs px-3 h-9 text-sm bg-white min-w-[100px]"
                        >
                            <option value="">Wszystkie poziomy</option>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(l => <option key={l} value={l}>klasa {l}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-2 pl-4 border-l">
                        <TrashButton isTrashActive={showInactive} onToggle={() => setShowInactive(!showInactive)} />
                        <Button onClick={() => setForm({ open: true, data: { level: 1, letter: '', isActive: true }, errors: {} })}><Plus size={16} className="mr-2" /> Dodaj</Button>
                    </div>
                </div>
                <div className="flex-1">
                    {loading ? <div className="text-center p-12 text-neutral-400"><RefreshCcw className="animate-spin inline mr-2" /> Ładowanie...</div> : (
                        <DataTable
                            data={paginatedData?.data || []}
                            columns={classColumns}
                            emptyMessage="Brak klas"
                            onRowClick={(row) => setSelected(p => ({ ...p, class: row.id }))}
                            sortBy={filters.sortBy}
                            sortDesc={filters.sortDesc}
                            onSort={f => setFilters(p => p.sortBy === f ? { ...p, sortDesc: !p.sortDesc } : { ...p, sortBy: f, sortDesc: true })}
                        />
                    )}
                </div>
                {paginatedData && (
                    <Pagination
                        currentPage={pageNumber}
                        totalPages={paginatedData.totalPages}
                        totalCount={paginatedData.totalCount}
                        pageSize={paginatedData.pageSize}
                        onPageChange={setPageNumber}
                    />
                )}
            </div>
        </div>
    );
};

import { useState, useEffect, useCallback, useMemo } from 'react';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { SortToolbar } from '../../components/ui/SortToolbar';
import { api } from '../../services/apiService';
import { BookOpen, ArrowLeft, Plus, RefreshCcw, CheckSquare, Filter } from 'lucide-react';
import { clsx } from 'clsx';
import type { Subject, SchoolYear, ClassEntity, Grade, StudentGradesRowDto, SemesterDto, AttendanceType, AttendanceAdminDto } from '../../types';
import { formatDateTime, formatName } from '../../utils/formatters';
import { YearSelector } from '../../components/ui/YearSelector';
import { SemesterSelector } from '../../components/ui/SemesterSelector';
import { GradeSquare } from '../../components/ui/GradeSquare';
import { GradeModal } from '../../components/modals/GradeModal';
import { SubjectTile } from '../../components/ui/SubjectTile';
import { ActionButtons } from '../../components/ui/ActionButtons';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

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

            <div className="flex justify-between items-center gap-4 mb-4">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-1.5 hover:bg-neutral-100 rounded text-neutral-600 transition-colors"><ArrowLeft size={18} /></button>
                    <div><h2 className="text-lg font-bold text-neutral-800 leading-tight">{subject.name}</h2><p className="text-xs text-neutral-500">{yearName} • Klasa {className}</p></div>
                </div>
                <SemesterSelector semesters={semesters} selectedOrder={semesterOrder} onChange={setSemesterOrder} />
            </div>

            <div className="bg-white border border-neutral-300 flex-1 shadow-sm overflow-hidden flex flex-col">
                <DataTable data={data} isLoading={loading} emptyMessage="Brak uczniów"
                    columns={[
                        { header: 'Lp.', accessor: 'orderNumber', className: 'w-10 text-center text-neutral-400 font-mono border-r border-neutral-100 text-xs py-2' },
                        { header: 'Uczeń', render: (row) => <div className="font-medium text-neutral-900 text-sm truncate">{formatName(row)}</div>, className: 'w-48 border-r border-neutral-100 py-2' },
                        {
                            header: 'Oceny cząstkowe', className: 'py-2',
                            render: (row) => (
                                <div className="flex flex-wrap gap-1 items-center">
                                    {(row.grades || []).map(g => <GradeSquare key={g.id} grade={g} onClick={() => setModalData({ open: true, studentId: row.studentId, grade: g })} />)}
                                    <button onClick={() => setModalData({ open: true, studentId: row.studentId })} className="w-8 h-8 flex items-center justify-center border border-dashed border-neutral-300 text-neutral-400 hover:text-primary hover:border-primary transition-colors rounded-sm opacity-50 hover:opacity-100"><Plus size={14} /></button>
                                </div>
                            )
                        },
                        { header: 'Średnia', render: (row) => <span className={clsx("font-bold block text-center", row.average ? (row.average >= 4.75 ? "text-primary" : "text-neutral-800") : "text-neutral-300")}>{row.average ? row.average.toFixed(2) : '-'}</span>, className: 'w-20 border-l border-neutral-200 bg-neutral-50/50 py-2' }
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
                    <SubjectTile key={item.subjectId} subjectName={item.subjectName} teacherName={item.teacherName} onClick={() => onSelectSubject({ id: item.subjectId, name: item.subjectName })} />
                ))}
                {!subjects.length && <div className="col-span-full p-8 text-center text-neutral-400 border border-dashed border-neutral-300">Brak przedmiotów</div>}
            </div>
        </div>
    );
};

const ClassAttendanceView = ({ classId, onBack, className, yearName }: { classId: number, onBack: () => void, className: string, yearName: string }) => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<AttendanceAdminDto[]>([]);
    const [dicts, setDicts] = useState<{ subjects: any[], teachers: any[], types: AttendanceType[] }>({ subjects: [], teachers: [], types: [] });
    const [filters, setFilters] = useState({ search: '', date: '', subjectId: '', teacherId: '', type: '' });
    const [sorting, setSorting] = useState({ field: 'lessonDate', desc: true });

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                const [details, attendanceData, typesData] = await Promise.all([
                    api.classManagement.getClassDetails(classId),
                    api.attendance.getAllAdmin({ includeInactive: false }),
                    api.attendanceTypes.getAll()
                ]);
                const subjectsMap = details.subjects.map(s => ({ id: s.subjectId, name: s.subjectName, teacherId: s.teacherId, teacherName: s.teacherName }));
                const studentIds = new Set(details.students.map(s => s.studentId));
                setData(attendanceData.filter(a => studentIds.has(a.studentId)));
                setDicts({ subjects: subjectsMap, teachers: Array.from(new Map(subjectsMap.map(s => [s.teacherName, { id: s.teacherId, name: s.teacherName }])).values()), types: typesData });
            } catch (e) { console.error(e); } finally { setLoading(false); }
        };
        init();
    }, [classId]);

    const filteredData = useMemo(() => {
        let res = [...data];
        if (filters.search) res = res.filter(r => r.studentName.toLowerCase().includes(filters.search.toLowerCase()));
        if (filters.date) res = res.filter(r => r.lessonDate.startsWith(filters.date));
        if (filters.subjectId) { const s = dicts.subjects.find(x => x.id === Number(filters.subjectId)); if (s) res = res.filter(r => r.subjectName === s.name); }
        if (filters.teacherId) res = res.filter(r => r.teacherName === filters.teacherId);
        if (filters.type) res = res.filter(r => r.shortCode === filters.type);
        res.sort((a, b) => { const vA = (a as any)[sorting.field], vB = (b as any)[sorting.field]; return vA < vB ? (sorting.desc ? 1 : -1) : vA > vB ? (sorting.desc ? -1 : 1) : 0; });
        return res;
    }, [data, filters, sorting, dicts.subjects]);

    const handleDelete = async (id: number) => { if (confirm('Usunąć?')) { await api.attendance.delete(id); setData(p => p.filter(x => x.id !== id)); } };

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center gap-4 mb-4">
                <button onClick={onBack} className="p-1 hover:bg-neutral-100 rounded text-neutral-600"><ArrowLeft size={20} /></button>
                <div><h2 className="text-xl font-bold text-neutral-800">Frekwencja - {className}</h2><p className="text-sm text-neutral-500">{yearName}</p></div>
            </div>
            <div className="bg-white border border-neutral-200 flex-1 flex flex-col rounded-xs overflow-hidden">
                <SortToolbar search={filters.search} onSearchChange={v => setFilters(p => ({ ...p, search: v }))} sortBy={sorting.field} sortDesc={sorting.desc}
                    onSortChange={f => setSorting(p => ({ field: f, desc: p.field === f ? !p.desc : true }))}
                    sortOptions={[{ field: 'lessonDate', label: 'Data' }, { field: 'studentName', label: 'Uczeń' }]} className="p-3 border-b" />
                <div className="p-3 border-b bg-neutral-50 flex flex-wrap gap-3 items-end">
                    <div className="w-36"><label className="text-xs font-medium text-neutral-500 mb-1 block">Data</label><Input type="date" value={filters.date} onChange={e => setFilters(p => ({ ...p, date: e.target.value }))} className="h-8" /></div>
                    <div className="w-40"><label className="text-xs font-medium text-neutral-500 mb-1 block">Przedmiot</label><select className="w-full border border-neutral-300 rounded-xs px-2 h-8 text-sm bg-white" value={filters.subjectId} onChange={e => setFilters(p => ({ ...p, subjectId: e.target.value }))}><option value="">Wszystkie</option>{dicts.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                    <div className="w-40"><label className="text-xs font-medium text-neutral-500 mb-1 block">Nauczyciel</label><select className="w-full border border-neutral-300 rounded-xs px-2 h-8 text-sm bg-white" value={filters.teacherId} onChange={e => setFilters(p => ({ ...p, teacherId: e.target.value }))}><option value="">Wszyscy</option>{dicts.teachers.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}</select></div>
                    <div className="w-32"><label className="text-xs font-medium text-neutral-500 mb-1 block">Status</label><select className="w-full border border-neutral-300 rounded-xs px-2 h-8 text-sm bg-white" value={filters.type} onChange={e => setFilters(p => ({ ...p, type: e.target.value }))}><option value="">Wszystkie</option>{dicts.types.map(t => <option key={t.id} value={t.shortCode}>{t.name}</option>)}</select></div>
                    <Button variant="secondary" className="h-8" onClick={() => setFilters({ search: '', date: '', subjectId: '', teacherId: '', type: '' })}><Filter size={12} className="mr-1" />Reset</Button>
                </div>
                <div className="flex-1 overflow-auto">
                    {loading ? <div className="p-12 text-center text-neutral-400"><RefreshCcw className="animate-spin inline mr-2" />Ładowanie...</div> : (
                        <DataTable data={filteredData} emptyMessage="Brak wpisów" columns={[
                            { header: 'Data', render: r => <span className="text-xs">{formatDateTime(r.lessonDate)}</span>, className: 'w-28' },
                            { header: 'Przedmiot', render: r => <div><div className="font-medium text-sm">{r.subjectName}</div><div className="text-xs text-neutral-500">{r.teacherName}</div></div>, className: 'w-48' },
                            { header: 'Uczeń', render: r => <span className="font-medium">{r.studentName}</span> },
                            { header: 'Status', render: r => <span>{r.shortCode}</span>, className: 'w-20' },
                            { header: 'Akcje', className: 'w-20 text-right', render: r => <ActionButtons onDelete={() => handleDelete(r.id)} /> }
                        ]} />
                    )}
                </div>
            </div>
        </div>
    );
};

export const ClassRegister = () => {
    const [years, setYears] = useState<SchoolYear[]>([]);
    const [classes, setClasses] = useState<ClassEntity[]>([]);
    const [selected, setSelected] = useState<{ year: number | null, class: number | null, subject: Subject | null }>({ year: null, class: null, subject: null });
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'grades' | 'attendance'>('grades');
    const [filters, setFilters] = useState({ search: '', sortBy: 'level', sortDesc: false });

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

    const classColumns: Column<ClassEntity>[] = [
        { header: 'Klasa', accessor: 'level', className: 'font-medium text-neutral-900', render: (row) => `${row.level}${row.letter}` },
        { header: 'Liczba uczniów', accessor: 'studentCount', render: (row) => row.studentCount || 0 },
        { header: 'Utworzono', render: (row) => formatDateTime(row.createdAt) },
        { header: 'Edytowano', render: (row) => formatDateTime(row.updatedAt) }
    ];

    const filteredClasses = useMemo(() => {
        let result = [...classes];
        if (filters.search) {
            const q = filters.search.toLowerCase();
            result = result.filter(c => `${c.level}${c.letter}`.toLowerCase().includes(q));
        }
        result.sort((a, b) => {
            const valA = filters.sortBy === 'level' ? a.level : (a as any)[filters.sortBy];
            const valB = filters.sortBy === 'level' ? b.level : (b as any)[filters.sortBy];
            if (valA < valB) return filters.sortDesc ? 1 : -1;
            if (valA > valB) return filters.sortDesc ? -1 : 1;
            if (filters.sortBy === 'level') return a.letter.localeCompare(b.letter);
            return 0;
        });
        return result;
    }, [classes, filters]);

    if (selected.class && selected.subject && selected.year) {
        return <SubjectGradesView
            classId={selected.class}
            subject={selected.subject}
            yearName={selectedYearName}
            yearId={selected.year}
            className={selectedClassName}
            onBack={() => setSelected(p => ({ ...p, subject: null }))}
        />;
    }

    if (selected.class) {
        return (
            <div className="font-sans h-full flex flex-col">
                <div className="flex border-b border-neutral-200 bg-white mb-6">
                    {[
                        { id: 'grades', label: 'Oceny', icon: BookOpen },
                        { id: 'attendance', label: 'Frekwencja', icon: CheckSquare }
                    ].map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={clsx("flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-none uppercase", activeTab === t.id ? "border-primary text-primary" : "border-transparent text-neutral-500 hover:text-black")}>
                            <t.icon size={16} /> {t.label}
                        </button>
                    ))}
                </div>

                <div className="flex-1">
                    {activeTab === 'grades' ? (
                        <ClassSubjectsView
                            classId={selected.class}
                            yearName={selectedYearName}
                            className={selectedClassName}
                            onSelectSubject={(s: Subject) => setSelected(p => ({ ...p, subject: s }))}
                            onBack={() => setSelected(p => ({ ...p, class: null }))}
                        />
                    ) : (
                        <ClassAttendanceView classId={selected.class} onBack={() => setSelected(p => ({ ...p, class: null }))} className={selectedClassName} yearName={selectedYearName} />
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="font-sans max-w-6xl mx-auto space-y-4">
            <div className="flex justify-between items-center pb-4 border-b">
                <h1 className="text-xl font-bold text-neutral-800">Dziennik lekcyjny</h1>
                <YearSelector years={years} selectedYear={selected.year} onChange={(id) => setSelected(p => ({ ...p, year: id }))} />
            </div>

            <div className="bg-white border border-neutral-200 min-h-[400px]">
                <div className="flex flex-col h-full">
                    <div className="p-3 border-b bg-neutral-50/30">
                        <SortToolbar
                            className="p-0 border-0"
                            search={filters.search}
                            onSearchChange={v => setFilters({ ...filters, search: v })}
                            sortBy={filters.sortBy}
                            sortDesc={filters.sortDesc}
                            onSortChange={f => setFilters({ ...filters, sortBy: f, sortDesc: f === filters.sortBy ? !filters.sortDesc : false })}
                            sortOptions={[
                                { field: 'level', label: 'Klasa' },
                                { field: 'studentCount', label: 'Liczba uczniów' }
                            ]}
                        />
                    </div>
                    {loading ? <div className="p-12 text-center text-neutral-400"><RefreshCcw className="animate-spin inline mr-2" /> Ładowanie...</div> : (
                        <DataTable
                            data={filteredClasses}
                            columns={classColumns}
                            emptyMessage="Brak klas w wybranym roku szkolnym"
                            onRowClick={(row) => setSelected(p => ({ ...p, class: row.id }))}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

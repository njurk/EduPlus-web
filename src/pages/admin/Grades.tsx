import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/apiService';
import { Plus, Download, ChevronDown } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { DataTable } from '../../components/ui/DataTable';
import { Pagination } from '../../components/ui/Pagination';
import { formatDateTime } from '../../utils/formatters';
import { ActionButtons } from '../../components/ui/ActionButtons';
import { YearSelector } from '../../components/ui/YearSelector';
import { TrashButton } from '../../components/ui/TrashButton';
import { SearchBar } from '../../components/ui/SearchBar';
import { Modal } from '../../components/modals/Modal';
import type { SchoolYear, SemesterDto, ClassEntity, PaginatedResponse, Subject, User } from '../../types';
import { useCMSContent } from '../../hooks/useCMSContent';

export const Grades = () => {
    const { getText } = useCMSContent('grades');
    const [data, setData] = useState<any[]>([]);
    const [paginatedData, setPaginatedData] = useState<PaginatedResponse<any> | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [loading, setLoading] = useState(false);
    const [years, setYears] = useState<SchoolYear[]>([]);
    const [semesters, setSemesters] = useState<SemesterDto[]>([]);
    const [classes, setClasses] = useState<ClassEntity[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [gradeTypes, setGradeTypes] = useState<any[]>([]);
    const [gradeCategories, setGradeCategories] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<User[]>([]);

    const [detailsGrade, setDetailsGrade] = useState<any | null>(null);
    const [editGrade, setEditGrade] = useState<any | null>(null);
    const [editForm, setEditForm] = useState({ gradeTypeId: 0, gradeCategoryId: 0, comment: '' });
    const [saving, setSaving] = useState(false);

    const [exportOpen, setExportOpen] = useState(false);
    const [exportFormat, setExportFormat] = useState<'pdf' | 'xlsx' | 'csv'>('pdf');
    const [exportType, setExportType] = useState<'class' | 'student'>('class');
    const [exportFilters, setExportFilters] = useState({
        yearId: null as number | null,
        semesterId: null as number | null,
        classId: null as number | null,
        subjectId: null as number | null,
        studentId: null as number | null
    });
    const [exportSemesters, setExportSemesters] = useState<SemesterDto[]>([]);
    const [exportClasses, setExportClasses] = useState<ClassEntity[]>([]);
    const [exportStudents, setExportStudents] = useState<any[]>([]);

    const [filters, setFilters] = useState({
        search: '',
        sortBy: 'createdat',
        sortDesc: true,
        yearId: null as number | null,
        semesterId: null as number | null,
        classId: null as number | null,
        subjectId: null as number | null,
        gradeTypeId: null as number | null,
        gradeCategoryId: null as number | null,
        teacherId: null as number | null,
        showInactive: false
    });

    useEffect(() => {
        api.schoolYears.getAll().then(data => {
            setYears(data);
            const today = new Date().toISOString().split('T')[0];
            const current = data.find(y => y.startDate <= today && y.endDate >= today) || data.find(y => y.isActive) || data[0];
            if (current) setFilters(f => ({ ...f, yearId: current.id }));
        });
        api.subjects.getAll().then(setSubjects).catch(console.error);
        api.gradeTypes.getAll().then(setGradeTypes).catch(console.error);
        api.gradeCategories.getAll().then(setGradeCategories).catch(console.error);
        api.users.getAll({ roleLevel: 2, pageSize: 1000 }).then(res => setTeachers(res.data)).catch(console.error);
    }, []);

    useEffect(() => {
        if (filters.yearId) {
            Promise.all([
                api.classManagement.getSemesters(filters.yearId),
                api.classManagement.getClassesByYear(filters.yearId)
            ]).then(([sem, cls]) => {
                setSemesters(sem);
                setClasses(cls.data);
            });
        }
    }, [filters.yearId]);

    const loadData = useCallback(async () => {
        if (!filters.yearId) return;
        setLoading(true);
        try {
            const params: Record<string, any> = {
                pageNumber,
                pageSize: 20,
                search: filters.search,
                sortBy: filters.sortBy,
                sortDesc: filters.sortDesc,
                schoolYearId: filters.yearId,
                showInactive: filters.showInactive
            };
            if (filters.classId) params.classId = filters.classId;
            if (filters.semesterId) params.semesterId = filters.semesterId;
            if (filters.subjectId) params.subjectId = filters.subjectId;
            if (filters.gradeTypeId) params.gradeTypeId = filters.gradeTypeId;
            if (filters.gradeCategoryId) params.gradeCategoryId = filters.gradeCategoryId;
            if (filters.teacherId) params.teacherId = filters.teacherId;
            const response = await api.grades.getAll(params);
            setPaginatedData(response);
            setData(response.data);
        } finally { setLoading(false); }
    }, [filters, pageNumber]);

    useEffect(() => { loadData(); }, [loadData]);

    useEffect(() => { setPageNumber(1); }, [filters.search, filters.yearId, filters.semesterId, filters.classId, filters.subjectId, filters.gradeTypeId, filters.gradeCategoryId, filters.teacherId, filters.showInactive]);

    const handleDetails = async (id: number) => {
        try {
            const grade = await api.grades.getById(id);
            setDetailsGrade(grade);
        } catch (e) { console.error(e); }
    };

    const handleEdit = async (id: number) => {
        try {
            const grade = await api.grades.getById(id);
            setEditGrade(grade);
            setEditForm({
                gradeTypeId: grade.gradeTypeId,
                gradeCategoryId: grade.gradeCategoryId,
                comment: grade.comment || ''
            });
        } catch (e) { console.error(e); }
    };

    const handleSaveEdit = async () => {
        if (!editGrade) return;
        setSaving(true);
        try {
            await api.grades.update(editGrade.id, editForm);
            setEditGrade(null);
            loadData();
        } catch (e) { console.error(e); } finally { setSaving(false); }
    };

    const handleDelete = async (id: number, isActive: boolean) => {
        const message = isActive
            ? 'Czy na pewno chcesz dezaktywować tę ocenę?'
            : 'Czy na pewno chcesz trwale usunąć tę ocenę?';
        if (!confirm(message)) return;
        try {
            await api.grades.delete(id);
            loadData();
        } catch (e) { console.error(e); }
    };

    const handleRestore = async (id: number) => {
        try {
            await api.grades.restore(id);
            loadData();
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        if (exportFilters.yearId && exportOpen) {
            Promise.all([
                api.classManagement.getSemesters(exportFilters.yearId),
                api.classManagement.getClassesByYear(exportFilters.yearId)
            ]).then(([sem, cls]) => {
                setExportSemesters(sem);
                setExportClasses(cls.data);
                if (!exportFilters.semesterId) {
                    const today = new Date().toISOString().split('T')[0];
                    const currentSem = sem.find((s: SemesterDto) => s.startDate && s.endDate && s.startDate <= today && s.endDate >= today) || sem[0];
                    if (currentSem) setExportFilters(f => ({ ...f, semesterId: currentSem.id }));
                }
            });
        }
    }, [exportFilters.yearId, exportOpen]);

    useEffect(() => {
        if (exportFilters.classId) {
            api.classManagement.getClassStudents(exportFilters.classId).then(students => {
                setExportStudents(students.sort((a: any, b: any) => a.orderNumber - b.orderNumber));
            });
        } else {
            setExportStudents([]);
        }
    }, [exportFilters.classId]);

    const handleExport = async () => {
        if (!exportFilters.yearId || !exportFilters.semesterId || !exportFilters.classId) return;
        if (exportType === 'class' && !exportFilters.subjectId) return;
        if (exportType === 'student' && !exportFilters.studentId) return;
        try {
            await api.export.downloadGrades({
                classId: exportFilters.classId,
                semesterId: exportFilters.semesterId,
                schoolYearId: exportFilters.yearId,
                subjectId: exportType === 'class' ? exportFilters.subjectId ?? undefined : undefined,
                studentId: exportType === 'student' ? exportFilters.studentId ?? undefined : undefined,
                format: exportFormat
            });
            setExportOpen(false);
        } catch (e) {
            console.error(e);
            alert('Błąd podczas eksportu');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold text-neutral-800">{getText('title')}</h1>
                <div className="flex gap-2">
                    <YearSelector
                        years={years}
                        selectedYear={filters.yearId}
                        onChange={v => setFilters(f => ({ ...f, yearId: v, semesterId: null, classId: null }))}
                    />
                    <select
                        value={filters.semesterId || ''}
                        onChange={e => setFilters(f => ({ ...f, semesterId: e.target.value ? Number(e.target.value) : null }))}
                        className="border border-neutral-300 rounded-xs px-3 h-9 text-sm bg-white min-w-[140px]"
                    >
                        <option value="">Wszystkie semestry</option>
                        {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <select
                        value={filters.classId || ''}
                        onChange={e => setFilters(f => ({ ...f, classId: e.target.value ? Number(e.target.value) : null }))}
                        className="border border-neutral-300 rounded-xs px-3 h-9 text-sm bg-white min-w-[100px]"
                    >
                        <option value="">Wszystkie klasy</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.level}{c.letter}</option>)}
                    </select>
                </div>
            </div>
            <div className="bg-white border border-neutral-200 rounded-xs min-h-[400px] flex flex-col">
                <div className="p-3 border-b flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                        <SearchBar value={filters.search} onChange={v => setFilters(f => ({ ...f, search: v }))} className="max-w-xs" />
                        <select
                            value={filters.subjectId || ''}
                            onChange={e => setFilters(f => ({ ...f, subjectId: e.target.value ? Number(e.target.value) : null }))}
                            className="border border-neutral-300 rounded-xs px-2 h-9 text-sm bg-white min-w-[120px]"
                        >
                            <option value="">Wszystkie przedmioty</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <select
                            value={filters.gradeTypeId || ''}
                            onChange={e => setFilters(f => ({ ...f, gradeTypeId: e.target.value ? Number(e.target.value) : null }))}
                            className="border border-neutral-300 rounded-xs px-2 h-9 text-sm bg-white min-w-[80px]"
                        >
                            <option value="">Wszystkie oceny</option>
                            {gradeTypes.map(g => <option key={g.id} value={g.id}>{g.numeric}</option>)}
                        </select>
                        <select
                            value={filters.gradeCategoryId || ''}
                            onChange={e => setFilters(f => ({ ...f, gradeCategoryId: e.target.value ? Number(e.target.value) : null }))}
                            className="border border-neutral-300 rounded-xs px-2 h-9 text-sm bg-white min-w-[100px]"
                        >
                            <option value="">Wszystkie kategorie</option>
                            {gradeCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <select
                            value={filters.teacherId || ''}
                            onChange={e => setFilters(f => ({ ...f, teacherId: e.target.value ? Number(e.target.value) : null }))}
                            className="border border-neutral-300 rounded-xs px-2 h-9 text-sm bg-white min-w-[140px]"
                        >
                            <option value="">Wszyscy nauczyciele</option>
                            {teachers.map(t => <option key={t.id} value={t.id}>{t.lastName} {t.firstName}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => { setExportOpen(true); setExportFilters({ yearId: filters.yearId, semesterId: null, classId: filters.classId, subjectId: filters.subjectId, studentId: null }); }}>
                            <Download size={14} className="mr-1" /> Eksport
                            <ChevronDown size={14} className="ml-1" />
                        </Button>
                        <TrashButton isTrashActive={filters.showInactive} onToggle={() => setFilters(f => ({ ...f, showInactive: !f.showInactive }))} />
                        <Button><Plus size={14} className="mr-1" /> Dodaj</Button>
                    </div>
                </div>
                <div className="flex-1">
                    {loading ? <LoadingSpinner /> : (
                        <DataTable
                            data={data}
                            sortBy={filters.sortBy}
                            sortDesc={filters.sortDesc}
                            onSort={field => setFilters(f => f.sortBy === field ? { ...f, sortDesc: !f.sortDesc } : { ...f, sortBy: field, sortDesc: true })}
                            columns={[
                                { header: getText('columns.student'), sortKey: 'studentname', render: g => <span className="font-medium">{g.studentName}</span> },
                                { header: getText('columns.class'), sortKey: 'classname', render: g => g.className },
                                { header: getText('columns.subject'), sortKey: 'subjectname', render: g => g.subjectName },
                                { header: getText('columns.grade'), sortKey: 'gradevalue', render: g => <span className="text-s">{g.gradeTypeName}</span> },
                                { header: getText('columns.category'), sortKey: 'categoryname', render: g => <span className="text-neutral-500 text-xs">{g.categoryName}</span> },
                                { header: getText('columns.teacher'), sortKey: 'teachername', render: g => <span className="text-xs">{g.teacherName}</span> },
                                { header: getText('columns.createdAt'), sortKey: 'createdat', render: g => <span className="text-neutral-500 text-xs">{formatDateTime(g.createdAt)}</span> },
                                { header: getText('columns.updatedAt'), sortKey: 'updatedat', render: g => <span className="text-neutral-500 text-xs">{formatDateTime(g.updatedAt)}</span> },
                                { header: getText('columns.modifiedBy'), render: g => <span className="text-neutral-500 text-xs">{g.modifiedByName || 'System'}</span> },
                                {
                                    header: getText('columns.actions'), className: 'text-right', render: g => (
                                        <ActionButtons
                                            onDetails={() => handleDetails(g.id)}
                                            onEdit={() => handleEdit(g.id)}
                                            onDelete={() => handleDelete(g.id, g.isActive)}
                                            onRestore={filters.showInactive ? () => handleRestore(g.id) : undefined}
                                        />
                                    )
                                }
                            ]}
                            emptyMessage={getText('emptyMessage')}
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

            <Modal isOpen={!!detailsGrade} onClose={() => setDetailsGrade(null)} title="Szczegóły oceny">
                {detailsGrade && (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                            <div><span className="text-neutral-500 text-sm">Uczeń:</span><p className="font-medium">{detailsGrade.studentName}</p></div>
                            <div><span className="text-neutral-500 text-sm">Klasa:</span><p className="font-medium">{detailsGrade.className}</p></div>
                            <div><span className="text-neutral-500 text-sm">Przedmiot:</span><p className="font-medium">{detailsGrade.subjectName}</p></div>
                            <div><span className="text-neutral-500 text-sm">Ocena:</span><p className="font-bold text-lg">{detailsGrade.gradeTypeName}</p></div>
                            <div><span className="text-neutral-500 text-sm">Kategoria:</span><p className="font-medium">{detailsGrade.categoryName}</p></div>
                            <div><span className="text-neutral-500 text-sm">Nauczyciel:</span><p className="font-medium">{detailsGrade.teacherName}</p></div>
                            <div className="col-span-2"><span className="text-neutral-500 text-sm">Komentarz:</span><p>{detailsGrade.comment || '-'}</p></div>
                            <div><span className="text-neutral-500 text-sm">Utworzono:</span><p className="text-sm">{formatDateTime(detailsGrade.createdAt)}</p></div>
                            <div><span className="text-neutral-500 text-sm">Zaktualizowano:</span><p className="text-sm">{formatDateTime(detailsGrade.updatedAt)}</p></div>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal isOpen={!!editGrade} onClose={() => setEditGrade(null)} title="Edycja oceny">
                {editGrade && (
                    <div className="space-y-4">
                        <div className="text-sm text-neutral-500 mb-2">
                            {editGrade.studentName} • {editGrade.className} • {editGrade.subjectName}
                        </div>
                        <div>
                            <label className="label-text block mb-1">Ocena</label>
                            <select
                                value={editForm.gradeTypeId}
                                onChange={e => setEditForm(f => ({ ...f, gradeTypeId: Number(e.target.value) }))}
                                className="w-full border border-neutral-300 rounded-xs px-3 h-9 text-sm bg-white"
                            >
                                {gradeTypes.map(g => <option key={g.id} value={g.id}>{g.numeric} - {g.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label-text block mb-1">Kategoria</label>
                            <select
                                value={editForm.gradeCategoryId}
                                onChange={e => setEditForm(f => ({ ...f, gradeCategoryId: Number(e.target.value) }))}
                                className="w-full border border-neutral-300 rounded-xs px-3 h-9 text-sm bg-white"
                            >
                                {gradeCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label-text block mb-1">Komentarz</label>
                            <textarea
                                value={editForm.comment}
                                onChange={e => setEditForm(f => ({ ...f, comment: e.target.value }))}
                                className="w-full border border-neutral-300 rounded-xs px-3 py-2 text-sm bg-white resize-none"
                                rows={3}
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button variant="secondary" onClick={() => setEditGrade(null)}>Anuluj</Button>
                            <Button onClick={handleSaveEdit} disabled={saving}>{saving ? 'Zapisywanie...' : 'Zapisz'}</Button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal isOpen={exportOpen} onClose={() => setExportOpen(false)} title="Eksport wykazu ocen">
                <div className="space-y-4 p-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label-text block mb-1">Rok szkolny *</label>
                            <YearSelector
                                years={years}
                                selectedYear={exportFilters.yearId}
                                onChange={v => setExportFilters(f => ({ ...f, yearId: v, semesterId: null, classId: null }))}
                            />
                        </div>
                        <div>
                            <label className="label-text block mb-1">Semestr *</label>
                            <select
                                value={exportFilters.semesterId || ''}
                                onChange={e => setExportFilters(f => ({ ...f, semesterId: e.target.value ? Number(e.target.value) : null }))}
                                className="w-full border border-neutral-300 rounded-xs px-3 h-9 text-sm bg-white"
                                disabled={!exportFilters.yearId}
                            >
                                <option value="">Wybierz semestr</option>
                                {exportSemesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="label-text block mb-1">Typ wykazu</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="exportType"
                                    value="class"
                                    checked={exportType === 'class'}
                                    onChange={() => { setExportType('class'); setExportFilters(f => ({ ...f, studentId: null })); }}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm font-medium">Cała klasa</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="exportType"
                                    value="student"
                                    checked={exportType === 'student'}
                                    onChange={() => setExportType('student')}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm font-medium">Pojedynczy uczeń</span>
                            </label>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label-text block mb-1">Klasa *</label>
                            <select
                                value={exportFilters.classId || ''}
                                onChange={e => setExportFilters(f => ({ ...f, classId: e.target.value ? Number(e.target.value) : null }))}
                                className="w-full border border-neutral-300 rounded-xs px-3 h-9 text-sm bg-white"
                                disabled={!exportFilters.yearId}
                            >
                                <option value="">Wybierz klasę</option>
                                {exportClasses.map(c => <option key={c.id} value={c.id}>{c.level}{c.letter}</option>)}
                            </select>
                        </div>
                        {exportType === 'class' ? (
                            <div>
                                <label className="label-text block mb-1">Przedmiot *</label>
                                <select
                                    value={exportFilters.subjectId || ''}
                                    onChange={e => setExportFilters(f => ({ ...f, subjectId: e.target.value ? Number(e.target.value) : null }))}
                                    className="w-full border border-neutral-300 rounded-xs px-3 h-9 text-sm bg-white"
                                >
                                    <option value="">Wybierz przedmiot</option>
                                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        ) : (
                            <div>
                                <label className="label-text block mb-1">Uczeń *</label>
                                <select
                                    value={exportFilters.studentId || ''}
                                    onChange={e => setExportFilters(f => ({ ...f, studentId: e.target.value ? Number(e.target.value) : null }))}
                                    className="w-full border border-neutral-300 rounded-xs px-3 h-9 text-sm bg-white"
                                    disabled={!exportFilters.classId}
                                >
                                    <option value="">Wybierz ucznia</option>
                                    {exportStudents.map((s: any) => <option key={s.studentId} value={s.studentId}>{s.orderNumber}. {s.student?.lastName} {s.student?.firstName}</option>)}
                                </select>
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="label-text block mb-1">Format</label>
                        <div className="flex gap-4">
                            {(['pdf', 'xlsx', 'csv'] as const).map(fmt => (
                                <label key={fmt} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="exportFormat"
                                        value={fmt}
                                        checked={exportFormat === fmt}
                                        onChange={() => setExportFormat(fmt)}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm font-medium uppercase">{fmt}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button variant="secondary" onClick={() => setExportOpen(false)}>Anuluj</Button>
                        <Button
                            onClick={handleExport}
                            disabled={!exportFilters.yearId || !exportFilters.semesterId || !exportFilters.classId || (exportType === 'class' && !exportFilters.subjectId) || (exportType === 'student' && !exportFilters.studentId)}
                        >
                            <Download size={14} className="mr-1" /> Eksportuj
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

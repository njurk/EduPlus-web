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
import { Select } from '../../components/ui/Select';
import { TrashButton } from '../../components/ui/TrashButton';
import { FilterToolbar, FilterSelect } from '../../components/ui/FilterToolbar';
import { Modal } from '../../components/modals/Modal';
import type { SemesterDto, ClassEntity, PaginatedResponse, Subject, SubjectList, User } from '../../types';
import { useCMSContent } from '../../hooks/useCMSContent';
import { useSchoolYearSelector } from '../../hooks/useSchoolYearSelector';

export const Grades = () => {
    const { getText } = useCMSContent('grades');
    const {
        years, selectedYearId,
        semesters, classes
    } = useSchoolYearSelector({ withClasses: true });

    const [data, setData] = useState<any[]>([]);
    const [paginatedData, setPaginatedData] = useState<PaginatedResponse<any> | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [loading, setLoading] = useState(false);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [gradeTypes, setGradeTypes] = useState<any[]>([]);
    const [gradeCategories, setGradeCategories] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<User[]>([]);

    const [detailsGrade, setDetailsGrade] = useState<any | null>(null);
    const [editGrade, setEditGrade] = useState<any | null>(null);
    const [editForm, setEditForm] = useState({ gradeTypeId: 0, gradeCategoryId: 0, comment: '' });
    const [saving, setSaving] = useState(false);

    const [addOpen, setAddOpen] = useState(false);
    const [addForm, setAddForm] = useState({ classId: null as number | null, studentId: null as number | null, subjectId: null as number | null, gradeTypeId: null as number | null, gradeCategoryId: null as number | null, comment: '' });
    const [addStudents, setAddStudents] = useState<any[]>([]);
    const [addSubjects, setAddSubjects] = useState<any[]>([]);

    const [exportOpen, setExportOpen] = useState(false);
    const [exportFormat, setExportFormat] = useState<'pdf' | 'xlsx'>('pdf');
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
    const [exportSubjects, setExportSubjects] = useState<SubjectList[]>([]);
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
        if (selectedYearId) setFilters(f => ({ ...f, yearId: selectedYearId }));
    }, [selectedYearId]);

    useEffect(() => {
        api.subjects.getAll().then(setSubjects).catch(console.error);
        api.gradeTypes.getAll().then(setGradeTypes).catch(console.error);
        api.gradeCategories.getAll({ includeSystem: true }).then(setGradeCategories).catch(console.error);
        api.users.getAll({ roleLevel: 2, pageSize: 1000 }).then(res => setTeachers(res.data)).catch(console.error);
    }, []);

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

    const handleAdd = async () => {
        if (!addForm.studentId || !addForm.subjectId || !addForm.gradeTypeId || !addForm.gradeCategoryId) return;
        setSaving(true);
        try {
            await api.grades.create({
                studentId: addForm.studentId,
                subjectId: addForm.subjectId,
                gradeTypeId: addForm.gradeTypeId,
                gradeCategoryId: addForm.gradeCategoryId,
                comment: addForm.comment || undefined
            });
            setAddOpen(false);
            setAddForm({ classId: null, studentId: null, subjectId: null, gradeTypeId: null, gradeCategoryId: null, comment: '' });
            loadData();
        } catch (e) { console.error(e); } finally { setSaving(false); }
    };

    useEffect(() => {
        if (addForm.classId) {
            api.classManagement.getClassDetails(addForm.classId).then(details => {
                setAddStudents((details.students || []).sort((a: any, b: any) => a.orderNumber - b.orderNumber));
                setAddSubjects((details.subjects || []).map((cs: any) => ({ id: cs.subjectId, name: cs.subjectName })).filter((s: any) => s.id));
            }).catch(console.error);
        } else {
            setAddStudents([]);
            setAddSubjects([]);
        }
    }, [addForm.classId]);

    useEffect(() => {
        if (exportFilters.yearId && exportOpen) {
            Promise.all([
                api.schoolYears.getSemesters(exportFilters.yearId),
                api.classManagement.getClassesByYear(exportFilters.yearId, { pageSize: 1000 })
            ]).then(([sem, cls]) => {
                setExportSemesters(sem || []);
                const classesArr = Array.isArray(cls) ? cls : (cls?.data || []);
                setExportClasses(classesArr);
                if (!exportFilters.semesterId) {
                    const today = new Date().toISOString().split('T')[0];
                    const currentSem = (sem || []).find((s: SemesterDto) => s.startDate && s.endDate && s.startDate <= today && s.endDate >= today) || sem?.[0];
                    if (currentSem) setExportFilters(f => ({ ...f, semesterId: currentSem.id }));
                }
            }).catch(console.error);
        }
    }, [exportFilters.yearId, exportOpen]);

    useEffect(() => {
        if (exportFilters.classId) {
            api.classManagement.getClassDetails(exportFilters.classId).then(details => {
                setExportStudents((details.students || []).sort((a: any, b: any) => a.orderNumber - b.orderNumber));
                setExportSubjects((details.subjects || []).map((cs: any) => ({ id: cs.subjectId, name: cs.subjectName })).filter((s: any) => s.id));
            }).catch(console.error);
        } else {
            setExportStudents([]);
            setExportSubjects([]);
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
                    <Select options={semesters.map(s => ({ value: s.id, label: s.name }))} value={filters.semesterId} onChange={v => setFilters(f => ({ ...f, semesterId: v ? Number(v) : null }))} placeholder="Wszystkie semestry" />
                    <Select options={classes.map(c => ({ value: c.id, label: `${c.level}${c.letter}` }))} value={filters.classId} onChange={v => setFilters(f => ({ ...f, classId: v ? Number(v) : null }))} placeholder="Wszystkie klasy" />
                </div>
            </div>
            <div className="bg-white border border-neutral-200 rounded-xs min-h-[400px] flex flex-col">
                <FilterToolbar
                    search={{ value: filters.search, onChange: v => setFilters(f => ({ ...f, search: v })) }}
                    onReset={() => setFilters(f => ({ ...f, search: '', subjectId: null, gradeTypeId: null, gradeCategoryId: null, teacherId: null }))}
                    rightContent={
                        <>
                            <Button variant="secondary" onClick={() => { setExportOpen(true); setExportFilters({ yearId: filters.yearId, semesterId: null, classId: filters.classId, subjectId: filters.subjectId, studentId: null }); }}>
                                <Download size={14} className="mr-1" /> Eksport
                                <ChevronDown size={14} className="ml-1" />
                            </Button>
                            <TrashButton isTrashActive={filters.showInactive} onToggle={() => setFilters(f => ({ ...f, showInactive: !f.showInactive }))} />
                            <Button onClick={() => { setAddOpen(true); setAddForm(f => ({ ...f, classId: filters.classId })); }}><Plus size={14} className="mr-1" /> Dodaj</Button>
                        </>
                    }
                >
                    <FilterSelect
                        label="Przedmiot:"
                        value={filters.subjectId}
                        onChange={v => setFilters(f => ({ ...f, subjectId: v as number | null }))}
                        options={subjects.map(s => ({ value: s.id, label: s.name }))}
                        placeholder="Wszystkie"
                        minWidth="120px"
                    />
                    <FilterSelect
                        label="Ocena:"
                        value={filters.gradeTypeId}
                        onChange={v => setFilters(f => ({ ...f, gradeTypeId: v as number | null }))}
                        options={gradeTypes.map(g => ({ value: g.id, label: String(g.numeric) }))}
                        placeholder="Wszystkie"
                        minWidth="80px"
                    />
                    <FilterSelect
                        label="Kategoria:"
                        value={filters.gradeCategoryId}
                        onChange={v => setFilters(f => ({ ...f, gradeCategoryId: v as number | null }))}
                        options={gradeCategories.map(c => ({ value: c.id, label: c.name }))}
                        placeholder="Wszystkie"
                        minWidth="100px"
                    />
                    <FilterSelect
                        label="Nauczyciel:"
                        value={filters.teacherId}
                        onChange={v => setFilters(f => ({ ...f, teacherId: v as number | null }))}
                        options={teachers.map(t => ({ value: t.id, label: `${t.lastName} ${t.firstName}` }))}
                        placeholder="Wszyscy"
                        minWidth="140px"
                    />
                </FilterToolbar>
                <div className="flex-1">
                    {loading ? <LoadingSpinner /> : (
                        <DataTable
                            data={data}
                            sortBy={filters.sortBy}
                            sortDesc={filters.sortDesc}
                            onSort={field => setFilters(f => f.sortBy === field ? { ...f, sortDesc: !f.sortDesc } : { ...f, sortBy: field, sortDesc: true })}
                            columns={[
                                { header: 'Uczeń', sortKey: 'studentname', bold: true, render: g => g.studentName },
                                { header: 'Klasa', sortKey: 'classname', render: g => g.className },
                                { header: 'Przedmiot', sortKey: 'subjectname', render: g => g.subjectName },
                                { header: 'Ocena', sortKey: 'gradevalue', render: g => g.gradeTypeName },
                                { header: 'Kategoria', sortKey: 'categoryname', bold: true, render: g => <span style={{ color: g.categoryColorHex }}>{g.categoryName}</span> },
                                { header: 'Nauczyciel', sortKey: 'teachername', render: g => g.teacherName },
                                { header: 'Wystawiono', sortKey: 'createdat', muted: true, render: g => formatDateTime(g.createdAt) },
                                { header: 'Edytowano', sortKey: 'updatedat', muted: true, render: g => formatDateTime(g.updatedAt) },
                                { header: 'Edytowane przez', muted: true, render: g => g.modifiedByName || 'System' },
                                {
                                    header: 'Akcje', className: 'text-right', render: g => (
                                        <ActionButtons
                                            isActive={!filters.showInactive}
                                            onDetails={() => handleDetails(g.id)}
                                            onEdit={!filters.showInactive ? () => handleEdit(g.id) : undefined}
                                            onDelete={() => handleDelete(g.id, g.isActive)}
                                            onRestore={filters.showInactive ? () => handleRestore(g.id) : undefined}
                                        />
                                    )
                                }
                            ]}
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
                    <div className="p-4 text-sm">
                        <div className="space-y-2 pb-3">
                            <div><span className="font-medium">Uczeń:</span> {detailsGrade.studentName}</div>
                            <div><span className="font-medium">Klasa:</span> {detailsGrade.className}</div>
                            <div><span className="font-medium">Przedmiot:</span> {detailsGrade.subjectName}</div>
                        </div>
                        <div className="border-t border-neutral-200 py-3 space-y-2">
                            <div><span className="font-medium">Ocena:</span> <span className="font-bold">{detailsGrade.gradeTypeName}</span></div>
                            <div><span className="font-medium">Kategoria:</span> <span className="font-medium" style={{ color: detailsGrade.categoryColorHex }}>{detailsGrade.categoryName}</span></div>
                            <div><span className="font-medium">Nauczyciel:</span> {detailsGrade.teacherName}</div>
                        </div>
                        <div className="border-t border-neutral-200 py-3 space-y-2 text-neutral-600">
                            <div><span className="font-medium text-neutral-800">Wystawiono:</span> {formatDateTime(detailsGrade.createdAt)}</div>
                            <div><span className="font-medium text-neutral-800">Edytowano:</span> {formatDateTime(detailsGrade.updatedAt)}</div>
                            <div><span className="font-medium text-neutral-800">Edytowane przez:</span> {detailsGrade.modifiedByName || 'System'}</div>
                        </div>
                        {detailsGrade.comment && (
                            <div className="border-t border-neutral-200 pt-3">
                                <span className="font-medium">Komentarz:</span>
                                <div className="p-3 bg-neutral-50 rounded mt-1">{detailsGrade.comment}</div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            <Modal isOpen={!!editGrade} onClose={() => setEditGrade(null)} title="Edycja oceny">
                {editGrade && (
                    <div className="space-y-4 p-4">
                        <div className="text-sm text-neutral-500">
                            <div><span>Uczeń:</span> {editGrade.studentName}</div>
                            <div><span>Klasa:</span> {editGrade.className}</div>
                            <div><span>Przedmiot:</span> {editGrade.subjectName}</div>
                            <div><span>Wystawiono:</span> {formatDateTime(editGrade.createdAt)}</div>
                        </div>
                        <div>
                            <label className="label-text block mb-1">Ocena</label>
                            <Select options={gradeTypes.map(g => ({ value: g.id, label: `${g.numeric} - ${g.name}` }))} value={editForm.gradeTypeId} onChange={v => setEditForm(f => ({ ...f, gradeTypeId: Number(v) }))} className="w-full" />
                        </div>
                        <div>
                            <label className="label-text block mb-1">Kategoria</label>
                            <Select options={gradeCategories.map(c => ({ value: c.id, label: c.name }))} value={editForm.gradeCategoryId} onChange={v => setEditForm(f => ({ ...f, gradeCategoryId: Number(v) }))} className="w-full" />
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
                            <Select options={exportSemesters.map(s => ({ value: s.id, label: s.name }))} value={exportFilters.semesterId} onChange={v => setExportFilters(f => ({ ...f, semesterId: v ? Number(v) : null }))} placeholder="Wybierz semestr" disabled={!exportFilters.yearId} className="w-full" />
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
                            <Select options={exportClasses.map(c => ({ value: c.id, label: `${c.level}${c.letter}` }))} value={exportFilters.classId} onChange={v => setExportFilters(f => ({ ...f, classId: v ? Number(v) : null }))} placeholder="Wybierz klasę" disabled={!exportFilters.yearId} className="w-full" />
                        </div>
                        {exportType === 'class' ? (
                            <div>
                                <label className="label-text block mb-1">Przedmiot *</label>
                                <Select options={exportSubjects.map(s => ({ value: s.id, label: s.name }))} value={exportFilters.subjectId} onChange={v => setExportFilters(f => ({ ...f, subjectId: v ? Number(v) : null }))} placeholder="Wybierz przedmiot" disabled={!exportFilters.classId} className="w-full" />
                            </div>
                        ) : (
                            <div>
                                <label className="label-text block mb-1">Uczeń *</label>
                                <Select options={exportStudents.map((s: any) => ({ value: s.studentId, label: `${s.orderNumber}. ${s.student?.lastName} ${s.student?.firstName}` }))} value={exportFilters.studentId} onChange={v => setExportFilters(f => ({ ...f, studentId: v ? Number(v) : null }))} placeholder="Wybierz ucznia" disabled={!exportFilters.classId} className="w-full" />
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="label-text block mb-1">Format</label>
                        <div className="flex gap-4">
                            {(['pdf', 'xlsx'] as const).map(fmt => (
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

            <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Dodaj ocenę">
                <div className="space-y-4 p-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label-text block mb-1">Klasa <span className="text-danger">*</span></label>
                            <Select options={classes.map(c => ({ value: c.id, label: `${c.level}${c.letter}` }))} value={addForm.classId} onChange={v => setAddForm(f => ({ ...f, classId: v ? Number(v) : null, studentId: null, subjectId: null }))} placeholder="Wybierz klasę" className="w-full" />
                        </div>
                        <div>
                            <label className="label-text block mb-1">Uczeń <span className="text-danger">*</span></label>
                            <Select options={addStudents.map((s: any) => ({ value: s.studentId, label: `${s.orderNumber}. ${s.student?.lastName} ${s.student?.firstName}` }))} value={addForm.studentId} onChange={v => setAddForm(f => ({ ...f, studentId: v ? Number(v) : null }))} placeholder="Wybierz ucznia" disabled={!addForm.classId} className="w-full" />
                        </div>
                    </div>
                    <div>
                        <label className="label-text block mb-1">Przedmiot <span className="text-danger">*</span></label>
                        <Select options={addSubjects.map(s => ({ value: s.id, label: s.name }))} value={addForm.subjectId} onChange={v => setAddForm(f => ({ ...f, subjectId: v ? Number(v) : null }))} placeholder="Wybierz przedmiot" disabled={!addForm.classId} className="w-full" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label-text block mb-1">Ocena <span className="text-danger">*</span></label>
                            <Select options={gradeTypes.map(g => ({ value: g.id, label: `${g.numeric} - ${g.name}` }))} value={addForm.gradeTypeId} onChange={v => setAddForm(f => ({ ...f, gradeTypeId: v ? Number(v) : null }))} placeholder="Wybierz ocenę" className="w-full" />
                        </div>
                        <div>
                            <label className="label-text block mb-1">Kategoria <span className="text-danger">*</span></label>
                            <Select options={gradeCategories.map(c => ({ value: c.id, label: c.name }))} value={addForm.gradeCategoryId} onChange={v => setAddForm(f => ({ ...f, gradeCategoryId: v ? Number(v) : null }))} placeholder="Wybierz kategorię" className="w-full" />
                        </div>
                    </div>
                    <div>
                        <label className="label-text block mb-1">Komentarz</label>
                        <textarea
                            value={addForm.comment}
                            onChange={e => setAddForm(f => ({ ...f, comment: e.target.value }))}
                            className="w-full border border-neutral-300 rounded-xs px-3 py-2 text-sm bg-white resize-none"
                            rows={3}
                            placeholder="Opcjonalny komentarz do oceny"
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button variant="secondary" onClick={() => setAddOpen(false)}>Anuluj</Button>
                        <Button
                            onClick={handleAdd}
                            disabled={saving || !addForm.studentId || !addForm.subjectId || !addForm.gradeTypeId || !addForm.gradeCategoryId}
                        >
                            {saving ? 'Zapisywanie...' : 'Dodaj ocenę'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

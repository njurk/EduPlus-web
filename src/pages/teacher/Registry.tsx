import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/apiService';
import type { SchoolYear, SemesterDto, ClassEntity, ClassSubject, Grade } from '../../types';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { FilterToolbar, FilterSelect, FilterDate } from '../../components/ui/FilterToolbar';
import { Pagination } from '../../components/ui/Pagination';
import { ActionButtons } from '../../components/ui/ActionButtons';
import { SemesterSelector } from '../../components/ui/SemesterSelector';
import { GradeSquare } from '../../components/ui/GradeSquare';
import { Modal } from '../../components/modals/Modal';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Plus, PlayCircle, Trash2, Pencil, CheckCircle } from 'lucide-react';

const getTeacherId = (): number => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id || 0;
};

type Tab = 'grades' | 'lessons';

export const Registry = () => {
    const teacherId = getTeacherId();

    const [selectedYearId, setSelectedYearId] = useState<number | null>(null);
    const [semesters, setSemesters] = useState<SemesterDto[]>([]);
    const [selectedSemesterOrder, setSelectedSemesterOrder] = useState<number | null>(null);

    const [allClasses, setAllClasses] = useState<ClassEntity[]>([]);
    const [teacherAssignments, setTeacherAssignments] = useState<{ classId: number; subjectId: number; subjectName: string }[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
    const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('grades');

    const [gradeTypes, setGradeTypes] = useState<any[]>([]);
    const [gradeCategories, setGradeCategories] = useState<any[]>([]);

    const [studentRows, setStudentRows] = useState<any[]>([]);
    const [gradeColumns, setGradeColumns] = useState<any[]>([]);
    const [gradesLoading, setGradesLoading] = useState(false);

    const [addColumnOpen, setAddColumnOpen] = useState(false);
    const [columnForm, setColumnForm] = useState({ name: '', gradeCategoryId: 0 });
    const [editColumn, setEditColumn] = useState<any>(null);

    const [bulkAddOpen, setBulkAddOpen] = useState(false);
    const [bulkColumnId, setBulkColumnId] = useState<number | null>(null);
    const [bulkGrades, setBulkGrades] = useState<Record<number, number>>({});


    const [editGradeOpen, setEditGradeOpen] = useState(false);
    const [editGrade, setEditGrade] = useState<Grade | null>(null);
    const [editGradeForm, setEditGradeForm] = useState({ gradeTypeId: 0, gradeCategoryId: 0, comment: '', gradeColumnId: null as number | null });

    const [lessons, setLessons] = useState<any[]>([]);
    const [lessonsTotal, setLessonsTotal] = useState(0);
    const [lessonsLoading, setLessonsLoading] = useState(false);
    const [lessonsPage, setLessonsPage] = useState(1);
    const [lessonsSearch, setLessonsSearch] = useState('');
    const [lessonsSortBy, setLessonsSortBy] = useState('date');
    const [lessonsSortDesc, setLessonsSortDesc] = useState(true);
    const [lessonsDateFilter, setLessonsDateFilter] = useState('');
    const [lessonsStatusFilter, setLessonsStatusFilter] = useState<number | null>(null);
    const [lessonStatuses, setLessonStatuses] = useState<any[]>([]);

    const [detailLesson, setDetailLesson] = useState<any>(null);
    const [attendance, setAttendance] = useState<any[]>([]);
    const [attendanceLoading, setAttendanceLoading] = useState(false);
    const [attendanceTypes, setAttendanceTypes] = useState<any[]>([]);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const [isCreateLessonOpen, setIsCreateLessonOpen] = useState(false);
    const [availableSchedules, setAvailableSchedules] = useState<any[]>([]);
    const [createDate, setCreateDate] = useState(new Date().toISOString().split('T')[0]);
    const [schedulesLoading, setSchedulesLoading] = useState(false);

    useEffect(() => {
        const loadInitial = async () => {
            const [yearsData, types, categories, statuses, attTypes] = await Promise.all([
                api.schoolYears.getAll(),
                api.gradeTypes.getAll(),
                api.gradeCategories.getAll(),
                api.lessonStatuses.getAll(),
                api.attendanceTypes.getAll()
            ]);
            setGradeTypes(types);
            setGradeCategories(categories);
            setLessonStatuses(statuses);
            setAttendanceTypes(attTypes);

            const today = new Date().toISOString().split('T')[0];
            const current = yearsData.find((y: SchoolYear) => y.startDate <= today && y.endDate >= today) || yearsData.find((y: SchoolYear) => y.isActive) || yearsData[0];
            if (current) setSelectedYearId(current.id);
        };
        loadInitial();
    }, []);

    useEffect(() => {
        if (!selectedYearId) return;
        Promise.all([
            api.classManagement.getSemesters(selectedYearId),
            api.classManagement.getClassesByYear(selectedYearId, { includeInactive: false, pageSize: 100 }),
            api.grades.getCurrentSemester(selectedYearId).catch(() => 1)
        ]).then(([sem, cls, currentSem]) => {
            setSemesters(sem);
            setAllClasses(cls.data);
            const semToSelect = sem.find((s: SemesterDto) => s.order === currentSem) || sem[0];
            if (semToSelect) setSelectedSemesterOrder(semToSelect.order);
        });
    }, [selectedYearId]);

    useEffect(() => {
        if (!selectedYearId || allClasses.length === 0) return;
        const loadAssignments = async () => {
            const assignments: { classId: number; subjectId: number; subjectName: string }[] = [];
            for (const cls of allClasses) {
                const details = await api.classManagement.getClassDetails(cls.id);
                details.subjects
                    .filter((s: ClassSubject) => s.teacherId === teacherId && s.isActive)
                    .forEach((s: ClassSubject) => {
                        assignments.push({ classId: cls.id, subjectId: s.subjectId, subjectName: s.subjectName || '' });
                    });
            }
            setTeacherAssignments(assignments);
        };
        loadAssignments();
    }, [allClasses, teacherId, selectedYearId]);

    const teacherClasses = allClasses.filter(c => teacherAssignments.some(a => a.classId === c.id));
    const availableSubjects = teacherAssignments.filter(a => a.classId === selectedClassId);

    const currentSemester = semesters.find(s => s.order === selectedSemesterOrder);

    const loadGradesGrid = useCallback(async () => {
        if (!selectedClassId || !selectedSubjectId || !currentSemester) return;
        setGradesLoading(true);
        try {
            const [rows, cols] = await Promise.all([
                api.classGrades.getClassGrades(selectedClassId, selectedSubjectId, currentSemester.order, selectedYearId || undefined),
                api.gradeColumns.getAll(selectedClassId, selectedSubjectId, currentSemester.id)
            ]);
            setStudentRows(rows);
            setGradeColumns(cols);
        } finally {
            setGradesLoading(false);
        }
    }, [selectedClassId, selectedSubjectId, currentSemester, selectedYearId, selectedSemesterOrder]);

    useEffect(() => {
        if (activeTab === 'grades') loadGradesGrid();
    }, [loadGradesGrid, activeTab]);

    const loadLessons = useCallback(async () => {
        if (!teacherId || !selectedClassId || !selectedSubjectId) return;
        setLessonsLoading(true);
        try {
            const result = await api.lessons.getAll({
                teacherId,
                classId: selectedClassId,
                subjectId: selectedSubjectId,
                pageNumber: lessonsPage,
                pageSize: 20,
                search: lessonsSearch || undefined,
                sortBy: lessonsSortBy,
                sortDesc: lessonsSortDesc,
                date: lessonsDateFilter || undefined,
                semesterId: currentSemester?.id,
                statusId: lessonsStatusFilter || undefined,
            });
            setLessons(result.data);
            setLessonsTotal(result.totalCount);
        } finally {
            setLessonsLoading(false);
        }
    }, [teacherId, selectedClassId, selectedSubjectId, lessonsPage, lessonsSearch, lessonsSortBy, lessonsSortDesc, lessonsDateFilter, lessonsStatusFilter, currentSemester]);

    useEffect(() => {
        if (activeTab === 'lessons') loadLessons();
    }, [loadLessons, activeTab]);

    const handleAddColumn = async () => {
        if (!selectedClassId || !selectedSubjectId || !currentSemester || !columnForm.gradeCategoryId) return;
        await api.gradeColumns.create({
            classId: selectedClassId,
            subjectId: selectedSubjectId,
            semesterId: currentSemester.id,
            gradeCategoryId: columnForm.gradeCategoryId,
            name: columnForm.name || undefined
        });
        setAddColumnOpen(false);
        setColumnForm({ name: '', gradeCategoryId: 0 });
        loadGradesGrid();
    };

    const handleEditColumn = async () => {
        if (!editColumn) return;
        await api.gradeColumns.update(editColumn.id, { gradeCategoryId: editColumn.gradeCategoryId, name: editColumn.name || undefined });
        setEditColumn(null);
        loadGradesGrid();
    };

    const handleDeleteColumn = async (colId: number) => {
        if (!window.confirm('Usunąć tę kolumnę?')) return;
        try {
            await api.gradeColumns.delete(colId);
            loadGradesGrid();
        } catch (e: any) {
            alert(e.message);
        }
    };



    const openEditGrade = (grade: Grade) => {
        setEditGrade(grade);
        setEditGradeForm({
            gradeTypeId: grade.gradeTypeId,
            gradeCategoryId: grade.gradeCategoryId,
            comment: grade.comment || '',
            gradeColumnId: grade.gradeColumnId || null
        });
        setEditGradeOpen(true);
    };

    const handleEditGrade = async () => {
        if (!editGrade) return;
        await api.grades.update(editGrade.id, {
            gradeTypeId: editGradeForm.gradeTypeId,
            gradeCategoryId: editGradeForm.gradeCategoryId,
            gradeColumnId: editGradeForm.gradeColumnId,
            comment: editGradeForm.comment || undefined
        });
        setEditGradeOpen(false);
        setEditGrade(null);
        loadGradesGrid();
    };

    const handleDeleteGrade = async () => {
        if (!editGrade || !window.confirm('Usunąć tę ocenę?')) return;
        await api.grades.delete(editGrade.id);
        setEditGradeOpen(false);
        setEditGrade(null);
        loadGradesGrid();
    };

    const openBulkAdd = (colId: number) => {
        setBulkColumnId(colId);
        setBulkGrades({});
        setBulkAddOpen(true);
    };

    const handleBulkSave = async () => {
        if (!bulkColumnId || !selectedSubjectId) return;
        const col = gradeColumns.find((c: any) => c.id === bulkColumnId);
        const entries = Object.entries(bulkGrades).filter(([, typeId]) => typeId > 0);
        for (const [studentId, gradeTypeId] of entries) {
            await api.grades.create({
                studentId: Number(studentId),
                subjectId: selectedSubjectId,
                gradeTypeId,
                gradeCategoryId: col?.gradeCategoryId || gradeCategories[0]?.id,
                gradeColumnId: bulkColumnId,
                comment: undefined
            });
        }
        setBulkAddOpen(false);
        loadGradesGrid();
    };

    const openLessonDetails = async (lesson: any) => {
        setDetailLesson(lesson);
        setIsDetailOpen(true);
        setAttendanceLoading(true);
        try {
            const att = await api.lessons.getAttendance(lesson.id);
            setAttendance(att);
        } finally {
            setAttendanceLoading(false);
        }
    };

    const handleAttendanceChange = async (studentId: number, attendanceTypeId: number | null) => {
        if (!detailLesson) return;
        await api.lessons.updateAttendance(detailLesson.id, studentId, attendanceTypeId);
        const att = await api.lessons.getAttendance(detailLesson.id);
        setAttendance(att);
    };

    const openCreateLesson = async () => {
        setIsCreateLessonOpen(true);
        setCreateDate(new Date().toISOString().split('T')[0]);
        await loadSchedules(new Date().toISOString().split('T')[0]);
    };

    const loadSchedules = async (date: string) => {
        setSchedulesLoading(true);
        try {
            const data = await api.schedule.getAvailableForDate(date, selectedClassId || undefined, teacherId, currentSemester?.id);
            setAvailableSchedules(data.filter((s: any) => s.subjectId === selectedSubjectId));
        } finally {
            setSchedulesLoading(false);
        }
    };

    const handleCreateFromSchedule = async (scheduleId: number) => {
        await api.lessons.createFromSchedule(scheduleId, createDate, teacherId);
        setIsCreateLessonOpen(false);
        loadLessons();
    };

    const getStatusBadge = (statusName: string) => {
        const colors: Record<string, string> = {
            'Zrealizowana': 'bg-success-light text-success-text',
            'Planowana': 'bg-info-light text-info-text',
            'Odwołana': 'bg-danger-light text-danger-text'
        };
        return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[statusName] || 'bg-neutral-100 text-neutral-600'}`}>{statusName}</span>;
    };

    const lessonColumns: Column<any>[] = [
        { header: 'Data', sortKey: 'date', bold: true, render: (l) => new Date(l.date).toLocaleDateString('pl-PL') },
        { header: 'Nr', sortKey: 'orderNumber', className: 'w-14 text-center', render: (l) => l.orderNumber },
        { header: 'Temat', muted: true, render: (l) => <span className="truncate block max-w-xs">{l.topic || '-'}</span> },
        { header: 'Status', render: (l) => getStatusBadge(l.statusName) },
        { header: '', className: 'w-20', render: (l) => <ActionButtons isActive onDetails={() => openLessonDetails(l)} /> }
    ];

    const handleClassChange = (classId: number | null) => {
        setSelectedClassId(classId);
        setSelectedSubjectId(null);
        setStudentRows([]);
        setGradeColumns([]);
        setLessons([]);
    };

    const handleSubjectChange = (subjectId: number | null) => {
        setSelectedSubjectId(subjectId);
        setStudentRows([]);
        setGradeColumns([]);
        setLessons([]);
    };

    const getStudentGradesForColumn = (studentGrades: any[], columnId: number) => {
        return studentGrades.filter((g: any) => g.gradeColumnId === columnId);
    };

    const getStudentOrphanGrades = (studentGrades: any[]) => {
        const columnIds = new Set(gradeColumns.map((c: any) => c.id));
        return studentGrades.filter((g: any) => !g.gradeColumnId || !columnIds.has(g.gradeColumnId));
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold text-neutral-800">Dziennik</h1>
                <div className="flex gap-2 items-center">
                    <SemesterSelector semesters={semesters} selectedOrder={selectedSemesterOrder} onChange={o => { setSelectedSemesterOrder(o); setLessonsPage(1); }} />
                </div>
            </div>

            <div className="flex gap-3 items-center">
                <select
                    className="px-3 py-2 border border-neutral-300 rounded-xs text-sm bg-white"
                    value={selectedClassId || ''}
                    onChange={e => handleClassChange(e.target.value ? Number(e.target.value) : null)}
                >
                    <option value="">Wybierz klasę</option>
                    {teacherClasses.map(c => <option key={c.id} value={c.id}>{c.level}{c.letter}</option>)}
                </select>

                <select
                    className="px-3 py-2 border border-neutral-300 rounded-xs text-sm bg-white"
                    value={selectedSubjectId || ''}
                    onChange={e => handleSubjectChange(e.target.value ? Number(e.target.value) : null)}
                    disabled={!selectedClassId}
                >
                    <option value="">Wybierz przedmiot</option>
                    {availableSubjects.map(a => <option key={a.subjectId} value={a.subjectId}>{a.subjectName}</option>)}
                </select>
            </div>

            {selectedClassId && selectedSubjectId && (
                <>
                    <div className="flex border-b border-neutral-200">
                        <button
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'grades' ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}
                            onClick={() => setActiveTab('grades')}
                        >
                            Oceny
                        </button>
                        <button
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'lessons' ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}
                            onClick={() => setActiveTab('lessons')}
                        >
                            Lekcje
                        </button>
                    </div>

                    {activeTab === 'grades' && (
                        <div className="bg-white border border-neutral-200 rounded-xs overflow-hidden">
                            <div className="flex justify-between items-center px-4 py-3 border-b border-neutral-100">
                                <span className="text-sm font-medium text-neutral-600">{studentRows.length} uczniów</span>
                                <Button onClick={() => { setColumnForm({ name: '', gradeCategoryId: gradeCategories[0]?.id || 0 }); setAddColumnOpen(true); }} className="flex items-center gap-1 text-xs">
                                    <Plus size={14} /> Dodaj kolumnę
                                </Button>
                            </div>

                            {gradesLoading ? <LoadingSpinner className="py-8" /> : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm border-collapse">
                                        <thead className="bg-neutral-50">
                                            <tr>
                                                <th className="px-3 py-2 text-center font-medium text-neutral-600 border-r border-neutral-200 w-[40px]">Nr</th>
                                                <th className="px-3 py-2 text-left font-medium text-neutral-600 border-r border-neutral-200 min-w-[160px]">Uczeń</th>
                                                {gradeColumns.map((col: any) => (
                                                    <th key={col.id} className="px-2 py-2 text-left font-medium text-neutral-600 border-r border-neutral-200 min-w-[100px]">
                                                        <div className="flex flex-col items-start gap-1">
                                                            <span className="text-sm font-medium">{col.name || ''}</span>
                                                            {col.categoryName && <span className="text-xs text-neutral-400 font-normal">{col.categoryName}</span>}
                                                            <div className="flex gap-2">
                                                                <button onClick={() => openBulkAdd(col.id)} className="text-primary hover:text-primary-dark" title="Dodaj oceny">
                                                                    <Plus size={16} />
                                                                </button>
                                                                <button onClick={() => setEditColumn({ ...col })} className="text-neutral-400 hover:text-neutral-600" title="Edytuj kolumnę">
                                                                    <Pencil size={16} />
                                                                </button>
                                                                <button onClick={() => handleDeleteColumn(col.id)} className="text-neutral-400 hover:text-danger" title="Usuń kolumnę">
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </th>
                                                ))}
                                                <th className="px-2 py-2 text-left font-medium text-neutral-600 border-r border-neutral-200 min-w-[80px]">
                                                    <span className="text-sm">Inne</span>
                                                </th>
                                                <th className="px-2 py-2 text-left font-medium text-neutral-600 min-w-[60px]">Śr.</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-100">
                                            {studentRows.map((row: any) => (
                                                <tr key={row.studentId} className="hover:bg-neutral-50">
                                                    <td className="px-3 py-2 text-center text-sm border-r border-neutral-200">{row.orderNumber || ''}</td>
                                                    <td className="px-3 py-2 font-medium border-r border-neutral-200 whitespace-nowrap text-sm">
                                                        {row.lastName} {row.firstName}
                                                    </td>
                                                    {gradeColumns.map((col: any) => {
                                                        const cellGrades = getStudentGradesForColumn(row.grades || [], col.id);
                                                        return (
                                                            <td key={col.id} className="px-2 py-2 text-left border-r border-neutral-200">
                                                                <div className="flex flex-wrap gap-1">
                                                                    {cellGrades.map((g: Grade) => (
                                                                        <GradeSquare key={g.id} grade={g} onClick={() => openEditGrade(g)} />
                                                                    ))}
                                                                </div>
                                                            </td>
                                                        );
                                                    })}
                                                    <td className="px-2 py-2 text-left border-r border-neutral-200">
                                                        <div className="flex flex-wrap gap-1">
                                                            {getStudentOrphanGrades(row.grades || []).map((g: Grade) => (
                                                                <GradeSquare key={g.id} grade={g} onClick={() => openEditGrade(g)} />
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-2 text-left">
                                                        <span className="font-bold text-neutral-700">
                                                            {row.average > 0 ? row.average.toFixed(2) : '-'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {studentRows.length === 0 && (
                                                <tr><td colSpan={gradeColumns.length + 4} className="text-center text-neutral-400 py-8">Brak danych</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'lessons' && (
                        <div className="bg-white border border-neutral-200 rounded-xs overflow-hidden">
                            <div className="flex justify-between items-center px-4 py-3 border-b border-neutral-100">
                                <span className="text-sm font-medium text-neutral-600">{lessonsTotal} lekcji</span>
                                <Button onClick={openCreateLesson} className="flex items-center gap-1 text-xs">
                                    <CheckCircle size={14} />Zarejestruj lekcję
                                </Button>
                            </div>

                            <FilterToolbar
                                search={{ value: lessonsSearch, onChange: v => { setLessonsSearch(v); setLessonsPage(1); }, placeholder: 'Szukaj...' }}
                                onReset={() => { setLessonsSearch(''); setLessonsDateFilter(''); setLessonsStatusFilter(null); setLessonsPage(1); }}
                            >
                                <FilterSelect
                                    label="Status"
                                    options={lessonStatuses.map(s => ({ label: s.name, value: s.id }))}
                                    value={lessonsStatusFilter}
                                    onChange={v => { setLessonsStatusFilter(v as number | null); setLessonsPage(1); }}
                                />
                                <FilterDate value={lessonsDateFilter} onChange={v => { setLessonsDateFilter(v); setLessonsPage(1); }} label="Data" />
                            </FilterToolbar>

                            <DataTable
                                columns={lessonColumns}
                                data={lessons}
                                sortBy={lessonsSortBy}
                                sortDesc={lessonsSortDesc}
                                onSort={field => {
                                    if (lessonsSortBy === field) setLessonsSortDesc(!lessonsSortDesc);
                                    else { setLessonsSortBy(field); setLessonsSortDesc(true); }
                                }}
                                isLoading={lessonsLoading}
                                onRowClick={openLessonDetails}
                                emptyMessage="Brak lekcji"
                            />
                            <Pagination currentPage={lessonsPage} totalPages={Math.ceil(lessonsTotal / 20)} totalCount={lessonsTotal} pageSize={20} onPageChange={setLessonsPage} />
                        </div>
                    )}
                </>
            )}

            {!selectedClassId && (
                <div className="bg-white border border-neutral-200 rounded-xs p-12 text-center text-neutral-400">
                    Wybierz klasę i przedmiot, aby wyświetlić dziennik
                </div>
            )}

            {selectedClassId && !selectedSubjectId && (
                <div className="bg-white border border-neutral-200 rounded-xs p-12 text-center text-neutral-400">
                    Wybierz przedmiot
                </div>
            )}

            <Modal isOpen={addColumnOpen} onClose={() => setAddColumnOpen(false)} title="Dodaj kolumnę">
                <div className="p-6 space-y-4">
                    <div>
                        <label className="label-text">Nazwa (opcjonalna)</label>
                        <input className="border border-neutral-300 rounded-xs px-3 py-2 text-sm bg-white w-full" value={columnForm.name} onChange={e => setColumnForm(prev => ({ ...prev, name: e.target.value }))} placeholder="np. Sprawdzian 1" />
                    </div>
                    <div>
                        <label className="label-text">Kategoria <span className="text-danger">*</span></label>
                        <select className="border border-neutral-300 rounded-xs px-3 py-2 text-sm bg-white w-full" value={columnForm.gradeCategoryId} onChange={e => setColumnForm(prev => ({ ...prev, gradeCategoryId: +e.target.value }))}>
                            <option value={0}>Wybierz</option>
                            {gradeCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="soft" onClick={() => setAddColumnOpen(false)}>Anuluj</Button>
                        <Button onClick={handleAddColumn} disabled={!columnForm.gradeCategoryId}>Dodaj</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={!!editColumn} onClose={() => setEditColumn(null)} title="Edytuj kolumnę">
                {editColumn && (
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="label-text">Nazwa</label>
                            <input className="border border-neutral-300 rounded-xs px-3 py-2 text-sm bg-white w-full" value={editColumn.name || ''} onChange={e => setEditColumn((prev: any) => ({ ...prev, name: e.target.value }))} />
                        </div>
                        <div>
                            <label className="label-text">Kategoria <span className="text-danger">*</span></label>
                            <select className="border border-neutral-300 rounded-xs px-3 py-2 text-sm bg-white w-full" value={editColumn.gradeCategoryId} onChange={e => setEditColumn((prev: any) => ({ ...prev, gradeCategoryId: +e.target.value }))}>
                                {gradeCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="soft" onClick={() => setEditColumn(null)}>Anuluj</Button>
                            <Button onClick={handleEditColumn}>Zapisz</Button>
                        </div>
                    </div>
                )}
            </Modal>



            <Modal isOpen={bulkAddOpen} onClose={() => setBulkAddOpen(false)} title={`Dodaj oceny — ${gradeColumns.find((c: any) => c.id === bulkColumnId)?.name || gradeColumns.find((c: any) => c.id === bulkColumnId)?.categoryName || ''}`} maxWidth="lg">
                <div className="p-6">
                    <table className="w-full text-sm border-collapse">
                        <thead className="bg-neutral-50">
                            <tr>
                                <th className="px-3 py-2 text-left font-medium text-neutral-600">Uczeń</th>
                                <th className="px-3 py-2 text-left font-medium text-neutral-600 w-48">Ocena</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {studentRows.map((row: any) => (
                                <tr key={row.studentId}>
                                    <td className="px-3 py-2 font-medium">{row.lastName} {row.firstName}</td>
                                    <td className="px-3 py-2">
                                        <select
                                            className="border border-neutral-300 rounded-xs px-2 py-1 text-sm bg-white w-full"
                                            value={bulkGrades[row.studentId] || ''}
                                            onChange={e => setBulkGrades(prev => ({ ...prev, [row.studentId]: +e.target.value }))}
                                        >
                                            <option value="">—</option>
                                            {gradeTypes.map(t => <option key={t.id} value={t.id}>{t.numeric} ({t.name})</option>)}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="soft" onClick={() => setBulkAddOpen(false)}>Anuluj</Button>
                        <Button onClick={handleBulkSave} disabled={Object.values(bulkGrades).filter(v => v > 0).length === 0}>
                            Zapisz ({Object.values(bulkGrades).filter(v => v > 0).length})
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title={detailLesson ? `${detailLesson.subjectName} — ${detailLesson.className}` : 'Szczegóły lekcji'} maxWidth="lg">
                {detailLesson && (
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><span className="text-neutral-500">Data:</span> <span className="font-medium">{new Date(detailLesson.date).toLocaleDateString('pl-PL')}</span></div>
                            <div><span className="text-neutral-500">Godzina:</span> <span className="font-medium">{detailLesson.orderNumber}</span></div>
                            <div><span className="text-neutral-500">Temat:</span> <span className="font-medium">{detailLesson.topic || '—'}</span></div>
                            <div><span className="text-neutral-500">Status:</span> {getStatusBadge(detailLesson.statusName)}</div>
                        </div>

                        <div className="border-t pt-4">
                            <h3 className="text-sm font-semibold text-neutral-700 mb-3">Frekwencja</h3>
                            {attendanceLoading ? <LoadingSpinner className="py-4" /> : (
                                <table className="w-full text-sm border-collapse">
                                    <thead className="bg-neutral-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left font-medium text-neutral-600">Uczeń</th>
                                            <th className="px-3 py-2 text-left font-medium text-neutral-600">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100">
                                        {attendance.map((a: any) => (
                                            <tr key={a.studentId}>
                                                <td className="px-3 py-2 font-medium">{a.studentName}</td>
                                                <td className="px-3 py-2">
                                                    <div className="flex gap-1">
                                                        {attendanceTypes.map(at => (
                                                            <button
                                                                key={at.id}
                                                                onClick={() => handleAttendanceChange(a.studentId, a.attendanceTypeId === at.id ? null : at.id)}
                                                                className={`w-8 h-8 rounded text-xs font-bold transition-colors ${a.attendanceTypeId === at.id ? 'ring-2 ring-offset-1 ring-primary' : 'opacity-40 hover:opacity-70'}`}
                                                                style={{ backgroundColor: at.colorHex || '#e5e7eb', color: '#000' }}
                                                                title={at.name}
                                                            >
                                                                {at.shortName || at.name?.charAt(0)}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {attendance.length === 0 && (
                                            <tr><td colSpan={2} className="text-center text-neutral-400 py-4">Brak danych o frekwencji</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            <Modal isOpen={isCreateLessonOpen} onClose={() => setIsCreateLessonOpen(false)} title="Realizuj lekcję z planu">
                <div className="p-6 space-y-4">
                    <div>
                        <label className="label-text">Data</label>
                        <input type="date" value={createDate} onChange={e => { setCreateDate(e.target.value); loadSchedules(e.target.value); }} className="border border-neutral-300 rounded-xs px-3 py-2 text-sm bg-white w-full" />
                    </div>
                    <div className="border-t pt-4">
                        <h3 className="text-sm font-semibold text-neutral-700 mb-3">Dostępne lekcje z planu</h3>
                        {schedulesLoading ? <LoadingSpinner className="py-4" /> : (
                            <div className="space-y-2">
                                {availableSchedules.length === 0 ? (
                                    <p className="text-sm text-neutral-400 text-center py-4">Brak dostępnych lekcji na ten dzień</p>
                                ) : availableSchedules.map(s => (
                                    <div key={s.id} className="flex items-center justify-between p-3 border border-neutral-200 rounded-xs hover:bg-neutral-50 transition-colors">
                                        <div>
                                            <div className="font-medium text-sm">{s.subjectName} — {s.className}</div>
                                            <div className="text-xs text-neutral-500">Lekcja {s.orderNumber} • {s.classroomName || 'Brak sali'}</div>
                                        </div>
                                        <Button onClick={() => handleCreateFromSchedule(s.id)} className="flex items-center gap-1 text-xs">
                                            <PlayCircle size={14} /> Realizuj
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            <Modal isOpen={editGradeOpen} onClose={() => { setEditGradeOpen(false); setEditGrade(null); }} title="Edytuj ocenę">
                {editGrade && (
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="label-text">Ocena <span className="text-danger">*</span></label>
                            <select className="border border-neutral-300 rounded-xs px-3 py-2 text-sm bg-white w-full" value={editGradeForm.gradeTypeId} onChange={e => setEditGradeForm(prev => ({ ...prev, gradeTypeId: +e.target.value }))}>
                                {gradeTypes.map(t => <option key={t.id} value={t.id}>{t.numeric} ({t.name})</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label-text">Kategoria</label>
                            <select className="border border-neutral-300 rounded-xs px-3 py-2 text-sm bg-white w-full" value={editGradeForm.gradeCategoryId} onChange={e => setEditGradeForm(prev => ({ ...prev, gradeCategoryId: +e.target.value }))}>
                                <option value={0}>Brak</option>
                                {gradeCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label-text">Kolumna</label>
                            <select className="border border-neutral-300 rounded-xs px-3 py-2 text-sm bg-white w-full" value={editGradeForm.gradeColumnId || ''} onChange={e => setEditGradeForm(prev => ({ ...prev, gradeColumnId: e.target.value ? +e.target.value : null }))}>
                                <option value="">Bez kolumny (Inne)</option>
                                {gradeColumns.map((c: any) => <option key={c.id} value={c.id}>{c.name || c.categoryName}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label-text">Komentarz</label>
                            <input className="border border-neutral-300 rounded-xs px-3 py-2 text-sm bg-white w-full" value={editGradeForm.comment} onChange={e => setEditGradeForm(prev => ({ ...prev, comment: e.target.value }))} />
                        </div>
                        <div className="flex justify-between pt-2">
                            <Button variant="soft" onClick={handleDeleteGrade} className="text-danger">Usuń</Button>
                            <div className="flex gap-3">
                                <Button variant="soft" onClick={() => { setEditGradeOpen(false); setEditGrade(null); }}>Anuluj</Button>
                                <Button onClick={handleEditGrade}>Zapisz</Button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

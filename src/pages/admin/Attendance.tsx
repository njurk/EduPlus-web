import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/apiService';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { DataTable } from '../../components/ui/DataTable';
import { formatDateTime, formatDateOnly } from '../../utils/formatters';
import { YearSelector } from '../../components/ui/YearSelector';
import { SemesterSelector } from '../../components/ui/SemesterSelector';
import { ClassSelector } from '../../components/ui/ClassSelector';
import { SearchBar } from '../../components/ui/SearchBar';
import { ActionButtons } from '../../components/ui/ActionButtons';
import { Modal } from '../../components/modals/Modal';
import type { SchoolYear, SemesterDto, ClassEntity, PaginatedResponse, User, LessonHour, AttendanceType } from '../../types';
import { useCMSContent } from '../../hooks/useCMSContent';
import { Pagination } from '../../components/ui/Pagination';

export const Attendance = () => {
    const { getText } = useCMSContent('attendance');
    const [paginatedData, setPaginatedData] = useState<PaginatedResponse<any> | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [loading, setLoading] = useState(false);
    const [years, setYears] = useState<SchoolYear[]>([]);
    const [semesters, setSemesters] = useState<SemesterDto[]>([]);
    const [classes, setClasses] = useState<ClassEntity[]>([]);
    const [attendanceTypes, setAttendanceTypes] = useState<AttendanceType[]>([]);
    const [teachers, setTeachers] = useState<User[]>([]);
    const [students, setStudents] = useState<User[]>([]);
    const [lessonHours, setLessonHours] = useState<LessonHour[]>([]);
    const [filters, setFilters] = useState({
        search: '',
        sortBy: 'created',
        sortDesc: true,
        yearId: null as number | null,
        semesterOrder: null as number | null,
        classId: null as number | null,
        orderNumber: null as number | null,
        teacherId: null as number | null,
        studentId: null as number | null,
        attendanceTypeId: null as number | null,
        lessonDate: '' as string
    });

    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [editTypeId, setEditTypeId] = useState<number | null>(null);

    useEffect(() => {
        Promise.all([
            api.schoolYears.getAll(),
            api.attendanceTypes.getAll(),
            api.users.getAll({ pageSize: 1000, roleLevel: 2 }),
            api.users.getAll({ pageSize: 1000, roleLevel: 3 }),
            api.lessonHours.getAll()
        ]).then(([yearsData, typesData, teachersData, studentsData, hoursData]) => {
            setYears(yearsData);
            setAttendanceTypes(typesData);
            setTeachers(teachersData.data || []);
            setStudents(studentsData.data || []);
            setLessonHours((hoursData || []).sort((a, b) => a.orderNumber - b.orderNumber));
            const today = new Date().toISOString().split('T')[0];
            const current = yearsData.find(y => y.startDate <= today && y.endDate >= today) || yearsData.find(y => y.isActive) || yearsData[0];
            if (current) setFilters(f => ({ ...f, yearId: current.id }));
        });
    }, []);

    useEffect(() => {
        if (filters.yearId) {
            Promise.all([
                api.classManagement.getSemesters(filters.yearId),
                api.classManagement.getClassesByYear(filters.yearId)
            ]).then(([sem, cls]) => {
                setSemesters(sem);
                setClasses(cls.data);
                if (sem.length > 0) setFilters(f => ({ ...f, semesterOrder: sem[0].order }));
            });
        }
    }, [filters.yearId]);



    const loadData = useCallback(async () => {
        if (!filters.yearId) return;
        setLoading(true);
        try {
            const teacher = filters.teacherId ? teachers.find(t => t.id === filters.teacherId) : null;
            const student = filters.studentId ? students.find(s => s.id === filters.studentId) : null;
            const result = await api.attendance.getAllAdmin({
                pageNumber,
                pageSize: 20,
                search: filters.search,
                sortBy: filters.sortBy,
                sortDesc: filters.sortDesc,
                classId: filters.classId ?? undefined,
                date: filters.lessonDate || undefined,
                teacherName: teacher ? `${teacher.lastName} ${teacher.firstName}` : undefined,
                attendanceTypeShortCode: filters.attendanceTypeId ? attendanceTypes.find(t => t.id === filters.attendanceTypeId)?.shortCode : undefined,
                orderNumber: filters.orderNumber ?? undefined,
                studentName: student ? `${student.lastName} ${student.firstName}` : undefined
            });
            setPaginatedData(result);
        } finally { setLoading(false); }
    }, [filters, pageNumber, attendanceTypes, teachers, students]);

    useEffect(() => { const id = setTimeout(loadData, 300); return () => clearTimeout(id); }, [loadData]);

    useEffect(() => { setPageNumber(1); }, [filters.search, filters.yearId, filters.semesterOrder, filters.classId, filters.orderNumber, filters.teacherId, filters.studentId, filters.attendanceTypeId, filters.lessonDate]);

    const handleSort = (field: string) => {
        setFilters(f => f.sortBy === field ? { ...f, sortDesc: !f.sortDesc } : { ...f, sortBy: field, sortDesc: true });
    };

    const handleView = (item: any) => {
        setSelectedItem(item);
        setViewModalOpen(true);
    };

    const handleEdit = (item: any) => {
        setSelectedItem(item);
        setEditTypeId(item.attendanceTypeId);
        setEditModalOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!selectedItem || !editTypeId) return;
        try {
            await api.attendance.update(selectedItem.id, editTypeId);
            setEditModalOpen(false);
            setSelectedItem(null);
            loadData();
        } catch (e: any) {
            alert(e.message || 'Błąd aktualizacji');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold text-neutral-800">{getText('title')}</h1>
                <div className="flex gap-2">
                    <YearSelector years={years} selectedYear={filters.yearId} onChange={v => setFilters(f => ({ ...f, yearId: v, semesterOrder: null, classId: null, studentId: null }))} />
                    <SemesterSelector semesters={semesters} selectedOrder={filters.semesterOrder} onChange={v => setFilters(f => ({ ...f, semesterOrder: v }))} showAll />
                    <ClassSelector classes={classes} selectedClass={filters.classId} onChange={v => setFilters(f => ({ ...f, classId: v, studentId: null }))} showAll />
                </div>
            </div>
            <div className="bg-white border border-neutral-200 rounded-xs min-h-[400px] flex flex-col">
                <div className="p-3 border-b flex flex-wrap items-center gap-3">
                    <SearchBar value={filters.search} onChange={v => setFilters(f => ({ ...f, search: v }))} className="max-w-xs" placeholder="Szukaj..." />
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-neutral-500">Lp:</label>
                        <select
                            value={filters.orderNumber || ''}
                            onChange={e => setFilters(f => ({ ...f, orderNumber: e.target.value ? Number(e.target.value) : null }))}
                            className="border border-neutral-300 rounded-xs px-2 h-8 text-sm bg-white min-w-[100px]"
                        >
                            <option value="">Wszystkie</option>
                            {lessonHours.map(h => <option key={h.orderNumber} value={h.orderNumber}>{h.orderNumber}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-neutral-500">Data lekcji:</label>
                        <input
                            type="date"
                            value={filters.lessonDate}
                            onChange={e => setFilters(f => ({ ...f, lessonDate: e.target.value }))}
                            className="border border-neutral-300 rounded-xs px-2 h-8 text-sm bg-white"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-neutral-500">Nauczyciel:</label>
                        <select
                            value={filters.teacherId || ''}
                            onChange={e => setFilters(f => ({ ...f, teacherId: e.target.value ? Number(e.target.value) : null }))}
                            className="border border-neutral-300 rounded-xs px-2 h-8 text-sm bg-white min-w-[160px]"
                        >
                            <option value="">Wszyscy nauczyciele</option>
                            {teachers.map(t => <option key={t.id} value={t.id}>{t.lastName} {t.firstName}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-neutral-500">Uczeń:</label>
                        <select
                            value={filters.studentId || ''}
                            onChange={e => setFilters(f => ({ ...f, studentId: e.target.value ? Number(e.target.value) : null }))}
                            className="border border-neutral-300 rounded-xs px-2 h-8 text-sm bg-white min-w-[160px]"
                        >
                            <option value="">Wszyscy uczniowie</option>
                            {students.map(s => <option key={s.id} value={s.id}>{s.lastName} {s.firstName}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-neutral-500">Typ:</label>
                        <select
                            value={filters.attendanceTypeId || ''}
                            onChange={e => setFilters(f => ({ ...f, attendanceTypeId: e.target.value ? Number(e.target.value) : null }))}
                            className="border border-neutral-300 rounded-xs px-2 h-8 text-sm bg-white min-w-[120px]"
                        >
                            <option value="">Wszystkie typy</option>
                            {attendanceTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                </div>
                <div className="flex-1 min-h-[500px]">
                    {loading ? <LoadingSpinner /> : (
                        <DataTable
                            data={paginatedData?.data || []}
                            sortBy={filters.sortBy}
                            sortDesc={filters.sortDesc}
                            onSort={handleSort}
                            columns={[
                                { header: getText('columns.createdAt'), sortKey: 'created', render: a => <span className="text-xs text-neutral-500">{formatDateTime(a.createdAt)}</span> },
                                { header: getText('columns.orderNumber'), sortKey: 'ordernumber', render: a => <span className="font-medium">{a.orderNumber}</span> },
                                { header: getText('columns.date'), sortKey: 'lessondate', render: a => <span className="text-xs">{formatDateOnly(a.lessonDate)}</span> },
                                { header: getText('columns.subject'), render: a => <span className="font-medium">{a.subjectName}</span> },
                                { header: getText('columns.teacher'), render: a => <span className="text-sm">{a.teacherName || '-'}</span> },
                                { header: getText('columns.student'), sortKey: 'studentname', render: a => <span className="font-medium">{a.studentName}</span> },
                                { header: getText('columns.type'), render: a => <span className={a.typeName === 'Obecny' ? 'text-success' : a.typeName === 'Nieobecny' ? 'text-danger' : 'text-warning'}>{a.typeName}</span> },
                                { header: getText('columns.updatedAt'), sortKey: 'updated', render: a => <span className="text-xs text-neutral-500">{formatDateTime(a.updatedAt)}</span> },
                                { header: getText('columns.modifiedBy'), render: a => <span className="text-xs text-neutral-500">{a.modifiedByName || 'System'}</span> },
                                {
                                    header: getText('columns.actions'), className: 'text-right', render: a => (
                                        <ActionButtons
                                            isActive={a.isActive}
                                            onDetails={() => handleView(a)}
                                            onEdit={() => handleEdit(a)}
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

            <Modal isOpen={viewModalOpen} onClose={() => { setViewModalOpen(false); setSelectedItem(null); }} title="Szczegóły frekwencji">
                {selectedItem && (
                    <div className="p-6 space-y-3 text-sm">
                        <div className="grid grid-cols-2 gap-2">
                            <span className="text-neutral-500">Data lekcji:</span>
                            <span>{formatDateOnly(selectedItem.lessonDate)}</span>
                            <span className="text-neutral-500">Lp lekcji:</span>
                            <span>{selectedItem.orderNumber}</span>
                            <span className="text-neutral-500">Klasa:</span>
                            <span>{selectedItem.className}</span>
                            <span className="text-neutral-500">Przedmiot:</span>
                            <span>{selectedItem.subjectName}</span>
                            <span className="text-neutral-500">Nauczyciel:</span>
                            <span>{selectedItem.teacherName}</span>
                            <span className="text-neutral-500">Uczeń:</span>
                            <span className="font-medium">{selectedItem.studentName}</span>
                            <span className="text-neutral-500">Email ucznia:</span>
                            <span>{selectedItem.studentEmail}</span>
                            <span className="text-neutral-500">Typ frekwencji:</span>
                            <span className={selectedItem.typeName === 'Obecny' ? 'text-success font-medium' : selectedItem.typeName === 'Nieobecny' ? 'text-danger font-medium' : 'text-warning font-medium'}>{selectedItem.typeName} ({selectedItem.shortCode})</span>
                            <span className="text-neutral-500">Utworzono:</span>
                            <span>{formatDateTime(selectedItem.createdAt)}</span>
                            <span className="text-neutral-500">Edytowano:</span>
                            <span>{formatDateTime(selectedItem.updatedAt)}</span>
                            <span className="text-neutral-500">Edytowane przez:</span>
                            <span>{selectedItem.modifiedByName || 'System'}</span>
                        </div>
                        <div className="flex justify-end pt-4">
                            <Button variant="secondary" onClick={() => { setViewModalOpen(false); setSelectedItem(null); }}>Zamknij</Button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal isOpen={editModalOpen} onClose={() => { setEditModalOpen(false); setSelectedItem(null); }} title="Edytuj frekwencję">
                {selectedItem && (
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <span className="text-neutral-500">Data lekcji:</span>
                            <span>{formatDateOnly(selectedItem.lessonDate)}</span>
                            <span className="text-neutral-500">Lp lekcji:</span>
                            <span>{selectedItem.orderNumber}</span>
                            <span className="text-neutral-500">Klasa:</span>
                            <span>{selectedItem.className}</span>
                            <span className="text-neutral-500">Przedmiot:</span>
                            <span>{selectedItem.subjectName}</span>
                            <span className="text-neutral-500">Nauczyciel:</span>
                            <span>{selectedItem.teacherName}</span>
                            <span className="text-neutral-500">Uczeń:</span>
                            <span className="font-medium">{selectedItem.studentName}</span>
                        </div>
                        <div>
                            <label className="label-text block mb-1">Typ frekwencji <span className="text-danger">*</span></label>
                            <select
                                value={editTypeId || ''}
                                onChange={e => setEditTypeId(Number(e.target.value))}
                                className="w-full border border-neutral-300 rounded-xs px-3 h-9 text-sm bg-white"
                            >
                                {attendanceTypes.map(t => <option key={t.id} value={t.id}>{t.name} ({t.shortCode})</option>)}
                            </select>
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="secondary" onClick={() => { setEditModalOpen(false); setSelectedItem(null); }}>Anuluj</Button>
                            <Button onClick={handleSaveEdit} disabled={!editTypeId}>Zapisz</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

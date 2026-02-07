import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/apiService';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { DataTable } from '../../components/ui/DataTable';
import { formatDateTime, formatDateOnly } from '../../utils/formatters';
import { YearSelector } from '../../components/ui/YearSelector';
import { SemesterSelector } from '../../components/ui/SemesterSelector';
import { FilterToolbar, FilterSelect, FilterDate } from '../../components/ui/FilterToolbar';
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
            api.lessonHours.getAll()
        ]).then(([yearsData, typesData, teachersData, hoursData]) => {
            setYears(yearsData);
            setAttendanceTypes(typesData);
            setTeachers(teachersData.data || []);
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
            const semester = filters.semesterOrder != null ? semesters.find(s => s.order === filters.semesterOrder) : null;
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
                semesterId: semester?.id ?? undefined
            });
            setPaginatedData(result);
        } finally { setLoading(false); }
    }, [filters, pageNumber, attendanceTypes, teachers, semesters]);

    useEffect(() => { const id = setTimeout(loadData, 300); return () => clearTimeout(id); }, [loadData]);

    useEffect(() => { setPageNumber(1); }, [filters.search, filters.yearId, filters.semesterOrder, filters.classId, filters.orderNumber, filters.teacherId, filters.attendanceTypeId, filters.lessonDate]);

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
                    <YearSelector years={years} selectedYear={filters.yearId} onChange={v => setFilters(f => ({ ...f, yearId: v, semesterOrder: null, classId: null }))} />
                    <SemesterSelector semesters={semesters} selectedOrder={filters.semesterOrder} onChange={v => setFilters(f => ({ ...f, semesterOrder: v }))} showAll />
                </div>
            </div>
            <div className="bg-white border border-neutral-200 rounded-xs min-h-[400px] flex flex-col">
                <FilterToolbar
                    search={{ value: filters.search, onChange: v => setFilters(f => ({ ...f, search: v })), placeholder: 'Szukaj...' }}
                    onReset={() => setFilters(f => ({ ...f, search: '', classId: null, orderNumber: null, teacherId: null, attendanceTypeId: null, lessonDate: '' }))}
                >
                    <FilterSelect
                        label="Klasa:"
                        value={filters.classId}
                        onChange={v => setFilters(f => ({ ...f, classId: v as number | null }))}
                        options={classes.map(c => ({ value: c.id, label: `${c.level}${c.letter}` }))}
                        placeholder="Wszystkie"
                        minWidth="120px"
                    />
                    <FilterSelect
                        label="Lp.:"
                        value={filters.orderNumber}
                        onChange={v => setFilters(f => ({ ...f, orderNumber: v as number | null }))}
                        options={lessonHours.map(h => ({ value: h.orderNumber, label: String(h.orderNumber) }))}
                        placeholder="Wszystkie"
                        minWidth="100px"
                    />
                    <FilterDate
                        label="Data lekcji:"
                        value={filters.lessonDate}
                        onChange={v => setFilters(f => ({ ...f, lessonDate: v }))}
                    />
                    <FilterSelect
                        label="Nauczyciel:"
                        value={filters.teacherId}
                        onChange={v => setFilters(f => ({ ...f, teacherId: v as number | null }))}
                        options={teachers.map(t => ({ value: t.id, label: `${t.lastName} ${t.firstName}` }))}
                        placeholder="Wszyscy"
                        minWidth="160px"
                    />
                    <FilterSelect
                        label="Typ:"
                        value={filters.attendanceTypeId}
                        onChange={v => setFilters(f => ({ ...f, attendanceTypeId: v as number | null }))}
                        options={attendanceTypes.map(t => ({ value: t.id, label: t.name }))}
                        placeholder="Wszystkie"
                        minWidth="120px"
                    />
                </FilterToolbar>
                <div className="flex-1 min-h-[500px]">
                    {loading ? <LoadingSpinner /> : (
                        <DataTable
                            data={paginatedData?.data || []}
                            sortBy={filters.sortBy}
                            sortDesc={filters.sortDesc}
                            onSort={handleSort}
                            columns={[
                                { header: 'Utworzono', sortKey: 'created', muted: true, render: a => formatDateTime(a.createdAt) },
                                { header: 'Nr lekcji', sortKey: 'ordernumber', bold: true, render: a => a.orderNumber },
                                { header: 'Data', sortKey: 'lessondate', muted: true, render: a => formatDateOnly(a.lessonDate) },
                                { header: 'Przedmiot', bold: true, render: a => a.subjectName },
                                { header: 'Nauczyciel', render: a => a.teacherName || '-' },
                                { header: 'Uczeń', sortKey: 'studentname', bold: true, render: a => a.studentName },
                                { header: 'Typ', bold: true, render: a => <span style={{ color: a.colorHex }}>{a.typeName}</span> },
                                { header: 'Edytowano', sortKey: 'updated', muted: true, render: a => formatDateTime(a.updatedAt) },
                                { header: 'Edytowane przez', muted: true, render: a => a.modifiedByName || 'System' },
                                {
                                    header: 'Akcje', className: 'text-right', render: a => (
                                        <ActionButtons
                                            isActive={a.isActive}
                                            onDetails={() => handleView(a)}
                                            onEdit={() => handleEdit(a)}
                                        />
                                    )
                                }
                            ]}
                            emptyMessage={'Brak danych frekwencji'}
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
                            <span className="text-neutral-500">Lp.:</span>
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
                            <span className="font-medium" style={{ color: selectedItem.colorHex }}>{selectedItem.typeName} ({selectedItem.shortCode})</span>
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
                            <span className="text-neutral-500">Lp.:</span>
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

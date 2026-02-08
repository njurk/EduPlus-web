import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/apiService';
import type { SchoolYear, SemesterDto, ClassEntity } from '../../types';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { FilterToolbar, FilterSelect } from '../../components/ui/FilterToolbar';
import { Pagination } from '../../components/ui/Pagination';
import { ActionButtons } from '../../components/ui/ActionButtons';
import { YearSelector } from '../../components/ui/YearSelector';
import { SemesterSelector } from '../../components/ui/SemesterSelector';
import { Modal } from '../../components/modals/Modal';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Check, X } from 'lucide-react';

const getTeacherId = (): number => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id || 0;
};

export const TeacherExcuses = () => {
    const teacherId = getTeacherId();

    const [years, setYears] = useState<SchoolYear[]>([]);
    const [selectedYearId, setSelectedYearId] = useState<number | null>(null);
    const [semesters, setSemesters] = useState<SemesterDto[]>([]);
    const [selectedSemesterOrder, setSelectedSemesterOrder] = useState<number | null>(null);
    const [classes, setClasses] = useState<ClassEntity[]>([]);

    const [excuses, setExcuses] = useState<any[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortDesc, setSortDesc] = useState(true);
    const [page, setPage] = useState(1);
    const [classFilter, setClassFilter] = useState<number | null>(null);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    const [detailExcuse, setDetailExcuse] = useState<any>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);

    useEffect(() => {
        const loadInitial = async () => {
            const yearsData = await api.schoolYears.getAll();
            setYears(yearsData);
            const today = new Date().toISOString().split('T')[0];
            const current = yearsData.find(y => y.startDate <= today && y.endDate >= today) || yearsData.find(y => y.isActive) || yearsData[0];
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
            setClasses(cls.data);
            const semToSelect = sem.find(s => s.order === currentSem) || sem[0];
            if (semToSelect) setSelectedSemesterOrder(semToSelect.order);
        });
    }, [selectedYearId]);

    const loadExcuses = useCallback(async () => {
        if (!teacherId) return;
        const semester = semesters.find(s => s.order === selectedSemesterOrder);
        setLoading(true);
        try {
            const result = await api.excuses.getAll({
                teacherId,
                pageNumber: page,
                pageSize: 20,
                search,
                sortBy,
                sortDesc,
                classId: classFilter || undefined,
                semesterId: semester?.id,
                statusFilter: statusFilter || undefined
            });
            setExcuses(result.data);
            setTotalCount(result.totalCount);
        } finally {
            setLoading(false);
        }
    }, [teacherId, page, search, sortBy, sortDesc, classFilter, selectedSemesterOrder, semesters, statusFilter]);

    useEffect(() => { loadExcuses(); }, [loadExcuses]);

    const handleSort = (field: string) => {
        if (sortBy === field) setSortDesc(!sortDesc);
        else { setSortBy(field); setSortDesc(true); }
    };

    const handleReset = () => {
        setSearch('');
        setClassFilter(null);
        setStatusFilter(null);
        setPage(1);
    };

    const getStatusBadge = (isAccepted: boolean | null) => {
        if (isAccepted === null) return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-warning-light text-warning-text">Oczekujące</span>;
        if (isAccepted) return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-success-light text-success-text">Zaakceptowane</span>;
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-danger-light text-danger-text">Odrzucone</span>;
    };

    const openDetails = async (excuse: any) => {
        setIsDetailOpen(true);
        setDetailLoading(true);
        try {
            const details = await api.excuses.getById(excuse.id);
            setDetailExcuse(details);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleAccept = async (id: number, isAccepted: boolean | null) => {
        await api.excuses.accept(id, isAccepted);
        loadExcuses();
        if (detailExcuse?.id === id) {
            const details = await api.excuses.getById(id);
            setDetailExcuse(details);
        }
    };

    const columns: Column<any>[] = [
        { header: 'Uczeń', sortKey: 'student', bold: true, accessor: 'studentName' },
        { header: 'Klasa', accessor: 'className' },
        { header: 'Rodzic', sortKey: 'parent', muted: true, accessor: 'parentName' },
        { header: 'Powód', muted: true, render: (e) => <span className="truncate block max-w-xs">{e.reason}</span> },
        { header: 'Lekcje', className: 'w-16 text-center', render: (e) => e.attendanceCount },
        { header: 'Status', render: (e) => getStatusBadge(e.isAccepted) },
        { header: 'Data', sortKey: 'createdAt', muted: true, render: (e) => new Date(e.createdAt).toLocaleDateString('pl-PL') },
        {
            header: '', className: 'w-28',
            render: (e) => (
                <div className="flex justify-end gap-1">
                    {e.isAccepted === null && (
                        <>
                            <button onClick={(ev) => { ev.stopPropagation(); handleAccept(e.id, true); }} className="p-1.5 text-success hover:bg-success-light rounded-xs">
                                <Check size={16} />
                            </button>
                            <button onClick={(ev) => { ev.stopPropagation(); handleAccept(e.id, false); }} className="p-1.5 text-danger hover:bg-danger-light rounded-xs">
                                <X size={16} />
                            </button>
                        </>
                    )}
                    <ActionButtons isActive onDetails={() => openDetails(e)} />
                </div>
            )
        }
    ];

    const statusOptions = [
        { label: 'Oczekujące', value: 'pending' },
        { label: 'Zaakceptowane', value: 'accepted' },
        { label: 'Odrzucone', value: 'rejected' }
    ];

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold text-neutral-800">Usprawiedliwienia</h1>
                <div className="flex gap-2 items-center">
                    <YearSelector years={years} selectedYear={selectedYearId} onChange={id => { setSelectedYearId(id); setSelectedSemesterOrder(null); setPage(1); }} />
                    <SemesterSelector semesters={semesters} selectedOrder={selectedSemesterOrder} onChange={o => { setSelectedSemesterOrder(o); setPage(1); }} />
                </div>
            </div>

            <div className="bg-white border border-neutral-200 rounded-xs overflow-hidden">
                <FilterToolbar
                    search={{ value: search, onChange: v => { setSearch(v); setPage(1); }, placeholder: 'Szukaj...' }}
                    onReset={handleReset}
                >
                    <FilterSelect
                        label="Klasa"
                        options={classes.map(c => ({ label: `${c.level}${c.letter}`, value: c.id }))}
                        value={classFilter}
                        onChange={v => { setClassFilter(v as number | null); setPage(1); }}
                    />
                    <FilterSelect
                        label="Status"
                        options={statusOptions}
                        value={statusFilter}
                        onChange={v => { setStatusFilter(v as string | null); setPage(1); }}
                        parseAsNumber={false}
                    />
                </FilterToolbar>

                <DataTable columns={columns} data={excuses} sortBy={sortBy} sortDesc={sortDesc} onSort={handleSort} isLoading={loading} onRowClick={openDetails} emptyMessage="Brak usprawiedliwień" />
                <Pagination currentPage={page} totalPages={Math.ceil(totalCount / 20)} totalCount={totalCount} pageSize={20} onPageChange={setPage} />
            </div>

            <Modal isOpen={isDetailOpen} onClose={() => { setIsDetailOpen(false); setDetailExcuse(null); }} title="Szczegóły usprawiedliwienia" maxWidth="lg">
                {detailLoading ? <LoadingSpinner className="py-8" /> : detailExcuse && (
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><span className="text-neutral-500">Uczeń:</span> <span className="font-medium">{detailExcuse.studentName}</span></div>
                            <div><span className="text-neutral-500">Rodzic:</span> <span className="font-medium">{detailExcuse.parentName}</span></div>
                            <div><span className="text-neutral-500">Status:</span> {getStatusBadge(detailExcuse.isAccepted)}</div>
                            <div><span className="text-neutral-500">Data zgłoszenia:</span> <span className="font-medium">{new Date(detailExcuse.createdAt).toLocaleDateString('pl-PL')}</span></div>
                        </div>
                        <div className="text-sm">
                            <span className="text-neutral-500">Powód:</span>
                            <p className="mt-1 text-neutral-800">{detailExcuse.reason}</p>
                        </div>
                        {detailExcuse.attendances?.length > 0 && (
                            <div className="border-t pt-4">
                                <h3 className="text-sm font-semibold text-neutral-700 mb-3">Powiązane nieobecności</h3>
                                <table className="w-full text-sm border-collapse">
                                    <thead className="bg-neutral-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left font-medium text-neutral-600">Data</th>
                                            <th className="px-3 py-2 text-left font-medium text-neutral-600">Przedmiot</th>
                                            <th className="px-3 py-2 text-left font-medium text-neutral-600">Lekcja</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100">
                                        {detailExcuse.attendances.map((a: any, i: number) => (
                                            <tr key={i}>
                                                <td className="px-3 py-2">{new Date(a.date).toLocaleDateString('pl-PL')}</td>
                                                <td className="px-3 py-2">{a.subjectName}</td>
                                                <td className="px-3 py-2">{a.lessonHour}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {detailExcuse.isAccepted === null && (
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button variant="danger" onClick={() => handleAccept(detailExcuse.id, false)}>
                                    <X size={14} /> Odrzuć
                                </Button>
                                <Button onClick={() => handleAccept(detailExcuse.id, true)}>
                                    <Check size={14} /> Zaakceptuj
                                </Button>
                            </div>
                        )}
                        {detailExcuse.isAccepted !== null && (
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button variant="soft" onClick={() => handleAccept(detailExcuse.id, null)}>
                                    Cofnij decyzję
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

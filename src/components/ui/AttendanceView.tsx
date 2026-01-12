import { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/apiService';
import { RefreshCcw, Filter } from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import { DataTable, type Column } from '../ui/DataTable';
import { SortFilterToolbar } from '../ui/SortFilterToolbar';
import { ActionButtons } from '../ui/ActionButtons';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import type { Attendance, AttendanceType, AttendanceAdminDto } from '../../types';

export const AttendanceView = ({ classId }: { classId: number }) => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<AttendanceAdminDto[]>([]);
    const [dicts, setDicts] = useState<{
        subjects: any[],
        teachers: any[],
        types: AttendanceType[]
    }>({
        subjects: [],
        teachers: [],
        types: []
    });

    const [filters, setFilters] = useState({
        search: '',
        date: '',
        subjectId: '',
        teacherId: '',
        type: ''
    });

    const [sorting, setSorting] = useState({
        field: 'lessonDate',
        desc: true
    });

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                const [details, attendanceData, typesData] = await Promise.all([
                    api.classManagement.getClassDetails(classId),
                    api.attendance.getAllAdmin(false),
                    api.attendanceTypes.getAll()
                ]);

                const subjectsMap = details.subjects.map(s => ({ id: s.subjectId, name: s.subjectName, teacherName: s.teacherName }));
                const teachersMap = Array.from(new Set(details.subjects.map(s => s.teacherName)))
                    .filter(Boolean)
                    .map((name, i) => ({ id: i, name }));

                const studentIds = new Set(details.students.map(s => s.studentId));
                const classAttendance = attendanceData.filter(a => studentIds.has(a.studentId));

                setData(classAttendance);
                setDicts({
                    subjects: subjectsMap,
                    teachers: teachersMap,
                    types: typesData
                });

            } catch (e) {
                console.error(e);
                alert("Nie udało się pobrać danych.");
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [classId]);

    const filteredData = useMemo(() => {
        let res = [...data];

        if (filters.search) {
            const q = filters.search.toLowerCase();
            res = res.filter(r => r.studentName.toLowerCase().includes(q));
        }
        if (filters.date) {
            res = res.filter(r => r.lessonDate.startsWith(filters.date));
        }
        if (filters.subjectId) {
            const subject = dicts.subjects.find(s => s.id === Number(filters.subjectId));
            if (subject) res = res.filter(r => r.subjectName === subject.name);
        }
        if (filters.teacherId) {
            res = res.filter(r => r.teacherName === filters.teacherId);
        }
        if (filters.type) {
            res = res.filter(r => r.shortCode === filters.type);
        }

        res.sort((a, b) => {
            const fieldA = (a as any)[sorting.field];
            const fieldB = (b as any)[sorting.field];

            if (fieldA < fieldB) return sorting.desc ? 1 : -1;
            if (fieldA > fieldB) return sorting.desc ? -1 : 1;
            return 0;
        });

        return res;
    }, [data, filters, sorting, dicts.subjects]);

    const handleSortChange = (field: string) => {
        setSorting(prev => ({
            field,
            desc: prev.field === field ? !prev.desc : true
        }));
    };

    const handleDelete = async (id: number) => {
        if (confirm('Usunąć wpis frekwencji?')) {
            try {
                await api.attendance.delete(id);
                setData(p => p.filter(x => x.id !== id));
            } catch {
                alert("Błąd usuwania");
            }
        }
    };

    const handleEdit = (row: AttendanceAdminDto) => {
        alert(`Edycja rekordu ID: ${row.id} - Funkcja w przygotowaniu`);
    };

    const columns: Column<AttendanceAdminDto>[] = [
        {
            header: 'Data',
            accessor: 'lessonDate',
            className: 'w-32 text-sm',
            render: (row) => <div className="flex items-center gap-2">{formatDate(row.lessonDate)}</div>
        },
        {
            header: 'Przedmiot',
            accessor: 'subjectName',
            className: 'w-48',
            render: (row) => (
                <div className="flex flex-col">
                    <div className="font-medium text-neutral-900 text-sm flex items-center gap-1 h-5">{row.subjectName}</div>
                    <div className="text-xs text-neutral-500 flex items-center gap-1 h-4 ml-5 mt-0.5">{row.teacherName}</div>
                </div>
            )
        },
        {
            header: 'Uczeń',
            accessor: 'studentName',
            className: 'font-medium text-neutral-900',
            render: (row) => row.studentName
        },
        {
            header: 'Status',
            accessor: 'typeName',
            className: 'w-32',
            render: (row) => row.shortCode
        },
        {
            header: 'Utworzono',
            accessor: 'createdAt',
            className: 'w-32 text-xs text-neutral-500',
            render: (row) => formatDate(row.createdAt)
        },
        {
            header: 'Edytowano',
            accessor: 'updatedAt',
            className: 'w-32 text-xs text-neutral-500',
            render: (row) => formatDate(row.updatedAt)
        },
        {
            header: 'Akcje',
            className: 'text-right w-24',
            render: (row) => (
                <ActionButtons
                    onEdit={() => handleEdit(row)}
                    onDelete={() => handleDelete(row.id)}
                />
            )
        }
    ];

    return (
        <div className="h-full flex flex-col bg-white border border-neutral-200 shadow-sm">
            <SortFilterToolbar
                search={filters.search}
                onSearchChange={v => setFilters(p => ({ ...p, search: v }))}
                sortBy={sorting.field}
                sortDesc={sorting.desc}
                onSortChange={handleSortChange}
                sortOptions={[
                    { field: 'lessonDate', label: 'Data' },
                    { field: 'subjectName', label: 'Przedmiot' },
                    { field: 'studentName', label: 'Uczeń' },
                    { field: 'createdAt', label: 'Utworzono' }
                ]}
                hideCreate
            />

            <div className="p-3 border-b border-neutral-200 bg-neutral-50 flex flex-wrap gap-3 items-end">
                <div className="w-40">
                    <label className="text-xs font-medium text-neutral-500 mb-1 block">Data</label>
                    <Input
                        type="date"
                        value={filters.date}
                        onChange={(e) => setFilters(p => ({ ...p, date: e.target.value }))}
                        className="bg-white h-9"
                    />
                </div>
                <div className="w-48">
                    <label className="text-xs font-medium text-neutral-500 mb-1 block">Przedmiot</label>
                    <select
                        className="w-full border border-neutral-300 rounded-md px-3 h-9 text-sm bg-white focus:outline-none focus:border-primary"
                        value={filters.subjectId}
                        onChange={(e) => setFilters(p => ({ ...p, subjectId: e.target.value }))}
                    >
                        <option value="">Wszystkie</option>
                        {dicts.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <div className="w-48">
                    <label className="text-xs font-medium text-neutral-500 mb-1 block">Nauczyciel</label>
                    <select
                        className="w-full border border-neutral-300 rounded-md px-3 h-9 text-sm bg-white focus:outline-none focus:border-primary"
                        value={filters.teacherId}
                        onChange={(e) => setFilters(p => ({ ...p, teacherId: e.target.value }))}
                    >
                        <option value="">Wszyscy</option>
                        {dicts.teachers.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                    </select>
                </div>
                <div className="w-36">
                    <label className="text-xs font-medium text-neutral-500 mb-1 block">Status</label>
                    <select
                        className="w-full border border-neutral-300 rounded-md px-3 h-9 text-sm bg-white focus:outline-none focus:border-primary"
                        value={filters.type}
                        onChange={(e) => setFilters(p => ({ ...p, type: e.target.value }))}
                    >
                        <option value="">Wszystkie</option>
                        {dicts.types.map(type => (
                            <option key={type.id} value={type.shortCode}>
                                {type.name} ({type.shortCode})
                            </option>
                        ))}
                    </select>
                </div>
                <Button variant="secondary" className="h-9" onClick={() => setFilters({ search: '', date: '', subjectId: '', teacherId: '', type: '' })}>
                    <Filter size={14} className="mr-2" /> Reset filtrów
                </Button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
                {loading ? (
                    <div className="p-12 text-center text-neutral-400"><RefreshCcw className="animate-spin inline mr-2" /> Ładowanie danych...</div>
                ) : (
                    <DataTable
                        data={filteredData}
                        columns={columns}
                        emptyMessage="Brak wpisów frekwencji dla wybranych filtrów."
                    />
                )}
            </div>
        </div>
    );
};
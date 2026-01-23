import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/apiService';
import { Plus } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { DataTable } from '../../components/ui/DataTable';
import { formatDateTime } from '../../utils/formatters';
import { ActionButtons } from '../../components/ui/ActionButtons';
import { YearSelector } from '../../components/ui/YearSelector';
import { TrashButton } from '../../components/ui/TrashButton';
import { SearchBar } from '../../components/ui/SearchBar';
import type { SchoolYear, SemesterDto, ClassEntity } from '../../types';
import { useCMSContent } from '../../hooks/useCMSContent';

export const Grades = () => {
    const { getText } = useCMSContent('grades');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [years, setYears] = useState<SchoolYear[]>([]);
    const [semesters, setSemesters] = useState<SemesterDto[]>([]);
    const [classes, setClasses] = useState<ClassEntity[]>([]);
    const [filters, setFilters] = useState({
        search: '',
        sortBy: 'createdat',
        sortDesc: true,
        yearId: null as number | null,
        semesterId: null as number | null,
        classId: null as number | null,
        showInactive: false
    });

    useEffect(() => {
        api.schoolYears.getAll().then(data => {
            setYears(data);
            const today = new Date().toISOString().split('T')[0];
            const current = data.find(y => y.startDate <= today && y.endDate >= today) || data.find(y => y.isActive) || data[0];
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
                setClasses(cls);
            });
        }
    }, [filters.yearId]);

    const loadData = useCallback(async () => {
        if (!filters.yearId) return;
        setLoading(true);
        try {
            const params: Record<string, any> = {
                search: filters.search,
                sortBy: filters.sortBy,
                sortDesc: filters.sortDesc,
                schoolYearId: filters.yearId,
                showInactive: filters.showInactive
            };
            if (filters.classId) params.classId = filters.classId;
            if (filters.semesterId) params.semesterId = filters.semesterId;
            setData(await api.grades.getAll(params));
        } finally { setLoading(false); }
    }, [filters]);

    useEffect(() => { loadData(); }, [loadData]);

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
            <div className="bg-white border border-neutral-200 rounded-xs">
                <div className="p-3 border-b flex items-center justify-between gap-4">
                    <SearchBar value={filters.search} onChange={v => setFilters(f => ({ ...f, search: v }))} className="max-w-xs" />
                    <div className="flex gap-2">
                        <TrashButton isTrashActive={filters.showInactive} onToggle={() => setFilters(f => ({ ...f, showInactive: !f.showInactive }))} />
                        <Button><Plus size={14} className="mr-1" /> Dodaj</Button>
                    </div>
                </div>
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
                            { header: getText('columns.grade'), sortKey: 'gradevalue', render: g => <span className="font-bold text-primary">{g.gradeTypeName}</span> },
                            { header: getText('columns.category'), sortKey: 'categoryname', render: g => <span className="text-neutral-500 text-xs">{g.categoryName}</span> },
                            { header: getText('columns.teacher'), sortKey: 'teachername', render: g => <span className="text-xs">{g.teacherName}</span> },
                            { header: getText('columns.createdAt'), sortKey: 'createdat', render: g => <span className="text-neutral-500 text-xs">{formatDateTime(g.createdAt)}</span> },
                            { header: getText('columns.updatedAt'), sortKey: 'updatedat', render: g => <span className="text-neutral-500 text-xs">{formatDateTime(g.updatedAt)}</span> },
                            { header: getText('columns.modifiedBy'), render: g => <span className="text-neutral-500 text-xs">{g.modifiedByName || 'System'}</span> },
                            {
                                header: getText('columns.actions'), className: 'text-right', render: g => (
                                    <ActionButtons
                                        onDetails={() => console.log('details', g.id)}
                                        onEdit={() => console.log('edit', g.id)}
                                    />
                                )
                            }
                        ]}
                        emptyMessage={getText('emptyMessage')}
                    />
                )}
            </div>
        </div>
    );
};

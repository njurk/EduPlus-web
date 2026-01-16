import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/apiService';
import { RefreshCcw, Plus } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { SortToolbar } from '../../components/ui/SortToolbar';
import { DataTable } from '../../components/ui/DataTable';
import { formatDate } from '../../utils/formatters';
import { YearSelector } from '../../components/ui/YearSelector';
import { SemesterSelector } from '../../components/ui/SemesterSelector';
import { ClassSelector } from '../../components/ui/ClassSelector';
import { TrashButton } from '../../components/ui/TrashButton';
import type { SchoolYear, SemesterDto, ClassEntity } from '../../types';
import { useCMSContent } from '../../hooks/useCMSContent';

export const Grades = () => {
    const { getText } = useCMSContent('grades');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [years, setYears] = useState<SchoolYear[]>([]);
    const [semesters, setSemesters] = useState<SemesterDto[]>([]);
    const [classes, setClasses] = useState<ClassEntity[]>([]);
    const [filters, setFilters] = useState({ search: '', sortBy: 'createdAt', sortDesc: true, yearId: null as number | null, semesterOrder: null as number | null, classId: null as number | null, showInactive: false });

    useEffect(() => {
        api.schoolYears.getAll().then(data => {
            setYears(data);
            const active = data.find(y => y.isActive);
            if (active) setFilters(f => ({ ...f, yearId: active.id }));
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
                if (sem.length > 0) setFilters(f => ({ ...f, semesterOrder: sem[0].order }));
            });
        }
    }, [filters.yearId]);

    const loadData = useCallback(async () => {
        if (!filters.yearId) return;
        setLoading(true);
        try {
            const params: Record<string, any> = { search: filters.search, sortBy: filters.sortBy, sortDesc: filters.sortDesc, showInactive: filters.showInactive };
            if (filters.classId) params.classId = filters.classId;
            setData(await api.grades.getAll(params));
        } finally { setLoading(false); }
    }, [filters]);

    useEffect(() => { const id = setTimeout(loadData, 300); return () => clearTimeout(id); }, [loadData]);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-neutral-800">{getText('title')}</h1>
                <div className="flex gap-2">
                    <YearSelector years={years} selectedYear={filters.yearId} onChange={v => setFilters(f => ({ ...f, yearId: v, semesterOrder: null, classId: null }))} />
                    <SemesterSelector semesters={semesters} selectedOrder={filters.semesterOrder} onChange={v => setFilters(f => ({ ...f, semesterOrder: v }))} showAll />
                    <ClassSelector classes={classes} selectedClass={filters.classId} onChange={v => setFilters(f => ({ ...f, classId: v }))} showAll />
                    <TrashButton isTrashActive={filters.showInactive} onToggle={() => setFilters(f => ({ ...f, showInactive: !f.showInactive }))} />
                    <Button><Plus size={14} className="mr-1" />{getText('actions.add')}</Button>
                </div>
            </div>
            <div className="bg-white border border-neutral-200 rounded-xs">
                <div className="p-3 border-b">
                    <SortToolbar search={filters.search} onSearchChange={v => setFilters(f => ({ ...f, search: v }))}
                        sortBy={filters.sortBy} sortDesc={filters.sortDesc}
                        onSortChange={field => setFilters(f => ({ ...f, sortBy: field, sortDesc: f.sortBy === field ? !f.sortDesc : true }))}
                        sortOptions={[{ field: 'studentName', label: getText('sort.student') }, { field: 'subjectName', label: getText('sort.subject') }, { field: 'createdAt', label: getText('sort.date') }]}
                    />
                </div>
                {loading ? <div className="flex items-center justify-center h-32 text-neutral-400"><RefreshCcw className="animate-spin mr-2" size={16} />{getText('loading')}</div> : (
                    <DataTable data={data} columns={[
                        { header: getText('columns.student'), render: g => <span className="font-medium">{g.studentName}</span> },
                        { header: getText('columns.class'), render: g => g.className },
                        { header: getText('columns.subject'), render: g => g.subjectName },
                        { header: getText('columns.grade'), render: g => <span className="font-bold text-primary">{g.gradeTypeName}</span> },
                        { header: getText('columns.category'), render: g => <span className="text-neutral-500 text-xs">{g.categoryName}</span> },
                        { header: getText('columns.date'), render: g => <span className="text-neutral-500 text-xs">{formatDate(g.createdAt)}</span> }
                    ]} emptyMessage={getText('empty')} />
                )}
            </div>
        </div>
    );
};


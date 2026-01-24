import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/apiService';
import { Plus } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { DataTable } from '../../components/ui/DataTable';
import { Pagination } from '../../components/ui/Pagination';
import { formatDateTime } from '../../utils/formatters';
import { ActionButtons } from '../../components/ui/ActionButtons';
import { YearSelector } from '../../components/ui/YearSelector';
import { TrashButton } from '../../components/ui/TrashButton';
import { SearchBar } from '../../components/ui/SearchBar';
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
        </div>
    );
};

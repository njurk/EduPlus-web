import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { api } from '../../services/apiService';
import { useCMSContent } from '../../hooks/useCMSContent';
import { DataTable } from '../../components/ui/DataTable';
import { FilterToolbar, FilterSelect } from '../../components/ui/FilterToolbar';
import { Pagination } from '../../components/ui/Pagination';
import { ActionButtons } from '../../components/ui/ActionButtons';
import { Modal } from '../../components/modals/Modal';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { formatDateTime } from '../../utils/formatters';
import type { Subject, User } from '../../types';

interface SubjectTeacherRow {
    id: string;
    subjectId: number;
    teacherId: number;
    subjectName: string;
    teacherName: string;
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
    modifiedByName?: string;
}

export const Subjects = () => {
    const { getText } = useCMSContent('subjects');
    const [data, setData] = useState<SubjectTeacherRow[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('subjectName');
    const [sortDesc, setSortDesc] = useState(false);
    const [page, setPage] = useState(1);
    const [filterSubjectId, setFilterSubjectId] = useState<number | null>(null);
    const [filterTeacherId, setFilterTeacherId] = useState<number | null>(null);
    const pageSize = 20;

    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [teachers, setTeachers] = useState<User[]>([]);

    const [addModal, setAddModal] = useState(false);
    const [editModal, setEditModal] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [editingRow, setEditingRow] = useState<SubjectTeacherRow | null>(null);

    useEffect(() => {
        Promise.all([
            api.subjects.getAll(),
            api.users.getAll({ roleLevel: 2, pageSize: 1000 })
        ]).then(([subj, users]) => {
            setSubjects(subj);
            setTeachers(users.data || users);
        });
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const result = await api.subjects.getAllSubjectTeachers({
            pageNumber: page,
            pageSize,
            sortBy,
            sortDesc,
            search,
            subjectId: filterSubjectId ?? undefined,
            teacherId: filterTeacherId ?? undefined
        });
        const mappedData = (result.data || []).map((item: any) => ({
            ...item,
            id: `${item.subjectId}-${item.teacherId}`
        }));
        setData(mappedData);
        setTotalCount(result.totalCount || 0);
        setTotalPages(result.totalPages || Math.ceil((result.totalCount || 0) / pageSize));
        setLoading(false);
    }, [page, sortBy, sortDesc, search, filterSubjectId, filterTeacherId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => { setPage(1); }, [search, filterSubjectId, filterTeacherId]);

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortDesc(!sortDesc);
        } else {
            setSortBy(field);
            setSortDesc(false);
        }
    };

    const handleDelete = async (subjectId: number, teacherId: number) => {
        if (!confirm('Czy na pewno chcesz usunąć to przypisanie?')) return;
        await api.subjects.removeTeacher(subjectId, teacherId);
        fetchData();
    };

    const openAddModal = () => {
        setSelectedSubject('');
        setSelectedTeacher('');
        setAddModal(true);
    };

    const handleAdd = async () => {
        if (!selectedSubject || !selectedTeacher) return;
        try {
            await api.subjects.addTeacher(+selectedSubject, +selectedTeacher);
            setAddModal(false);
            fetchData();
        } catch (err: any) {
            alert(err?.message || 'Błąd');
        }
    };

    const handleReset = () => {
        setSearch('');
        setFilterSubjectId(null);
        setFilterTeacherId(null);
    };

    const openEditModal = (row: SubjectTeacherRow) => {
        setEditingRow(row);
        setSelectedTeacher(row.teacherId.toString());
        setEditModal(true);
    };

    const handleEdit = async () => {
        if (!editingRow || !selectedTeacher) return;
        try {
            await api.subjects.updateTeacher(editingRow.subjectId, editingRow.teacherId, +selectedTeacher);
            setEditModal(false);
            setEditingRow(null);
            fetchData();
        } catch (err: any) {
            alert(err?.message || 'Błąd');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold text-neutral-800">{getText('title')}</h1>
            </div>
            <div className="bg-white border border-neutral-200 rounded-xs min-h-[400px] flex flex-col">
                <FilterToolbar
                    search={{ value: search, onChange: setSearch, placeholder: 'Szukaj...' }}
                    onReset={handleReset}
                    rightContent={
                        <Button onClick={openAddModal}><Plus size={14} className="mr-1" /> Przypisz</Button>
                    }
                >
                    <FilterSelect
                        label="Przedmiot:"
                        value={filterSubjectId}
                        onChange={v => setFilterSubjectId(v as number | null)}
                        options={subjects.map(s => ({ value: s.id, label: s.name }))}
                        placeholder="Wszystkie"
                        minWidth="150px"
                    />
                    <FilterSelect
                        label="Nauczyciel:"
                        value={filterTeacherId}
                        onChange={v => setFilterTeacherId(v as number | null)}
                        options={teachers.map(t => ({ value: t.id, label: `${t.lastName} ${t.firstName}` }))}
                        placeholder="Wszyscy"
                        minWidth="180px"
                    />
                </FilterToolbar>
                <div className="flex-1">
                    {loading ? <LoadingSpinner /> : (
                        <DataTable
                            data={data}
                            sortBy={sortBy}
                            sortDesc={sortDesc}
                            onSort={handleSort}
                            columns={[
                                { header: 'Przedmiot', sortKey: 'subjectName', render: (row: SubjectTeacherRow) => <span className="font-medium">{row.subjectName}</span> },
                                { header: 'Nauczyciel', sortKey: 'teacherName', render: (row: SubjectTeacherRow) => row.teacherName },
                                { header: 'Utworzono', sortKey: 'createdat', render: (row: SubjectTeacherRow) => <span className="text-neutral-500 text-xs">{formatDateTime(row.createdAt)}</span> },
                                { header: 'Edytowano', sortKey: 'updatedat', render: (row: SubjectTeacherRow) => <span className="text-neutral-500 text-xs">{formatDateTime(row.updatedAt)}</span> },
                                { header: 'Edytowane przez', render: (row: SubjectTeacherRow) => <span className="text-neutral-500 text-xs">{row.modifiedByName || 'System'}</span> },
                                {
                                    header: 'Akcje',
                                    className: 'text-right',
                                    render: (row: SubjectTeacherRow) => (
                                        <ActionButtons
                                            onEdit={() => openEditModal(row)}
                                            onDelete={() => handleDelete(row.subjectId, row.teacherId)}
                                        />
                                    )
                                }
                            ]}
                            emptyMessage={'Brak przypisań'}
                        />
                    )}
                </div>
                <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    totalCount={totalCount}
                    pageSize={pageSize}
                    onPageChange={setPage}
                />
            </div>

            <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Przypisz nauczyciela do przedmiotu" maxWidth="md"
                footer={<><Button variant="secondary" onClick={() => setAddModal(false)}>Anuluj</Button><Button onClick={handleAdd} disabled={!selectedSubject || !selectedTeacher}>Przypisz</Button></>}>
                <div className="space-y-4">
                    <div>
                        <label className="label-text block mb-1">Przedmiot</label>
                        <select className="w-full border border-neutral-300 rounded-xs px-3 h-9 text-sm bg-white" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
                            <option value="">Wybierz przedmiot...</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label-text block mb-1">Nauczyciel</label>
                        <select className="w-full border border-neutral-300 rounded-xs px-3 h-9 text-sm bg-white" value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)}>
                            <option value="">Wybierz nauczyciela...</option>
                            {teachers.map(t => <option key={t.id} value={t.id}>{t.lastName} {t.firstName}</option>)}
                        </select>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={editModal} onClose={() => { setEditModal(false); setEditingRow(null); }} title="Zmień nauczyciela przedmiotu" maxWidth="md"
                footer={<><Button variant="secondary" onClick={() => { setEditModal(false); setEditingRow(null); }}>Anuluj</Button><Button onClick={handleEdit} disabled={!selectedTeacher || selectedTeacher === editingRow?.teacherId.toString()}>Zapisz</Button></>}>
                <div className="space-y-4">
                    <div>
                        <label className="label-text block mb-1">Przedmiot</label>
                        <div className="w-full border border-neutral-200 rounded-xs px-3 h-9 text-sm bg-neutral-50 flex items-center">{editingRow?.subjectName}</div>
                    </div>
                    <div>
                        <label className="label-text block mb-1">Nowy nauczyciel</label>
                        <select className="w-full border border-neutral-300 rounded-xs px-3 h-9 text-sm bg-white" value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)}>
                            <option value="">Wybierz nauczyciela...</option>
                            {teachers.map(t => <option key={t.id} value={t.id}>{t.lastName} {t.firstName}</option>)}
                        </select>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

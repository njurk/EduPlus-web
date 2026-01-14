import { useState, useEffect, useCallback } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { User, Role } from '../../types';
import { api } from '../../services/apiService';
import { TrashButton } from '../../components/ui/TrashButton';
import { Check, AlertCircle, User as UserIcon, Users as UsersIcon, Search, Link as LinkIcon, Plus, Shield, UserPlus, RefreshCcw } from 'lucide-react';
import { clsx } from 'clsx';
import { SortFilterToolbar } from '../../components/ui/SortFilterToolbar';
import { ActionButtons } from '../../components/ui/ActionButtons';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { validateUserField, validateUserForm } from '../../utils/validation';
import { DataTable } from '../../components/ui/DataTable';
import { formatDate, formatName } from '../../utils/formatters';
import { DetailsModal } from '../../components/modals/DetailsModal';

const FIELDS_CONFIG = { firstName: "Imię", lastName: "Nazwisko", email: "Email", phone: "Telefon", street: "Ulica i numer domu", postalCode: "Kod pocztowy", city: "Miasto" };

export const Users = () => {
    const [mainTab, setMainTab] = useState<'users' | 'relations' | 'roles'>('users');
    const [data, setData] = useState<any[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [viewMode, setViewMode] = useState<'list' | 'form' | 'assign'>('list');
    const [loading, setLoading] = useState(false);
    const [assignmentTarget, setAssignmentTarget] = useState<User | null>(null);
    const [assignmentCandidates, setAssignmentCandidates] = useState<User[]>([]);
    const [selectedAssignmentIds, setSelectedAssignmentIds] = useState<number[]>([]);
    const [relationSearch, setRelationSearch] = useState('');

    const [filters, setFilters] = useState({
        search: '',
        sortBy: 'created',
        sortDesc: true,
        showInactive: false,
        onlyUnassignedParents: false
    });

    const [formData, setFormData] = useState<Partial<User>>({});
    const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
    const [errors, setErrors] = useState<Record<string, string | null>>({});

    const [detailsUser, setDetailsUser] = useState<any>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            if (mainTab === 'users') {
                const [users, fetchedRoles] = await Promise.all([
                    api.users.getAll(filters),
                    roles.length ? Promise.resolve(roles) : api.roles.getAll()
                ]);
                setData(users);
                if (!roles.length) setRoles(fetchedRoles);
            } else if (mainTab === 'roles') {
                const r = await api.roles.getAll({ search: filters.search });
                setData(r);
            } else {
                if (filters.onlyUnassignedParents) {
                    const parents = await api.users.getAll({ onlyUnassignedParents: true });
                    setData(parents);
                } else {
                    const rels = await api.parentStudents.getAll(filters.search, filters.sortBy, filters.sortDesc);
                    setData(rels);
                }
            }
        } catch { setErrors({ general: "Błąd pobierania danych" }); }
        finally { setLoading(false); }
    }, [mainTab, filters, roles.length]);

    useEffect(() => { const id = setTimeout(loadData, 300); return () => clearTimeout(id); }, [loadData]);

    useEffect(() => {
        setData([]);
        setFilters(prev => ({ ...prev, search: '', showInactive: false, onlyUnassignedParents: false, sortBy: 'created', sortDesc: true }));
    }, [mainTab]);

    useEffect(() => {
        if (viewMode === 'form' && !roles.length) {
            api.roles.getAll().then(setRoles).catch(console.error);
        }
    }, [viewMode, roles.length]);

    const handleAction = async (action: () => Promise<any>, msg?: string) => {
        if (msg && !window.confirm(msg)) return;
        try { await action(); loadData(); } catch { alert("Błąd operacji"); }
    };

    const handleRestore = async (id: number) => {
        await handleAction(() => api.users.restore(id), "Przywrócić użytkownika?");
    };

    const handleEditRelation = async (userId: number) => {
        setLoading(true);
        try {
            const user = await api.users.get(userId);
            setAssignmentTarget(user);

            const isStudent = user.userRoles?.some((ur: any) => ur.roleName === 'Uczeń' || ur.role?.name === 'Uczeń');
            const targetRole = isStudent ? 'Rodzic' : 'Uczeń';

            const candidates = await api.users.getAll({ roleName: targetRole });
            setAssignmentCandidates(candidates);

            setSelectedAssignmentIds(isStudent ? (user.parentIds || []) : (user.childIds || []));
            setRelationSearch('');
            setViewMode('assign');
        } catch {
            alert("Błąd przygotowania przypisania");
        } finally {
            setLoading(false);
        }
    };

    const openForm = (item?: any) => {
        setErrors({});
        setFormData(item ? {
            id: item.id,
            firstName: item.firstName,
            lastName: item.lastName,
            email: item.email,
            phone: item.phone || '',
            street: item.street || '',
            city: item.city || '',
            postalCode: item.postalCode || '',
            isActive: item.isActive
        } : { isActive: true, firstName: '', lastName: '', email: '' });

        const roleIds = item?.userRoles?.map((ur: any) => {
            if (typeof ur === 'number') return ur;
            return ur.roleId || ur.role?.id;
        }) || [];
        setSelectedRoleIds(roleIds);
        setViewMode('form');
    };

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: validateUserField(name, value, !!formData.id) }));
    };

    const handleSave = async () => {
        const formErrors = validateUserForm(formData, !!formData.id);
        if (!selectedRoleIds.length) formErrors.general = "Rola wymagana";
        if (Object.keys(formErrors).length) return setErrors(formErrors);

        try {
            const payload = { ...formData, roleIds: selectedRoleIds };
            if (!payload.password) delete payload.password;

            await (formData.id ? api.users.update(formData.id, payload) : api.users.create(payload));
            setViewMode('list');
            loadData();
        } catch (e: any) { setErrors({ general: e.message || "Błąd zapisu" }); }
    };

    const handleSaveAssignment = async () => {
        if (!assignmentTarget) return;
        setLoading(true);
        try {
            const isStudent = assignmentTarget.userRoles?.some((ur: any) => ur.roleName === 'Uczeń' || ur.role?.name === 'Uczeń');
            const payload: any = { ...assignmentTarget, roleIds: assignmentTarget.userRoles?.map((ur: any) => ur.roleId) };

            if (isStudent) {
                payload.parentIds = selectedAssignmentIds;
            } else {
                payload.childIds = selectedAssignmentIds;
            }

            await api.users.update(assignmentTarget.id, payload);
            setViewMode('list');
            loadData();
        } catch {
            alert("Błąd zapisu powiązań");
        } finally {
            setLoading(false);
        }
    };

    const filteredCandidates = assignmentCandidates.filter(c =>
        (c.lastName + " " + c.firstName + " " + c.email).toLowerCase().includes(relationSearch.toLowerCase())
    );

    const renderForm = () => (
        <div className="bg-white border border-neutral-200 max-w-4xl mx-auto shadow-sm min-h-[500px] flex flex-col font-sans mt-6 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b bg-neutral-50">
                <h3 className="text-lg font-bold text-neutral-800">
                    {formData.id ? 'Edycja' : 'Nowy'} użytkownika
                </h3>
            </div>

            <div className="p-6 flex-1 overflow-y-auto bg-white">
                {errors.general && <div className="mb-4 p-3 bg-danger-light text-danger-text rounded flex gap-2 text-sm"><AlertCircle size={16} />{errors.general}</div>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {Object.keys(FIELDS_CONFIG).map(f => (
                        <div key={f} className={f === 'email' ? 'md:col-span-2' : ''}>
                            <label className="label-text">{FIELDS_CONFIG[f as keyof typeof FIELDS_CONFIG]} {!['phone', 'street', 'city', 'postalCode'].includes(f) && <span className="text-danger">*</span>}</label>
                            <Input name={f} value={(formData[f as keyof User] as string) || ''} onChange={handleInput} className={errors[f] ? "!border-danger" : ""} />
                            {errors[f] && <span className="text-xs text-danger">{errors[f]}</span>}
                        </div>
                    ))}
                    <div className="md:col-span-2 border-t pt-4">
                        <PasswordInput value={formData.password || ''} onChange={handleInput} required={!formData.id} showRules={!!(!formData.id || formData.password)} />
                        {errors.password && <span className="text-xs text-danger">{errors.password}</span>}
                    </div>
                </div>
                <div className="border-t pt-4"><label className="label-text block mb-2">Rola <span className="text-danger">*</span></label>
                    <div className="flex gap-2 flex-wrap">{roles.map(r => (<button key={r.id} onClick={() => setSelectedRoleIds(p => p.includes(r.id) ? p.filter(id => id !== r.id) : [...p, r.id])} className={clsx("px-3 py-1.5 text-sm border rounded flex gap-2 transition-colors", selectedRoleIds.includes(r.id) ? "bg-primary text-white border-primary" : "bg-white text-neutral-600 hover:border-primary")}>{selectedRoleIds.includes(r.id) && <Check size={14} />}{r.name}</button>))}</div>
                </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-neutral-50 mt-auto"><Button variant="secondary" onClick={() => setViewMode('list')}>Anuluj</Button><Button onClick={handleSave}>Zapisz</Button></div>
        </div>
    );

    const renderAssignForm = () => (
        <div className="bg-white border border-neutral-200 max-w-2xl mx-auto shadow-sm min-h-[500px] flex flex-col font-sans mt-6 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b bg-neutral-50 flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-neutral-800">Zarządzaj powiązaniami</h3>
                    <p className="text-sm text-neutral-500">{formatName(assignmentTarget!)}</p>
                </div>
                <UsersIcon className="text-neutral-300" size={24} />
            </div>

            <div className="p-6 flex-1 flex flex-col gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-neutral-400" size={18} />
                    <Input value={relationSearch} onChange={e => setRelationSearch(e.target.value)} placeholder="Szukaj użytkownika..." className="pl-10" />
                </div>

                <div className="border rounded-lg flex-1 overflow-y-auto divide-y divide-neutral-100 min-h-[300px]">
                    {filteredCandidates.map(c => (
                        <div key={c.id} onClick={() => setSelectedAssignmentIds(p => p.includes(c.id) ? p.filter(id => id !== c.id) : [...p, c.id])} className={clsx("p-4 flex justify-between items-center cursor-pointer hover:bg-neutral-50 transition-colors", selectedAssignmentIds.includes(c.id) && "bg-primary-light/30")}>
                            <div>
                                <div className={clsx("font-medium text-sm", selectedAssignmentIds.includes(c.id) ? "text-primary" : "text-neutral-700")}>{formatName(c)}</div>
                                <div className="text-xs text-neutral-500">{c.email}</div>
                            </div>
                            {selectedAssignmentIds.includes(c.id) ? <Check size={20} className="text-primary" /> : <Plus size={18} className="text-neutral-300" />}
                        </div>
                    ))}
                    {!filteredCandidates.length && <div className="p-12 text-center text-neutral-400 text-sm">Nie znaleziono kandydatów</div>}
                </div>
                <div className="text-sm text-neutral-600 font-medium">Zaznaczono elementów: {selectedAssignmentIds.length}</div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-neutral-50">
                <Button variant="secondary" onClick={() => setViewMode('list')}>Anuluj</Button>
                <Button onClick={handleSaveAssignment}>Zapisz powiązania</Button>
            </div>
        </div>
    );

    if (viewMode === 'form') return renderForm();
    if (viewMode === 'assign') return renderAssignForm();

    return (
        <div className="bg-white border border-neutral-200 shadow-sm font-sans flex flex-col min-h-[600px]">
            <div className="border-b px-4 flex justify-between items-end bg-neutral-50/30">
                <div className="flex gap-6">
                    <button onClick={() => setMainTab('users')} className={clsx("py-4 text-sm font-bold uppercase border-b-2 flex gap-2 transition-colors", mainTab === 'users' ? "border-primary text-primary" : "border-transparent text-neutral-500 hover:text-neutral-700")}><UsersIcon size={18} /> Użytkownicy</button>
                    <button onClick={() => setMainTab('roles')} className={clsx("py-4 text-sm font-bold uppercase border-b-2 flex gap-2 transition-colors", mainTab === 'roles' ? "border-primary text-primary" : "border-transparent text-neutral-500 hover:text-neutral-700")}><Shield size={18} /> Role</button>
                    <button onClick={() => setMainTab('relations')} className={clsx("py-4 text-sm font-bold uppercase border-b-2 flex gap-2 transition-colors", mainTab === 'relations' ? "border-primary text-primary" : "border-transparent text-neutral-500 hover:text-neutral-700")}><LinkIcon size={18} /> Powiązania</button>
                </div>
                {mainTab === 'users' && <div className="py-3"><Button onClick={() => openForm()}><Plus size={16} className="mr-2" /> Dodaj</Button></div>}
            </div>

            <div className="flex items-center justify-between gap-4 p-4 border-b bg-white">
                <SortFilterToolbar
                    className="flex-1"
                    search={filters.search} onSearchChange={v => setFilters(p => ({ ...p, search: v }))}
                    sortBy={filters.sortBy} sortDesc={filters.sortDesc} onSortChange={f => setFilters(p => ({ ...p, sortBy: f, sortDesc: p.sortBy === f ? !p.sortDesc : false }))}
                    sortOptions={
                        mainTab === 'users' ? [
                            { field: 'lastName', label: 'Nazwisko' }, { field: 'email', label: 'Email' }, { field: 'role', label: 'Rola' }, { field: 'created', label: 'Utworzono' }, { field: 'updated', label: 'Edytowano' }
                        ] : mainTab === 'roles' ? [] : [
                            { field: 'parentName', label: 'Rodzic' }, { field: 'studentName', label: 'Uczeń' }, { field: 'created', label: 'Utworzono' }
                        ]
                    }
                    hideCreate={true}
                />
                {mainTab === 'users' && (
                    <TrashButton
                        isTrashActive={filters.showInactive || false}
                        onToggle={() => {
                            setLoading(true);
                            setData([]);
                            setFilters(p => ({ ...p, showInactive: !p.showInactive }));
                        }}
                    />
                )}
                {mainTab === 'relations' && <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer whitespace-nowrap"><input type="checkbox" checked={filters.onlyUnassignedParents} onChange={e => { setLoading(true); setFilters(p => ({ ...p, onlyUnassignedParents: e.target.checked })); }} className="rounded border-neutral-300 text-primary focus:ring-primary" /> Pokaż rodziców bez powiązań</label>}
            </div>

            <div className="flex-1 bg-white">
                {loading ? <div className="p-12 text-center text-neutral-400 flex flex-col items-center gap-2"><RefreshCcw className="animate-spin" size={24} /> Ładowanie...</div> : (
                    mainTab === 'users' ? (
                        <DataTable
                            data={data}
                            columns={[
                                { header: 'Użytkownik', render: (u) => <div><div className={clsx("font-medium", !u.isActive && "text-neutral-500")}>{formatName(u)}</div><div className="text-xs text-neutral-500">{u.email}</div></div> },
                                { header: 'Telefon', render: (u) => <span className="text-neutral-600">{u.phone || '-'}</span> },
                                {
                                    header: 'Rola', render: (u) =>
                                        <div className="flex gap-1 flex-wrap">
                                            {u.roleNames ? u.roleNames.split(', ').map((r: string, idx: number) => (
                                                <span key={idx} className="text-neutral-500 text-xs">{r}</span>
                                            )) : <span className="text-neutral-400 text-xs">-</span>}
                                        </div>
                                },
                                { header: 'Utworzono', render: (u) => <span className="text-neutral-500 text-xs">{formatDate(u.createdAt)}</span> },
                                { header: 'Edytowano', render: (u) => <span className="text-neutral-500 text-xs">{formatDate(u.updatedAt)}</span> },
                                { header: 'Zmodyfikowano', render: (u) => <span className="text-neutral-500 text-xs">{u.modifiedByName || 'System'}</span> },
                                {
                                    header: 'Akcje', className: 'text-right', render: (u) => (
                                        <ActionButtons
                                            isActive={u.isActive}
                                            onEdit={async () => {
                                                setLoading(true);
                                                try {
                                                    const fullUser = await api.users.get(u.id);
                                                    openForm(fullUser);
                                                } catch { alert("Błąd pobierania danych użytkownika"); }
                                                finally { setLoading(false); }
                                            }}
                                            onDelete={() => handleAction(() => api.users.delete(u.id), "Usunąć?")}
                                            onRestore={() => handleRestore(u.id)}
                                            onDetails={async () => {
                                                setLoading(true);
                                                try {
                                                    const fullUser = await api.users.get(u.id);
                                                    const roleNames = fullUser.userRoles?.map((ur: any) => ur.roleName || ur.role?.name).filter(Boolean).join(', ') || '-';
                                                    const relatedContent = fullUser.relations && fullUser.relations.length > 0
                                                        ? fullUser.relations.join(', ')
                                                        : '-';

                                                    setDetailsUser({
                                                        ...fullUser,
                                                        roleNames,
                                                        relatedContent,
                                                        createdAt: fullUser.createdAt,
                                                    });
                                                    setIsDetailsOpen(true);
                                                } catch { alert("Błąd pobierania szczegółów"); }
                                                finally { setLoading(false); }
                                            }}
                                        />
                                    )
                                }
                            ]}
                        />
                    ) : mainTab === 'roles' ? (
                        <DataTable
                            data={data}
                            columns={[
                                { header: 'Nazwa', accessor: 'name', className: 'font-medium text-neutral-900' },
                                { header: 'Poziom', accessor: 'level', className: 'text-neutral-600' },
                                { header: 'Opis', render: (r) => <span className="text-neutral-500 truncate max-w-xs block" title={r.description}>{r.description || '-'}</span> },
                                { header: 'Utworzono', render: (r) => <span className="text-xs text-neutral-500">{formatDate(r.createdAt)}</span> }
                            ]}
                        />
                    ) : (
                        filters.onlyUnassignedParents ? (
                            <DataTable
                                data={data}
                                columns={[
                                    { header: 'Rodzic', render: (p) => <div><div className="font-medium text-neutral-900">{formatName(p)}</div><div className="text-xs text-neutral-500">{p.email}</div></div> },
                                    { header: 'Status', render: () => <span className="italic text-neutral-500">brak powiązań</span> },
                                    { header: 'Utworzono', render: (p) => <span className="text-xs text-neutral-500">{formatDate(p.createdAt)}</span> },
                                    { header: 'Akcje', className: 'text-right', render: (p) => <button onClick={() => handleEditRelation(p.id)} className="text-primary hover:bg-primary-light px-3 py-1 rounded text-xs flex items-center gap-1 ml-auto transition-colors"><UserPlus size={14} /> Przypisz</button> }
                                ]}
                            />
                        ) : (
                            <DataTable
                                data={data}
                                columns={[
                                    { header: 'Rodzic', render: (r) => <div><div className="font-medium text-neutral-900">{r.parentName}</div><div className="text-xs text-neutral-500 font-normal">{r.parentEmail}</div></div> },
                                    { header: 'Uczeń', accessor: 'studentName', className: 'font-medium text-neutral-900' },
                                    { header: 'Utworzono', render: (r) => <span className="text-xs text-neutral-500">{formatDate(r.createdAt)}</span> },
                                    { header: 'Edytowano', render: (r) => <span className="text-xs text-neutral-500">{formatDate(r.updatedAt || r.createdAt)}</span> },
                                    {
                                        header: 'Akcje', className: 'text-right', render: (r) => (
                                            <ActionButtons
                                                onEdit={() => handleEditRelation(r.parentId)}
                                                onDelete={() => handleAction(() => api.parentStudents.delete(r.id), "Usunąć powiązanie?")}
                                            />
                                        )
                                    }
                                ]}
                            />
                        )
                    )
                )}
            </div>

            {detailsUser && (
                <DetailsModal
                    isOpen={isDetailsOpen}
                    onClose={() => setIsDetailsOpen(false)}
                    title={`Szczegóły użytkownika: ${formatName(detailsUser)}`}
                    data={detailsUser}
                    labels={{
                        ...FIELDS_CONFIG,
                        roleNames: "Przypisane role",
                        relatedContent: "Powiązania",
                        createdAt: "Data utworzenia",
                        updatedAt: "Ostatnia modyfikacja"
                    }}
                    excludeKeys={['id', 'password', 'userRoles', 'childIds', 'parentIds', 'parentStudents', 'tickets', 'grades', 'attendances', 'announcements', 'classId', 'class', 'isActive', 'relations']}
                />
            )}
        </div>
    );
};

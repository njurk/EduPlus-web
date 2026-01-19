import { useState, useEffect, useCallback } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { User, Role } from '../../types';
import { api } from '../../services/apiService';
import { TrashButton } from '../../components/ui/TrashButton';
import { Check, AlertCircle, Users as UsersIcon, Search, Link as LinkIcon, Plus, Shield, UserPlus } from 'lucide-react';
import { clsx } from 'clsx';
import { SearchBar } from '../../components/ui/SearchBar';
import { ActionButtons } from '../../components/ui/ActionButtons';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { validateUserField, validateUserForm } from '../../utils/validation';
import { DataTable } from '../../components/ui/DataTable';
import { formatDate, formatName } from '../../utils/formatters';
import { DetailsModal } from '../../components/modals/DetailsModal';
import { Modal } from '../../components/modals/Modal';
import { useCMSContent } from '../../hooks/useCMSContent';

const FIELDS_CONFIG = { firstName: "Imię", lastName: "Nazwisko", email: "Email", phone: "Telefon", street: "Ulica i numer domu", postalCode: "Kod pocztowy", city: "Miasto" };

export const Users = () => {
    const { getText } = useCMSContent('users');
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
        onlyUnassignedParents: false,
        roleName: ''
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
                const r = await api.roles.getAll({ search: filters.search, sortBy: filters.sortBy, sortDesc: filters.sortDesc });
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
        } catch (e) { console.error('Error:', e); }
        finally { setLoading(false); }
    }, [mainTab, filters, roles.length]);

    useEffect(() => { loadData(); }, [mainTab, filters]);

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
        try { await action(); await loadData(); } catch (e: any) { console.error('handleAction error:', e); alert(e?.message || "Błąd operacji"); }
    };

    const handleRestore = async (id: number) => {
        await handleAction(() => api.users.restore(id), "Przywrócić użytkownika?");
    };

    const handleEditRelation = async (userId: number) => {
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
            await loadData();
        } catch (e: any) { setErrors({ general: e.message || "Błąd zapisu" }); }
    };

    const handleSaveAssignment = async () => {
        if (!assignmentTarget) return;
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
            await loadData();
        } catch {
            alert("Błąd zapisu powiązań");
        }
    };

    const filteredCandidates = assignmentCandidates.filter(c =>
        (c.lastName + " " + c.firstName + " " + c.email).toLowerCase().includes(relationSearch.toLowerCase())
    );

    const renderForm = () => (
        <Modal
            isOpen={viewMode === 'form'}
            onClose={() => setViewMode('list')}
            title={formData.id ? getText('modal.editUser') : getText('modal.newUser')}
            maxWidth="lg"
            footer={
                <>
                    <Button variant="secondary" onClick={() => setViewMode('list')}>{'Anuluj'}</Button>
                    <Button onClick={handleSave}>{'Zapisz'}</Button>
                </>
            }
        >
            <div className="p-6 space-y-6">
                {errors.general && <div className="p-3 bg-danger-light text-danger-text rounded flex gap-2 text-sm"><AlertCircle size={16} />{errors.general}</div>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <div className="border-t pt-4">
                    <label className="label-text block mb-2">{getText('form.role')} <span className="text-danger">*</span></label>
                    <div className="flex gap-2 flex-wrap">
                        {roles.map(r => (
                            <button
                                key={r.id}
                                onClick={() => setSelectedRoleIds(p => p.includes(r.id) ? p.filter(id => id !== r.id) : [...p, r.id])}
                                className={clsx("px-3 py-1.5 text-sm border rounded flex gap-2 transition-colors", selectedRoleIds.includes(r.id) ? "bg-primary text-white border-primary" : "bg-white text-neutral-600 hover:border-primary")}
                            >
                                {selectedRoleIds.includes(r.id) && <Check size={14} />}
                                {r.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </Modal>
    );

    const renderAssignForm = () => (
        <Modal
            isOpen={viewMode === 'assign'}
            onClose={() => setViewMode('list')}
            title={getText('modal.manageRelations')}
            maxWidth="lg"
            footer={
                <>
                    <Button variant="secondary" onClick={() => setViewMode('list')}>{'Anuluj'}</Button>
                    <Button onClick={handleSaveAssignment}>{'Zapisz powiązania'}</Button>
                </>
            }
        >
            <div className="p-6 flex flex-col gap-4">
                <div className="mb-2">
                    <p className="text-sm text-neutral-500">{getText('modal.user')}: <span className="font-medium text-neutral-800">{formatName(assignmentTarget!)}</span></p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-neutral-400" size={18} />
                    <Input value={relationSearch} onChange={e => setRelationSearch(e.target.value)} placeholder={'Szukaj użytkownika...'} className="pl-10" />
                </div>

                <div className="border rounded-lg overflow-y-auto divide-y divide-neutral-100 max-h-[350px]">
                    {filteredCandidates.map(c => (
                        <div key={c.id} onClick={() => setSelectedAssignmentIds(p => p.includes(c.id) ? p.filter(id => id !== c.id) : [...p, c.id])} className={clsx("p-4 flex justify-between items-center cursor-pointer hover:bg-neutral-50 transition-colors", selectedAssignmentIds.includes(c.id) && "bg-primary-light/30")}>
                            <div>
                                <div className={clsx("font-medium text-sm", selectedAssignmentIds.includes(c.id) ? "text-primary" : "text-neutral-700")}>{formatName(c)}</div>
                                <div className="text-xs text-neutral-500">{c.email}</div>
                            </div>
                            {selectedAssignmentIds.includes(c.id) ? <Check size={20} className="text-primary" /> : <Plus size={18} className="text-neutral-300" />}
                        </div>
                    ))}
                    {!filteredCandidates.length && <div className="p-12 text-center text-neutral-400 text-sm">Nie znaleziono kandydatw</div>}
                </div>
                <div className="text-sm text-neutral-600 font-medium">Zaznaczono elementów: {selectedAssignmentIds.length}</div>
            </div>
        </Modal>
    );

    return (
        <div className="bg-white border border-neutral-200 shadow-sm font-sans flex flex-col min-h-[600px]">
            <div className="border-b px-4 flex justify-between items-end bg-neutral-50/30">
                <div className="flex gap-6">
                    <button onClick={() => setMainTab('users')} className={clsx("py-4 text-sm font-bold uppercase border-b-2 flex gap-2 transition-colors", mainTab === 'users' ? "border-primary text-primary" : "border-transparent text-neutral-500 hover:text-neutral-700")}><UsersIcon size={18} /> {getText('tabs.users')}</button>
                    <button onClick={() => setMainTab('roles')} className={clsx("py-4 text-sm font-bold uppercase border-b-2 flex gap-2 transition-colors", mainTab === 'roles' ? "border-primary text-primary" : "border-transparent text-neutral-500 hover:text-neutral-700")}><Shield size={18} /> {getText('tabs.roles')}</button>
                    <button onClick={() => setMainTab('relations')} className={clsx("py-4 text-sm font-bold uppercase border-b-2 flex gap-2 transition-colors", mainTab === 'relations' ? "border-primary text-primary" : "border-transparent text-neutral-500 hover:text-neutral-700")}><LinkIcon size={18} /> {getText('tabs.relations')}</button>
                </div>
            </div>

            <div className="flex items-center justify-between gap-4 p-4 border-b bg-white">
                <div className="flex items-center gap-4 flex-1">
                    <SearchBar value={filters.search} onChange={v => setFilters(p => ({ ...p, search: v }))} className="max-w-xs" />
                    {mainTab === 'users' && roles.length > 0 && (
                        <select
                            value={filters.roleName}
                            onChange={e => setFilters(p => ({ ...p, roleName: e.target.value }))}
                            className="border border-neutral-300 rounded-xs px-3 h-9 text-sm bg-white min-w-[120px]"
                        >
                            <option value="">Wszystkie role</option>
                            {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                        </select>
                    )}
                </div>
                {mainTab === 'users' && (
                    <div className="flex gap-2">
                        <TrashButton isTrashActive={filters.showInactive || false} onToggle={() => { setLoading(true); setData([]); setFilters(p => ({ ...p, showInactive: !p.showInactive })); }} />
                        {!filters.showInactive && <Button onClick={() => openForm()}><Plus size={16} className="mr-2" /> {'Dodaj'}</Button>}
                    </div>
                )}
                {mainTab === 'relations' && <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer whitespace-nowrap"><input type="checkbox" checked={filters.onlyUnassignedParents} onChange={e => { setLoading(true); setFilters(p => ({ ...p, onlyUnassignedParents: e.target.checked })); }} className="rounded border-neutral-300 text-primary focus:ring-primary" /> Pokaż niepowiązanych</label>}
            </div>

            <div className="flex-1 bg-white">
                {mainTab === 'users' ? (
                    <DataTable
                        data={data}
                        isLoading={loading}
                        sortBy={filters.sortBy}
                        sortDesc={filters.sortDesc}
                        onSort={field => setFilters(p => p.sortBy === field ? { ...p, sortDesc: !p.sortDesc } : { ...p, sortBy: field, sortDesc: true })}
                        columns={[
                            { header: getText('columns.user'), sortKey: 'name', render: (u) => <div><div className={clsx("font-medium", !u.isActive && "text-neutral-500")}>{formatName(u)}</div><div className="text-xs text-neutral-500">{u.email}</div></div> },
                            { header: getText('columns.phone'), render: (u) => <span className="text-neutral-600">{u.phone || '-'}</span> },
                            {
                                header: getText('columns.role'), render: (u) =>
                                    <div className="flex gap-1 flex-wrap">
                                        {u.roleNames ? u.roleNames.split(', ').map((r: string, idx: number) => (
                                            <span key={idx} className="text-neutral-500 text-xs">{r}</span>
                                        )) : <span className="text-neutral-400 text-xs">-</span>}
                                    </div>
                            },
                            { header: getText('columns.createdAt'), sortKey: 'created', render: (u) => <span className="text-neutral-500 text-xs">{formatDate(u.createdAt)}</span> },
                            { header: getText('columns.updatedAt'), sortKey: 'updated', render: (u) => <span className="text-neutral-500 text-xs">{formatDate(u.updatedAt)}</span> },
                            { header: getText('columns.modifiedBy'), render: (u) => <span className="text-neutral-500 text-xs">{u.modifiedByName || 'System'}</span> },
                            {
                                header: getText('columns.actions'), className: 'text-right', render: (u) => (
                                    <ActionButtons
                                        isActive={u.isActive}
                                        onEdit={u.isActive ? async () => {
                                            try {
                                                const fullUser = await api.users.get(u.id);
                                                openForm(fullUser);
                                            } catch { alert("Błąd pobierania danych użytkownika"); }
                                        } : undefined}
                                        onDelete={u.isActive ? () => handleAction(() => api.users.delete(u.id), "Usun?") : undefined}
                                        onRestore={!u.isActive ? () => handleRestore(u.id) : undefined}
                                        onDetails={async () => {
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
                                        }}
                                    />
                                )
                            }
                        ]}
                    />
                ) : mainTab === 'roles' ? (
                    <DataTable
                        data={data}
                        isLoading={loading}
                        sortBy={filters.sortBy}
                        sortDesc={filters.sortDesc}
                        onSort={field => setFilters(p => p.sortBy === field ? { ...p, sortDesc: !p.sortDesc } : { ...p, sortBy: field, sortDesc: true })}
                        columns={[
                            { header: getText('columns.roleName'), accessor: 'name', sortKey: 'name', className: 'font-medium text-neutral-900' },
                            { header: getText('columns.level'), accessor: 'level', sortKey: 'level', className: 'text-neutral-600' },
                            { header: getText('columns.description'), render: (r) => <span className="text-neutral-500 truncate max-w-xs block" title={r.description}>{r.description || '-'}</span> },
                            { header: getText('columns.createdAt'), sortKey: 'created', render: (r) => <span className="text-xs text-neutral-500">{formatDate(r.createdAt)}</span> },
                            { header: getText('columns.updatedAt'), sortKey: 'updated', render: (r) => <span className="text-xs text-neutral-500">{formatDate(r.updatedAt)}</span> },
                            { header: getText('columns.modifiedBy'), render: (r) => <span className="text-xs text-neutral-500">{r.modifiedByName || 'System'}</span> }
                        ]}
                    />
                ) : (
                    filters.onlyUnassignedParents ? (
                        <DataTable
                            data={data}
                            isLoading={loading}
                            sortBy={filters.sortBy}
                            sortDesc={filters.sortDesc}
                            onSort={field => setFilters(p => p.sortBy === field ? { ...p, sortDesc: !p.sortDesc } : { ...p, sortBy: field, sortDesc: true })}
                            columns={[
                                { header: getText('columns.parent'), sortKey: 'name', render: (p) => <div><div className="font-medium text-neutral-900">{p.lastName && p.firstName ? formatName(p) : `ID: ${p.id}`}</div><div className="text-xs text-neutral-500">{p.email || '-'}</div></div> },
                                { header: getText('columns.status'), render: () => <span className="italic text-neutral-500">Brak powiązań</span> },
                                { header: getText('columns.createdAt'), sortKey: 'created', render: (p) => <span className="text-xs text-neutral-500">{formatDate(p.createdAt)}</span> },
                                { header: getText('columns.updatedAt'), sortKey: 'updated', render: (p) => <span className="text-xs text-neutral-500">{formatDate(p.updatedAt)}</span> },
                                { header: getText('columns.modifiedBy'), render: (p) => <span className="text-xs text-neutral-500">{p.modifiedByName || 'System'}</span> },
                                { header: getText('columns.actions'), className: 'text-right', render: (p) => <button onClick={() => handleEditRelation(p.id)} className="text-primary hover:bg-primary-light px-3 py-1 rounded text-xs flex items-center gap-1 ml-auto transition-colors"><UserPlus size={14} /> {'Przypisz'}</button> }
                            ]}
                        />
                    ) : (
                        <DataTable
                            data={data}
                            isLoading={loading}
                            sortBy={filters.sortBy}
                            sortDesc={filters.sortDesc}
                            onSort={field => setFilters(p => p.sortBy === field ? { ...p, sortDesc: !p.sortDesc } : { ...p, sortBy: field, sortDesc: true })}
                            columns={[
                                { header: getText('columns.parent'), sortKey: 'parentName', render: (r) => <div><div className="font-medium text-neutral-900">{r.parentName}</div><div className="text-xs text-neutral-500 font-normal">{r.parentEmail}</div></div> },
                                { header: getText('columns.student'), accessor: 'studentName', sortKey: 'studentName', className: 'font-medium text-neutral-900' },
                                { header: getText('columns.createdAt'), sortKey: 'created', render: (r) => <span className="text-xs text-neutral-500">{formatDate(r.createdAt)}</span> },
                                { header: getText('columns.updatedAt'), sortKey: 'updated', render: (r) => <span className="text-xs text-neutral-500">{formatDate(r.updatedAt || r.createdAt)}</span> },
                                { header: getText('columns.modifiedBy'), render: (r) => <span className="text-xs text-neutral-500">{r.modifiedByName || 'System'}</span> },
                                {
                                    header: getText('columns.actions'), className: 'text-right', render: (r) => (
                                        <ActionButtons
                                            onEdit={() => handleEditRelation(r.parentId)}
                                            onDelete={() => handleAction(() => api.parentStudents.delete(r.id), 'Czy usunąć powiązanie?')}
                                        />
                                    )
                                }
                            ]}
                        />
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
                        roleNames: "Role",
                        relatedContent: "Powiązania",
                        createdAt: "Data utworzenia",
                        updatedAt: "Ostatnia modyfikacja"
                    }}
                    excludeKeys={['id', 'password', 'userRoles', 'childIds', 'parentIds', 'parentStudents', 'tickets', 'grades', 'attendances', 'announcements', 'classId', 'class', 'isActive', 'relations']}
                />
            )}
            {viewMode === 'form' && renderForm()}
            {viewMode === 'assign' && renderAssignForm()}
        </div>
    );
};

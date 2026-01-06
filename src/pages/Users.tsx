import { useState, useEffect, useCallback } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import type { User, Role, ParentStudentRelation } from '../types';
import { api } from '../services/apiService';
import { TrashButton } from '../components/ui/TrashButton';
import { Check, AlertCircle, User as UserIcon, Users as UsersIcon, Search, Link as LinkIcon, Plus, Shield, UserPlus, RefreshCcw } from 'lucide-react';
import { clsx } from 'clsx';
import { SortFilterToolbar } from '../components/ui/SortFilterToolbar';
import { ActionButtons } from '../components/ui/ActionButtons';
import { PasswordInput } from '../components/ui/PasswordInput';
import { validateUserField, validateUserForm } from '../utils/validation';

const FIELDS_CONFIG = { firstName: "Imię", lastName: "Nazwisko", email: "Email", phone: "Telefon", street: "Ulica i numer domu", postalCode: "Kod pocztowy", city: "Miasto" };

const formatDate = (date?: string) => date ? new Date(date).toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
const formatName = (u?: { firstName: string; lastName: string } | null) => u ? `${u.lastName} ${u.firstName}` : '';

export const Users = () => {
    const [mainTab, setMainTab] = useState<'users' | 'relations' | 'roles'>('users');
    const [usersData, setUsersData] = useState<User[]>([]);
    const [relationsData, setRelationsData] = useState<ParentStudentRelation[]>([]);
    const [rolesData, setRolesData] = useState<Role[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [cachedStudents, setCachedStudents] = useState<User[]>([]);
    const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
    const [loading, setLoading] = useState(false);

    const [filters, setFilters] = useState({
        search: '',
        sortBy: 'created',
        sortDesc: true,
        showInactive: false,
        onlyUnassignedParents: false
    });

    const [formData, setFormData] = useState<Partial<User>>({});
    const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
    const [selectedChildIds, setSelectedChildIds] = useState<number[]>([]);
    const [errors, setErrors] = useState<Record<string, string | null>>({});
    const [formTab, setFormTab] = useState<'details' | 'relations'>('details');
    const [relationSearch, setRelationSearch] = useState('');

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            if (mainTab === 'users') {
                const [fetchedUsers, fetchedRoles] = await Promise.all([
                    api.users.getAll(filters),
                    roles.length ? Promise.resolve(roles) : api.roles.getAll()
                ]);
                setUsersData(fetchedUsers);
                if (!roles.length) setRoles(fetchedRoles);
            } else if (mainTab === 'roles') {
                const fetchedRoles = await api.roles.getAll({ search: filters.search });
                setRolesData(fetchedRoles);
            } else {
                if (filters.onlyUnassignedParents) {
                    const parents = await api.users.getAll({ onlyUnassignedParents: true });
                    setUsersData(parents);
                } else {
                    const relations = await api.parentStudents.getAll(filters.search, filters.sortBy, filters.sortDesc);
                    setRelationsData(relations);
                }
            }
        } catch { setErrors({ general: "Błąd pobierania danych" }); } finally { setLoading(false); }
    }, [mainTab, filters, roles.length]);

    useEffect(() => { const id = setTimeout(loadData, 300); return () => clearTimeout(id); }, [loadData]);

    useEffect(() => {
        setUsersData([]); setRelationsData([]); setRolesData([]);
        setFilters(prev => ({ ...prev, search: '', showInactive: false, onlyUnassignedParents: false, sortBy: 'created', sortDesc: true }));
    }, [mainTab]);

    useEffect(() => {
        if (viewMode === 'form' && cachedStudents.length === 0) {
            api.users.getAll({ roleName: 'Uczeń' }).then(setCachedStudents).catch(console.error);
        }
    }, [viewMode, cachedStudents.length]);

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: validateUserField(name, value, !!formData.id) }));
    };

    const handleAction = async (action: () => Promise<any>, msg?: string) => {
        if (msg && !window.confirm(msg)) return;
        try { await action(); loadData(); } catch { alert("Błąd operacji"); }
    };

    const handleRestore = async (id: number) => {
        await handleAction(() => api.users.restore(id), "Przywrócić użytkownika?");
    };

    const handleEditRelation = async (parentId: number) => {
        setLoading(true);
        try {
            const parent = await api.users.get(parentId);
            openForm(parent, 'relations');
        } catch {
            alert("Błąd pobierania danych rodzica");
        } finally {
            setLoading(false);
        }
    };

    const openForm = (item?: any, tab: 'details' | 'relations' = 'details') => {
        setErrors({});
        setFormData(item ? { ...item } : { isActive: true, password: "", firstName: '', lastName: '', email: '', street: '', city: '', postalCode: '' });
        setSelectedRoleIds(item?.userRoles?.map((ur: any) => ur.roleId) || []);
        if (item) {
            const kids = relationsData.filter(r => r.parentId === item.id).map(r => r.studentId);
            setSelectedChildIds(kids);
        } else {
            setSelectedChildIds([]);
        }

        setFormTab(tab);
        setRelationSearch('');
        setViewMode('form');
    };

    const handleSave = async () => {
        const formErrors = validateUserForm(formData, !!formData.id);
        const newErrors: Record<string, string | null> = { ...formErrors };

        if (!selectedRoleIds.length) {
            newErrors.general = "Użytkownik musi mieć przypisaną rolę";
        }

        if (Object.keys(newErrors).length) return setErrors(newErrors);

        try {
            const payload = { ...formData, roleIds: selectedRoleIds, childIds: selectedChildIds, phone: formData.phone?.trim() || undefined };
            if (!payload.password) delete payload.password;
            await (formData.id ? api.users.update(formData.id, payload) : api.users.create(payload));
            setViewMode('list');
            loadData();
        } catch (e: any) { setErrors({ general: e.message || "Błąd zapisu" }); }
    };

    const availableStudents = cachedStudents.filter(u =>
        u.id !== formData.id &&
        (u.lastName + " " + u.firstName + " " + u.email).toLowerCase().includes(relationSearch.toLowerCase())
    );

    const renderForm = () => (
        <div className="bg-white border border-neutral-200 max-w-4xl mx-auto shadow-sm min-h-[500px] flex flex-col font-sans">
            <div className="px-6 py-4 border-b bg-neutral-50">
                <h3 className="text-lg font-bold text-neutral-800">
                    {formData.id ? 'Edycja' : 'Nowy'} użytkownika
                </h3>
            </div>

            <div className="flex border-b px-6 gap-6">
                <button onClick={() => setFormTab('details')} className={clsx("py-3 text-sm font-medium flex gap-2 border-b-2 transition-colors", formTab === 'details' ? "border-primary text-primary" : "border-transparent text-neutral-500 hover:text-neutral-700")}><UserIcon size={16} /> Dane podstawowe</button>
                <button onClick={() => setFormTab('relations')} className={clsx("py-3 text-sm font-medium flex gap-2 border-b-2 transition-colors", formTab === 'relations' ? "border-primary text-primary" : "border-transparent text-neutral-500 hover:text-neutral-700")}><UsersIcon size={16} /> Powiązania</button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
                {errors.general && <div className="mb-4 p-3 bg-danger-light text-danger-text rounded flex gap-2 text-sm"><AlertCircle size={16} />{errors.general}</div>}

                {formTab === 'details' ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {Object.keys(FIELDS_CONFIG).map(f => (
                                <div key={f} className={f === 'email' ? 'md:col-span-2' : ''}>
                                    <label className="label-text">{FIELDS_CONFIG[f as keyof typeof FIELDS_CONFIG]} {!['phone', 'street', 'city', 'postalCode'].includes(f) && <span className="text-danger">*</span>}</label>
                                    <Input name={f} value={(formData[f as keyof User] as string) || ''} onChange={handleInput} className={errors[f] ? "!border-danger" : ""} />
                                    {errors[f] && <span className="text-xs text-danger">{errors[f]}</span>}
                                </div>
                            ))}
                            <div className="md:col-span-2 border-t pt-4">
                                <PasswordInput
                                    value={formData.password || ''}
                                    onChange={handleInput}
                                    required={!formData.id}
                                    showRules={!!(!formData.id || formData.password)}
                                />
                                {errors.password && <span className="text-xs text-danger">{errors.password}</span>}
                            </div>
                        </div>
                        <div className="border-t pt-4"><label className="label-text block mb-2">Rola <span className="text-danger">*</span></label>
                            <div className="flex gap-2 flex-wrap">{roles.map(r => (<button key={r.id} onClick={() => setSelectedRoleIds(p => p.includes(r.id) ? p.filter(id => id !== r.id) : [...p, r.id])} className={clsx("px-3 py-1.5 text-sm border rounded flex gap-2 transition-colors", selectedRoleIds.includes(r.id) ? "bg-primary text-white border-primary" : "bg-white text-neutral-600 hover:border-primary")}>{selectedRoleIds.includes(r.id) && <Check size={14} />}{r.name}</button>))}</div>
                        </div>
                    </>
                ) : (
                    <div className="space-y-4">
                        <div className="relative"><Search className="absolute left-3 top-2.5 text-neutral-400" size={18} /><Input value={relationSearch} onChange={e => setRelationSearch(e.target.value)} placeholder="Szukaj ucznia..." className="pl-10" /></div>
                        <div className="border rounded h-64 overflow-y-auto divide-y divide-neutral-100">
                            {availableStudents.map(s => (
                                <div key={s.id} onClick={() => setSelectedChildIds(p => p.includes(s.id) ? p.filter(id => id !== s.id) : [...p, s.id])} className={clsx("p-3 flex justify-between cursor-pointer hover:bg-neutral-50 transition-colors", selectedChildIds.includes(s.id) && "bg-primary-light")}>
                                    <div>
                                        <div className={clsx("font-medium text-sm", selectedChildIds.includes(s.id) ? "text-primary" : "text-neutral-700")}>{formatName(s)}</div>
                                        <div className="text-xs text-neutral-500">{s.email}</div>
                                    </div>
                                    {selectedChildIds.includes(s.id) && <Check size={16} className="text-primary" />}
                                </div>
                            ))}
                            {!availableStudents.length && <div className="p-4 text-center text-neutral-400 text-sm">Nie znaleziono uczniów</div>}
                        </div>
                        <div className="text-xs text-neutral-500 mt-2">Zaznaczono: {selectedChildIds.length}</div>
                    </div>
                )}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-neutral-50 mt-auto"><Button variant="secondary" onClick={() => setViewMode('list')}>Anuluj</Button><Button onClick={handleSave}>Zapisz</Button></div>
        </div>
    );

    const renderRolesTable = () => (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans">
                <thead><tr className="text-xs text-neutral-500 border-b bg-neutral-50 uppercase"><th className="px-4 py-3">Nazwa</th><th className="px-4 py-3">Poziom</th><th className="px-4 py-3">Opis</th><th className="px-4 py-3">Utworzono</th></tr></thead>
                <tbody className="text-sm divide-y divide-neutral-100">
                    {!rolesData.length ? <tr><td colSpan={4} className="p-8 text-center text-neutral-400">Brak danych</td></tr> : rolesData.map(r => (
                        <tr key={r.id} className="hover:bg-neutral-50 transition-colors">
                            <td className="px-4 py-2 font-medium text-neutral-900">{r.name}</td>
                            <td className="px-4 py-2 text-neutral-600">{r.level}</td>
                            <td className="px-4 py-2 text-neutral-500 truncate max-w-xs" title={r.description || ''}>{r.description || '-'}</td>
                            <td className="px-4 py-2 text-neutral-500 text-xs whitespace-nowrap">{formatDate(r.createdAt)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderRelationsTable = () => (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans">
                <thead><tr className="text-xs text-neutral-500 border-b bg-white uppercase"><th className="px-6 py-3 w-1/3">Rodzic</th><th className="px-6 py-3 w-1/3">{filters.onlyUnassignedParents ? 'Status' : 'Uczeń'}</th><th className="px-4 py-3">Utworzono</th><th className="px-4 py-3">Edytowano</th><th className="px-6 py-3 text-right">Akcje</th></tr></thead>
                <tbody className="text-sm divide-y divide-neutral-100">
                    {filters.onlyUnassignedParents ?
                        usersData.map(p => (
                            <tr key={p.id} className="hover:bg-neutral-50 bg-danger-light/30 transition-colors">
                                <td className="px-6 py-3"><div className="font-medium text-neutral-900">{formatName(p)}</div><div className="text-xs text-neutral-500">{p.email}</div></td>
                                <td className="px-6 py-3 italic text-neutral-500">brak powiązań</td>
                                <td className="px-4 py-3 text-xs text-neutral-500">{formatDate(p.createdAt)}</td>
                                <td className="px-4 py-3 text-xs text-neutral-500">{formatDate(p.updatedAt)}</td>
                                <td className="px-6 py-3 text-right"><button onClick={() => openForm(p, 'relations')} className="text-primary hover:bg-primary-light px-3 py-1 rounded text-xs flex items-center gap-1 ml-auto transition-colors"><UserPlus size={14} /> Przypisz</button></td>
                            </tr>
                        )) :
                        relationsData.map(r => (
                            <tr key={r.id} className="hover:bg-neutral-50 transition-colors">
                                <td className="px-6 py-3"><div className="font-medium text-neutral-900">{r.parentName}</div><div className="text-xs text-neutral-500 font-normal">{r.parentEmail}</div></td>
                                <td className="px-6 py-3"><div className="font-medium text-neutral-900">{r.studentName}</div></td>
                                <td className="px-4 py-3 text-xs text-neutral-500">{formatDate(r.createdAt)}</td>
                                <td className="px-4 py-3 text-xs text-neutral-500">{formatDate(r.updatedAt || r.createdAt)}</td>
                                <td className="px-6 py-3 text-right">
                                    <ActionButtons
                                        onEdit={() => handleEditRelation(r.parentId)}
                                        onDelete={() => handleAction(() => api.parentStudents.delete(r.id), "Usunąć powiązanie?")}
                                    />
                                </td>
                            </tr>
                        ))}
                    {!((filters.onlyUnassignedParents ? usersData : relationsData).length) && <tr><td colSpan={6} className="p-8 text-center text-neutral-400">Brak danych</td></tr>}
                </tbody>
            </table>
        </div>
    );

    const renderUsersTable = () => (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans">
                <thead><tr className="text-xs text-neutral-500 border-b bg-neutral-50 uppercase"><th className="px-4 py-3">Użytkownik</th><th className="px-4 py-3">Telefon</th><th className="px-4 py-3">Rola</th><th className="px-4 py-3">Utworzono</th><th className="px-4 py-3">Edytowano</th><th className="px-4 py-3 text-right">Akcje</th></tr></thead>
                <tbody className="text-sm divide-y divide-neutral-100">
                    {!usersData.length ? <tr><td colSpan={6} className="p-8 text-center text-neutral-400">Brak danych</td></tr> : usersData.map(u => (
                        <tr key={u.id} className={clsx("hover:bg-neutral-50 transition-colors", !u.isActive && "bg-neutral-50/50 grayscale opacity-75")}>
                            <td className="px-4 py-2"><div className="font-medium text-neutral-900">{formatName(u)}</div><div className="text-xs text-neutral-500">{u.email}</div></td>
                            <td className="px-4 py-2 text-neutral-600">{u.phone || '-'}</td>
                            <td className="px-4 py-2"><div className="flex gap-1 flex-wrap">{u.userRoles?.map(r => <span key={r.id} className="bg-primary-light text-primary text-xs px-2 py-0.5 rounded border border-primary-light">{r.role?.name}</span>)}</div></td>
                            <td className="px-4 py-2 text-neutral-500 text-xs whitespace-nowrap">{formatDate(u.createdAt)}</td>
                            <td className="px-4 py-2 text-neutral-500 text-xs whitespace-nowrap">{formatDate(u.updatedAt)}</td>
                            <td className="px-4 py-2 text-right">
                                <ActionButtons
                                    isActive={u.isActive}
                                    onEdit={() => openForm(u)}
                                    onDelete={() => handleAction(() => api.users.delete(u.id), "Usunąć?")}
                                    onRestore={() => handleRestore(u.id)}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    if (viewMode === 'form') return renderForm();

    return (
        <div className="bg-white border border-neutral-200 shadow-sm font-sans">
            <div className="border-b px-4 flex justify-between items-end">
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
                            setUsersData([]);
                            setFilters(p => ({ ...p, showInactive: !p.showInactive }));
                        }}
                    />
                )}
                {mainTab === 'relations' && <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer whitespace-nowrap"><input type="checkbox" checked={filters.onlyUnassignedParents} onChange={e => { setLoading(true); setFilters(p => ({ ...p, onlyUnassignedParents: e.target.checked })); }} className="rounded border-neutral-300 text-primary focus:ring-primary" /> Pokaż bez powiązań</label>}
            </div>

            {loading ? <div className="p-12 text-center text-neutral-400 flex flex-col items-center gap-2"><RefreshCcw className="animate-spin" size={24} /> Ładowanie...</div> : (mainTab === 'users' ? renderUsersTable() : mainTab === 'roles' ? renderRolesTable() : renderRelationsTable())}
        </div>
    );
};
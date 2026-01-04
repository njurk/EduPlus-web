import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { User, Role, ParentStudentRelation } from '../../types';
import { api } from '../../services/apiService';
import { Check, AlertCircle, Edit2, Trash2, RefreshCcw, User as UserIcon, Users as UsersIcon, Search, Link as LinkIcon, Plus, UserPlus } from 'lucide-react';
import { clsx } from 'clsx';
import { SortFilterToolbar } from '../../components/ui/SortFilterToolbar';

const PASSWORD_RULES = [
  { label: "Min. 8 znaków", test: (p: string) => p.length >= 8 },
  { label: "Min. 1 duża litera", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Min. 1 cyfra", test: (p: string) => /[0-9]/.test(p) },
  { label: "Min. 1 znak specjalny", test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

const FIELDS_CONFIG = { firstName: "Imię", lastName: "Nazwisko", email: "Email", phone: "Telefon", street: "Ulica i numer domu", postalCode: "Kod pocztowy", city: "Miasto" };

const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  POSTAL: /^\d{2}-\d{3}$/,
  PHONE_CHARS: /^[0-9+\- ]*$/
};

const formatDate = (date?: string) => date ? new Date(date.endsWith('Z') ? date : date + 'Z').toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
const formatName = (u?: { firstName: string; lastName: string } | null) => u ? `${u.lastName} ${u.firstName}` : '';
const swapNameOrder = (fullName: string) => { const parts = fullName.trim().split(' '); return parts.length < 2 ? fullName : `${parts.pop()} ${parts.join(' ')}`; };

export const Users = () => {
  const [mainTab, setMainTab] = useState<'users' | 'relations'>('users');
  const [data, setData] = useState<{ users: User[], roles: Role[], relations: ParentStudentRelation[] }>({ users: [], roles: [], relations: [] });
  const [cachedUsers, setCachedUsers] = useState<User[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ search: '', sortBy: 'created', sortDesc: true, showInactive: false, onlyUnassignedParents: false });

  const [formData, setFormData] = useState<Partial<User>>({});
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [selectedChildIds, setSelectedChildIds] = useState<number[]>([]);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [formTab, setFormTab] = useState<'details' | 'relations'>('details');
  const [relationSearch, setRelationSearch] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [users, roles, relations] = await Promise.all([
        api.users.getAll(filters),
        api.roles.getAll(),
        api.parentStudents.getAll()
      ]);
      setData({ users, roles, relations });
    } catch { setErrors({ general: "Błąd pobierania danych" }); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => {
    setLoading(true);
    const id = setTimeout(loadData, 300);
    return () => clearTimeout(id);
  }, [loadData]);

  useEffect(() => {
    setFilters(prev => mainTab === 'users' ? { ...prev, onlyUnassignedParents: false } : { ...prev, showInactive: false });
  }, [mainTab]);

  useEffect(() => {
    if (viewMode === 'form' && filters.onlyUnassignedParents && cachedUsers.length === 0) {
      api.users.getAll().then(setCachedUsers).catch(console.error);
    }
  }, [viewMode, filters.onlyUnassignedParents, cachedUsers.length]);

  const validateInput = (name: string, value: any, isEdit: boolean) => {
    const valStr = value?.toString().trim() || "";
    if (!valStr && !['password', 'phone', 'street', 'city', 'postalCode'].includes(name)) return "Pole wymagane";
    if (name === 'email' && !REGEX.EMAIL.test(valStr)) return "Nieprawidłowy email";
    if (name === 'password' && (!isEdit || valStr) && !PASSWORD_RULES.every(r => r.test(valStr))) return "Hasło zbyt słabe";
    if (name === 'postalCode' && valStr && !REGEX.POSTAL.test(valStr)) return "Format: XX-XXX";
    if (name === 'phone' && valStr && valStr.replace(/\D/g, '').length < 9) return "Numer za krótki";
    return null;
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'phone' && !REGEX.PHONE_CHARS.test(value)) return;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: validateInput(name, value, !!formData.id) }));
  };

  const handleAction = async (action: () => Promise<any>, msg?: string) => {
    if (msg && !window.confirm(msg)) return;
    try {
      const result = await action();
      console.log(result);
      loadData();
    } catch {
      alert("Błąd operacji");
    }
  };

  const openForm = (user?: User, tab: 'details' | 'relations' = 'details') => {
    setErrors({});
    setFormData(user ? { ...user } : { isActive: true, password: "", firstName: '', lastName: '', email: '', street: '', city: '', postalCode: '' });
    setSelectedRoleIds(user?.userRoles?.map(ur => ur.roleId) || []);
    setSelectedChildIds(user ? data.relations.filter(r => r.parentId === user.id).map(r => r.studentId) : []);
    setFormTab(tab);
    setRelationSearch('');
    setViewMode('form');
  };

  const handleSave = async () => {
    const newErrors: Record<string, string | null> = {};
    if (!selectedRoleIds.length) newErrors.general = "Użytkownik musi mieć rolę";
    Object.keys(FIELDS_CONFIG).concat('password').forEach(f => {
      const val = formData[f as keyof User];
      if (['password', 'postalCode', 'phone', 'street', 'city'].includes(f) && !val && formData.id) return;
      const err = validateInput(f, val, !!formData.id);
      if (err) newErrors[f] = err;
    });

    if (Object.keys(newErrors).length) return setErrors(newErrors);

    try {
      const payload = { ...formData, roleIds: selectedRoleIds, childIds: selectedChildIds, phone: formData.phone?.trim() || undefined };
      if (!payload.password) delete payload.password;
      await (formData.id ? api.users.update(formData.id, payload) : api.users.create(payload));
      setViewMode('list'); loadData();
    } catch (e: any) { setErrors({ general: e.message || "Błąd zapisu" }); }
  };

  const processedRelations = useMemo(() => data.relations
    .map(r => ({ ...r, displayParentName: swapNameOrder(r.parentName), displayStudentName: swapNameOrder(r.studentName) }))
    .filter(r => {
      const s = filters.search.toLowerCase();
      return !s || r.displayParentName.toLowerCase().includes(s) || r.displayStudentName.toLowerCase().includes(s);
    })
    .sort((a, b) => {
      const field = filters.sortBy === 'studentName' ? 'displayStudentName' : 'displayParentName';
      const valA = (a[field] || '').toLowerCase(), valB = (b[field] || '').toLowerCase();
      return filters.sortDesc ? (valA < valB ? 1 : -1) : (valA > valB ? 1 : -1);
    }), [data.relations, filters]);

  const usersForForm = filters.onlyUnassignedParents ? cachedUsers : data.users;
  const availableStudents = usersForForm.filter(u => u.id !== formData.id && u.userRoles?.some(r => r.role?.name.toLowerCase().includes('uczeń')) &&
    (u.lastName + u.firstName + u.email).toLowerCase().includes(relationSearch.toLowerCase()));

  const renderForm = () => (
    <div className="bg-white border border-neutral-200 max-w-4xl mx-auto shadow-sm min-h-[500px] flex flex-col font-sans">
      <div className="px-6 py-4 border-b bg-neutral-50"><h3 className="text-lg font-bold text-neutral-800">{formData.id ? 'Edycja' : 'Nowy'} użytkownik</h3></div>
      <div className="flex border-b px-6 gap-6">
        <button onClick={() => setFormTab('details')} className={clsx("py-3 text-sm font-medium flex gap-2 border-b-2 transition-colors", formTab === 'details' ? "border-primary text-primary" : "border-transparent text-neutral-500 hover:text-neutral-700")}><UserIcon size={16} /> Dane podstawowe</button>
        <button onClick={() => setFormTab('relations')} className={clsx("py-3 text-sm font-medium flex gap-2 border-b-2 transition-colors", formTab === 'relations' ? "border-primary text-primary" : "border-transparent text-neutral-500 hover:text-neutral-700")}><UsersIcon size={16} /> Powiązania</button>
      </div>
      <div className="p-6 flex-1 overflow-y-auto">
        {errors.general && <div className="mb-4 p-3 bg-danger-light text-danger-text rounded flex gap-2 text-sm"><AlertCircle size={16} />{errors.general}</div>}
        {formTab === 'details' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {['firstName', 'lastName', 'email', 'phone'].map(f => (
                <div key={f} className={f === 'email' ? 'md:col-span-2' : ''}>
                  <label className="label-text">{FIELDS_CONFIG[f as keyof typeof FIELDS_CONFIG]} {!['phone'].includes(f) && <span className="text-danger">*</span>}</label>
                  <Input name={f} value={(formData[f as keyof User] as string) || ''} onChange={handleInput} className={errors[f] ? "!border-danger" : ""} placeholder={f === 'phone' ? 'np. 123 456 789' : ''} />
                  {errors[f] && <span className="text-xs text-danger">{errors[f]}</span>}
                </div>
              ))}
              <div className="md:col-span-2 border-t pt-4"><h4 className="text-sm font-semibold mb-4 text-neutral-700">Adres</h4>
                <div className="grid grid-cols-2 gap-6">{['street', 'postalCode', 'city'].map(f => (
                  <div key={f} className={f === 'street' ? 'col-span-2' : ''}><label className="label-text">{FIELDS_CONFIG[f as keyof typeof FIELDS_CONFIG]}</label><Input name={f} value={(formData[f as keyof User] as string) || ''} onChange={handleInput} className={errors[f] ? "!border-danger" : ""} placeholder={f === 'postalCode' ? 'XX-XXX' : ''} />
                    {errors[f] && <span className="text-xs text-danger">{errors[f]}</span>}</div>
                ))}</div>
              </div>
              <div className="md:col-span-2 border-t pt-4"><label className="label-text">Hasło {!formData.id && <span className="text-danger">*</span>}</label>
                <Input name="password" type="password" value={formData.password || ''} onChange={handleInput} />
                {(!formData.id || formData.password) && <ul className="mt-2 space-y-1">{PASSWORD_RULES.map((r, i) => <li key={i} className={clsx("text-xs flex gap-2", r.test(formData.password || "") ? "text-success" : "text-neutral-400")}><Check size={12} className={r.test(formData.password || "") ? "" : "opacity-0"} />{r.label}</li>)}</ul>}
                {errors.password && <span className="text-xs text-danger">{errors.password}</span>}
              </div>
            </div>
            <div className="border-t pt-4"><label className="label-text block mb-2">Rola <span className="text-danger">*</span></label><div className="flex gap-2">{data.roles.map(r => (<button key={r.id} onClick={() => setSelectedRoleIds(p => p.includes(r.id) ? p.filter(id => id !== r.id) : [...p, r.id])} className={clsx("px-3 py-1.5 text-sm border rounded flex gap-2 transition-colors", selectedRoleIds.includes(r.id) ? "bg-primary text-white border-primary" : "bg-white text-neutral-600 hover:border-primary")}>{selectedRoleIds.includes(r.id) && <Check size={14} />}{r.name}</button>))}</div></div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="relative"><Search className="absolute left-3 top-2.5 text-neutral-400" size={18} /><Input value={relationSearch} onChange={e => setRelationSearch(e.target.value)} placeholder="Szukaj ucznia..." className="pl-10" /></div>
            <div className="border rounded h-64 overflow-y-auto divide-y divide-neutral-100">{availableStudents.map(s => <div key={s.id} onClick={() => setSelectedChildIds(p => p.includes(s.id) ? p.filter(id => id !== s.id) : [...p, s.id])} className={clsx("p-3 flex justify-between cursor-pointer hover:bg-neutral-50 transition-colors", selectedChildIds.includes(s.id) && "bg-primary-light")}><div><div className={clsx("font-medium text-sm", selectedChildIds.includes(s.id) ? "text-primary" : "text-neutral-700")}>{s.lastName} {s.firstName}</div><div className="text-xs text-neutral-500">{s.email}</div></div>{selectedChildIds.includes(s.id) && <Check size={16} className="text-primary" />}</div>)}</div>
            <div className="text-xs text-neutral-500 mt-2">Zaznaczono: {selectedChildIds.length}</div>
          </div>
        )}
      </div>
      <div className="flex justify-end gap-3 px-6 py-4 border-t bg-neutral-50 mt-auto"><Button variant="secondary" onClick={() => setViewMode('list')}>Anuluj</Button><Button onClick={handleSave}>Zapisz</Button></div>
    </div>
  );

  const renderUsersTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse font-sans">
        <thead>
          <tr className="text-xs text-neutral-500 border-b bg-neutral-50 uppercase">
            <th className="px-4 py-3">Użytkownik</th>
            <th className="px-4 py-3">Telefon</th>
            <th className="px-4 py-3">Adres</th>
            <th className="px-4 py-3">Rola</th>
            <th className="px-4 py-3">Utworzono</th>
            <th className="px-4 py-3">Edytowano</th>
            <th className="px-4 py-3 text-right">Akcje</th>
          </tr>
        </thead>
        <tbody className="text-sm divide-y divide-neutral-100">{!data.users.length ? <tr><td colSpan={7} className="p-8 text-center text-neutral-400">Brak danych</td></tr> : data.users.map(u => (
          <tr key={u.id} className={clsx("hover:bg-neutral-50 transition-colors", !u.isActive && "bg-neutral-50/50 grayscale opacity-75")}>
            <td className="px-4 py-2"><div className="font-medium text-neutral-900">{formatName(u)}</div><div className="text-xs text-neutral-500">{u.email}</div></td>
            <td className="px-4 py-2 text-neutral-600">{u.phone || '-'}</td>
            <td className="px-4 py-2 text-xs text-neutral-600">{u.postalCode || u.city ? <div>{u.postalCode} {u.city}</div> : null}{u.street && <div className="text-neutral-400">{u.street}</div>}{!u.city && !u.postalCode && !u.street && '-'}</td>
            <td className="px-4 py-2"><div className="flex gap-1 flex-wrap">{u.userRoles?.map(r => <span key={r.id} className="bg-primary-light text-primary text-xs px-2 py-0.5 rounded border border-primary-light">{r.role?.name}</span>)}</div></td>
            <td className="px-4 py-2 text-neutral-500 text-xs whitespace-nowrap">{formatDate(u.createdAt)}</td>
            <td className="px-4 py-2 text-neutral-500 text-xs whitespace-nowrap">{formatDate(u.updatedAt)}</td>
            <td className="px-4 py-2 text-right">{u.isActive ? <div className="flex justify-end gap-1"><button onClick={() => openForm(u)} className="p-1.5 text-primary hover:bg-neutral-100 rounded transition-colors"><Edit2 size={16} /></button><button onClick={() => handleAction(() => api.users.delete(u.id), "Usunąć?")} className="p-1.5 text-danger hover:bg-neutral-100 rounded transition-colors"><Trash2 size={16} /></button></div> : <button onClick={() => handleAction(() => api.users.update(u.id, { ...u, isActive: true, lastName: u.lastName.replace(' (nieaktywny)', ''), roleIds: u.userRoles.map(r => r.roleId) } as any), "Przywrócić?")} className="p-1.5 text-success hover:bg-success-light rounded ml-auto block transition-colors"><RefreshCcw size={16} /></button>}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );

  const renderRelationsTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse font-sans">
        <thead><tr className="text-xs text-neutral-500 border-b bg-white uppercase"><th className="px-6 py-3 w-1/3">Rodzic</th><th className="px-6 py-3 w-1/3">{filters.onlyUnassignedParents ? 'Status' : 'Uczeń'}</th><th className="px-4 py-3">Utworzono</th><th className="px-4 py-3">Edytowano</th><th className="px-6 py-3 text-right">Akcje</th></tr></thead>
        <tbody className="text-sm divide-y divide-neutral-100">
          {filters.onlyUnassignedParents ? data.users.map(p => (
            <tr key={p.id} className="hover:bg-neutral-50 bg-danger-light/30 transition-colors">
              <td className="px-6 py-3">
                <div className="font-medium text-neutral-900">{formatName(p)}</div>
                <div className="text-xs text-neutral-500 font-normal">{p.email}</div>
              </td>
              <td className="px-6 py-3 italic text-neutral-500">Brak dzieci</td><td>-</td><td>-</td>
              <td className="px-6 py-3 text-right"><button onClick={() => openForm(p, 'relations')} className="text-primary hover:bg-primary-light px-3 py-1 rounded text-xs flex items-center gap-1 ml-auto transition-colors"><UserPlus size={14} /> Przypisz</button></td>
            </tr>
          )) : processedRelations.map(r => (
            <tr key={r.id} className="hover:bg-neutral-50 transition-colors">
              <td className="px-6 py-3">
                <div className="font-medium text-neutral-900">{r.displayParentName}</div>
                <div className="text-xs text-neutral-500 font-normal">{r.parentEmail}</div>
              </td>
              <td className="px-6 py-3">
                <div className="font-medium text-neutral-900">{r.displayStudentName}</div>
              </td>
              <td className="px-4 py-3 text-xs text-neutral-500">{formatDate(r.createdAt)}</td><td className="px-4 py-3 text-xs text-neutral-500">{formatDate(r.updatedAt)}</td>
              <td className="px-6 py-3 text-right flex justify-end gap-2"><button onClick={() => { const p = data.users.find(u => u.id === r.parentId); if (p) openForm(p, 'relations'); }} className="text-primary hover:bg-primary-light px-2 py-1 rounded transition-colors"><Edit2 size={14} /></button><button onClick={() => handleAction(() => api.parentStudents.delete(r.id), "Usunąć?")} className="text-danger hover:bg-danger-light px-2 py-1 rounded transition-colors"><Trash2 size={14} /></button></td></tr>
          ))}
          {!((filters.onlyUnassignedParents ? data.users : processedRelations).length) && <tr><td colSpan={5} className="p-8 text-center text-neutral-400">Brak danych</td></tr>}
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
          <button onClick={() => setMainTab('relations')} className={clsx("py-4 text-sm font-bold uppercase border-b-2 flex gap-2 transition-colors", mainTab === 'relations' ? "border-primary text-primary" : "border-transparent text-neutral-500 hover:text-neutral-700")}><LinkIcon size={18} /> Powiązania</button>
        </div>
        {mainTab === 'users' && <div className="py-3"><Button onClick={() => openForm()}><Plus size={16} className="mr-2" /> Dodaj</Button></div>}
      </div>

      <div className="flex items-center justify-between gap-4 p-4 border-b bg-white">
        <SortFilterToolbar
          className="flex-1"
          search={filters.search} onSearchChange={v => setFilters(p => ({ ...p, search: v }))}
          sortBy={filters.sortBy} sortDesc={filters.sortDesc} onSortChange={f => setFilters(p => ({ ...p, sortBy: f, sortDesc: p.sortBy === f ? !p.sortDesc : false }))}
          showInactive={mainTab === 'users' ? filters.showInactive : undefined}
          onToggleInactive={mainTab === 'users' ? () => { setLoading(true); setFilters(p => ({ ...p, showInactive: !p.showInactive })); } : undefined}
          sortOptions={mainTab === 'users' ? [{ field: 'lastName', label: 'Nazwisko' }, { field: 'email', label: 'Email' }, { field: 'role', label: 'Rola' }, { field: 'created', label: 'Utworzono' }, { field: 'updated', label: 'Edytowano' }] : [{ field: 'parentName', label: 'Rodzic' }, !filters.onlyUnassignedParents ? { field: 'studentName', label: 'Uczeń' } : null].filter(Boolean) as any}
          hideCreate={true}
        />
        {mainTab === 'relations' && (
          <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer whitespace-nowrap">
            <input type="checkbox" checked={filters.onlyUnassignedParents} onChange={e => { setLoading(true); setFilters(p => ({ ...p, onlyUnassignedParents: e.target.checked })); }} className="rounded border-neutral-300 text-primary focus:ring-primary" /> Pokaż bez powiązań
          </label>
        )}
      </div>

      {loading ? <div className="p-8 text-center text-neutral-500">Ładowanie...</div> : (mainTab === 'users' ? renderUsersTable() : renderRelationsTable())}
    </div>
  );
};
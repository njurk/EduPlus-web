import { useState, useEffect, useCallback } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { User, Role, ParentStudentRelation } from '../../types';
import { api } from '../../services/apiService';
import { Check, AlertCircle, Edit2, Trash2, RefreshCcw, User as UserIcon, Users as UsersIcon, Search, X, Baby, Link as LinkIcon, Plus } from 'lucide-react';
import { clsx } from 'clsx';
import { SortFilterToolbar } from '../../components/ui/SortFilterToolbar';

const PASSWORD_RULES = [
  { label: "Min. 8 znaków", test: (p: string) => p.length >= 8 },
  { label: "Min. 1 duża litera", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Min. 1 cyfra", test: (p: string) => /[0-9]/.test(p) },
  { label: "Min. 1 znak specjalny", test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

const FIELDS_CONFIG = {
  firstName: "Imię",
  lastName: "Nazwisko",
  email: "Email",
  phone: "Telefon",
  street: "Ulica i numer",
  postalCode: "Kod pocztowy",
  city: "Miasto"
};

const formatDate = (date?: string) => {
  if (!date) return '-';
  const validDate = date.endsWith('Z') ? date : date + 'Z';
  return new Date(validDate).toLocaleString('pl-PL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

const formatName = (user: { firstName: string; lastName: string } | null | undefined) => {
  if (!user) return '';
  return `${user.lastName} ${user.firstName}`;
};

export const Users = () => {
  const [mainTab, setMainTab] = useState<'users' | 'relations'>('users');
  const [data, setData] = useState<{ users: User[], roles: Role[], relations: ParentStudentRelation[] }>({ users: [], roles: [], relations: [] });
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ search: '', sortBy: 'lastName', sortDesc: false, showInactive: false });
  const [formData, setFormData] = useState<Partial<User>>({});
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [formTab, setFormTab] = useState<'details' | 'relations'>('details');
  const [selectedChildIds, setSelectedChildIds] = useState<number[]>([]);
  const [relationSearch, setRelationSearch] = useState('');

  const userSortOptions = [
    { field: 'lastName', label: 'Nazwisko' },
    { field: 'email', label: 'Email' },
    { field: 'role', label: 'Rola' },
    { field: 'created', label: 'Utworzono' },
    { field: 'updated', label: 'Edytowano' }
  ];

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [users, roles, relations] = await Promise.all([
        api.users.getAll(filters),
        api.roles.getAll(),
        api.parentStudents.getAll()
      ]);
      setData({ users, roles, relations });
    } catch {
      setErrors({ general: "Błąd pobierania danych" });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timeoutId = setTimeout(loadData, 300);
    return () => clearTimeout(timeoutId);
  }, [loadData]);

  const validateField = (name: string, value: any, isEdit: boolean) => {
    if (!value?.toString().trim() && !['password', 'phone', 'street', 'city', 'postalCode'].includes(name)) return "Pole wymagane";
    if (name === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Błędny email";
    if (name === 'password' && (!isEdit || value)) {
      if (!PASSWORD_RULES.every(r => r.test(value))) return "Hasło za słabe";
    }
    if (name === 'postalCode' && value && !/^\d{2}-\d{3}$/.test(value)) return "Format XX-XXX";
    return null;
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'phone' && !/^[0-9+\- ]*$/.test(value)) return;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: validateField(name, value, !!formData.id) }));
  };

  const openForm = (user?: User, initialTab: 'details' | 'relations' = 'details') => {
    setErrors({});
    setFormData(user ? { ...user } : { isActive: true, password: "", firstName: '', lastName: '', email: '', street: '', city: '', postalCode: '' });
    setSelectedRoleIds(user?.userRoles?.map(ur => ur.roleId) || []);

    const existingChildren = user
      ? data.relations.filter(r => r.parentId === user.id).map(r => r.studentId)
      : [];
    setSelectedChildIds(existingChildren);

    setFormTab(initialTab);
    setRelationSearch('');
    setViewMode('form');
  };

  const handleAction = async (action: () => Promise<void>, confirmMsg?: string) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    try { await action(); loadData(); } catch { alert("Wystąpił błąd operacji"); }
  };

  const toggleRole = (id: number) => setSelectedRoleIds(p => p.includes(id) ? p.filter(r => r !== id) : [...p, id]);
  const toggleChild = (id: number) => setSelectedChildIds(p => p.includes(id) ? p.filter(cid => cid !== id) : [...p, id]);

  const handleSave = async () => {
    const newErrors: Record<string, string | null> = {};
    if (!selectedRoleIds.length) newErrors.general = "Użytkownik musi mieć rolę";

    Object.keys(FIELDS_CONFIG).concat('password').forEach(f => {
      const val = formData[f as keyof User];
      if (['password', 'postalCode', 'phone', 'street', 'city'].includes(f) && !val && formData.id) return;
      const err = validateField(f, val, !!formData.id);
      if (err) newErrors[f] = err;
    });

    if (Object.keys(newErrors).length > 0) return setErrors(newErrors);

    try {
      const payload = {
        ...formData,
        password: formData.password || undefined,
        phone: formData.phone?.trim() || undefined,
        street: formData.street?.trim() || undefined,
        city: formData.city?.trim() || undefined,
        postalCode: formData.postalCode?.trim() || undefined,
        roleIds: selectedRoleIds,
        childIds: selectedChildIds
      };
      await (formData.id ? api.users.update(formData.id, payload) : api.users.create(payload));
      setViewMode('list');
      loadData();
    } catch (e: any) {
      setErrors({ general: e.message || "Błąd zapisu" });
    }
  };

  // Helper function to swap "FirstName LastName" to "LastName FirstName"
  const swapNameOrder = (fullName: string) => {
    if (!fullName) return '';
    const parts = fullName.trim().split(' ');
    if (parts.length < 2) return fullName;
    const lastName = parts.pop(); // Take the last part as surname
    return `${lastName} ${parts.join(' ')}`;
  };

  const processedRelations = data.relations
    .map(r => ({
      ...r,
      displayParentName: swapNameOrder(r.parentName),
      displayStudentName: swapNameOrder(r.studentName)
    }))
    .filter(r => {
      const s = filters.search.toLowerCase();
      return !s || r.displayParentName.toLowerCase().includes(s) || r.parentEmail.toLowerCase().includes(s) || r.displayStudentName.toLowerCase().includes(s);
    })
    .sort((a, b) => {
      const field = filters.sortBy === 'studentName' ? 'displayStudentName' : 'displayParentName';
      const valA = (a[field] || '').toLowerCase();
      const valB = (b[field] || '').toLowerCase();
      if (valA < valB) return filters.sortDesc ? 1 : -1;
      if (valA > valB) return filters.sortDesc ? -1 : 1;
      return 0;
    });

  const availableStudents = data.users.filter(u =>
    u.id !== formData.id &&
    u.userRoles?.some(r => r.role?.name.toLowerCase().includes('uczeń')) &&
    (u.lastName.toLowerCase().includes(relationSearch.toLowerCase()) ||
      u.firstName.toLowerCase().includes(relationSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(relationSearch.toLowerCase()))
  );

  if (viewMode === 'form') {
    return (
      <div className="bg-white border border-neutral-200 max-w-4xl mx-auto shadow-sm min-h-[500px] flex flex-col">
        <div className="px-6 py-4 border-b bg-neutral-50 flex justify-between">
          <h3 className="text-lg font-bold text-neutral-800">{formData.id ? 'Edycja' : 'Nowy'} użytkownik</h3>
        </div>

        <div className="flex border-b px-6 gap-6">
          <button onClick={() => setFormTab('details')} className={clsx("py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors", formTab === 'details' ? "border-primary text-primary" : "border-transparent text-neutral-500 hover:text-neutral-700")}>
            <UserIcon size={16} /> Dane podstawowe
          </button>
          <button onClick={() => setFormTab('relations')} className={clsx("py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors", formTab === 'relations' ? "border-primary text-primary" : "border-transparent text-neutral-500 hover:text-neutral-700")}>
            <UsersIcon size={16} /> Powiązania (dzieci)
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {errors.general && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded flex gap-2 text-sm"><AlertCircle size={16} />{errors.general}</div>}

          {formTab === 'details' ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {['firstName', 'lastName', 'email', 'phone'].map(field => (
                  <div key={field} className={field === 'email' ? 'md:col-span-2' : ''}>
                    <label className="label-text">
                      {FIELDS_CONFIG[field as keyof typeof FIELDS_CONFIG]}
                      {!['phone'].includes(field) && <span className="text-red-500">*</span>}
                    </label>
                    <Input name={field} value={(formData[field as keyof User] as string) || ''} onChange={handleInput} className={errors[field] ? "!border-red-500" : ""} placeholder={field === 'phone' ? 'np. 123 456 789' : ''} />
                    {errors[field] && <span className="text-xs text-red-500 mt-1 block">{errors[field]}</span>}
                  </div>
                ))}
                <div className="md:col-span-2 border-t pt-4 mt-2">
                  <h4 className="text-sm font-semibold text-neutral-600 mb-4">Adres zamieszkania</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {['street', 'postalCode', 'city'].map(field => (
                      <div key={field} className={field === 'street' ? 'md:col-span-2' : ''}>
                        <label className="label-text">{FIELDS_CONFIG[field as keyof typeof FIELDS_CONFIG]}</label>
                        <Input name={field} value={(formData[field as keyof User] as string) || ''} onChange={handleInput} className={errors[field] ? "!border-red-500" : ""} placeholder={field === 'postalCode' ? 'XX-XXX' : ''} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2 border-t pt-4 mt-2">
                  <label className="label-text">Hasło {!formData.id && <span className="text-red-500">*</span>}</label>
                  <Input name="password" type="password" value={formData.password || ''} onChange={handleInput} placeholder={formData.id ? "********" : "Hasło"} className={errors.password ? "!border-red-500" : ""} />
                  {(!formData.id || !!formData.password) && <div className="mt-3 p-3 bg-neutral-50 rounded border border-neutral-100"><ul className="space-y-1">{PASSWORD_RULES.map((r, i) => <li key={i} className={clsx("text-xs flex gap-2", r.test(formData.password || "") ? "text-green-600 font-medium" : "text-neutral-400")}>{r.test(formData.password || "") ? <Check size={12} strokeWidth={3} /> : <div className="w-3 h-3 rounded-full border border-neutral-300" />}{r.label}</li>)}</ul></div>}
                  {errors.password && <span className="text-xs text-red-500 mt-1 block">{errors.password}</span>}
                </div>
              </div>
              <div className="mb-4 border-t pt-4">
                <label className="label-text mb-2 block">Rola <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-2">
                  {data.roles.map(r => (
                    <button key={r.id} onClick={() => toggleRole(r.id)} className={clsx("px-3 py-1.5 text-sm border flex items-center gap-2 rounded transition-all", selectedRoleIds.includes(r.id) ? "bg-primary text-white border-primary" : "bg-white text-neutral-600 hover:border-primary")}>
                      {selectedRoleIds.includes(r.id) && <Check size={14} />}{r.name}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-neutral-500">Wyszukaj i zaznacz uczniów, których chcesz przypisać do tego rodzica.</p>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-neutral-400" size={18} />
                <Input value={relationSearch} onChange={(e) => setRelationSearch(e.target.value)} placeholder="Szukaj ucznia..." className="pl-10" />
              </div>
              <div className="border rounded-md h-64 overflow-y-auto divide-y">
                {availableStudents.length === 0 ? <div className="p-4 text-center text-sm text-neutral-400">Brak wyników</div> :
                  availableStudents.map(student => {
                    const isSelected = selectedChildIds.includes(student.id);
                    return (
                      <div key={student.id} onClick={() => toggleChild(student.id)} className={clsx("p-3 flex items-center justify-between cursor-pointer hover:bg-neutral-50 transition-colors", isSelected && "bg-blue-50")}>
                        <div>
                          <div className={clsx("font-medium text-sm", isSelected ? "text-primary" : "text-neutral-700")}>{student.lastName} {student.firstName}</div>
                          <div className="text-xs text-neutral-500">{student.email}</div>
                        </div>
                        {isSelected && <Check size={16} className="text-primary" />}
                      </div>
                    );
                  })}
              </div>
              <div className="text-xs text-neutral-500 mt-2">Zaznaczono: {selectedChildIds.length}</div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-neutral-50 mt-auto">
          <Button variant="secondary" onClick={() => setViewMode('list')}>Anuluj</Button>
          <Button onClick={handleSave}>Zapisz</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-neutral-200 shadow-sm">
      <div className="border-b px-4 flex justify-between items-end">
        <div className="flex gap-6">
          <button onClick={() => setMainTab('users')} className={clsx("py-4 text-sm font-bold uppercase border-b-2 transition-colors flex items-center gap-2", mainTab === 'users' ? "border-primary text-primary" : "border-transparent text-neutral-500 hover:text-neutral-700")}>
            <UsersIcon size={18} /> Użytkownicy
          </button>
          <button onClick={() => setMainTab('relations')} className={clsx("py-4 text-sm font-bold uppercase border-b-2 transition-colors flex items-center gap-2", mainTab === 'relations' ? "border-primary text-primary" : "border-transparent text-neutral-500 hover:text-neutral-700")}>
            <LinkIcon size={18} /> Powiązania
          </button>
        </div>
        {mainTab === 'users' && (
          <div className="py-3"><Button onClick={() => openForm()}><Plus size={16} className="mr-2" /> Dodaj</Button></div>
        )}
      </div>

      {mainTab === 'users' ? (
        <>
          <SortFilterToolbar
            search={filters.search}
            onSearchChange={(val) => setFilters(prev => ({ ...prev, search: val }))}
            showInactive={filters.showInactive}
            onToggleInactive={() => setFilters(prev => ({ ...prev, showInactive: !prev.showInactive }))}
            sortBy={filters.sortBy}
            sortDesc={filters.sortDesc}
            onSortChange={(field) => setFilters(prev => ({ ...prev, sortBy: field, sortDesc: prev.sortBy === field ? !prev.sortDesc : false }))}
            sortOptions={userSortOptions}
          />
          {loading ? <div className="p-8 text-center text-neutral-500">Ładowanie...</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs text-neutral-500 border-b bg-neutral-50 uppercase">
                    <th className="px-4 py-3">Nazwisko i Imię</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Telefon</th>
                    <th className="px-4 py-3">Adres</th>
                    <th className="px-4 py-3">Rola</th>
                    <th className="px-4 py-3">Utworzono</th>
                    <th className="px-4 py-3">Edytowano</th>
                    <th className="px-4 py-3 text-right">Akcje</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-neutral-100">
                  {!data.users.length ? <tr><td colSpan={8} className="px-4 py-8 text-center text-neutral-400">Brak danych</td></tr> : data.users.map(user => (
                    <tr key={user.id} className={clsx("hover:bg-neutral-50", !user.isActive && "bg-neutral-50/50 grayscale text-neutral-400")}>
                      <td className="px-4 py-2 font-medium text-neutral-900">{formatName(user)}</td>
                      <td className="px-4 py-2 text-neutral-600">{user.email}</td>
                      <td className="px-4 py-2 text-neutral-600">{user.phone || '-'}</td>
                      <td className="px-4 py-2 text-neutral-600 text-xs">
                        {user.street && <div>{user.street}</div>}
                        {(user.city || user.postalCode) && <div>{user.postalCode} {user.city}</div>}
                        {!user.street && !user.city && '-'}
                      </td>
                      <td className="px-4 py-2"><div className="flex gap-1 flex-wrap">{user.userRoles?.map(ur => <span key={ur.id} className="bg-primary-light text-primary-text text-xs px-2 py-0.5 rounded border border-primary-light/50">{ur.role?.name}</span>)}</div></td>
                      <td className="px-4 py-2 text-neutral-500 text-xs whitespace-nowrap">{formatDate(user.createdAt)}</td>
                      <td className="px-4 py-2 text-neutral-500 text-xs whitespace-nowrap">{formatDate(user.updatedAt)}</td>
                      <td className="px-4 py-2 text-right">
                        {user.isActive ? (
                          <div className="flex justify-end gap-1">
                            <button onClick={() => openForm(user)} className="p-1.5 text-primary hover:bg-neutral-100 rounded" title="Edytuj"><Edit2 size={16} /></button>
                            <button onClick={() => handleAction(() => api.users.delete(user.id), "Usunąć?")} className="p-1.5 text-danger hover:bg-neutral-100 rounded" title="Usuń"><Trash2 size={16} /></button>
                          </div>
                        ) : (
                          <button onClick={() => handleAction(() => api.users.update(user.id, { ...user, isActive: true, roleIds: user.userRoles.map(r => r.roleId), phone: user.phone?.trim() || undefined } as any), "Przywrócić?")} className="p-1.5 text-green-600 hover:bg-green-50 rounded ml-auto block" title="Przywróć"><RefreshCcw size={16} /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <div className="p-0">
          <SortFilterToolbar
            search={filters.search}
            onSearchChange={(val) => setFilters(prev => ({ ...prev, search: val }))}
            sortBy={filters.sortBy}
            sortDesc={filters.sortDesc}
            onSortChange={(field) => setFilters(prev => ({ ...prev, sortBy: field, sortDesc: prev.sortBy === field ? !prev.sortDesc : false }))}
            sortOptions={[
              { field: 'parentName', label: 'Rodzic' },
              { field: 'studentName', label: 'Uczeń' }
            ]}
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs text-neutral-500 border-b bg-white uppercase">
                  <th className="px-6 py-3 w-1/3">Rodzic</th>
                  <th className="px-6 py-3 w-1/3">Uczeń</th>
                  <th className="px-6 py-3 text-right">Akcje</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-neutral-100">
                {processedRelations.map(rel => (
                  <tr key={rel.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"><UserIcon size={16} /></div>
                        <div>
                          <div className="font-medium text-neutral-900">{rel.displayParentName}</div>
                          <div className="text-xs text-neutral-500">{rel.parentEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0"><Baby size={16} /></div>
                        <div>
                          <div className="font-medium text-neutral-900">{rel.displayStudentName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            const parentUser = data.users.find(u => u.id === rel.parentId);
                            if (parentUser) openForm(parentUser, 'relations');
                          }}
                          className="text-primary hover:bg-primary/10 px-3 py-1.5 rounded text-xs font-medium border border-transparent transition-all flex items-center gap-1"
                        >
                          <Edit2 size={12} /> Edytuj
                        </button>
                        <button
                          onClick={() => handleAction(() => api.parentStudents.delete(rel.id), "Usunąć powiązanie?")}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1.5 rounded text-xs font-medium border border-transparent hover:border-red-200 transition-all flex items-center gap-1"
                        >
                          <Trash2 size={12} /> Usuń
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!processedRelations.length && <tr><td colSpan={3} className="p-8 text-center text-neutral-400">Brak zdefiniowanych relacji</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
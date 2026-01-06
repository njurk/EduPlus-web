import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { TrashButton } from '../components/ui/TrashButton';
import { SearchBar } from '../components/ui/SearchBar';
import { api } from '../services/apiService'; 
import { Edit2, Trash2, Plus, School, Clock, GraduationCap, CalendarCheck, BookOpen, RefreshCcw, RotateCcw, Tag } from 'lucide-react';
import { clsx } from 'clsx';

type BaseEntity = { id: number; isActive: boolean; createdAt: string; updatedAt: string; [key: string]: any };

interface GradeType extends BaseEntity { numeric: string; value: number; name: string; }
interface GradeCategory extends BaseEntity { name: string; weight: number; }
interface LessonHour extends BaseEntity { orderNumber: number; startTime: string; endTime: string; }
interface AttendanceType extends BaseEntity { shortCode: string; }

const TABS = [
    { id: 'classrooms', label: 'Sale', icon: School },
    { id: 'time', label: 'Lekcje', icon: Clock },
    { id: 'gradeTypes', label: 'Skala Ocen', icon: GraduationCap },
    { id: 'gradeCategories', label: 'Kategorie Ocen', icon: Tag },
    { id: 'attendance', label: 'Frekwencja', icon: CalendarCheck },
    { id: 'subjects', label: 'Przedmioty', icon: BookOpen },
] as const;

export const SystemConfig = () => {
    const [activeTab, setActiveTab] = useState<typeof TABS[number]['id']>('classrooms');
    const [timeSubTab, setTimeSubTab] = useState<'hours' | 'statuses'>('hours');
    const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
    const [showTrash, setShowTrash] = useState(false);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [formData, setFormData] = useState<Partial<BaseEntity>>({});
    const [errors, setErrors] = useState<Record<string, string | null>>({});
    const [search, setSearch] = useState('');

    const getCurrentApi = useCallback(() => {
        switch (activeTab) {
            case 'classrooms': return api.classrooms;
            case 'gradeTypes': return api.gradeTypes;
            case 'gradeCategories': return api.gradeCategories;
            case 'attendance': return api.attendanceTypes;
            case 'subjects': return api.subjects;
            case 'time': return timeSubTab === 'hours' ? api.lessonHours : api.lessonStatuses;
            default: return api.classrooms;
        }
    }, [activeTab, timeSubTab]);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getCurrentApi().getAll();
            setData(result || []);
        } catch (err) { console.error(err); } 
        finally { setLoading(false); }
    }, [getCurrentApi]);

    useEffect(() => {
        loadData();
        setViewMode('list');
        setSearch('');
        setShowTrash(false);
    }, [loadData, activeTab]);

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        if (value && errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        const isHour = activeTab === 'time' && timeSubTab === 'hours';
        
        if (!isHour && !formData.name) newErrors.name = "Nazwa jest wymagana";
        
        if (activeTab === 'gradeTypes') {
            if (!(formData as GradeType).numeric) newErrors.numeric = "Symbol jest wymagany";
            if (!(formData as GradeType).value) newErrors.value = "Wartość jest wymagana";
        }

        if (activeTab === 'gradeCategories') {
             if (!(formData as GradeCategory).weight) newErrors.weight = "Waga jest wymagana";
        }

        if (activeTab === 'attendance' && !(formData as AttendanceType).shortCode) newErrors.shortCode = "Skrót jest wymagany";
        
        if (isHour) {
            const h = formData as LessonHour;
            if (!h.startTime) newErrors.startTime = "Start jest wymagany";
            if (!h.endTime) newErrors.endTime = "Koniec jest wymagany";
            if (!h.orderNumber) newErrors.orderNumber = "Numer jest wymagany";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        try {
            const resource = getCurrentApi();
            formData.id ? await resource.update(formData.id, formData) : await resource.create(formData);
            loadData();
            setViewMode('list');
        } catch { alert("Błąd zapisu"); }
    };

    const handleStatusChange = async (item: BaseEntity, isActive: boolean) => {
        if (!window.confirm(isActive ? "Przywrócić element?" : "Przenieść do kosza?")) return;
        try {
            await getCurrentApi().update(item.id, { ...item, isActive });
            loadData();
        } catch { alert("Błąd zmiany statusu"); }
    };

    const handleHardDelete = async (id: number) => {
        if (!window.confirm("Usunąć trwale?")) return;
        try { await getCurrentApi().delete(id); loadData(); } catch { alert("Błąd usuwania"); }
    };

    const openForm = (item?: any) => {
        setErrors({});
        setFormData(item ? { ...item } : { 
            isActive: true, 
            orderNumber: (activeTab === 'time' && timeSubTab === 'hours') ? (data.length + 1) : undefined 
        });
        setViewMode('form');
    };

    const filteredData = useMemo(() => data.filter(item => {
        if (item.isActive !== !showTrash) return false;
        const s = search.toLowerCase();
        return !s || [item.name, item.shortCode, item.numeric].some(val => val?.toString().toLowerCase().includes(s));
    }), [data, search, showTrash]);

    const renderForm = () => (
        <div className="bg-white border border-neutral-200 max-w-2xl mx-auto shadow-sm flex flex-col font-sans mt-6 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b bg-neutral-50 font-bold text-neutral-800">{formData.id ? 'Edycja' : 'Nowy'} element</div>
            <div className="p-6 space-y-4">
                
                {!(activeTab === 'time' && timeSubTab === 'hours') && (
                    <div>
                        <label className="label-text">
                            {activeTab === 'gradeTypes' ? 'Nazwa opisowa' : 'Nazwa'} <span className="text-danger">*</span>
                        </label>
                        <Input name="name" value={formData.name || ''} onChange={handleInput} className={errors.name ? "!border-danger" : ""} />
                        
                        <span className="text-xs text-neutral-500 block mt-1">
                            {activeTab === 'gradeTypes' && 'np. Dobry plus'}
                            {activeTab === 'gradeCategories' && 'np. Sprawdzian'}
                            {activeTab === 'classrooms' && 'np. 102'}
                            {activeTab === 'subjects' && 'np. Matematyka'}
                            {activeTab === 'time' && timeSubTab === 'statuses' && 'np. Odwołana'}
                        </span>
                        
                        {errors.name && <span className="text-xs text-danger">{errors.name}</span>}
                    </div>
                )}

                {activeTab === 'gradeTypes' && (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label-text">Symbol <span className="text-danger">*</span></label>
                            <Input name="numeric" value={(formData as GradeType).numeric || ''} onChange={handleInput} className={errors.numeric ? "!border-danger" : ""} />
                            <span className="text-xs text-neutral-500 block mt-1">np. 4+</span>
                            {errors.numeric && <span className="text-xs text-danger">{errors.numeric}</span>}
                        </div>
                        <div>
                            <label className="label-text">Wartość <span className="text-danger">*</span></label>
                            <Input type="number" step="0.25" name="value" value={(formData as GradeType).value || ''} onChange={handleInput} className={errors.value ? "!border-danger" : ""} />
                            <span className="text-xs text-neutral-500 block mt-1">np. 4.5</span>
                            {errors.value && <div className="text-xs text-danger">{errors.value}</div>}
                        </div>
                    </div>
                )}

                {activeTab === 'gradeCategories' && (
                    <div>
                        <label className="label-text">Waga <span className="text-danger">*</span></label>
                        <Input type="number" step="1" min="0" name="weight" value={(formData as GradeCategory).weight || ''} onChange={handleInput} className={errors.weight ? "!border-danger" : ""} />
                        <span className="text-xs text-neutral-500 block mt-1">np. 3</span>
                        {errors.weight && <div className="text-xs text-danger">{errors.weight}</div>}
                    </div>
                )}

                {activeTab === 'attendance' && (
                    <div>
                        <label className="label-text">Skrót <span className="text-danger">*</span></label>
                        <Input name="shortCode" maxLength={5} value={(formData as AttendanceType).shortCode || ''} onChange={handleInput} />
                        <span className="text-xs text-neutral-500 block mt-1">np. NB</span>
                        {errors.shortCode && <span className="text-xs text-danger">{errors.shortCode}</span>}
                    </div>
                )}

                {activeTab === 'time' && timeSubTab === 'hours' && (
                    <div className="space-y-4">
                        <div>
                            <label className="label-text">Numer lekcji <span className="text-danger">*</span></label>
                            <Input type="number" name="orderNumber" value={(formData as LessonHour).orderNumber || ''} onChange={handleInput} />
                            <span className="text-xs text-neutral-500 block mt-1">Kolejność w planie</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label-text">Start <span className="text-danger">*</span></label>
                                <Input type="time" name="startTime" value={(formData as LessonHour).startTime || ''} onChange={handleInput} />
                            </div>
                            <div>
                                <label className="label-text">Koniec <span className="text-danger">*</span></label>
                                <Input type="time" name="endTime" value={(formData as LessonHour).endTime || ''} onChange={handleInput} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-neutral-50">
                <Button variant="secondary" onClick={() => setViewMode('list')}>Anuluj</Button>
                <Button onClick={handleSave}>Zapisz</Button>
            </div>
        </div>
    );

    return (
        <div className="bg-white border border-neutral-200 shadow-sm font-sans min-h-[600px] flex flex-col">
            <div className="border-b px-4 flex gap-1 bg-neutral-50/50 overflow-x-auto">
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={clsx("py-4 px-4 text-sm font-bold uppercase border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap",
                            activeTab === tab.id ? "border-primary text-primary bg-white" : "border-transparent text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100/50")}>
                            <Icon size={18} /> {tab.label}
                        </button>
                    )
                })}
            </div>

            {viewMode === 'list' && (
                <div className="flex items-center justify-between gap-4 p-4 border-b bg-white">
                    <div className="flex-1 flex items-center gap-4">
                        <SearchBar value={search} onChange={setSearch} className="w-64" />
                        
                        {activeTab === 'time' && (
                            <div className="flex bg-neutral-100 p-1 rounded-lg border border-neutral-200">
                                <button onClick={() => setTimeSubTab('hours')} className={clsx("px-3 py-1 text-xs font-medium rounded-md transition-all", timeSubTab === 'hours' ? "bg-white shadow text-neutral-900" : "text-neutral-500 hover:text-neutral-700")}>Godziny</button>
                                <button onClick={() => setTimeSubTab('statuses')} className={clsx("px-3 py-1 text-xs font-medium rounded-md transition-all", timeSubTab === 'statuses' ? "bg-white shadow text-neutral-900" : "text-neutral-500 hover:text-neutral-700")}>Statusy</button>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <TrashButton isTrashActive={showTrash} onToggle={() => setShowTrash(!showTrash)} />
                        {!showTrash && <Button onClick={() => openForm()}><Plus size={16} className="mr-2" /> Dodaj</Button>}
                    </div>
                </div>
            )}

            <div className="flex-1 bg-white">
                {loading ? (
                    <div className="p-12 text-center text-neutral-400 flex flex-col items-center gap-2"><RefreshCcw className="animate-spin" size={24} /> Ładowanie...</div>
                ) : viewMode === 'form' ? renderForm() : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse font-sans">
                            <thead>
                                <tr className="text-xs text-neutral-500 border-b bg-neutral-50 uppercase">
                                    {activeTab === 'time' && timeSubTab === 'hours' ? <><th className="px-4 py-3 w-16 text-center">Nr</th><th className="px-4 py-3">Godziny</th></> : 
                                     activeTab === 'gradeTypes' ? <><th className="px-4 py-3">Symbol</th><th className="px-4 py-3">Nazwa</th></> :
                                     <th className="px-4 py-3 w-1/3">Nazwa</th>}
                                    
                                    {activeTab === 'gradeTypes' && <th className="px-4 py-3">Wartość</th>}
                                    {activeTab === 'gradeCategories' && <th className="px-4 py-3">Waga</th>}
                                    {activeTab === 'attendance' && <th className="px-4 py-3">Skrót</th>}
                                    
                                    <th className="px-4 py-3 text-right">Akcje</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-neutral-100">
                                {!filteredData.length ? <tr><td colSpan={6} className="p-8 text-center text-neutral-400">Brak danych</td></tr> : filteredData.map(item => (
                                    <tr key={item.id} className="hover:bg-neutral-50 transition-colors">
                                        
                                        {activeTab === 'time' && timeSubTab === 'hours' ? 
                                            <><td className="px-4 py-3 text-center text-neutral-900">{item.orderNumber}</td><td className="px-4 py-3 text-neutral-900">{item.startTime?.slice(0, 5)} - {item.endTime?.slice(0, 5)}</td></> : 
                                            activeTab === 'gradeTypes' ? 
                                            <><td className="px-4 py-3 text-neutral-900">{item.numeric}</td><td className="px-4 py-3 text-neutral-900">{item.name}</td></> :
                                            <td className="px-4 py-3 text-neutral-900">{item.name}</td>
                                        }

                                        {activeTab === 'gradeTypes' && <td className="px-4 py-3 text-neutral-900">{Number(item.value || 0).toFixed(2)}</td>}
                                        {activeTab === 'gradeCategories' && <td className="px-4 py-3 text-neutral-900">{item.weight}</td>}
                                        {activeTab === 'attendance' && <td className="px-4 py-3 text-neutral-900 font-mono">{item.shortCode}</td>}
                                        
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-1">
                                                {showTrash ? (
                                                    <>
                                                        <button onClick={() => handleStatusChange(item, true)} title="Przywróć" className="p-1.5 text-success hover:bg-success-light rounded transition-colors"><RotateCcw size={16} /></button>
                                                        <button onClick={() => handleHardDelete(item.id)} title="Usuń trwale" className="p-1.5 text-danger hover:bg-danger-light rounded transition-colors"><Trash2 size={16} /></button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button onClick={() => openForm(item)} className="p-1.5 text-primary hover:bg-primary-light rounded transition-colors"><Edit2 size={16} /></button>
                                                        <button onClick={() => handleStatusChange(item, false)} title="Przenieś do kosza" className="p-1.5 text-neutral-400 hover:text-danger hover:bg-danger-light rounded transition-colors"><Trash2 size={16} /></button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
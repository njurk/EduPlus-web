import { useState, useEffect, useCallback } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { SortFilterToolbar } from '../../components/ui/SortFilterToolbar'; // Zakładam, że istnieje, jak w Users
import { api } from '../../services/apiService'; // Twoje API
import {
    Edit2, Trash2, Plus,
    School, Clock, GraduationCap,
    CalendarCheck, BookOpen,
    AlertCircle, Check, RefreshCcw
} from 'lucide-react';
import { clsx } from 'clsx';

// --- Typy danych (odpowiadające C#) ---
type BaseEntity = { id: number; isActive: boolean; createdAt: string; updatedAt: string;[key: string]: any };

interface Classroom extends BaseEntity { name: string; }
interface LessonHour extends BaseEntity { orderNumber: number; startTime: string; endTime: string; }
interface LessonStatus extends BaseEntity { name: string; }
interface GradeType extends BaseEntity { name: string; numeric: string; value: number; }
interface AttendanceType extends BaseEntity { name: string; shortCode: string; }
interface Subject extends BaseEntity { name: string; }

const TABS = [
    { id: 'classrooms', label: 'Sale', icon: School },
    { id: 'time', label: 'Czas', icon: Clock },
    { id: 'grading', label: 'Ocenianie', icon: GraduationCap },
    { id: 'attendance', label: 'Frekwencja', icon: CalendarCheck },
    { id: 'subjects', label: 'Przedmioty', icon: BookOpen },
] as const;

type TabId = typeof TABS[number]['id'];

export const SystemConfig = () => {
    // Stan widoku
    const [activeTab, setActiveTab] = useState<TabId>('classrooms');
    const [timeSubTab, setTimeSubTab] = useState<'hours' | 'statuses'>('hours'); // Specjalne dla zakładki Czas
    const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
    const [loading, setLoading] = useState(false);

    // Dane i Formularz
    const [data, setData] = useState<any[]>([]);
    const [formData, setFormData] = useState<Partial<BaseEntity>>({});
    const [errors, setErrors] = useState<Record<string, string | null>>({});

    // Filtry (uproszczone względem Users, zazwyczaj słowniki są małe)
    const [search, setSearch] = useState('');

    // --- Pobieranie danych ---
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            let result = [];
            // Tutaj podepnij swoje endpointy API
            switch (activeTab) {
                case 'classrooms': result = await api.classrooms.getAll(); break;
                case 'time':
                    result = timeSubTab === 'hours'
                        ? await api.lessonHours.getAll()
                        : await api.lessonStatuses.getAll();
                    break;
                case 'grading': result = await api.gradeTypes.getAll(); break;
                case 'attendance': result = await api.attendanceTypes.getAll(); break;
                case 'subjects': result = await api.subjects.getAll(); break;
            }
            setData(result || []);
        } catch (err) {
            console.error(err);
            alert("Błąd pobierania danych");
        } finally {
            setLoading(false);
        }
    }, [activeTab, timeSubTab]);

    useEffect(() => {
        loadData();
        setViewMode('list'); // Reset do listy przy zmianie zakładki
        setSearch('');
    }, [loadData]);

    // --- Obsługa Formularza ---
    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        // Prosta walidacja "on change"
        if (value && errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (activeTab !== 'time' || timeSubTab === 'statuses') {
            if (!formData.name) newErrors.name = "Nazwa jest wymagana";
        }

        if (activeTab === 'grading') {
            if (!(formData as GradeType).numeric) newErrors.numeric = "Symbol jest wymagany";
            if (!(formData as GradeType).value) newErrors.value = "Wartość jest wymagana";
        }

        if (activeTab === 'attendance') {
            if (!(formData as AttendanceType).shortCode) newErrors.shortCode = "Skrót jest wymagany";
        }

        if (activeTab === 'time' && timeSubTab === 'hours') {
            const h = formData as LessonHour;
            if (!h.startTime) newErrors.startTime = "Start jest wymagany";
            if (!h.endTime) newErrors.endTime = "Koniec jest wymagany";
            if (!h.orderNumber) newErrors.orderNumber = "Numer lekcji wymagany";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        try {
            // Wybór odpowiedniej metody API
            let apiResource: any;
            switch (activeTab) {
                case 'classrooms': apiResource = api.classrooms; break;
                case 'time': apiResource = timeSubTab === 'hours' ? api.lessonHours : api.lessonStatuses; break;
                case 'grading': apiResource = api.gradeTypes; break;
                case 'attendance': apiResource = api.attendanceTypes; break;
                case 'subjects': apiResource = api.subjects; break;
            }

            if (formData.id) {
                await apiResource.update(formData.id, formData);
            } else {
                await apiResource.create(formData);
            }
            loadData();
            setViewMode('list');
        } catch (e) {
            alert("Błąd zapisu");
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Czy na pewno usunąć?")) return;
        try {
            let apiResource: any;
            switch (activeTab) {
                case 'classrooms': apiResource = api.classrooms; break;
                case 'time': apiResource = timeSubTab === 'hours' ? api.lessonHours : api.lessonStatuses; break;
                case 'grading': apiResource = api.gradeTypes; break;
                case 'attendance': apiResource = api.attendanceTypes; break;
                case 'subjects': apiResource = api.subjects; break;
            }
            await apiResource.delete(id);
            loadData();
        } catch { alert("Błąd usuwania"); }
    };

    const openForm = (item?: any) => {
        setErrors({});
        if (item) {
            setFormData({ ...item });
        } else {
            // Domyślne wartości dla nowych
            const defaults: any = { isActive: true };
            if (activeTab === 'time' && timeSubTab === 'hours') {
                defaults.orderNumber = (data.length || 0) + 1;
            }
            setFormData(defaults);
        }
        setViewMode('form');
    };

    // --- Renderowanie Tabeli ---
    const filteredData = data.filter(item => {
        const s = search.toLowerCase();
        // Proste szukanie po nazwie lub innych polach tekstowych
        return (item.name?.toLowerCase().includes(s)) ||
            (item.shortCode?.toLowerCase().includes(s)) ||
            (item.numeric?.toLowerCase().includes(s)) ||
            (!s);
    });

    const renderTableContent = () => {
        // Wspólne nagłówki
        const ActionHeader = () => <th className="px-4 py-3 text-right">Akcje</th>;
        const StatusHeader = () => <th className="px-4 py-3 text-center">Status</th>;

        // Renderowanie wierszy zależne od zakładki
        return (
            <table className="w-full text-left border-collapse font-sans">
                <thead>
                    <tr className="text-xs text-neutral-500 border-b bg-neutral-50 uppercase">
                        {activeTab === 'time' && timeSubTab === 'hours' ? (
                            <>
                                <th className="px-4 py-3 w-16 text-center">Nr</th>
                                <th className="px-4 py-3">Godziny</th>
                            </>
                        ) : (
                            <th className="px-4 py-3 w-1/3">Nazwa</th>
                        )}

                        {/* Specyficzne kolumny */}
                        {activeTab === 'grading' && <><th className="px-4 py-3">Symbol</th><th className="px-4 py-3">Waga/Wartość</th></>}
                        {activeTab === 'attendance' && <th className="px-4 py-3">Skrót</th>}

                        <StatusHeader />
                        <ActionHeader />
                    </tr>
                </thead>
                <tbody className="text-sm divide-y divide-neutral-100">
                    {filteredData.length === 0 ? (
                        <tr><td colSpan={6} className="p-8 text-center text-neutral-400">Brak danych</td></tr>
                    ) : filteredData.map(item => (
                        <tr key={item.id} className={clsx("hover:bg-neutral-50 transition-colors", !item.isActive && "opacity-60")}>

                            {/* Kolumny treści */}
                            {activeTab === 'time' && timeSubTab === 'hours' ? (
                                <>
                                    <td className="px-4 py-3 text-center font-bold text-neutral-600">{item.orderNumber}</td>
                                    <td className="px-4 py-3">{item.startTime?.toString().slice(0, 5)} - {item.endTime?.toString().slice(0, 5)}</td>
                                </>
                            ) : (
                                <td className="px-4 py-3 font-medium text-neutral-900">{item.name}</td>
                            )}

                            {activeTab === 'grading' && (
                                <>
                                    <td className="px-4 py-3 text-neutral-600">{item.numeric}</td>
                                    <td className="px-4 py-3 font-mono">{item.value}</td>
                                </>
                            )}

                            {activeTab === 'attendance' && (
                                <td className="px-4 py-3"><span className="bg-neutral-100 px-2 py-1 rounded text-xs font-mono">{item.shortCode}</span></td>
                            )}

                            {/* Status i Akcje */}
                            <td className="px-4 py-3 text-center">
                                {item.isActive
                                    ? <span className="text-success text-xs">Aktywny</span>
                                    : <span className="text-neutral-400 text-xs">Nieaktywny</span>}
                            </td>
                            <td className="px-4 py-3 text-right">
                                <div className="flex justify-end gap-1">
                                    <button onClick={() => openForm(item)} className="p-1.5 text-primary hover:bg-neutral-100 rounded transition-colors"><Edit2 size={16} /></button>
                                    <button onClick={() => handleDelete(item.id)} className="p-1.5 text-danger hover:bg-neutral-100 rounded transition-colors"><Trash2 size={16} /></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    // --- Renderowanie Formularza ---
    const renderForm = () => (
        <div className="bg-white border border-neutral-200 max-w-2xl mx-auto shadow-sm flex flex-col font-sans mt-6">
            <div className="px-6 py-4 border-b bg-neutral-50 flex justify-between items-center">
                <h3 className="text-lg font-bold text-neutral-800">{formData.id ? 'Edycja' : 'Nowy'} element</h3>
            </div>

            <div className="p-6 space-y-4">
                {/* Pola wspólne */}
                {!(activeTab === 'time' && timeSubTab === 'hours') && (
                    <div>
                        <label className="label-text">Nazwa <span className="text-danger">*</span></label>
                        <Input name="name" value={formData.name || ''} onChange={handleInput} className={errors.name ? "!border-danger" : ""} />
                        {errors.name && <span className="text-xs text-danger">{errors.name}</span>}
                    </div>
                )}

                {/* Pola specyficzne */}
                {activeTab === 'grading' && (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label-text">Symbol (np. 5, 4+)</label>
                            <Input name="numeric" value={(formData as GradeType).numeric || ''} onChange={handleInput} />
                        </div>
                        <div>
                            <label className="label-text">Wartość (do średniej)</label>
                            <Input type="number" step="0.5" name="value" value={(formData as GradeType).value || ''} onChange={handleInput} />
                        </div>
                    </div>
                )}

                {activeTab === 'attendance' && (
                    <div>
                        <label className="label-text">Skrót (np. OB, NB)</label>
                        <Input name="shortCode" maxLength={5} value={(formData as AttendanceType).shortCode || ''} onChange={handleInput} />
                    </div>
                )}

                {activeTab === 'time' && timeSubTab === 'hours' && (
                    <div className="space-y-4">
                        <div>
                            <label className="label-text">Numer lekcji</label>
                            <Input type="number" name="orderNumber" value={(formData as LessonHour).orderNumber || ''} onChange={handleInput} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="label-text">Start</label><Input type="time" name="startTime" value={(formData as LessonHour).startTime || ''} onChange={handleInput} /></div>
                            <div><label className="label-text">Koniec</label><Input type="time" name="endTime" value={(formData as LessonHour).endTime || ''} onChange={handleInput} /></div>
                        </div>
                    </div>
                )}

                <div className="pt-2">
                    <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
                        <input type="checkbox" name="isActive" checked={formData.isActive || false} onChange={handleInput} className="rounded border-neutral-300 text-primary focus:ring-primary" />
                        Aktywny
                    </label>
                </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-neutral-50">
                <Button variant="secondary" onClick={() => setViewMode('list')}>Anuluj</Button>
                <Button onClick={handleSave}>Zapisz</Button>
            </div>
        </div>
    );

    // --- Główny Render ---
    return (
        <div className="bg-white border border-neutral-200 shadow-sm font-sans min-h-[600px] flex flex-col">
            {/* Pasek zakładek głównych */}
            <div className="border-b px-4 flex gap-1 bg-neutral-50/50 overflow-x-auto">
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={clsx(
                                "py-4 px-4 text-sm font-bold uppercase border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap",
                                isActive ? "border-primary text-primary bg-white" : "border-transparent text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100/50"
                            )}
                        >
                            <Icon size={18} /> {tab.label}
                        </button>
                    )
                })}
            </div>

            {/* Pasek narzędzi i Sub-taby */}
            {viewMode === 'list' && (
                <div className="flex items-center justify-between gap-4 p-4 border-b bg-white">
                    <div className="flex-1 flex items-center gap-4">
                        {/* Search Bar - uproszczony SortFilterToolbar */}

                        {/* Sub-taby dla Czasu */}
                        {activeTab === 'time' && (
                            <div className="flex bg-neutral-100 p-1 rounded-lg border border-neutral-200">
                                <button onClick={() => setTimeSubTab('hours')} className={clsx("px-3 py-1 text-xs font-medium rounded-md transition-all", timeSubTab === 'hours' ? "bg-white shadow text-neutral-900" : "text-neutral-500 hover:text-neutral-700")}>Godziny lekcyjne</button>
                                <button onClick={() => setTimeSubTab('statuses')} className={clsx("px-3 py-1 text-xs font-medium rounded-md transition-all", timeSubTab === 'statuses' ? "bg-white shadow text-neutral-900" : "text-neutral-500 hover:text-neutral-700")}>Statusy lekcji</button>
                            </div>
                        )}
                    </div>
                    <Button onClick={() => openForm()}><Plus size={16} className="mr-2" /> Dodaj</Button>
                </div>
            )}

            {/* Treść */}
            <div className="flex-1 bg-white">
                {loading ? (
                    <div className="p-12 text-center text-neutral-400 flex flex-col items-center gap-2">
                        <RefreshCcw className="animate-spin" size={24} /> Ładowanie danych...
                    </div>
                ) : viewMode === 'form' ? (
                    renderForm()
                ) : (
                    <div className="overflow-x-auto">
                        {renderTableContent()}
                    </div>
                )}
            </div>
        </div>
    );
};
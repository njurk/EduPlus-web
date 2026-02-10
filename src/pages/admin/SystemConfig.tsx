import { useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { TrashButton } from "../../components/ui/TrashButton";
import { Modal } from "../../components/modals/Modal";
import { DetailsModal } from "../../components/modals/DetailsModal";
import { api } from "../../services/apiService";
import { School, Clock, GraduationCap, CalendarCheck, BookOpen, List, ListOrdered, Plus, HelpCircle, Calendar } from "lucide-react";
import { clsx } from "clsx";
import { FilterToolbar, FilterSelect } from "../../components/ui/FilterToolbar";
import { validateSystemConfig, validateSchoolYearForm } from "../../utils/validation";
import { DataTable, type Column } from "../../components/ui/DataTable";
import { ActionButtons } from "../../components/ui/ActionButtons";
import type { GradeType, GradeCategory, AttendanceType, LessonHour, SchoolYearFormData } from "../../types";
import { formatDateTime, formatDateOnly } from "../../utils/formatters";
import { useCMSContent } from "../../hooks/useCMSContent";
import { ColorPicker } from "../../components/ui/ColorPicker";

const TABS = [
    { id: "schoolYears", icon: Calendar },
    { id: "classrooms", icon: School },
    { id: "subjects", icon: BookOpen },
    { id: "lessonHours", icon: Clock },
    { id: "lessonStatuses", icon: List },
    { id: "gradeTypes", icon: GraduationCap },
    { id: "gradeCategories", icon: ListOrdered },
    { id: "attendance", icon: CalendarCheck },
    { id: "ticketReasons", icon: HelpCircle },
] as const;

type TabId = typeof TABS[number]['id'];

const TAB_SORT_DEFAULTS: Partial<Record<TabId, { sortBy: string; sortDesc: boolean }>> = {
    schoolYears: { sortBy: "startdate", sortDesc: true },
    lessonHours: { sortBy: "orderNumber", sortDesc: false },
    gradeTypes: { sortBy: "value", sortDesc: true },
    gradeCategories: { sortBy: "weight", sortDesc: true },
};
const DEFAULT_SORT = { sortBy: "created", sortDesc: true };

const EDIT_ONLY_TABS: TabId[] = ["attendance", "lessonStatuses"];
const NO_ADD_TABS: TabId[] = ["attendance", "lessonStatuses"];
const NO_TRASH_TABS: TabId[] = ["lessonStatuses"];

const getInitialSchoolYearForm = (): SchoolYearFormData => ({
    name: '', startDate: '', endDate: '', isActive: true,
    semester1: { endDate: '' }, semester2: { startDate: '' }
});

const DETAILS_LABELS: Record<string, Record<string, string>> = {
    schoolYears: { name: "Nazwa", startDate: "Data rozpoczęcia", endDate: "Data zakończenia" },
    classrooms: { name: "Nazwa" },
    subjects: { name: "Nazwa" },
    lessonHours: { orderNumber: "Numer lekcji", startTime: "Start", endTime: "Koniec" },
    lessonStatuses: { name: "Nazwa" },
    gradeTypes: { name: "Nazwa opisowa", numeric: "Symbol", value: "Wartość" },
    gradeCategories: { name: "Nazwa", weight: "Waga", colorHex: "Kolor" },
    attendance: { name: "Nazwa", shortCode: "Skrót", colorHex: "Kolor", isNegative: "Ujemne" },
    ticketReasons: { name: "Nazwa" },
};

const DETAILS_EXCLUDE = ["id", "password", "isActive", "slug", "modifiedByUserId"];

const buildDetailsData = (tab: TabId, item: any): Record<string, any> => {
    const labels = DETAILS_LABELS[tab] || {};
    const data: Record<string, any> = {};
    for (const key of Object.keys(labels)) {
        let val = item[key];
        if (key === "value" && tab === "gradeTypes") val = Number(val).toFixed(2);
        if (key === "startTime" || key === "endTime") val = val?.slice(0, 5);
        data[key] = val;
    }
    data.createdAt = item.createdAt;
    data.updatedAt = item.updatedAt;
    data.modifiedByName = item.modifiedByName;
    return data;
};

const buildDetailsLabels = (tab: TabId): Record<string, string> => ({
    ...DETAILS_LABELS[tab],
    createdAt: "Utworzono",
    updatedAt: "Edytowano",
    modifiedByName: "Edytowane przez",
});

const ConfigFormContent = ({ activeTab, formData, errors, handleInput, onColorChange, setFormData }: {
    activeTab: TabId;
    formData: any;
    errors: Record<string, string | null>;
    handleInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onColorChange: (color: string) => void;
    setFormData: React.Dispatch<React.SetStateAction<any>>;
}) => (
    <div className="p-6 space-y-4">
        {activeTab !== "lessonHours" && (
            <div>
                <label className="label-text">
                    {activeTab === "gradeTypes" ? "Nazwa opisowa" : "Nazwa"} <span className="text-danger">*</span>
                </label>
                <Input
                    name="name"
                    value={formData.name || ""}
                    onChange={handleInput}
                    placeholder={activeTab === "schoolYears" ? "np. 2025/2026" : undefined}
                    className={errors.name ? "!border-danger" : ""}
                />
                {errors.name && <span className="text-xs text-danger">{errors.name}</span>}
            </div>
        )}

        {activeTab === "schoolYears" && (
            <>
                <div className="grid grid-cols-2 gap-4">
                    {([["startDate", "Data rozpoczęcia roku"], ["endDate", "Data zakończenia roku"]] as const).map(([key, label]) => (
                        <div key={key}>
                            <label className="label-text">{label} <span className="text-danger">*</span></label>
                            <Input type="date" value={formData[key] || ""} onChange={e => setFormData((p: any) => ({ ...p, [key]: e.target.value }))} className={errors[key] ? "!border-danger" : ""} />
                            {errors[key] && <span className="text-xs text-danger">{errors[key]}</span>}
                        </div>
                    ))}
                </div>
                <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Semestr 1</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label-text text-muted-foreground">Data rozpoczęcia</label>
                            <Input type="date" value={formData.startDate || ""} disabled className="bg-muted" />
                        </div>
                        <div>
                            <label className="label-text">Data zakończenia <span className="text-danger">*</span></label>
                            <Input type="date" value={formData.semester1?.endDate || ""} onChange={e => setFormData((p: any) => ({ ...p, semester1: { ...p.semester1, endDate: e.target.value } }))} className={errors.semester1End ? "!border-danger" : ""} />
                            {errors.semester1End && <span className="text-xs text-danger">{errors.semester1End}</span>}
                        </div>
                    </div>
                </div>
                <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Semestr 2</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label-text">Data rozpoczęcia <span className="text-danger">*</span></label>
                            <Input type="date" value={formData.semester2?.startDate || ""} onChange={e => setFormData((p: any) => ({ ...p, semester2: { ...p.semester2, startDate: e.target.value } }))} className={errors.semester2Start ? "!border-danger" : ""} />
                            {errors.semester2Start && <span className="text-xs text-danger">{errors.semester2Start}</span>}
                        </div>
                        <div>
                            <label className="label-text text-muted-foreground">Data zakończenia</label>
                            <Input type="date" value={formData.endDate || ""} disabled className="bg-muted" />
                        </div>
                    </div>
                </div>
            </>
        )}

        {activeTab === "gradeTypes" && (
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="label-text">Symbol <span className="text-danger">*</span></label>
                    <Input name="numeric" value={(formData as GradeType).numeric || ""} onChange={handleInput} className={errors.numeric ? "!border-danger" : ""} />
                    {errors.numeric && <span className="text-xs text-danger">{errors.numeric}</span>}
                </div>
                <div>
                    <label className="label-text">Wartość <span className="text-danger">*</span></label>
                    <Input type="number" step="0.25" name="value" value={(formData as GradeType).value || ""} onChange={handleInput} className={errors.value ? "!border-danger" : ""} />
                    {errors.value && <div className="text-xs text-danger">{errors.value}</div>}
                </div>
            </div>
        )}

        {(activeTab === "gradeCategories" || activeTab === "attendance") && (
            <ColorPicker label="Kolor" value={(formData as any).colorHex || '#6b7280'} onChange={onColorChange} />
        )}

        {activeTab === "gradeCategories" && (
            <div>
                <label className="label-text">Waga <span className="text-danger">*</span></label>
                <Input type="number" step="1" min="0" name="weight" value={(formData as GradeCategory).weight || ""} onChange={handleInput} className={errors.weight ? "!border-danger" : ""} />
                {errors.weight && <div className="text-xs text-danger">{errors.weight}</div>}
            </div>
        )}

        {activeTab === "attendance" && (
            <div className="space-y-4">
                <div>
                    <label className="label-text">Skrót <span className="text-danger">*</span></label>
                    <Input name="shortCode" maxLength={5} value={(formData as AttendanceType).shortCode || ""} onChange={handleInput} />
                    {errors.shortCode && <span className="text-xs text-danger">{errors.shortCode}</span>}
                </div>
                <div className="flex items-center gap-2">
                    <input type="checkbox" id="isNegative" name="isNegative" checked={(formData as AttendanceType).isNegative || false} onChange={handleInput} className="h-4 w-4 rounded border-gray-300" />
                    <label htmlFor="isNegative" className="label-text cursor-pointer">Punkty ujemne</label>
                </div>
            </div>
        )}

        {activeTab === "lessonHours" && (
            <div className="space-y-4">
                <div>
                    <label className="label-text">Numer lekcji <span className="text-danger">*</span></label>
                    <Input type="number" name="orderNumber" value={(formData as LessonHour).orderNumber || ""} onChange={handleInput} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label-text">Start <span className="text-danger">*</span></label>
                        <Input type="time" name="startTime" value={(formData as LessonHour).startTime || ""} onChange={handleInput} />
                    </div>
                    <div>
                        <label className="label-text">Koniec <span className="text-danger">*</span></label>
                        <Input type="time" name="endTime" value={(formData as LessonHour).endTime || ""} onChange={handleInput} />
                    </div>
                </div>
            </div>
        )}
    </div>
);

export const SystemConfig = () => {
    const { getText } = useCMSContent('systemConfig');
    const [activeTab, setActiveTab] = useState<TabId>("schoolYears");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [formData, setFormData] = useState<any>({});
    const [errors, setErrors] = useState<Record<string, string | null>>({});
    const [filters, setFilters] = useState({
        search: "",
        sortBy: "startdate",
        sortDesc: true,
        showInactive: false,
        isNegativeFilter: "" as "" | "true" | "false",
    });

    const [detailsItem, setDetailsItem] = useState<any>(null);
    const [detailsSemesters, setDetailsSemesters] = useState<any[]>([]);

    const isSchoolYears = activeTab === "schoolYears";

    useEffect(() => {
        setLoading(true);
        setData([]);
        setIsModalOpen(false);
        setDetailsItem(null);
        const { sortBy, sortDesc } = TAB_SORT_DEFAULTS[activeTab] || DEFAULT_SORT;
        setFilters(p => ({ ...p, search: "", showInactive: false, isNegativeFilter: "" as const, sortBy, sortDesc }));
    }, [activeTab]);

    const getCurrentApi = useCallback(() => {
        const apis: Record<TabId, any> = {
            schoolYears: api.schoolYears,
            classrooms: api.classrooms,
            subjects: api.subjects,
            lessonHours: api.lessonHours,
            lessonStatuses: api.lessonStatuses,
            gradeTypes: api.gradeTypes,
            gradeCategories: api.gradeCategories,
            attendance: api.attendanceTypes,
            ticketReasons: api.ticketReasons,
        };
        return apis[activeTab];
    }, [activeTab]);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getCurrentApi().getAll(filters);
            setData(result || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [getCurrentApi, filters]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        let finalValue: any = value;
        if (type === "checkbox") finalValue = checked;
        else if (type === "number") finalValue = value === "" ? null : Number(value);
        else if (type === "time") finalValue = value.length === 5 ? `${value}:00` : value;
        setFormData((prev: any) => ({ ...prev, [name]: finalValue }));
        if (value && errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const openForm = async (item?: any) => {
        setErrors({});
        if (isSchoolYears) {
            if (item) {
                try {
                    const semesters = await api.schoolYears.getSemesters(item.id);
                    const sem1 = semesters.find((s: any) => s.order === 1) || semesters[0];
                    const sem2 = semesters.find((s: any) => s.order === 2) || semesters[1];
                    setFormData({
                        id: item.id, name: item.name, isActive: item.isActive,
                        startDate: item.startDate?.split('T')[0] || '',
                        endDate: item.endDate?.split('T')[0] || '',
                        semester1: { id: sem1?.id, endDate: sem1?.endDate?.split('T')[0] || '' },
                        semester2: { id: sem2?.id, startDate: sem2?.startDate?.split('T')[0] || '' }
                    });
                } catch {
                    setFormData({
                        id: item.id, name: item.name, isActive: item.isActive,
                        startDate: item.startDate?.split('T')[0] || '',
                        endDate: item.endDate?.split('T')[0] || '',
                        semester1: { endDate: '' }, semester2: { startDate: '' }
                    });
                }
            } else {
                setFormData(getInitialSchoolYearForm());
            }
        } else {
            setFormData(item ? { ...item } : {
                isActive: true,
                orderNumber: activeTab === "lessonHours" ? data.length + 1 : undefined,
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        const newErrors = isSchoolYears
            ? validateSchoolYearForm(formData)
            : validateSystemConfig(activeTab, formData);
        if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

        try {
            if (isSchoolYears) {
                if (formData.id) {
                    await api.schoolYears.update(formData.id, {
                        id: formData.id, name: formData.name,
                        startDate: formData.startDate, endDate: formData.endDate, isActive: formData.isActive
                    });
                    if (formData.semester1.id) {
                        await api.semesters.update(formData.semester1.id, {
                            id: formData.semester1.id, name: 'Semestr 1',
                            startDate: formData.startDate, endDate: formData.semester1.endDate, schoolYearId: formData.id
                        });
                    }
                    if (formData.semester2.id) {
                        await api.semesters.update(formData.semester2.id, {
                            id: formData.semester2.id, name: 'Semestr 2',
                            startDate: formData.semester2.startDate, endDate: formData.endDate, schoolYearId: formData.id
                        });
                    }
                } else {
                    const createdYear = await api.schoolYears.create({
                        name: formData.name, startDate: formData.startDate,
                        endDate: formData.endDate, isActive: formData.isActive
                    });
                    await api.semesters.create({
                        name: 'Semestr 1', order: 1, startDate: formData.startDate,
                        endDate: formData.semester1.endDate, schoolYearId: createdYear.id
                    });
                    await api.semesters.create({
                        name: 'Semestr 2', order: 2, startDate: formData.semester2.startDate,
                        endDate: formData.endDate, schoolYearId: createdYear.id
                    });
                }
            } else {
                const resource = getCurrentApi();
                formData.id ? await resource.update(formData.id, formData) : await resource.create(formData);
            }
            await loadData();
            setIsModalOpen(false);
        } catch (err: any) {
            alert(err?.response?.data?.message || err?.message || 'Błąd zapisu');
        }
    };

    const handleDelete = async (item: any, isActive: boolean) => {
        const msg = isActive ? 'Przenieś do kosza?' : 'Czy na pewno chcesz trwale usunąć ten element?';
        if (!window.confirm(msg)) return;
        try {
            if (isActive) await getCurrentApi().update(item.id, { ...item, isActive: false });
            else await getCurrentApi().delete(item.id);
            await loadData();
        } catch { alert('Błąd usuwania'); }
    };

    const handleRestore = async (item: any) => {
        if (!window.confirm('Przywróć element?')) return;
        try {
            if (isSchoolYears) await api.schoolYears.restore(item.id);
            else await getCurrentApi().update(item.id, { ...item, isActive: true });
            await loadData();
        } catch { alert('Błąd przywracania'); }
    };

    const handleSort = (field: string) => {
        setFilters(p => p.sortBy === field ? { ...p, sortDesc: !p.sortDesc } : { ...p, sortBy: field, sortDesc: true });
    };

    const openDetails = async (item: any) => {
        if (isSchoolYears) {
            try {
                const semesters = await api.schoolYears.getSemesters(item.id);
                setDetailsSemesters(semesters.sort((a: any, b: any) => a.order - b.order));
            } catch {
                setDetailsSemesters([]);
            }
        }
        setDetailsItem(item);
    };

    const detailsTitle = useMemo(() => {
        if (!detailsItem) return "";
        const prefix = getText(`tabs.${activeTab}`) || activeTab;
        return `${prefix}: ${detailsItem.name || detailsItem.orderNumber || ''}`;
    }, [detailsItem, activeTab, getText]);

    const detailsCustomFooter = useMemo((): ReactNode => {
        if (!isSchoolYears || !detailsItem) return undefined;
        return (
            <div className="w-full space-y-3">
                {detailsSemesters.length > 0 ? detailsSemesters.map((sem: any) => (
                    <div key={sem.id} className="card">
                        <h5 className="font-medium mb-2">{sem.name}</h5>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><span className="text-muted-foreground">Rozpoczęcie:</span><span className="ml-2">{formatDateOnly(sem.startDate)}</span></div>
                            <div><span className="text-muted-foreground">Zakończenie:</span><span className="ml-2">{formatDateOnly(sem.endDate)}</span></div>
                        </div>
                    </div>
                )) : <p className="text-muted-foreground text-sm">Brak</p>}
                <div className="flex justify-end">
                    <Button onClick={() => setDetailsItem(null)}>Zamknij</Button>
                </div>
            </div>
        );
    }, [isSchoolYears, detailsItem, detailsSemesters]);

    const columns = useMemo(() => {
        const tabColumns: Record<string, Column<any>[]> = {
            schoolYears: [
                { header: 'Nazwa', accessor: 'name', sortKey: 'name' },
                { header: 'Data rozpoczęcia', sortKey: 'startdate', render: row => formatDateOnly(row.startDate) },
                { header: 'Data zakończenia', sortKey: 'enddate', render: row => formatDateOnly(row.endDate) },
            ],
            lessonHours: [
                { header: 'Nr', accessor: "orderNumber", sortKey: "orderNumber", className: "text-center w-16" },
                { header: 'Godziny', render: row => `${row.startTime?.slice(0, 5)} - ${row.endTime?.slice(0, 5)}` }
            ],
            gradeTypes: [
                { header: 'Symbol', accessor: "numeric", sortKey: "numeric" },
                { header: 'Nazwa', accessor: "name", sortKey: "name" },
                { header: 'Wartość', sortKey: "value", render: row => Number(row.value).toFixed(2) }
            ],
            gradeCategories: [
                { header: 'Nazwa', accessor: "name", sortKey: "name" },
                { header: 'Waga', accessor: "weight", sortKey: "weight" },
                { header: "Kolor", render: row => <div className="w-6 h-6 rounded border" style={{ backgroundColor: row.colorHex || '#6b7280' }} /> }
            ],
            attendance: [
                { header: 'Nazwa', accessor: "name", sortKey: "name" },
                { header: 'Skrót', accessor: "shortCode", className: "font-mono" },
                { header: "Kolor", render: row => <div className="w-6 h-6 rounded border" style={{ backgroundColor: row.colorHex || '#6b7280' }} /> },
                { header: "Ujemne", render: row => row.isNegative ? "Tak" : "Nie", className: "text-center" }
            ]
        };

        const specificCols = tabColumns[activeTab] || [
            { header: 'Nazwa', accessor: "name", sortKey: "name", className: "w-1/3" }
        ];

        return [
            ...specificCols,
            { header: 'Utworzono', sortKey: "created", render: (row: any) => formatDateTime(row.createdAt), muted: true },
            { header: 'Edytowano', sortKey: "updated", render: (row: any) => formatDateTime(row.updatedAt), muted: true },
            { header: 'Edytowane przez', render: (row: any) => row.modifiedByName || '-', muted: true },
            {
                header: 'Akcje', className: "text-right",
                render: (row: any) => {
                    if (EDIT_ONLY_TABS.includes(activeTab)) {
                        return <ActionButtons isActive onEdit={() => openForm(row)} onDetails={() => openDetails(row)} />;
                    }
                    const canDelete = !row.slug;
                    return (
                        <ActionButtons
                            isActive={!filters.showInactive}
                            onEdit={() => openForm(row)}
                            onDelete={canDelete ? () => handleDelete(row, row.isActive) : undefined}
                            onRestore={canDelete ? () => handleRestore(row) : undefined}
                            onDetails={() => openDetails(row)}
                        />
                    );
                }
            }
        ];
    }, [activeTab, filters.showInactive]);

    const filteredData = activeTab === "attendance" && filters.isNegativeFilter !== ""
        ? data.filter(row => String(row.isNegative) === filters.isNegativeFilter)
        : data;

    return (
        <div className="bg-white border border-neutral-200 shadow-sm font-sans min-h-[600px] flex">
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={formData.id ? 'Edycja elementu' : 'Nowy element'}
                maxWidth={isSchoolYears ? "lg" : "md"}
                footer={<><Button variant="secondary" onClick={() => setIsModalOpen(false)}>Anuluj</Button><Button onClick={handleSave}>Zapisz</Button></>}
            >
                <ConfigFormContent
                    activeTab={activeTab}
                    formData={formData}
                    errors={errors}
                    handleInput={handleInput}
                    onColorChange={color => setFormData((prev: any) => ({ ...prev, colorHex: color }))}
                    setFormData={setFormData}
                />
            </Modal>

            <DetailsModal
                isOpen={detailsItem !== null}
                onClose={() => setDetailsItem(null)}
                title={detailsTitle}
                data={detailsItem ? buildDetailsData(activeTab, detailsItem) : {}}
                labels={buildDetailsLabels(activeTab)}
                excludeKeys={DETAILS_EXCLUDE}
                maxWidth={isSchoolYears ? "lg" : "md"}
                customFooter={detailsCustomFooter}
            />

            <div className="w-56 border-r bg-neutral-50/50 flex-shrink-0">
                <div className="p-4 border-b">
                    <h1 className="text-lg font-bold text-neutral-800">Konfiguracja</h1>
                </div>
                <nav className="py-2">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={clsx(
                                    "w-full px-4 py-3 text-sm font-medium flex items-center gap-3 transition-colors text-left",
                                    activeTab === tab.id
                                        ? "bg-primary/10 text-primary border-r-2 border-primary"
                                        : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800"
                                )}
                            >
                                <Icon size={18} />
                                {getText(`tabs.${tab.id}`) || tab.id}
                            </button>
                        );
                    })}
                </nav>
            </div>

            <div className="flex-1 flex flex-col">
                <FilterToolbar
                    search={{ value: filters.search, onChange: v => setFilters(p => ({ ...p, search: v })) }}
                    onReset={() => setFilters(p => ({ ...p, search: '', isNegativeFilter: '' as const }))}
                    rightContent={
                        <>
                            {!NO_TRASH_TABS.includes(activeTab) && (
                                <TrashButton
                                    isTrashActive={filters.showInactive}
                                    onToggle={() => { setLoading(true); setData([]); setFilters(p => ({ ...p, showInactive: !p.showInactive })); }}
                                />
                            )}
                            {!NO_ADD_TABS.includes(activeTab) && (
                                <Button onClick={() => openForm()}><Plus size={16} className="mr-2" /> Dodaj</Button>
                            )}
                        </>
                    }
                >
                    {activeTab === "attendance" && (
                        <FilterSelect
                            label="Typ"
                            value={filters.isNegativeFilter || null}
                            onChange={v => setFilters(p => ({ ...p, isNegativeFilter: (v?.toString() || '') as "" | "true" | "false" }))}
                            options={[{ value: "true", label: "Ujemne" }, { value: "false", label: "Nieujemne" }]}
                            parseAsNumber={false}
                        />
                    )}
                </FilterToolbar>

                <div className="flex-1">
                    <DataTable
                        data={filteredData}
                        columns={columns}
                        isLoading={loading}
                        emptyMessage="Brak danych"
                        sortBy={filters.sortBy}
                        sortDesc={filters.sortDesc}
                        onSort={handleSort}
                    />
                </div>
            </div>
        </div>
    );
};

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { TrashButton } from "../../components/ui/TrashButton";
import { Modal } from "../../components/modals/Modal";
import { api } from "../../services/apiService";
import { School, Clock, GraduationCap, CalendarCheck, BookOpen, List, ListOrdered, Plus, HelpCircle, Calendar, Eye } from "lucide-react";
import { clsx } from "clsx";
import { FilterToolbar, FilterSelect } from "../../components/ui/FilterToolbar";
import { validateSystemConfig } from "../../utils/validation";
import { DataTable, type Column } from "../../components/ui/DataTable";
import { ActionButtons } from "../../components/ui/ActionButtons";
import type { BaseEntity, GradeType, GradeCategory, AttendanceType, LessonHour } from "../../types";
import { formatDateTime } from "../../utils/formatters";
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

interface SchoolYearFormData {
    id?: number;
    name: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
    semester1: { id?: number; endDate: string };
    semester2: { id?: number; startDate: string };
}

const getInitialFormData = (): SchoolYearFormData => ({
    name: '',
    startDate: '',
    endDate: '',
    isActive: true,
    semester1: { endDate: '' },
    semester2: { startDate: '' }
});

const SchoolYearConfig = () => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [detailsData, setDetailsData] = useState<{ year: any; semesters: any[] } | null>(null);
    const [formData, setFormData] = useState<SchoolYearFormData>(getInitialFormData());
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [filters, setFilters] = useState({
        search: '',
        sortBy: 'startdate',
        sortDesc: true,
        showInactive: false
    });

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const result = await api.schoolYears.getAll(filters);
            setData(result || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const openForm = async (item?: any) => {
        setErrors({});
        if (item) {
            try {
                const semesters = await api.schoolYears.getSemesters(item.id);
                const sem1 = semesters.find((s: any) => s.order === 1) || semesters[0];
                const sem2 = semesters.find((s: any) => s.order === 2) || semesters[1];
                setFormData({
                    id: item.id,
                    name: item.name,
                    startDate: item.startDate?.split('T')[0] || '',
                    endDate: item.endDate?.split('T')[0] || '',
                    isActive: item.isActive,
                    semester1: { id: sem1?.id, endDate: sem1?.endDate?.split('T')[0] || '' },
                    semester2: { id: sem2?.id, startDate: sem2?.startDate?.split('T')[0] || '' }
                });
            } catch {
                setFormData({
                    id: item.id,
                    name: item.name,
                    startDate: item.startDate?.split('T')[0] || '',
                    endDate: item.endDate?.split('T')[0] || '',
                    isActive: item.isActive,
                    semester1: { endDate: '' },
                    semester2: { startDate: '' }
                });
            }
        } else {
            setFormData(getInitialFormData());
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name.trim()) newErrors.name = 'Nazwa jest wymagana';
        if (!formData.startDate) newErrors.startDate = 'Data rozpoczęcia jest wymagana';
        if (!formData.endDate) newErrors.endDate = 'Data zakończenia jest wymagana';
        if (!formData.semester1.endDate) newErrors.semester1End = 'Data zakończenia semestru 1 jest wymagana';
        if (!formData.semester2.startDate) newErrors.semester2Start = 'Data rozpoczęcia semestru 2 jest wymagana';
        if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
            newErrors.endDate = 'Data zakończenia musi być po dacie rozpoczęcia';
        }
        if (formData.semester1.endDate && formData.startDate && new Date(formData.semester1.endDate) <= new Date(formData.startDate)) {
            newErrors.semester1End = 'Data zakończenia semestru 1 musi być po rozpoczęciu roku';
        }
        if (formData.semester2.startDate && formData.endDate && new Date(formData.semester2.startDate) >= new Date(formData.endDate)) {
            newErrors.semester2Start = 'Data rozpoczęcia semestru 2 musi być przed końcem roku';
        }
        if (formData.semester1.endDate && formData.semester2.startDate && new Date(formData.semester1.endDate) >= new Date(formData.semester2.startDate)) {
            newErrors.semester2Start = 'Semestr 2 musi zaczynać się po zakończeniu semestru 1';
        }
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        try {
            if (formData.id) {
                await api.schoolYears.update(formData.id, {
                    id: formData.id,
                    name: formData.name,
                    startDate: formData.startDate,
                    endDate: formData.endDate,
                    isActive: formData.isActive
                });
                if (formData.semester1.id) {
                    await api.semesters.update(formData.semester1.id, {
                        id: formData.semester1.id,
                        name: 'Semestr 1',
                        startDate: formData.startDate,
                        endDate: formData.semester1.endDate,
                        schoolYearId: formData.id
                    });
                }
                if (formData.semester2.id) {
                    await api.semesters.update(formData.semester2.id, {
                        id: formData.semester2.id,
                        name: 'Semestr 2',
                        startDate: formData.semester2.startDate,
                        endDate: formData.endDate,
                        schoolYearId: formData.id
                    });
                }
            } else {
                const createdYear = await api.schoolYears.create({
                    name: formData.name,
                    startDate: formData.startDate,
                    endDate: formData.endDate,
                    isActive: formData.isActive
                });
                await api.semesters.create({
                    name: 'Semestr 1',
                    order: 1,
                    startDate: formData.startDate,
                    endDate: formData.semester1.endDate,
                    schoolYearId: createdYear.id
                });
                await api.semesters.create({
                    name: 'Semestr 2',
                    order: 2,
                    startDate: formData.semester2.startDate,
                    endDate: formData.endDate,
                    schoolYearId: createdYear.id
                });
            }
            await loadData();
            setIsModalOpen(false);
        } catch (err: any) {
            const message = err?.response?.data?.message || err?.message || 'Błąd zapisu';
            alert(message);
        }
    };

    const handleDelete = async (item: any, isActive: boolean) => {
        const message = isActive
            ? 'Przenieś do kosza?'
            : 'Czy na pewno chcesz trwale usunąć ten rok szkolny?';
        if (!window.confirm(message)) return;
        try {
            if (isActive) {
                await api.schoolYears.update(item.id, { ...item, isActive: false });
            } else {
                await api.schoolYears.delete(item.id);
            }
            await loadData();
        } catch {
            alert('Błąd usuwania');
        }
    };

    const handleRestore = async (item: any) => {
        if (!window.confirm('Przywróć rok szkolny?')) return;
        try {
            await api.schoolYears.restore(item.id);
            await loadData();
        } catch {
            alert('Błąd przywracania');
        }
    };

    const handleSort = (field: string) => {
        setFilters(p => p.sortBy === field
            ? { ...p, sortDesc: !p.sortDesc }
            : { ...p, sortBy: field, sortDesc: true });
    };

    const formatDateOnly = (date: string) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('pl-PL');
    };

    const openDetails = async (item: any) => {
        try {
            const semesters = await api.schoolYears.getSemesters(item.id);
            setDetailsData({ year: item, semesters: semesters.sort((a: any, b: any) => a.order - b.order) });
            setIsDetailsOpen(true);
        } catch {
            alert('Błąd pobierania semestrów');
        }
    };

    const columns: Column<any>[] = useMemo(() => [
        { header: 'Nazwa', accessor: 'name', sortKey: 'name' },
        { header: 'Data rozpoczęcia', sortKey: 'startdate', render: (row) => formatDateOnly(row.startDate) },
        { header: 'Data zakończenia', sortKey: 'enddate', render: (row) => formatDateOnly(row.endDate) },
        { header: 'Utworzono', sortKey: 'created', render: (row) => formatDateTime(row.createdAt), muted: true },
        { header: 'Edytowano', sortKey: 'updated', render: (row) => formatDateTime(row.updatedAt), muted: true },
        { header: 'Edytowane przez', render: (row) => row.modifiedByName || '-', muted: true },
        {
            header: 'Akcje',
            className: 'text-right',
            render: (row) => (
                <div className="flex items-center justify-end gap-1">
                    <button
                        onClick={() => openDetails(row)}
                        className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        title="Szczegóły"
                    >
                        <Eye size={16} />
                    </button>
                    <ActionButtons
                        isActive={!filters.showInactive}
                        onEdit={() => openForm(row)}
                        onDelete={() => handleDelete(row, row.isActive)}
                        onRestore={() => handleRestore(row)}
                    />
                </div>
            )
        }
    ], [filters.showInactive]);

    return (
        <div className="flex-1 flex flex-col">
            <Modal
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
                title={`Rok szkolny: ${detailsData?.year?.name || ''}`}
                maxWidth="lg"
            >
                {detailsData && (
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-sm text-muted-foreground">Data rozpoczęcia</span>
                                <p className="font-medium">{formatDateOnly(detailsData.year.startDate)}</p>
                            </div>
                            <div>
                                <span className="text-sm text-muted-foreground">Data zakończenia</span>
                                <p className="font-medium">{formatDateOnly(detailsData.year.endDate)}</p>
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <div className="space-y-4">
                                {detailsData.semesters.map((sem: any) => (
                                    <div key={sem.id} className="card">
                                        <h5 className="font-medium mb-2">{sem.name}</h5>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-muted-foreground">Rozpoczęcie:</span>
                                                <span className="ml-2">{formatDateOnly(sem.startDate)}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Zakończenie:</span>
                                                <span className="ml-2">{formatDateOnly(sem.endDate)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {detailsData.semesters.length === 0 && (
                                    <p className="text-muted-foreground text-sm">Brak semestrów</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={formData.id ? 'Edycja roku szkolnego' : 'Nowy rok szkolny'}
                maxWidth="lg"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Anuluj</Button>
                        <Button onClick={handleSave}>Zapisz</Button>
                    </>
                }
            >
                <div className="p-6 space-y-6">
                    <div>
                        <label className="label-text">Nazwa <span className="text-danger">*</span></label>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                            placeholder="np. 2025/2026"
                            className={errors.name ? '!border-danger' : ''}
                        />
                        {errors.name && <span className="text-xs text-danger">{errors.name}</span>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label-text">Data rozpoczęcia roku <span className="text-danger">*</span></label>
                            <Input
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData(p => ({ ...p, startDate: e.target.value }))}
                                className={errors.startDate ? '!border-danger' : ''}
                            />
                            {errors.startDate && <span className="text-xs text-danger">{errors.startDate}</span>}
                        </div>
                        <div>
                            <label className="label-text">Data zakończenia roku <span className="text-danger">*</span></label>
                            <Input
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => setFormData(p => ({ ...p, endDate: e.target.value }))}
                                className={errors.endDate ? '!border-danger' : ''}
                            />
                            {errors.endDate && <span className="text-xs text-danger">{errors.endDate}</span>}
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <h4 className="font-medium mb-3">Semestr 1</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label-text text-muted-foreground">Data rozpoczęcia</label>
                                <Input type="date" value={formData.startDate} disabled className="bg-muted" />
                            </div>
                            <div>
                                <label className="label-text">Data zakończenia <span className="text-danger">*</span></label>
                                <Input
                                    type="date"
                                    value={formData.semester1.endDate}
                                    onChange={(e) => setFormData(p => ({ ...p, semester1: { ...p.semester1, endDate: e.target.value } }))}
                                    className={errors.semester1End ? '!border-danger' : ''}
                                />
                                {errors.semester1End && <span className="text-xs text-danger">{errors.semester1End}</span>}
                            </div>
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <h4 className="font-medium mb-3">Semestr 2</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label-text">Data rozpoczęcia <span className="text-danger">*</span></label>
                                <Input
                                    type="date"
                                    value={formData.semester2.startDate}
                                    onChange={(e) => setFormData(p => ({ ...p, semester2: { ...p.semester2, startDate: e.target.value } }))}
                                    className={errors.semester2Start ? '!border-danger' : ''}
                                />
                                {errors.semester2Start && <span className="text-xs text-danger">{errors.semester2Start}</span>}
                            </div>
                            <div>
                                <label className="label-text text-muted-foreground">Data zakończenia</label>
                                <Input type="date" value={formData.endDate} disabled className="bg-muted" />
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>

            <FilterToolbar
                search={{ value: filters.search, onChange: v => setFilters(p => ({ ...p, search: v })) }}
                onReset={() => setFilters(p => ({ ...p, search: '' }))}
                rightContent={
                    <>
                        <TrashButton
                            isTrashActive={filters.showInactive}
                            onToggle={() => {
                                setLoading(true);
                                setData([]);
                                setFilters(p => ({ ...p, showInactive: !p.showInactive }));
                            }}
                        />
                        <Button onClick={() => openForm()}>
                            <Plus size={16} className="mr-2" /> Dodaj
                        </Button>
                    </>
                }
            />

            <div className="flex-1">
                <DataTable
                    data={data}
                    columns={columns}
                    isLoading={loading}
                    emptyMessage="Brak lat szkolnych"
                    sortBy={filters.sortBy}
                    sortDesc={filters.sortDesc}
                    onSort={handleSort}
                />
            </div>
        </div>
    );
};

const ConfigFormContent = ({
    activeTab,
    formData,
    errors,
    handleInput,
    onColorChange
}: {
    activeTab: typeof TABS[number]['id'];
    formData: Partial<BaseEntity>;
    errors: Record<string, string | null>;
    handleInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onColorChange: (color: string) => void;
}) => {
    const getNameValue = () => (formData as any).name || "";

    return (
        <div className="p-6 space-y-4">
            {activeTab !== "lessonHours" && (
                <div>
                    <label className="label-text">
                        {activeTab === "gradeTypes" ? "Nazwa opisowa" : "Nazwa"} <span className="text-danger">*</span>
                    </label>
                    <Input
                        name="name"
                        value={getNameValue()}
                        onChange={handleInput}
                        className={errors.name ? "!border-danger" : ""}
                    />
                    {errors.name && <span className="text-xs text-danger">{errors.name}</span>}
                </div>
            )}

            {activeTab === "gradeTypes" && (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label-text">Symbol <span className="text-danger">*</span></label>
                        <Input
                            name="numeric"
                            value={(formData as GradeType).numeric || ""}
                            onChange={handleInput}
                            className={errors.numeric ? "!border-danger" : ""}
                        />
                        {errors.numeric && <span className="text-xs text-danger">{errors.numeric}</span>}
                    </div>
                    <div>
                        <label className="label-text">Wartość <span className="text-danger">*</span></label>
                        <Input
                            type="number"
                            step="0.25"
                            name="value"
                            value={(formData as GradeType).value || ""}
                            onChange={handleInput}
                            className={errors.value ? "!border-danger" : ""}
                        />
                        {errors.value && <div className="text-xs text-danger">{errors.value}</div>}
                    </div>
                </div>
            )}

            {(activeTab === "gradeCategories" || activeTab === "attendance") && (
                <ColorPicker
                    label="Kolor"
                    value={(formData as any).colorHex || '#6b7280'}
                    onChange={onColorChange}
                />
            )}

            {activeTab === "gradeCategories" && (
                <div>
                    <label className="label-text">Waga <span className="text-danger">*</span></label>
                    <Input
                        type="number"
                        step="1"
                        min="0"
                        name="weight"
                        value={(formData as GradeCategory).weight || ""}
                        onChange={handleInput}
                        className={errors.weight ? "!border-danger" : ""}
                    />
                    {errors.weight && <div className="text-xs text-danger">{errors.weight}</div>}
                </div>
            )}

            {activeTab === "attendance" && (
                <div className="space-y-4">
                    <div>
                        <label className="label-text">Skrót <span className="text-danger">*</span></label>
                        <Input
                            name="shortCode"
                            maxLength={5}
                            value={(formData as AttendanceType).shortCode || ""}
                            onChange={handleInput}
                        />
                        {errors.shortCode && <span className="text-xs text-danger">{errors.shortCode}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isNegative"
                            name="isNegative"
                            checked={(formData as AttendanceType).isNegative || false}
                            onChange={handleInput}
                            className="h-4 w-4 rounded border-gray-300"
                        />
                        <label htmlFor="isNegative" className="label-text cursor-pointer">Punkty ujemne</label>
                    </div>
                </div>
            )}

            {activeTab === "lessonHours" && (
                <div className="space-y-4">
                    <div>
                        <label className="label-text">Numer lekcji <span className="text-danger">*</span></label>
                        <Input
                            type="number"
                            name="orderNumber"
                            value={(formData as LessonHour).orderNumber || ""}
                            onChange={handleInput}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label-text">Start <span className="text-danger">*</span></label>
                            <Input
                                type="time"
                                name="startTime"
                                value={(formData as LessonHour).startTime || ""}
                                onChange={handleInput}
                            />
                        </div>
                        <div>
                            <label className="label-text">Koniec <span className="text-danger">*</span></label>
                            <Input
                                type="time"
                                name="endTime"
                                value={(formData as LessonHour).endTime || ""}
                                onChange={handleInput}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export const SystemConfig = () => {
    const { getText } = useCMSContent('systemConfig');
    const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["id"]>("classrooms");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [formData, setFormData] = useState<Partial<BaseEntity>>({});
    const [errors, setErrors] = useState<Record<string, string | null>>({});
    const [filters, setFilters] = useState({
        search: "",
        sortBy: "name",
        sortDesc: false,
        showInactive: false,
        isNegativeFilter: "" as "" | "true" | "false",
    });

    useEffect(() => {
        setLoading(true);
        setData([]);
        setIsModalOpen(false);

        let defaultSort = "name";
        let defaultDesc = false;

        if (activeTab === "lessonHours") {
            defaultSort = "orderNumber";
            defaultDesc = false;
        } else if (activeTab === "gradeTypes") {
            defaultSort = "value";
            defaultDesc = true;
        } else if (activeTab === "gradeCategories") {
            defaultSort = "weight";
            defaultDesc = true;
        } else if (["subjects", "classrooms", "lessonStatuses", "attendance", "ticketReasons"].includes(activeTab)) {
            defaultSort = "created";
            defaultDesc = true;
        }

        setFilters((prev) => ({
            ...prev,
            search: "",
            showInactive: false,
            sortBy: defaultSort,
            sortDesc: defaultDesc,
        }));
    }, [activeTab]);

    const getCurrentApi = useCallback(() => {
        switch (activeTab) {
            case "classrooms": return api.classrooms;
            case "subjects": return api.subjects;
            case "lessonHours": return api.lessonHours;
            case "lessonStatuses": return api.lessonStatuses;
            case "gradeTypes": return api.gradeTypes;
            case "gradeCategories": return api.gradeCategories;
            case "attendance": return api.attendanceTypes;
            case "ticketReasons": return api.ticketReasons;
            default: return api.classrooms;
        }
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

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        let finalValue: any = value;

        if (type === "checkbox") {
            finalValue = checked;
        } else if (type === "number") {
            finalValue = value === "" ? null : Number(value);
        } else if (type === "time") {
            finalValue = value.length === 5 ? `${value}:00` : value;
        }

        setFormData((prev) => ({ ...prev, [name]: finalValue }));
        if (value && errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
    };

    const handleSave = async () => {
        const newErrors = validateSystemConfig(activeTab, formData);
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            const resource = getCurrentApi();
            formData.id
                ? await resource.update(formData.id, formData)
                : await resource.create(formData);

            await loadData();
            setIsModalOpen(false);
        } catch (err: any) {
            const message = err?.response?.data?.message || err?.message || 'Błąd zapisu';
            alert(message);
        }
    };

    const handleDelete = async (item: BaseEntity, isActive: boolean) => {
        const message = isActive
            ? 'Przenieś do kosza?'
            : 'Czy na pewno chcesz trwale usunąć ten element?';
        if (!window.confirm(message)) return;
        try {
            if (isActive) {
                await getCurrentApi().update(item.id, { ...item, isActive: false });
            } else {
                await getCurrentApi().delete(item.id);
            }
            await loadData();
        } catch {
            alert('Błąd usuwania');
        }
    };

    const handleRestore = async (item: BaseEntity) => {
        if (!window.confirm('Przywróć element?')) return;
        try {
            await getCurrentApi().update(item.id, { ...item, isActive: true });
            await loadData();
        } catch {
            alert('Błąd przywracania');
        }
    };

    const openForm = (item?: any) => {
        setErrors({});
        setFormData(
            item
                ? { ...item }
                : {
                    isActive: true,
                    orderNumber: activeTab === "lessonHours" ? data.length + 1 : undefined,
                }
        );
        setIsModalOpen(true);
    };

    const handleSort = (field: string) => {
        setFilters(p => p.sortBy === field
            ? { ...p, sortDesc: !p.sortDesc }
            : { ...p, sortBy: field, sortDesc: true });
    };

    const columns = useMemo(() => {
        const tabColumns: Record<string, Column<any>[]> = {
            lessonHours: [
                { header: 'Nr', accessor: "orderNumber", sortKey: "orderNumber", className: "text-center w-16" },
                { header: 'Godziny', render: (row) => `${row.startTime?.slice(0, 5)} - ${row.endTime?.slice(0, 5)}` }
            ],
            gradeTypes: [
                { header: 'Symbol', accessor: "numeric", sortKey: "numeric" },
                { header: 'Nazwa', accessor: "name", sortKey: "name" },
                { header: 'Wartość', sortKey: "value", render: (row) => Number(row.value).toFixed(2) }
            ],
            gradeCategories: [
                { header: 'Nazwa', accessor: "name", sortKey: "name" },
                { header: 'Waga', accessor: "weight", sortKey: "weight" },
                { header: "Kolor", render: (row) => <div className="w-6 h-6 rounded border" style={{ backgroundColor: row.colorHex || '#6b7280' }} /> }
            ],
            attendance: [
                { header: 'Nazwa', accessor: "name", sortKey: "name" },
                { header: 'Skrót', accessor: "shortCode", className: "font-mono" },
                { header: "Kolor", render: (row) => <div className="w-6 h-6 rounded border" style={{ backgroundColor: row.colorHex || '#6b7280' }} /> },
                { header: "Ujemne", render: (row) => row.isNegative ? "Tak" : "Nie", className: "text-center" }
            ]
        };

        const specificCols = tabColumns[activeTab] || [
            { header: 'Nazwa', accessor: "name", sortKey: "name", className: "w-1/3" }
        ];

        return [
            ...specificCols,
            { header: 'Utworzono', sortKey: "created", render: (row) => formatDateTime(row.createdAt), muted: true },
            { header: 'Edytowano', sortKey: "updated", render: (row) => formatDateTime(row.updatedAt), muted: true },
            { header: 'Edytowane przez', render: (row) => row.modifiedByName || '-', muted: true },
            {
                header: 'Akcje',
                className: "text-right",
                render: (row) => {
                    const editOnly = ['attendance', 'lessonStatuses'].includes(activeTab);
                    if (editOnly) {
                        return (
                            <ActionButtons
                                isActive={true}
                                onEdit={() => openForm(row)}
                            />
                        );
                    }
                    const canDelete = !row.slug;
                    return (
                        <ActionButtons
                            isActive={!filters.showInactive}
                            onEdit={() => openForm(row)}
                            onDelete={canDelete ? () => handleDelete(row, row.isActive) : undefined}
                            onRestore={canDelete ? () => handleRestore(row) : undefined}
                        />
                    );
                },
            }
        ];
    }, [activeTab, filters.showInactive]);

    return (
        <div className="bg-white border border-neutral-200 shadow-sm font-sans min-h-[600px] flex">
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={formData.id ? 'Edycja elementu' : 'Nowy element'}
                maxWidth="md"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>{'Anuluj'}</Button>
                        <Button onClick={handleSave}>{'Zapisz'}</Button>
                    </>
                }
            >
                <ConfigFormContent
                    activeTab={activeTab}
                    formData={formData}
                    errors={errors}
                    handleInput={handleInput}
                    onColorChange={(color) => setFormData(prev => ({ ...prev, colorHex: color }))}
                />
            </Modal>

            <div className="w-56 border-r bg-neutral-50/50 flex-shrink-0">
                <div className="p-4 border-b">
                    <h1 className="text-lg font-bold text-neutral-800">Konfiguracja</h1>
                </div>
                <nav className="py-2">
                    {TABS.map((tab) => {
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

            {activeTab === 'schoolYears' ? (
                <SchoolYearConfig />
            ) : (
                <div className="flex-1 flex flex-col">
                    <FilterToolbar
                        search={{ value: filters.search, onChange: v => setFilters(p => ({ ...p, search: v })) }}
                        onReset={() => setFilters(p => ({ ...p, search: '', isNegativeFilter: '' as const }))}
                        rightContent={
                            <>
                                {!['lessonStatuses'].includes(activeTab) && (
                                    <TrashButton
                                        isTrashActive={filters.showInactive}
                                        onToggle={() => {
                                            setLoading(true);
                                            setData([]);
                                            setFilters((p) => ({ ...p, showInactive: !p.showInactive }));
                                        }}
                                    />
                                )}
                                {!['attendance', 'lessonStatuses'].includes(activeTab) && (
                                    <Button onClick={() => openForm()}>
                                        <Plus size={16} className="mr-2" /> Dodaj
                                    </Button>
                                )}
                            </>
                        }
                    >
                        {activeTab === "attendance" && (
                            <FilterSelect
                                label="Typ"
                                value={filters.isNegativeFilter || null}
                                onChange={(v) => setFilters(p => ({ ...p, isNegativeFilter: (v?.toString() || '') as "" | "true" | "false" }))}
                                options={[
                                    { value: "true", label: "Ujemne" },
                                    { value: "false", label: "Nieujemne" }
                                ]}
                                parseAsNumber={false}
                            />
                        )}
                    </FilterToolbar>

                    <div className="flex-1">
                        <DataTable
                            data={activeTab === "attendance" && filters.isNegativeFilter !== ""
                                ? data.filter(row => String(row.isNegative) === filters.isNegativeFilter)
                                : data}
                            columns={columns}
                            isLoading={loading}
                            emptyMessage="Brak danych w wybranej kategorii"
                            sortBy={filters.sortBy}
                            sortDesc={filters.sortDesc}
                            onSort={handleSort}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

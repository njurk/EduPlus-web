import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { TrashButton } from "../../components/ui/TrashButton";
import { Modal } from "../../components/modals/Modal";
import { api } from "../../services/apiService";
import { School, Clock, GraduationCap, CalendarCheck, BookOpen, List, ListOrdered, Plus, HelpCircle, Calendar, Save } from "lucide-react";
import { clsx } from "clsx";
import { FilterToolbar } from "../../components/ui/FilterToolbar";
import { validateSystemConfig, validateSchoolYearSemesters, type SchoolYearSemesterData } from "../../utils/validation";
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

const SchoolYearConfig = () => {
    const [schoolYears, setSchoolYears] = useState<any[]>([]);
    const [selectedYear, setSelectedYear] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [formData, setFormData] = useState<SchoolYearSemesterData | null>(null);

    useEffect(() => {
        const loadYears = async () => {
            setLoading(true);
            try {
                const years = await api.schoolYears.getAll();
                setSchoolYears(years);
                if (years.length > 0) {
                    setSelectedYear(years[0]);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadYears();
    }, []);

    useEffect(() => {
        if (!selectedYear) return;
        const loadSemesters = async () => {
            setLoading(true);
            try {
                const sems = await api.schoolYears.getSemesters(selectedYear.id);
                const sem1 = sems.find((s: any) => s.order === 1) || sems[0];
                const sem2 = sems.find((s: any) => s.order === 2) || sems[1];
                setFormData({
                    schoolYear: {
                        id: selectedYear.id,
                        name: selectedYear.name,
                        startDate: selectedYear.startDate,
                        endDate: selectedYear.endDate
                    },
                    semester1: {
                        id: sem1?.id || 0,
                        name: sem1?.name || 'Semestr I',
                        startDate: selectedYear.startDate,
                        endDate: sem1?.endDate || ''
                    },
                    semester2: {
                        id: sem2?.id || 0,
                        name: sem2?.name || 'Semestr II',
                        startDate: sem1?.endDate ? addDay(sem1.endDate) : '',
                        endDate: selectedYear.endDate
                    }
                });
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadSemesters();
    }, [selectedYear]);

    const addDay = (date: string) => {
        const d = new Date(date);
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
    };

    const handleDateChange = (field: string, value: string) => {
        if (!formData) return;
        const newData = { ...formData };
        if (field === 'schoolYearStart') {
            newData.schoolYear.startDate = value;
            newData.semester1.startDate = value;
        } else if (field === 'schoolYearEnd') {
            newData.schoolYear.endDate = value;
            newData.semester2.endDate = value;
        } else if (field === 'semester1End') {
            newData.semester1.endDate = value;
            newData.semester2.startDate = addDay(value);
        }
        setFormData(newData);
        setErrors({});
    };

    const handleSave = async () => {
        if (!formData) return;
        const validationErrors = validateSchoolYearSemesters(formData);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        setSaving(true);
        try {
            await api.schoolYears.update(formData.schoolYear.id, {
                id: formData.schoolYear.id,
                name: formData.schoolYear.name,
                startDate: formData.schoolYear.startDate,
                endDate: formData.schoolYear.endDate,
                isActive: true
            });
            if (formData.semester1.id) {
                await api.semesters.update(formData.semester1.id, {
                    id: formData.semester1.id,
                    name: formData.semester1.name,
                    startDate: formData.semester1.startDate,
                    endDate: formData.semester1.endDate,
                    schoolYearId: formData.schoolYear.id
                });
            }
            if (formData.semester2.id) {
                await api.semesters.update(formData.semester2.id, {
                    id: formData.semester2.id,
                    name: formData.semester2.name,
                    startDate: formData.semester2.startDate,
                    endDate: formData.semester2.endDate,
                    schoolYearId: formData.schoolYear.id
                });
            }
            const years = await api.schoolYears.getAll();
            setSchoolYears(years);
            const updatedYear = years.find((y: any) => y.id === formData.schoolYear.id);
            if (updatedYear) setSelectedYear(updatedYear);
        } catch (err) {
            console.error(err);
            alert('Błąd zapisu');
        } finally {
            setSaving(false);
        }
    };

    if (loading && !formData) {
        return <div className="p-6 text-center text-muted-foreground">Ładowanie...</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
                <label className="label-text">Rok szkolny:</label>
                <select
                    className="input"
                    value={selectedYear?.id || ''}
                    onChange={(e) => {
                        const year = schoolYears.find(y => y.id === Number(e.target.value));
                        setSelectedYear(year);
                    }}
                >
                    {schoolYears.map(year => (
                        <option key={year.id} value={year.id}>{year.name}</option>
                    ))}
                </select>
            </div>

            {formData && (
                <div className="grid gap-6">
                    <div className="card p-4">
                        <h3 className="font-semibold mb-4">Rok szkolny: {formData.schoolYear.name}</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label-text">Data rozpoczęcia <span className="text-danger">*</span></label>
                                <Input
                                    type="date"
                                    value={formData.schoolYear.startDate}
                                    onChange={(e) => handleDateChange('schoolYearStart', e.target.value)}
                                    className={errors.schoolYearStart ? '!border-danger' : ''}
                                />
                                {errors.schoolYearStart && <span className="text-xs text-danger">{errors.schoolYearStart}</span>}
                            </div>
                            <div>
                                <label className="label-text">Data zakończenia <span className="text-danger">*</span></label>
                                <Input
                                    type="date"
                                    value={formData.schoolYear.endDate}
                                    onChange={(e) => handleDateChange('schoolYearEnd', e.target.value)}
                                    className={errors.schoolYearEnd ? '!border-danger' : ''}
                                />
                                {errors.schoolYearEnd && <span className="text-xs text-danger">{errors.schoolYearEnd}</span>}
                            </div>
                        </div>
                    </div>

                    <div className="card p-4">
                        <h3 className="font-semibold mb-4">Semestr I</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label-text">Data rozpoczęcia</label>
                                <Input
                                    type="date"
                                    value={formData.semester1.startDate}
                                    disabled
                                    className="bg-muted"
                                />
                                <span className="text-xs text-muted-foreground">Automatycznie: początek roku</span>
                            </div>
                            <div>
                                <label className="label-text">Data zakończenia <span className="text-danger">*</span></label>
                                <Input
                                    type="date"
                                    value={formData.semester1.endDate}
                                    onChange={(e) => handleDateChange('semester1End', e.target.value)}
                                    className={errors.semester1End ? '!border-danger' : ''}
                                />
                                {errors.semester1End && <span className="text-xs text-danger">{errors.semester1End}</span>}
                            </div>
                        </div>
                    </div>

                    <div className="card p-4">
                        <h3 className="font-semibold mb-4">Semestr II</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label-text">Data rozpoczęcia</label>
                                <Input
                                    type="date"
                                    value={formData.semester2.startDate}
                                    disabled
                                    className="bg-muted"
                                />
                                <span className="text-xs text-muted-foreground">Automatycznie: dzień po końcu I sem.</span>
                            </div>
                            <div>
                                <label className="label-text">Data zakończenia</label>
                                <Input
                                    type="date"
                                    value={formData.semester2.endDate}
                                    disabled
                                    className="bg-muted"
                                />
                                <span className="text-xs text-muted-foreground">Automatycznie: koniec roku</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button onClick={handleSave} disabled={saving}>
                            <Save size={16} className="mr-2" />
                            {saving ? 'Zapisuję...' : 'Zapisz zmiany'}
                        </Button>
                    </div>
                </div>
            )}
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
        } catch {
            alert('Błąd zapisu');
        }
    };

    const handleStatusChange = async (item: BaseEntity, isActive: boolean) => {
        if (!window.confirm(isActive ? 'Przywróć element?' : 'Przenieś do kosza?')) return;
        try {
            await getCurrentApi().update(item.id, { ...item, isActive });
            await loadData();
        } catch {
            alert('Błąd zmiany statusu');
        }
    };

    const handleHardDelete = async (id: number) => {
        if (!window.confirm('Usunąć trwale?')) return;
        try {
            await getCurrentApi().delete(id);
            await loadData();
        } catch {
            alert('Błąd usuwania');
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
        setFilters(p => p.sortBy === field ? { ...p, sortDesc: !p.sortDesc } : { sortBy: field, sortDesc: true, search: p.search, showInactive: p.showInactive });
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
                { header: "Kolor", render: (row) => <div className="w-6 h-6 rounded border" style={{ backgroundColor: row.colorHex || '#6b7280' }} /> }
            ]
        };

        const specificCols = tabColumns[activeTab] || [
            { header: 'Nazwa', accessor: "name", sortKey: "name", className: "w-1/3" }
        ];

        return [
            ...specificCols,
            { header: 'Utworzono', sortKey: "created", render: (row) => formatDateTime(row.createdAt), className: "text-neutral-500 text-xs" },
            { header: 'Edytowano', sortKey: "updated", render: (row) => formatDateTime(row.updatedAt), className: "text-neutral-500 text-xs" },
            {
                header: 'Akcje',
                className: "text-right",
                render: (row) => (
                    <ActionButtons
                        isActive={!filters.showInactive}
                        onEdit={() => openForm(row)}
                        onDelete={() => filters.showInactive ? handleHardDelete(row.id) : handleStatusChange(row, false)}
                        onRestore={() => handleStatusChange(row, true)}
                    />
                ),
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
                        onReset={() => setFilters(p => ({ ...p, search: '' }))}
                        rightContent={
                            <>
                                <TrashButton
                                    isTrashActive={filters.showInactive}
                                    onToggle={() => {
                                        setLoading(true);
                                        setData([]);
                                        setFilters((p) => ({ ...p, showInactive: !p.showInactive }));
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

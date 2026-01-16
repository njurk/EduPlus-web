import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { TrashButton } from "../../components/ui/TrashButton";
import { Modal } from "../../components/modals/Modal";
import { api } from "../../services/apiService";
import { School, Clock, GraduationCap, CalendarCheck, BookOpen, List, ListOrdered, Plus } from "lucide-react";
import { clsx } from "clsx";
import { SortToolbar } from "../../components/ui/SortToolbar";
import { validateSystemConfig } from "../../utils/validation";
import { DataTable, type Column } from "../../components/ui/DataTable";
import { ActionButtons } from "../../components/ui/ActionButtons";
import type { BaseEntity, GradeType, GradeCategory, AttendanceType, LessonHour } from "../../types";
import { formatDate } from "../../utils/formatters";
import { useCMSContent } from "../../hooks/useCMSContent";


const TABS = [
    { id: "classrooms", label: "Sale", icon: School },
    { id: "subjects", label: "Przedmioty", icon: BookOpen },
    { id: "lessonHours", label: "Godziny lekcyjne", icon: Clock },
    { id: "lessonStatuses", label: "Statusy lekcji", icon: List },
    { id: "gradeTypes", label: "Skala ocen", icon: GraduationCap },
    { id: "gradeCategories", label: "Kategorie ocen", icon: ListOrdered },
    { id: "attendance", label: "Frekwencja", icon: CalendarCheck },
] as const;

const ConfigFormContent = ({
    activeTab,
    formData,
    errors,
    handleInput
}: {
    activeTab: typeof TABS[number]['id'];
    formData: Partial<BaseEntity>;
    errors: Record<string, string | null>;
    handleInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
                        <label className="label-text">Wartoœæ <span className="text-danger">*</span></label>
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
    const [activeTab, setActiveTab] =
        useState<(typeof TABS)[number]["id"]>("classrooms");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [formData, setFormData] = useState<Partial<BaseEntity>>({});
    const [errors, setErrors] = useState<Record<string, string | null>>({});
    const [filters, setFilters] = useState({
        search: "",
        sortBy: "updated",
        sortDesc: true,
        showInactive: false,
    });

    useEffect(() => {
        setLoading(true);
        setData([]);
        setIsModalOpen(false);

        let defaultSort = "updated";
        let defaultDesc = true;

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

    const getSortOptions = () => {
        const common = [
            { field: "updated", label: "Edytowano" },
            { field: "created", label: "Utworzono" },
        ];
        if (activeTab === "lessonHours") return [{ field: "orderNumber", label: "Nr lekcji" }, ...common];
        if (activeTab === "gradeTypes") return [{ field: "value", label: "Wartoœæ" }, { field: "name", label: "Nazwa" }, ...common];
        if (activeTab === "gradeCategories") return [{ field: "weight", label: "Waga" }, { field: "name", label: "Nazwa" }, ...common];
        if (activeTab === "attendance") return [{ field: "name", label: "Nazwa" }, ...common];
        return [{ field: "name", label: "Nazwa" }, ...common];
    };

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
            alert('B³¹d zapisu');
        }
    };

    const handleStatusChange = async (item: BaseEntity, isActive: boolean) => {
        if (!window.confirm(isActive ? 'Przywróciæ element?' : 'Przenieœæ do kosza?')) return;
        try {
            await getCurrentApi().update(item.id, { ...item, isActive });
            await loadData();
        } catch {
            alert('B³¹d zmiany statusu');
        }
    };

    const handleHardDelete = async (id: number) => {
        if (!window.confirm('Usun¹æ trwale?')) return;
        try {
            await getCurrentApi().delete(id);
            await loadData();
        } catch {
            alert('B³¹d usuwania');
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

    const columns = useMemo(() => {
        const tabColumns: Record<string, Column<any>[]> = {
            lessonHours: [
                { header: getText('columns.number'), accessor: "orderNumber", className: "text-center w-16" },
                { header: getText('columns.hours'), render: (row) => `${row.startTime?.slice(0, 5)} - ${row.endTime?.slice(0, 5)}` }
            ],
            gradeTypes: [
                { header: getText('columns.symbol'), accessor: "numeric" },
                { header: getText('columns.name'), accessor: "name" },
                { header: getText('columns.value'), render: (row) => Number(row.value).toFixed(2) }
            ],
            gradeCategories: [
                { header: getText('columns.name'), accessor: "name" },
                { header: getText('columns.weight'), accessor: "weight" }
            ],
            attendance: [
                { header: getText('columns.name'), accessor: "name" },
                { header: getText('columns.shortCode'), accessor: "shortCode", className: "font-mono" }
            ]
        };

        const specificCols = tabColumns[activeTab] || [
            { header: getText('columns.name'), accessor: "name", className: "w-1/3" }
        ];

        return [
            ...specificCols,
            { header: getText('columns.createdAt'), render: (row) => formatDate(row.createdAt), className: "text-neutral-500 text-xs" },
            { header: getText('columns.updatedAt'), render: (row) => formatDate(row.updatedAt), className: "text-neutral-500 text-xs" },
            {
                header: getText('columns.actions'),
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
        <div className="bg-white border border-neutral-200 shadow-sm font-sans min-h-[600px] flex flex-col">
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={formData.id ? getText('modal.edit') : getText('modal.new')}
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
                />
            </Modal>

            <div className="border-b px-4 flex gap-1 bg-neutral-50/50 overflow-x-auto">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={clsx(
                                "py-4 px-4 text-sm font-bold uppercase border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap",
                                activeTab === tab.id
                                    ? "border-primary text-primary bg-white"
                                    : "border-transparent text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100/50"
                            )}
                        >
                            <Icon size={18} /> {tab.label}
                        </button>
                    );
                })}
            </div>

            <div className="flex items-center justify-between gap-4 p-4 border-b bg-white">
                <div className="flex-1 flex items-center gap-4">
                    <SortToolbar
                        className="flex-1"
                        search={filters.search}
                        onSearchChange={(v) => setFilters((p) => ({ ...p, search: v }))}
                        sortBy={filters.sortBy}
                        sortDesc={filters.sortDesc}
                        onSortChange={(f) =>
                            setFilters((p) => ({
                                ...p,
                                sortBy: f,
                                sortDesc: p.sortBy === f ? !p.sortDesc : true,
                            }))
                        }
                        sortOptions={getSortOptions()}
                    />
                </div>
                <div className="flex gap-2 items-center">
                    <TrashButton
                        isTrashActive={filters.showInactive}
                        onToggle={() => {
                            setLoading(true);
                            setData([]);
                            setFilters((p) => ({ ...p, showInactive: !p.showInactive }));
                        }}
                    />
                    {!filters.showInactive && (
                        <Button onClick={() => openForm()} className="h-10">
                            <Plus size={16} className="mr-2" /> Dodaj
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex-1 bg-white">
                <DataTable
                    data={data}
                    columns={columns}
                    isLoading={loading}
                    emptyMessage="Brak danych w wybranej kategorii"
                />
            </div>
        </div>
    );
};

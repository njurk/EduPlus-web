import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { DataTable } from '../components/ui/DataTable';
import { api } from '../services/apiService';
import { Calendar, BookOpen, ArrowLeft, Plus, RefreshCcw, Filter } from 'lucide-react';
import { clsx } from 'clsx';
import type { Subject, SchoolYear, ClassEntity, Grade, GradeType, GradeCategory, StudentGradesRowDto, GradeDto } from '../types';
import { validateGradeForm } from '../utils/validation';
import { formatName } from '../utils/formatters';

const GradeSquare = ({ grade, onClick }: { grade: Grade, onClick: () => void }) => (
    <div 
        onClick={onClick}
        title={`${grade.gradeType?.numeric} - ${grade.gradeType?.name}\nKategoria: ${grade.gradeCategory?.name}\nData: ${new Date(grade.createdAt).toLocaleDateString()}${grade.comment ? `\n\nKomentarz: ${grade.comment}` : ''}`}
        className="w-8 h-8 flex items-center justify-center bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-bold text-sm cursor-pointer transition-colors select-none"
    >
        {grade.gradeType?.numeric}
    </div>
);

const GradeModal = ({ 
    isOpen, onClose, onSuccess, 
    studentId, subjectId, grade 
}: { 
    isOpen: boolean, onClose: () => void, onSuccess: () => void,
    studentId: number, subjectId: number, grade?: Grade 
}) => {
    const [types, setTypes] = useState<GradeType[]>([]);
    const [cats, setCats] = useState<GradeCategory[]>([]);
    
    const [formData, setFormData] = useState<Partial<GradeDto>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            Promise.all([api.gradeTypes.getAll(), api.gradeCategories.getAll()])
                .then(([t, c]) => { setTypes(t); setCats(c); });
            
            setFormData({
                gradeTypeId: grade?.gradeTypeId,
                gradeCategoryId: grade?.gradeCategoryId,
                comment: grade?.comment || ''
            });
            setErrors({});
        }
    }, [isOpen, grade]);

    const handleSave = async () => {
        const payload = { ...formData, studentId, subjectId };
        const validationErrors = validateGradeForm(payload);
        
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        try {
            if (grade) await api.grades.update(grade.id, payload);
            else await api.grades.create(payload);
            onSuccess();
            onClose();
        } catch {
            alert("Błąd zapisu");
        }
    };

    const handleDelete = async () => {
        if (!grade || !window.confirm("Usunąć ocenę?")) return;
        try { await api.grades.delete(grade.id); onSuccess(); onClose(); } catch { alert("Błąd usuwania"); }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={grade ? "Edycja oceny" : "Nowa ocena"}
            maxWidth="sm"
            footer={
                <div className="flex justify-between w-full">
                    <div>{grade && <Button variant="danger" onClick={handleDelete}>Usuń</Button>}</div>
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={onClose}>Anuluj</Button>
                        <Button onClick={handleSave}>Zapisz</Button>
                    </div>
                </div>
            }
        >
            <div className="p-6 space-y-4">
                <div>
                    <label className="text-sm font-medium text-neutral-700 mb-2 block">Ocena <span className="text-danger">*</span></label>
                    <div className="grid grid-cols-4 gap-2">
                        {types.map(t => (
                            <button
                                key={t.id}
                                onClick={() => { setFormData(p => ({...p, gradeTypeId: t.id})); setErrors(p => ({...p, gradeTypeId: ''})); }}
                                className={clsx("h-10 border text-sm font-bold transition-colors", formData.gradeTypeId === t.id ? "bg-primary text-white border-primary" : "bg-white hover:bg-neutral-50")}
                            >
                                {t.numeric}
                            </button>
                        ))}
                    </div>
                    {errors.gradeTypeId && <span className="text-xs text-danger mt-1 block">{errors.gradeTypeId}</span>}
                </div>
                
                <div>
                    <label className="text-sm font-medium text-neutral-700 block mb-1">Kategoria <span className="text-danger">*</span></label>
                    <select 
                        className="w-full border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:border-primary rounded"
                        value={formData.gradeCategoryId || ''}
                        onChange={e => { setFormData(p => ({...p, gradeCategoryId: +e.target.value})); setErrors(p => ({...p, gradeCategoryId: ''})); }}
                    >
                        <option value="">Wybierz...</option>
                        {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {errors.gradeCategoryId && <span className="text-xs text-danger mt-1 block">{errors.gradeCategoryId}</span>}
                </div>

                <div>
                    <label className="text-sm font-medium text-neutral-700 block mb-1">Komentarz</label>
                    <textarea 
                        className="w-full border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:border-primary min-h-[80px]"
                        value={formData.comment}
                        onChange={e => setFormData(p => ({...p, comment: e.target.value}))}
                        maxLength={255}
                    />
                    {errors.comment && <span className="text-xs text-danger mt-1 block">{errors.comment}</span>}
                </div>
            </div>
        </Modal>
    );
};

const SubjectGradesView = ({ 
    classId, 
    subject, 
    yearName, 
    className, 
    onBack 
}: { 
    classId: number, 
    subject: Subject, 
    yearName: string, 
    className: string, 
    onBack: () => void 
}) => {
    const [data, setData] = useState<StudentGradesRowDto[]>([]);
    const [loading, setLoading] = useState(false);
    

    const [semester, setSemester] = useState<1 | 2>(() => {
        const month = new Date().getMonth() + 1;
        return (month >= 9 || month === 1) ? 1 : 2;
    });

    const [modalData, setModalData] = useState<{ open: boolean, studentId: number, grade?: Grade }>({ open: false, studentId: 0 });

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const result = await api.classGrades.getClassGrades(classId, subject.id);
            setData(result || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [classId, subject.id]);

    useEffect(() => { loadData(); }, [loadData]);

    const filterGradesBySemester = (grades: Grade[]) => {
        return grades.filter(g => {
            const date = new Date(g.createdAt);
            const month = date.getMonth() + 1;
            const isSem1 = month >= 9 || month <= 1;
            return semester === 1 ? isSem1 : !isSem1;
        });
    };

    if (loading && !data.length) return <div className="p-12 text-center text-neutral-400"><RefreshCcw className="animate-spin inline mr-2" /> Ładowanie dziennika...</div>;

    return (
        <div className="h-full flex flex-col">
            {modalData.open && (
                <GradeModal 
                    isOpen={modalData.open}
                    onClose={() => setModalData({ ...modalData, open: false })}
                    onSuccess={loadData}
                    studentId={modalData.studentId}
                    subjectId={subject.id}
                    grade={modalData.grade}
                />
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-1 hover:bg-neutral-100 rounded text-neutral-600"><ArrowLeft size={20} /></button>
                    <div>
                        <h2 className="text-xl font-bold text-neutral-800">{subject.name}</h2>
                        <p className="text-sm text-neutral-500 flex items-center gap-2">
                            Dziennik ocen <span className="text-neutral-300">•</span> {yearName} <span className="text-neutral-300">•</span> Klasa {className}
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2 bg-white border border-neutral-300 px-3 py-1.5 rounded">
                    <Filter size={16} className="text-neutral-400" />
                    <select 
                        className="bg-transparent text-sm font-medium text-neutral-700 focus:outline-none cursor-pointer"
                        value={semester}
                        onChange={(e) => setSemester(+e.target.value as 1 | 2)}
                    >
                        <option value={1}>Semestr 1</option>
                        <option value={2}>Semestr 2</option>
                    </select>
                </div>
            </div>

            <div className="bg-white border border-neutral-300 flex-1">
                <DataTable 
                    data={data}
                    isLoading={loading}
                    emptyMessage="Brak uczniów w tej klasie"
                    columns={[
                        { 
                            header: 'Lp.', 
                            accessor: 'orderNumber', 
                            className: 'w-12 text-center text-neutral-500 font-mono border-r border-neutral-100' 
                        },
                        { 
                            header: 'Uczeń', 
                            render: (row) => <div className="font-medium text-neutral-900">{formatName(row)}</div>,
                            className: 'w-64 border-r border-neutral-100'
                        },
                        {
                            header: 'Oceny cząstkowe',
                            render: (row) => {
                                const visibleGrades = filterGradesBySemester(row.grades || []);
                                return (
                                    <div className="flex flex-wrap gap-2 items-center">
                                        {visibleGrades.map(g => (
                                            <GradeSquare 
                                                key={g.id} 
                                                grade={g} 
                                                onClick={() => setModalData({ open: true, studentId: row.studentId, grade: g })} 
                                            />
                                        ))}
                                        <button 
                                            onClick={() => setModalData({ open: true, studentId: row.studentId })}
                                            className="w-8 h-8 flex items-center justify-center border border-dashed border-neutral-300 text-neutral-400 hover:text-primary hover:border-primary transition-colors"
                                            title="Dodaj ocenę"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                );
                            }
                        }
                    ]}
                />
            </div>
        </div>
    );
};

const ClassSubjectsView = ({ 
    classId, 
    yearName, 
    className, 
    onSelectSubject, 
    onBack 
}: { 
    classId: number, 
    yearName: string, 
    className: string, 
    onSelectSubject: (s: Subject) => void, 
    onBack: () => void 
}) => {
    const [subjects, setSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        api.classManagement.getClassDetails(classId)
            .then(data => {
                setSubjects(data.subjects || []);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [classId]);

    if (loading) return <div className="p-12 text-center text-neutral-400"><RefreshCcw className="animate-spin inline mr-2" /> Ładowanie przedmiotów...</div>;

    return (
        <div>
            <div className="flex items-center gap-4 mb-6">
                <button onClick={onBack} className="p-1 hover:bg-neutral-100 rounded text-neutral-600"><ArrowLeft size={20} /></button>
                <div>
                    <h2 className="text-xl font-bold text-neutral-800">Klasa {className}</h2>
                    <p className="text-sm text-neutral-500">
                        {yearName} <span className="mx-2 text-neutral-300">•</span> Wybierz przedmiot
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {subjects.map((item) => (
                    <div 
                        key={item.subjectId} 
                        onClick={() => onSelectSubject({ id: item.subjectId, name: item.subjectName } as Subject)}
                        className="bg-white border border-neutral-300 p-6 cursor-pointer hover:border-primary hover:shadow-sm transition-all group"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-primary-light flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                <BookOpen size={20} />
                            </div>
                            <h3 className="font-bold text-neutral-800">{item.subjectName}</h3>
                        </div>
                        <div className="text-xs text-neutral-500 border-t pt-2 mt-2">
                            Nauczyciel: <span className="font-medium text-neutral-700">{item.teacherName || '-'}</span>
                        </div>
                    </div>
                ))}
                {!subjects.length && <div className="col-span-full p-8 text-center text-neutral-400 border border-dashed border-neutral-300">Brak przypisanych przedmiotów w tej klasie.</div>}
            </div>
        </div>
    );
};

export const ClassGrades = () => {
    const [years, setYears] = useState<SchoolYear[]>([]);
    const [classes, setClasses] = useState<ClassEntity[]>([]);
    const [selected, setSelected] = useState<{ year: number | null, class: number | null, subject: Subject | null }>({ year: null, class: null, subject: null });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.classManagement.getYears().then(res => {
            setYears(res);
            const current = res.find(y => y.isActive) || res[0];
            if (current) setSelected(p => ({ ...p, year: current.id }));
        });
    }, []);

    useEffect(() => {
        if (!selected.year) return;
        setLoading(true);
        api.classManagement.getClassesByYear(selected.year)
            .then(res => setClasses(res.filter(c => c.isActive)))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [selected.year]);

    const selectedYearName = years.find(y => y.id === selected.year)?.name || '';
    const selectedClassObj = classes.find(c => c.id === selected.class);
    const selectedClassName = selectedClassObj ? `${selectedClassObj.level}${selectedClassObj.letter}` : '';

    if (selected.class && selected.subject) {
        return (
            <SubjectGradesView 
                classId={selected.class} 
                subject={selected.subject} 
                yearName={selectedYearName}
                className={selectedClassName}
                onBack={() => setSelected(p => ({ ...p, subject: null }))} 
            />
        );
    }

    if (selected.class) {
        return (
            <ClassSubjectsView 
                classId={selected.class} 
                yearName={selectedYearName}
                className={selectedClassName}
                onSelectSubject={s => setSelected(p => ({ ...p, subject: s }))} 
                onBack={() => setSelected(p => ({ ...p, class: null }))} 
            />
        );
    }

    return (
        <div className="font-sans max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-neutral-800">Dziennik ocen</h1>
                <div className="flex items-center gap-3 bg-white p-2 rounded border border-neutral-300">
                    <Calendar className="text-primary ml-2" size={18} />
                    <select className="bg-transparent font-semibold text-neutral-800 focus:outline-none cursor-pointer text-sm" value={selected.year || ''} onChange={e => setSelected(p => ({ ...p, year: +e.target.value }))}>
                        {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="bg-white border border-neutral-300 p-6 min-h-[500px]">
                <h2 className="text-lg font-semibold text-neutral-800 mb-6">Wybierz klasę</h2>
                {loading ? <div className="text-center p-12 text-neutral-400"><RefreshCcw className="animate-spin inline mr-2" /> Ładowanie...</div> : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {classes.map(cls => (
                            <div key={cls.id} onClick={() => setSelected(p => ({ ...p, class: cls.id }))} className="group border border-neutral-300 p-4 cursor-pointer hover:border-primary transition-colors bg-white">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-primary-light flex items-center justify-center text-primary font-bold text-lg">{cls.level}{cls.letter}</div>
                                    <div>
                                        <div className="font-bold text-neutral-800">Klasa {cls.level}{cls.letter}</div>
                                        <div className="text-xs text-neutral-500">{cls.studentCount || 0} uczniów</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {!classes.length && <div className="col-span-full text-center p-12 border border-dashed border-neutral-300 text-neutral-400">Brak klas w wybranym roku.</div>}
                    </div>
                )}
            </div>
        </div>
    );
};
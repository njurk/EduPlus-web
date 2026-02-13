import { useState, useEffect } from 'react';
import { FileText, Download } from 'lucide-react';
import { api } from '../../services/apiService';
import { Editor } from 'primereact/editor';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { useSchoolYearSelector } from '../../hooks/useSchoolYearSelector';
import { useCMSContent } from '../../hooks/useCMSContent';

interface TemplateDefinition {
    id: string;
    name: string;
    placeholders: string[];
}

interface StudentItem {
    studentId: number;
    studentName: string;
}

const editorHeader = (
    <>
        <span className="ql-formats">
            <select className="ql-size" defaultValue="" aria-label="Font Size">
                <option value="small">Mały</option>
                <option value="">Normalny</option>
                <option value="large">Duży</option>
                <option value="huge">Bardzo duży</option>
            </select>
        </span>
        <span className="ql-formats">
            <button className="ql-bold" aria-label="Bold"></button>
            <button className="ql-italic" aria-label="Italic"></button>
            <button className="ql-underline" aria-label="Underline"></button>
        </span>
        <span className="ql-formats">
            <select className="ql-color" aria-label="Text Color"></select>
            <select className="ql-background" aria-label="Background Color"></select>
        </span>
        <span className="ql-formats">
            <select className="ql-align" aria-label="Alignment"></select>
        </span>
        <span className="ql-formats">
            <button className="ql-list" value="ordered" aria-label="Ordered List"></button>
            <button className="ql-list" value="bullet" aria-label="Bullet List"></button>
        </span>
        <span className="ql-formats">
            <button className="ql-clean" aria-label="Clean"></button>
        </span>
    </>
);

export const Templates = () => {
    const { getText } = useCMSContent('teacherLayout');
    const { years, selectedYearId, selectedSemester, classes: allClasses } = useSchoolYearSelector({ withClasses: true, withCurrentSemester: true });

    const [templates, setTemplates] = useState<TemplateDefinition[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);

    const [teacherAssignments, setTeacherAssignments] = useState<{ classId: number; subjectId: number; subjectName: string }[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
    const [students, setStudents] = useState<StudentItem[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
    const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
    const [customFields, setCustomFields] = useState<Record<string, string>>({});

    useEffect(() => {
        api.templates.getAll().then(setTemplates).catch(console.error);
    }, []);

    useEffect(() => {
        if (!selectedYearId) return;
        api.grades.getTeacherAssignments(selectedYearId).then(setTeacherAssignments);
    }, [selectedYearId]);

    const teacherClasses = allClasses.filter(c => teacherAssignments.some(a => a.classId === c.id));
    const classSubjects = teacherAssignments.filter(a => a.classId === selectedClassId);

    useEffect(() => {
        if (!selectedClassId) { setStudents([]); return; }
        api.classManagement.getStudentsWithParents(selectedClassId)
            .then((data: any[]) => setStudents(data.map(s => ({ studentId: s.studentId, studentName: s.studentName }))))
            .catch(console.error);
    }, [selectedClassId]);

    useEffect(() => {
        if (!selectedId) return;
        setLoading(true);
        api.templates.getContent(selectedId)
            .then(setContent)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [selectedId]);

    const handleExport = async () => {
        if (!selectedId) return;
        setExporting(true);
        try {
            const selectedClass = allClasses.find(c => c.id === selectedClassId);
            const selectedStudent = students.find(s => s.studentId === selectedStudentId);

            const placeholders: Record<string, string> = {};
            if (selectedStudent) placeholders['{{imie_i_nazwisko}}'] = selectedStudent.studentName;
            if (selectedClass) placeholders['{{klasa}}'] = `${selectedClass.level}${selectedClass.letter}`;
            const subject = classSubjects.find(s => s.subjectId === selectedSubjectId);
            if (subject) placeholders['{{przedmiot}}'] = subject.subjectName;
            const yearName = years.find(y => y.id === selectedYearId)?.name;
            if (yearName) placeholders['{{rok_szkolny}}'] = yearName;
            if (selectedSemester) placeholders['{{semestr}}'] = selectedSemester.name;
            for (const [key, value] of Object.entries(customFields)) {
                if (value) placeholders[key] = value;
            }

            const blob = await api.templates.export(selectedId, content, placeholders);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${selectedId}.docx`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Błąd eksportu:', error);
        } finally {
            setExporting(false);
        }
    };

    const selected = templates.find(t => t.id === selectedId);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-neutral-800">{getText('title.templates')}</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 bg-white rounded-xs border border-neutral-200 p-4">
                    <h2 className="text-sm font-semibold text-neutral-600 mb-3 uppercase tracking-wide">Szablony</h2>
                    <div className="space-y-2">
                        {templates.map(template => (
                            <button
                                key={template.id}
                                onClick={() => setSelectedId(template.id)}
                                className={`w-full text-left p-3 rounded-xs border transition-all ${selectedId === template.id
                                    ? 'bg-primary text-white border-primary'
                                    : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <FileText size={16} />
                                    <span className="text-sm font-medium">{template.name}</span>
                                </div>
                            </button>
                        ))}
                        {templates.length === 0 && (
                            <p className="text-sm text-neutral-500 text-center py-4">Brak szablonów</p>
                        )}
                    </div>

                    {selected && (
                        <>
                            <div className="mt-6 pt-4 border-t border-neutral-200 space-y-3">
                                <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Dane ucznia</h3>
                                <Select
                                    options={teacherClasses.map(c => ({ value: c.id, label: `${c.level}${c.letter}` }))}
                                    value={selectedClassId}
                                    onChange={v => { setSelectedClassId(v ? Number(v) : null); setSelectedStudentId(null); setSelectedSubjectId(null); }}
                                    placeholder="Wybierz klasę"
                                />
                                <Select
                                    options={students.map(s => ({ value: s.studentId, label: s.studentName }))}
                                    value={selectedStudentId}
                                    onChange={v => setSelectedStudentId(v ? Number(v) : null)}
                                    placeholder="Wybierz ucznia"
                                    disabled={!selectedClassId}
                                />
                                {selected.placeholders.includes('{{przedmiot}}') && (
                                    <Select
                                        options={classSubjects.map(s => ({ value: s.subjectId, label: s.subjectName }))}
                                        value={selectedSubjectId}
                                        onChange={v => setSelectedSubjectId(v ? Number(v) : null)}
                                        placeholder="Wybierz przedmiot"
                                        disabled={!selectedClassId}
                                    />
                                )}
                                {selected.placeholders
                                    .filter(p => ['{{data_wycieczki}}', '{{koszt}}', '{{termin_wplat}}', '{{numer_konta}}'].includes(p))
                                    .map(p => {
                                        const labels: Record<string, string> = {
                                            '{{data_wycieczki}}': 'Data wycieczki',
                                            '{{koszt}}': 'Koszt wycieczki',
                                            '{{termin_wplat}}': 'Termin wpłat',
                                            '{{numer_konta}}': 'Numer konta bankowego'
                                        };
                                        return (
                                            <input
                                                key={p}
                                                className="border border-neutral-300 rounded-xs px-3 py-2 text-sm bg-white w-full"
                                                value={customFields[p] || ''}
                                                onChange={e => setCustomFields(prev => ({ ...prev, [p]: e.target.value }))}
                                                placeholder={labels[p]}
                                            />
                                        );
                                    })
                                }
                            </div>

                            <div className="mt-4 pt-4 border-t border-neutral-200">
                                <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Dostępne znaczniki</h3>
                                <div className="flex flex-wrap gap-1.5">
                                    {selected.placeholders.map(p => (
                                        <span key={p} className="px-2 py-1 bg-primary/10 text-primary text-xs font-mono rounded">
                                            {p}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="lg:col-span-3 bg-white rounded-xs border border-neutral-200 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
                        <span className="text-sm font-medium text-neutral-600">
                            {selected ? selected.name : 'Wybierz szablon'}
                        </span>
                        {selectedId && (
                            <Button onClick={handleExport} disabled={exporting || loading}>
                                <Download size={16} className="mr-2" />
                                {exporting ? 'Eksportowanie...' : 'Eksportuj'}
                            </Button>
                        )}
                    </div>
                    <div className="p-4">
                        {selectedId ? (
                            loading ? (
                                <div className="text-neutral-500 text-center py-8">Ładowanie...</div>
                            ) : (
                                <Editor
                                    value={content}
                                    onTextChange={(e) => setContent(e.htmlValue || '')}
                                    style={{ height: '500px' }}
                                    headerTemplate={editorHeader}
                                />
                            )
                        ) : (
                            <div className="text-neutral-500 text-center py-8">
                                Wybierz szablon z listy
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

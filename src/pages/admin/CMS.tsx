import { useState, useEffect } from 'react';
import type { Target, Page, PageContent } from '../../types';
import { api } from '../../services/apiService';
import { Button } from '../../components/ui/Button';
import { Edit2, Save, X, Layout, FileText, Type } from 'lucide-react';
import clsx from 'clsx';
import { RefreshCcw } from 'lucide-react';

export const CMS = () => {
    const [targets, setTargets] = useState<Target[]>([]);
    const [selectedTargetId, setSelectedTargetId] = useState<number | null>(null);

    const [pages, setPages] = useState<Page[]>([]);
    const [selectedPageId, setSelectedPageId] = useState<number | null>(null);

    const [contents, setContents] = useState<PageContent[]>([]);
    const [editingContentId, setEditingContentId] = useState<number | null>(null);
    const [editValue, setEditValue] = useState('');

    const [loadingTargets, setLoadingTargets] = useState(false);
    const [loadingPages, setLoadingPages] = useState(false);
    const [loadingContents, setLoadingContents] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setLoadingTargets(true);
        api.targets.getAll().then(t => {
            setTargets(t);
            if (t.length > 0) setSelectedTargetId(t[0].id);
        }).catch(console.error).finally(() => setLoadingTargets(false));
    }, []);

    useEffect(() => {
        if (!selectedTargetId) return;
        setLoadingPages(true);
        setPages([]);
        setSelectedPageId(null);
        setContents([]);
        api.pages.getAll(selectedTargetId).then(p => {
            setPages(p.sort((a, b) => a.position - b.position));
        }).catch(console.error).finally(() => setLoadingPages(false));
    }, [selectedTargetId]);

    useEffect(() => {
        if (!selectedPageId) return;
        setLoadingContents(true);
        api.pageContent.getByPageId(selectedPageId).then(setContents).catch(console.error).finally(() => setLoadingContents(false));
    }, [selectedPageId]);

    const handleSaveContent = async (id: number) => {
        setSaving(true);
        try {
            const updated = await api.pageContent.update(id, editValue);
            setContents(prev => prev.map(c => c.id === id ? updated : c));
            setEditingContentId(null);
        } catch {
            alert("Błąd zapisu");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <div className="pb-4 bg-neutral-50/30">
                <h2 className="text-xl font-bold text-neutral-800">Zarządzanie treściami</h2>
            </div>
            <div className="font-sans flex flex-col h-[calc(100vh-200px)] border border-neutral-200 shadow-sm rounded-xs overflow-hidden">
                <div className="flex flex-1 overflow-hidden">
                    <div className="w-1/4 border-r bg-neutral-50 flex flex-col">
                        <div className="p-3 font-semibold text-xs uppercase text-neutral-500 border-b flex items-center gap-2">
                            <Layout size={14} /> Sekcja
                        </div>
                        <div className="overflow-y-auto flex-1 p-2 space-y-1">
                            {loadingTargets && <div className="p-4 text-center"><RefreshCcw className="animate-spin inline text-neutral-400" /></div>}
                            {targets.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setSelectedTargetId(t.id)}
                                    className={clsx(
                                        "w-full text-left px-4 py-3 rounded-xs text-sm font-medium flex flex-col",
                                        selectedTargetId === t.id ? "bg-white ring-1 ring-neutral-200 shadow-sm text-primary" : "text-neutral-600 hover:bg-neutral-200/50"
                                    )}
                                >
                                    <span className={clsx(selectedTargetId === t.id && "font-bold")}>{t.title}</span>
                                    <span className="text-xs text-neutral-400 font-normal">{t.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="w-1/4 border-r bg-white flex flex-col">
                        <div className="p-3 font-semibold text-xs uppercase text-neutral-500 border-b flex items-center gap-2">
                            <FileText size={14} /> Strona
                        </div>
                        <div className="overflow-y-auto flex-1 p-2 space-y-1">
                            {loadingPages && <div className="p-4 text-center"><RefreshCcw className="animate-spin inline text-neutral-400" /></div>}
                            {!loadingPages && pages.length === 0 && <div className="p-4 text-center text-sm text-neutral-400">Brak stron w tej sekcji</div>}
                            {pages.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => setSelectedPageId(p.id)}
                                    className={clsx(
                                        "w-full text-left px-4 py-3 rounded-xs text-sm",
                                        selectedPageId === p.id ? "bg-primary-light text-primary font-medium" : "text-neutral-700 hover:bg-neutral-50"
                                    )}
                                >
                                    {p.title}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 bg-white flex flex-col">
                        <div className="p-3 font-semibold text-xs uppercase text-neutral-500 border-b flex items-center gap-2">
                            <Type size={14} /> treść
                        </div>
                        <div className="overflow-y-auto flex-1 p-2">
                            {loadingContents && <div className="p-12 text-center text-neutral-400 flex flex-col items-center gap-2 max-w-sm mx-auto"><RefreshCcw className="animate-spin" size={24} /> Ładowanie treści...</div>}

                            {!selectedPageId && !loadingContents && (
                                <div className="p-4 text-center text-sm text-neutral-400">Wybierz stronę aby edytować treści</div>
                            )}

                            {selectedPageId && !loadingContents && contents.length === 0 && (
                                <div className="text-center text-neutral-400 mt-12">Brak edytowalnych elementów na tej stronie</div>
                            )}

                            <div className="space-y-6 max-w-3xl">
                                {contents.map(c => (
                                    <div key={c.id} className="border border-neutral-200 rounded-xs p-4 shadow-sm hover:shadow-md bg-white">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <span className="text-xs font-mono text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded">{c.key}</span>
                                            </div>
                                            {editingContentId !== c.id && (
                                                <button
                                                    onClick={() => { setEditingContentId(c.id); setEditValue(c.value); }}
                                                    className="text-primary hover:text-primary-hover p-1"
                                                    title="Edytuj"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                            )}
                                        </div>

                                        {editingContentId === c.id ? (
                                            <div className="space-y-3 animation-fade-in">
                                                <textarea
                                                    value={editValue}
                                                    onChange={e => setEditValue(e.target.value)}
                                                    className="w-full min-h-[120px] p-3 border border-primary rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                    autoFocus
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="secondary" onClick={() => setEditingContentId(null)} disabled={saving} className="text-xs py-1 h-8">
                                                        <X size={14} className="mr-1" /> Anuluj
                                                    </Button>
                                                    <Button onClick={() => handleSaveContent(c.id)} disabled={saving} className="text-xs py-1 h-8">
                                                        {saving ? <RefreshCcw className="animate-spin" size={14} /> : <Save size={14} className="mr-1" />} Zapisz
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-neutral-800 text-sm whitespace-pre-wrap leading-relaxed pl-1 border-l-2 border-transparent">
                                                {c.value || <span className="text-neutral-300 italic">Brak treści</span>}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

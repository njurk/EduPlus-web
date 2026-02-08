import { useState, useEffect } from 'react';
import type { Target, Page, PageContent } from '../../types';
import { api, BASE_URL } from '../../services/apiService';
import { Button } from '../../components/ui/Button';
import { Edit2, Save, RefreshCcw, Upload } from 'lucide-react';
import clsx from 'clsx';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { SearchBar } from '../../components/ui/SearchBar';

const LINK_TO_NAV_KEY: Record<string, string> = {
    'dashboard': 'nav.dashboard',
    'users': 'nav.users',
    'classManagement': 'nav.classes',
    'announcements': 'nav.announcements',
    'tickets': 'nav.tickets',
    'schedule': 'nav.schedule',
    'lessons': 'nav.lessons',
    'grades': 'nav.grades',
    'attendance': 'nav.attendance',
    'excuses': 'nav.excuses',
    'systemConfig': 'nav.config',
    'cms': 'nav.cms'
};

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
    const [search, setSearch] = useState('');
    const [pageTitles, setPageTitles] = useState<Record<number, string>>({});
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadPreview, setUploadPreview] = useState<string | null>(null);

    const isImageKey = (key: string) => key.endsWith('Url');

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
        setPageTitles({});
        api.pages.getAll(selectedTargetId).then(async p => {
            const sortedPages = p.sort((a, b) => a.position - b.position);
            setPages(sortedPages);

            let layoutPageContents: any[] = [];
            try {
                layoutPageContents = await api.pageContent.getByPageId(14);
            } catch (err) {
                console.error('Błąd pobierania layout PageContent', err);
            }

            const titles: Record<number, string> = {};
            for (const page of sortedPages) {
                try {
                    const navKey = LINK_TO_NAV_KEY[page.link];
                    if (navKey) {
                        const navContent = layoutPageContents.find(pc => pc.key === navKey);
                        if (navContent) {
                            titles[page.id] = navContent.value;
                        }
                    }
                } catch (err) {
                    console.error(`Błąd pobierania tytułu strony o ID: ${page.id}`, err);
                }
            }
            setPageTitles(titles);
        }).catch(console.error).finally(() => setLoadingPages(false));
    }, [selectedTargetId]);

    useEffect(() => {
        if (!selectedPageId) return;
        setLoadingContents(true);
        api.pageContent.getByPageId(selectedPageId, search).then(setContents).catch(console.error).finally(() => setLoadingContents(false));
    }, [selectedPageId, search]);

    const handleSaveContent = async (id: number) => {
        setSaving(true);
        try {
            let valueToSave = editValue;

            if (uploadFile) {
                valueToSave = await api.pageContent.uploadImage(uploadFile);
            }

            const updated = await api.pageContent.update(id, valueToSave);
            setContents(prev => prev.map(c => c.id === id ? updated : c));

            if (updated.key.startsWith('nav.') && updated.pageId === 14) {
                const affectedPage = pages.find(p => LINK_TO_NAV_KEY[p.link] === updated.key);
                if (affectedPage) {
                    setPageTitles(prev => ({ ...prev, [affectedPage.id]: updated.value }));
                }
            } else if (updated.key === 'title' && selectedPageId) {
                setPageTitles(prev => ({ ...prev, [selectedPageId]: updated.value }));
            }

            setEditingContentId(null);
            setUploadFile(null);
            setUploadPreview(null);
        } catch {
            alert("Błąd zapisu");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <div className="pb-4 bg-neutral-50/30 flex items-center justify-between">
                <h2 className="text-xl font-bold text-neutral-800">Zarządzanie treściami w systemie</h2>
                <Button variant="primary" onClick={() => window.location.reload()} className="flex items-center gap-2">
                    <RefreshCcw size={16} /> Odśwież
                </Button>
            </div>
            <div className="font-sans flex flex-col h-[calc(100vh-200px)] border border-neutral-200 shadow-sm rounded-xs overflow-hidden">
                <div className="flex flex-1 overflow-hidden">
                    <div className="w-1/4 border-r bg-neutral-50 flex flex-col">
                        <div className="p-3 font-semibold text-xs uppercase text-neutral-500 border-b flex items-center gap-2">
                            Sekcje
                        </div>
                        <div className="overflow-y-auto flex-1 p-2 space-y-1">
                            {loadingTargets && <LoadingSpinner className="h-16" />}
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
                            Strony
                        </div>
                        <div className="overflow-y-auto flex-1 p-2 space-y-1">
                            {loadingPages && <LoadingSpinner className="h-16" />}
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
                                    {pageTitles[p.id] || p.title}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 bg-white flex flex-col">
                        <div className="p-3 border-b">
                            <div className="flex items-center justify-between mb-2">
                                <div className="font-semibold text-xs uppercase text-neutral-500 flex items-center gap-2">
                                    treści
                                </div>
                            </div>
                            <SearchBar
                                value={search}
                                onChange={setSearch}
                                placeholder="Szukaj..."
                                className="max-w-md"
                            />
                        </div>
                        <div className="overflow-y-auto flex-1 p-2">
                            {loadingContents && <LoadingSpinner text="Ładowanie treści..." className="h-48" />}

                            {!selectedPageId && !loadingContents && (
                                <div className="p-4 text-center text-sm text-neutral-400">Wybierz stronę</div>
                            )}

                            {selectedPageId && !loadingContents && contents.length === 0 && (
                                <div className="text-center text-neutral-400 mt-12">Brak</div>
                            )}

                            <div className="space-y-3 max-w-3xl">
                                {contents.map(c => (
                                    <div key={c.id} className="border border-neutral-200 rounded-xs p-3 shadow-sm bg-white">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <span className="text-xs font-mono text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded">{c.key}</span>
                                            </div>
                                            {editingContentId !== c.id && (
                                                <button
                                                    onClick={() => { setEditingContentId(c.id); setEditValue(c.value); setUploadFile(null); setUploadPreview(null); }}
                                                    className="text-primary hover:text-primary-hover p-1"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                            )}
                                        </div>

                                        {editingContentId === c.id ? (
                                            <div className="space-y-3 animation-fade-in">
                                                {isImageKey(c.key) ? (
                                                    <div className="space-y-3">
                                                        {(uploadPreview || c.value) && (
                                                            <div className="flex items-center gap-3">
                                                                <img
                                                                    src={uploadPreview || `${BASE_URL}/${c.value}`}
                                                                    alt="Podgląd"
                                                                    className="h-16 w-16 object-contain rounded"
                                                                />
                                                                <span className="text-sm text-neutral-600">{uploadFile?.name || c.value}</span>
                                                            </div>
                                                        )}
                                                        <label className="text-sm text-primary flex p-1 hover:text-primary-hover cursor-pointer">
                                                            <Upload size={16} className="my-0.5 text-neutral-500 mr-2" />Wybierz plik
                                                            <input
                                                                type="file"
                                                                accept=".png,.jpg,.jpeg,.svg,.webp,.ico"
                                                                className="hidden"
                                                                onChange={e => {
                                                                    const file = e.target.files?.[0];
                                                                    if (file) {
                                                                        setUploadFile(file);
                                                                        setUploadPreview(URL.createObjectURL(file));
                                                                    }
                                                                }}
                                                            />
                                                        </label>
                                                    </div>
                                                ) : (
                                                    <textarea
                                                        value={editValue}
                                                        onChange={e => setEditValue(e.target.value)}
                                                        className="w-full min-h-[120px] p-3 border border-primary rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                        autoFocus
                                                    />
                                                )}
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="secondary" onClick={() => { setEditingContentId(null); setUploadFile(null); setUploadPreview(null); }} disabled={saving} className="text-xs py-1 h-8">
                                                        Anuluj
                                                    </Button>
                                                    <Button onClick={() => handleSaveContent(c.id)} disabled={saving || (isImageKey(c.key) && !uploadFile)} className="text-xs py-1 h-8">
                                                        {saving ? <RefreshCcw className="animate-spin" size={14} /> : <Save size={14} className="mr-1" />} Zapisz
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-neutral-800 text-sm whitespace-pre-wrap leading-relaxed pl-1 border-l-2 border-transparent">
                                                {isImageKey(c.key) && c.value ? (
                                                    <div className="flex items-center gap-3">
                                                        <img src={`${BASE_URL}/${c.value}`} alt={c.key} className="h-12 w-12 object-contain" />
                                                        <span className="text-neutral-500 text-xs font-mono">{c.value}</span>
                                                    </div>
                                                ) : (
                                                    c.value || <span className="text-neutral-300 italic">Brak</span>
                                                )}
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

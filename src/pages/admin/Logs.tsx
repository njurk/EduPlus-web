import { useState, useEffect, useRef } from 'react';
import { RefreshCw, FileText } from 'lucide-react';
import { API_URL, getHeaders } from '../../services/api/core';

interface LogFile {
    name: string;
    size: number;
    lastModified: string;
}

interface LogContent {
    fileName: string;
    totalLines: number;
    lines: string[];
}

export const Logs = () => {
    const [files, setFiles] = useState<LogFile[]>([]);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [logContent, setLogContent] = useState<LogContent | null>(null);
    const [loading, setLoading] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [linesCount, setLinesCount] = useState(100);
    const logContainerRef = useRef<HTMLDivElement>(null);

    const fetchFiles = async () => {
        try {
            const response = await fetch(`${API_URL}/logs/files`, {
                headers: getHeaders()
            });
            const data = await response.json();
            setFiles(data);
            if (data.length > 0 && !selectedFile) {
                setSelectedFile(data[0].name);
            }
        } catch (error) {
            console.error('Błąd pobierania plików:', error);
        }
    };

    const fetchLogContent = async () => {
        if (!selectedFile) return;
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/logs/content/${selectedFile}?lines=${linesCount}`, {
                headers: getHeaders()
            });
            const data = await response.json();
            setLogContent(data);
            setTimeout(() => {
                if (logContainerRef.current) {
                    logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
                }
            }, 100);
        } catch (error) {
            console.error('Błąd pobierania logów:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles();
    }, []);

    useEffect(() => {
        if (selectedFile) {
            fetchLogContent();
        }
    }, [selectedFile, linesCount]);

    useEffect(() => {
        if (autoRefresh && selectedFile) {
            const interval = setInterval(fetchLogContent, 2000);
            return () => clearInterval(interval);
        }
    }, [autoRefresh, selectedFile]);

    const getLineClass = (line: string) => {
        if (line.includes('| ERROR') || line.includes('LOGIN_FAILED')) return 'text-red-400';
        if (line.includes('| LOGIN ') || line.includes('| LOGOUT')) return 'text-green-400';
        if (line.includes('| WARNING')) return 'text-yellow-400';
        return 'text-neutral-300';
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-neutral-800">Logi systemu</h1>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 bg-white rounded-lg border border-neutral-200 p-4">
                    <h2 className="text-sm font-semibold text-neutral-600 mb-3 uppercase tracking-wide">Pliki logów</h2>
                    <div className="space-y-2">
                        {files.map(file => (
                            <button
                                key={file.name}
                                onClick={() => setSelectedFile(file.name)}
                                className={`w-full text-left p-3 rounded-lg border transition-all ${selectedFile === file.name
                                    ? 'bg-primary text-white border-primary'
                                    : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <FileText size={16} />
                                    <span className="text-sm font-medium truncate">{file.name}</span>
                                </div>
                                <div className={`text-xs mt-1 ${selectedFile === file.name ? 'text-white/70' : 'text-neutral-500'}`}>
                                    {formatFileSize(file.size)}
                                </div>
                            </button>
                        ))}
                        {files.length === 0 && (
                            <p className="text-sm text-neutral-500 text-center py-4">Brak</p>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-3 bg-neutral-900 rounded-lg border border-neutral-700 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-neutral-800 border-b border-neutral-700">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-mono text-neutral-400">{selectedFile || 'Wybierz plik'}</span>
                            {logContent && (
                                <span className="text-xs text-neutral-500">
                                    ({logContent.totalLines} linii)
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <select
                                value={linesCount}
                                onChange={(e) => setLinesCount(Number(e.target.value))}
                                className="text-xs bg-neutral-700 text-neutral-300 border border-neutral-600 rounded px-2 py-1"
                            > linii
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                                <option value={200}>200</option>
                                <option value={500}>500</option>
                            </select>
                            <label className="flex items-center gap-2 text-xs text-neutral-400">
                                <input
                                    type="checkbox"
                                    checked={autoRefresh}
                                    onChange={(e) => setAutoRefresh(e.target.checked)}
                                    className="rounded"
                                />
                                auto-odświeżanie
                            </label>
                            <button
                                onClick={fetchLogContent}
                                disabled={loading}
                                className="p-2 text-neutral-400 hover:text-white transition-colors disabled:opacity-50"
                            >
                                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            </button>
                        </div>
                    </div>
                    <div
                        ref={logContainerRef}
                        className="h-[600px] overflow-auto p-4 font-mono text-xs"
                    >
                        {logContent?.lines.map((line, index) => (
                            <div key={index} className={`${getLineClass(line)} whitespace-pre-wrap break-all leading-relaxed`}>
                                {line}
                            </div>
                        ))}
                        {!logContent && (
                            <div className="text-neutral-500 text-center py-8">
                                Brak wybranego pliku logów
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

import { API_URL, getHeaders } from './core';

const generateTimestamp = () => new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);

const downloadBlob = async (url: URL, filename: string) => {
    const response = await fetch(url.toString(), { headers: getHeaders() });
    if (!response.ok) throw new Error('Błąd eksportu');

    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    window.URL.revokeObjectURL(link.href);
    document.body.removeChild(link);
};

export const exportApi = {
    downloadSchedule: async (params: { classId: number; yearId?: number; semesterId?: number; format: 'pdf' | 'xlsx' | 'csv' | 'docx' }): Promise<void> => {
        const url = new URL(`${API_URL}/export/schedule/${params.format}`);
        url.searchParams.set('classId', params.classId.toString());
        if (params.yearId) url.searchParams.set('yearId', params.yearId.toString());
        if (params.semesterId) url.searchParams.set('semesterId', params.semesterId.toString());
        await downloadBlob(url, `plan-lekcji-${generateTimestamp()}.${params.format}`);
    },
    downloadGrades: async (params: { classId: number; semesterId: number; schoolYearId: number; subjectId?: number; studentId?: number; format: 'pdf' | 'xlsx' | 'csv' }): Promise<void> => {
        const url = new URL(`${API_URL}/export/grades/${params.format}`);
        url.searchParams.set('classId', params.classId.toString());
        url.searchParams.set('semesterId', params.semesterId.toString());
        url.searchParams.set('schoolYearId', params.schoolYearId.toString());
        if (params.subjectId) url.searchParams.set('subjectId', params.subjectId.toString());
        if (params.studentId) url.searchParams.set('studentId', params.studentId.toString());
        await downloadBlob(url, `wykaz-ocen-${generateTimestamp()}.${params.format}`);
    }
};

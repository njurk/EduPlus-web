import { API_URL, getHeaders } from './core';

const downloadFile = async (url: URL) => {
    const response = await fetch(url.toString(), { headers: getHeaders() });
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'download';

    if (contentDisposition) {
        filename = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1]?.replace(/%/g, decodeURIComponent)
            ?? contentDisposition.match(/filename="?([^";]+)"?/i)?.[1]?.trim()
            ?? filename;
    }

    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    link.click();
};

export const exportApi = {
    downloadSchedulePdf: async (classId: number, yearId?: number, semesterId?: number): Promise<void> => {
        const url = new URL(`${API_URL}/export/schedule/pdf`);
        url.searchParams.append('classId', classId.toString());
        if (yearId) url.searchParams.append('yearId', yearId.toString());
        if (semesterId) url.searchParams.append('semesterId', semesterId.toString());
        await downloadFile(url);
    },
    downloadScheduleXlsx: async (classId: number, yearId?: number, semesterId?: number): Promise<void> => {
        const url = new URL(`${API_URL}/export/schedule/xlsx`);
        url.searchParams.append('classId', classId.toString());
        if (yearId) url.searchParams.append('yearId', yearId.toString());
        if (semesterId) url.searchParams.append('semesterId', semesterId.toString());
        await downloadFile(url);
    },
    downloadScheduleCsv: async (classId: number, yearId?: number, semesterId?: number): Promise<void> => {
        const url = new URL(`${API_URL}/export/schedule/csv`);
        url.searchParams.append('classId', classId.toString());
        if (yearId) url.searchParams.append('yearId', yearId.toString());
        if (semesterId) url.searchParams.append('semesterId', semesterId.toString());
        await downloadFile(url);
    },
    downloadScheduleDocx: async (classId: number, yearId?: number, semesterId?: number): Promise<void> => {
        const url = new URL(`${API_URL}/export/schedule/docx`);
        url.searchParams.append('classId', classId.toString());
        if (yearId) url.searchParams.append('yearId', yearId.toString());
        if (semesterId) url.searchParams.append('semesterId', semesterId.toString());
        await downloadFile(url);
    }
};

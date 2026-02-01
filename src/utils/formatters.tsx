type DateFormat = 'datetime' | 'date';

export function formatDate(dateString?: string | null, format: DateFormat = 'datetime'): string {
    if (!dateString) return '-';
    try {
        const d = new Date(dateString);
        if (format === 'date') {
            return d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });
        }
        return d.toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
        return '-';
    }
}

export const formatDateTime = (dateString?: string | null) => formatDate(dateString, 'datetime');
export const formatDateOnly = (dateString?: string | null) => formatDate(dateString, 'date');

export const formatName = (user?: { firstName: string; lastName: string } | null): string => {
    if (!user) return 'Nieznany użytkownik';
    return `${user.lastName} ${user.firstName}`;
};

import type { ReactNode } from 'react';

type DateFormat = 'datetime' | 'date';

export function formatDate(dateString?: string | null, format: DateFormat = 'datetime'): ReactNode {
    if (!dateString) return '-';
    try {
        const d = new Date(dateString);
        const options: Intl.DateTimeFormatOptions = format === 'date'
            ? { day: '2-digit', month: '2-digit', year: 'numeric' }
            : { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
        return <span className="whitespace-nowrap">{d.toLocaleString('pl-PL', options)}</span>;
    } catch {
        return '-';
    }
}

export const formatDateTime = (dateString?: string | null): ReactNode => formatDate(dateString, 'datetime');
export const formatDateOnly = (dateString?: string | null): ReactNode => formatDate(dateString, 'date');

export const formatName = (user?: { firstName: string; lastName: string } | null): string => {
    if (!user) return 'Nieznany użytkownik';
    return `${user.lastName} ${user.firstName}`;
};

export const formatFullDate = (date: Date): string =>
    date.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });


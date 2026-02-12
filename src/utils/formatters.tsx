import type { ReactNode } from 'react';

export function formatDateTime(dateString?: string | null): ReactNode {
    if (!dateString) return '-';
    try {
        const d = new Date(dateString);
        return <span className="whitespace-nowrap">{d.toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>;
    } catch {
        return '-';
    }
}

export function formatDateOnly(dateString?: string | null): ReactNode {
    if (!dateString) return '-';
    try {
        const d = new Date(dateString);
        return <span className="whitespace-nowrap">{d.toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>;
    } catch {
        return '-';
    }
}

export const formatName = (user?: { firstName: string; lastName: string } | null): string => {
    if (!user) return 'Nieznany użytkownik';
    return `${user.lastName} ${user.firstName}`;
};

export const formatFullDate = (date: Date): string =>
    date.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });


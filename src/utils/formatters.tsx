export const formatDateTime = (dateString?: string | null): string => {
    if (!dateString) return '-';
    try {
        return new Date(dateString).toLocaleString('pl-PL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return '-';
    }
};

export const formatTime = (dateString?: string | null): string => {
    if (!dateString) return '-';
    try {
        return new Date(dateString).toLocaleTimeString('pl-PL', {
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return '-';
    }
};

export const formatFullDate = (dateString?: string | null): string => {
    if (!dateString) return '-';
    try {
        return new Date(dateString).toLocaleDateString('pl-PL', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch {
        return '-';
    }
};

export const formatName = (user?: { firstName: string; lastName: string } | null): string => {
    if (!user) return 'Nieznany użytkownik';
    return `${user.lastName} ${user.firstName}`;
};

export const formatDateOnly = (dateString?: string | null): string => {
    if (!dateString) return '-';
    try {
        return new Date(dateString).toLocaleDateString('pl-PL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch {
        return '-';
    }
};
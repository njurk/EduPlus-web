export const formatDate = (dateString?: string | null): string => {
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

export const formatName = (user?: { firstName: string; lastName: string } | null): string => {
    if (!user) return 'Nieznany użytkownik';
    return `${user.lastName} ${user.firstName}`;
};
export const getTeacherId = (): number => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id || 0;
};

export const EXCUSE_STATUS_OPTIONS = [
    { value: 'pending', label: 'Oczekujące', style: 'bg-neutral-100 text-neutral-600' },
    { value: 'accepted', label: 'Zaakceptowane', style: 'bg-success-light text-success-text' },
    { value: 'rejected', label: 'Odrzucone', style: 'bg-danger-light text-danger-text' }
] as const;

export const getExcuseStatusBadge = (isAccepted: boolean | null) => {
    const key = isAccepted === true ? 'accepted' : isAccepted === false ? 'rejected' : 'pending';
    const opt = EXCUSE_STATUS_OPTIONS.find(o => o.value === key)!;
    return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${opt.style}`}>{opt.label}</span>;
};


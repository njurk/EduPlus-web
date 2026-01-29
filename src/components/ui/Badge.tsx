interface BadgeProps {
    variant?: 'count' | 'new';
    count?: number;
    show?: boolean;
}

export const Badge = ({ variant = 'count', count, show }: BadgeProps) => {
    if (variant === 'count') {
        if (!count || count <= 0) return null;
        return (
            <span className="ml-auto bg-white text-primary text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                {count > 99 ? '99+' : count}
            </span>
        );
    }

    if (variant === 'new') {
        if (show === false || show === undefined) return null;
        return (
            <span className="px-1.5 py-0.4 text-[11px] font-bold bg-primary text-white rounded-xs ml-auto">
                nowe
            </span>
        );
    }

    return null;
};

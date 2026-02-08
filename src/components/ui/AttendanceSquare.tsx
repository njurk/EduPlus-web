import { useState } from 'react';

interface AttendanceSquareProps {
    shortCode: string;
    colorHex: string;
    isSelected: boolean;
    onClick?: () => void;
    readOnly?: boolean;
}

export const AttendanceSquare = ({ shortCode, colorHex, isSelected, onClick, readOnly }: AttendanceSquareProps) => {
    const [hovered, setHovered] = useState(false);
    const interactive = !readOnly && onClick;
    const showColor = isSelected || (interactive && hovered);

    const style = {
        backgroundColor: showColor ? colorHex : '#e5e7eb',
        color: '#fff',
    };

    if (interactive) {
        return (
            <button
                onClick={onClick}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                className={`w-7 h-7 rounded-sm text-s font-bold flex items-center justify-center ${!isSelected && !hovered ? 'opacity-40' : ''}`}
                style={style}
            >
                {shortCode}
            </button>
        );
    }

    return (
        <span
            className={`w-7 h-7 rounded-sm text-s font-bold flex items-center justify-center ${!isSelected ? 'opacity-40' : ''}`}
            style={style}
        >
            {shortCode}
        </span>
    );
};

import type { Grade } from '../../types';

interface GradeSquareProps {
    grade: Grade;
    onClick: () => void;
}

export const GradeSquare = ({ grade, onClick }: GradeSquareProps) => (
    <div
        onClick={onClick}
        className="w-6 h-6 flex items-center justify-center font-bold text-s text-white cursor-pointer rounded-sm"
        style={{ backgroundColor: grade.gradeCategory?.colorHex || '#e5e7eb' }}
    >
        {grade.gradeType?.numeric}
    </div>
);
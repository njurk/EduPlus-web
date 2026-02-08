import type { Grade } from '../../types';

interface GradeSquareProps {
    grade: Grade;
    onClick: () => void;
}

export const GradeSquare = ({ grade, onClick }: GradeSquareProps) => (
    <div
        onClick={onClick}
        className="w-8 h-8 flex items-center justify-center bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-800 font-bold text-sm cursor-pointer rounded-sm"
    >
        {grade.gradeType?.numeric}
    </div>
);
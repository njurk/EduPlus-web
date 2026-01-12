interface SubjectTileProps {
    subjectName: string;
    teacherName?: string;
    onClick: () => void;
}

export const SubjectTile = ({ subjectName, teacherName, onClick }: SubjectTileProps) => {
    return (
        <div 
            onClick={onClick}
            className="bg-white border border-neutral-300 p-5 cursor-pointer hover:border-primary hover:shadow-sm transition-all group h-full flex flex-col justify-between"
        >
            <h3 className="font-bold text-neutral-800 text-lg mb-4 group-hover:text-primary transition-colors">
                {subjectName}
            </h3>
            <div className="text-xs text-neutral-500 border-t border-neutral-100 pt-3">
                Nauczyciel: <span className="font-medium text-neutral-700 block mt-0.5 text-sm">{teacherName || '-'}</span>
            </div>
        </div>
    );
};
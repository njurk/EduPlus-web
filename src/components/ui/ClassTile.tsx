import { Users, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import type { ClassEntity } from '../../types';

interface ClassTileProps {
    data: ClassEntity;
    onClick: () => void;
    actions?: React.ReactNode;
    showStatus?: boolean;
    showFooter?: boolean;
}

export const ClassTile = ({ data, onClick, actions, showStatus, showFooter }: ClassTileProps) => {
    return (
        <div 
            onClick={onClick} 
            className={clsx(
                "group border border-neutral-200 p-3 cursor-pointer hover:border-primary bg-white relative flex flex-col justify-center min-h-[70px] transition-colors rounded-sm",
                !data.isActive && "opacity-75 bg-neutral-50"
            )}
        >
            {actions && (
                <div className="absolute top-2 right-2 flex gap-1 z-10" onClick={e => e.stopPropagation()}>
                    {actions}
                </div>
            )}
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-neutral-100 flex items-center justify-center text-primary font-bold text-sm rounded-sm shrink-0">
                    {data.level}{data.letter}
                </div>
                <div className="flex-1">
                    <div className="font-bold text-sm text-neutral-800 leading-tight">
                        Klasa {data.level}{data.letter}
                    </div>
                    {showStatus ? (
                        <div className={clsx("text-[10px] px-1.5 py-0.5 inline-block border rounded-sm leading-none mt-1", 
                            data.isActive ? "bg-success-light text-success-text border-success-light" : "bg-neutral-100 text-neutral-500 border-neutral-200")}>
                            {data.isActive ? 'Aktywna' : 'Archiwum'}
                        </div>
                    ) : (
                        !showFooter && <div className="text-xs text-neutral-500">{data.studentCount || 0} uczniów</div>
                    )}
                </div>
            </div>
            {showFooter && (
                <div className="border-t border-neutral-100 pt-2 mt-3 flex justify-between text-xs text-neutral-500">
                    <span className="flex items-center gap-1"><Users size={12} /> {data.studentCount || 0} uczniów</span>
                    <ChevronRight size={14} className="text-neutral-300 group-hover:text-primary transition-colors" />
                </div>
            )}
        </div>
    );
};
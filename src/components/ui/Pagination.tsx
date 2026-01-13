import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-center gap-4 py-4">
            <Button
                variant="secondary"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-1 text-sm py-1 px-3"
            >
                <ChevronLeft size={16} /> Poprzednia
            </Button>
            <span className="text-sm text-neutral-600 font-medium">
                Strona {currentPage} z {totalPages}
            </span>
            <Button
                variant="secondary"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 text-sm py-1 px-3"
            >
                Następna <ChevronRight size={16} />
            </Button>
        </div>
    );
};

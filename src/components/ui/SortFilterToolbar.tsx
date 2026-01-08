import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { clsx } from 'clsx';

interface SortOption {
  field: string;
  label: string;
}

interface SortFilterToolbarProps {
  search: string;
  onSearchChange: (val: string) => void;
  showInactive?: boolean;
  onToggleInactive?: () => void;
  sortBy: string;
  sortDesc: boolean;
  onSortChange: (field: string) => void;
  sortOptions: SortOption[];
  hideCreate?: boolean;
  className?: string;
}

export const SortFilterToolbar = ({
  search, onSearchChange,
  showInactive, onToggleInactive,
  sortBy, sortDesc, onSortChange,
  sortOptions,
  className
}: SortFilterToolbarProps) => {

  return (
    <div className={clsx("px-4 py-3 border-b flex flex-col sm:flex-row justify-between items-center gap-4", className)}>
      <div className="flex items-center gap-4 flex-1 w-full sm:w-auto">
        <SearchBar value={search} onChange={onSearchChange} className="w-full sm:max-w-xs bg-white" />
        <div className="flex gap-4 border-l pl-4  overflow-x-auto">
          {sortOptions.map((option) => (
            <button
              key={option.field}
              onClick={() => onSortChange(option.field)}
              className={clsx(
                "flex items-center gap-1 text-sm font-medium transition-colors whitespace-nowrap",
                sortBy === option.field ? "text-primary" : "text-neutral-700 hover:text-neutral-900"
              )}
            >
              {option.label}
              {sortBy === option.field ? (sortDesc ? <ArrowDown size={14} /> : <ArrowUp size={14} />) : <ArrowUpDown size={14} className="opacity-50" />}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {onToggleInactive && (
          <label className="flex items-center cursor-pointer text-sm text-neutral-700 hover:text-neutral-900 select-none whitespace-nowrap">
            <input
              type="checkbox"
              checked={showInactive || false}
              onChange={onToggleInactive}
              className="mr-2 rounded text-primary focus:ring-primary border-neutral-300"
            />
            Kosz
          </label>
        )}
      </div>
    </div>
  );
};
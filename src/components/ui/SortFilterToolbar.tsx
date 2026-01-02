import { Search, ArrowUpDown, ArrowUp, ArrowDown, Plus } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
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
  onCreate: () => void;
  sortOptions: SortOption[];
  createLabel?: string;
}

export const SortFilterToolbar = ({ 
  search, onSearchChange, 
  showInactive, onToggleInactive, 
  sortBy, sortDesc, onSortChange, 
  onCreate, sortOptions, createLabel = "Dodaj"
}: SortFilterToolbarProps) => {
  
  return (
    <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-100 flex flex-col sm:flex-row justify-between items-center gap-4">
      <div className="flex items-center gap-4 flex-1 w-full sm:w-auto">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 text-neutral-300" size={18} />
          <Input 
            placeholder="Szukaj..." 
            value={search} 
            onChange={(e) => onSearchChange(e.target.value)} 
            className="pl-9 bg-white"
          />
        </div>
        
        <div className="flex gap-4 border-l pl-4 border-neutral-300 overflow-x-auto">
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
              {sortBy === option.field ? (sortDesc ? <ArrowDown size={14}/> : <ArrowUp size={14}/>) : <ArrowUpDown size={14} className="opacity-50"/>}
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
            Pokaż nieaktywne
          </label>
        )}
        <Button onClick={onCreate}>
          <Plus size={16} className="mr-2 inline"/> {createLabel}
        </Button>
      </div>
    </div>
  );
};
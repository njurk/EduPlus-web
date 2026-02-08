import { Edit2, Trash2, RefreshCcw, Eye, type LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

export interface ActionButtonsProps {
  isActive?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onRestore?: () => void;
  onDetails?: () => void;
  className?: string;
  editLabel?: string;
  editIcon?: LucideIcon;
}

export const ActionButtons = ({
  isActive = true,
  onEdit,
  onDelete,
  onRestore,
  onDetails,
  className,
  editIcon: EditIcon = Edit2
}: ActionButtonsProps) => {

  const handleClick = (e: React.MouseEvent, handler?: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    if (handler) {
      handler();
    }
  };

  if (!isActive) {
    return (
      <div className={clsx("flex justify-end gap-1", className)}>
        {onDetails && (
          <button type="button" onClick={(e) => handleClick(e, onDetails)} className="p-1.5 text-neutral-600 hover:bg-neutral-100 rounded-xs">
            <Eye size={16} />
          </button>
        )}
        {onRestore && (
          <button type="button" onClick={(e) => handleClick(e, onRestore)} className="p-1.5 text-success hover:bg-success-light rounded-xs">
            <RefreshCcw size={16} />
          </button>
        )}
        {onDelete && (
          <button type="button" onClick={(e) => handleClick(e, onDelete)} className="p-1.5 text-danger hover:bg-danger-light rounded-xs">
            <Trash2 size={16} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={clsx("flex justify-end gap-1", className)}>
      {onDetails && (
        <button type="button" onClick={(e) => handleClick(e, onDetails)} className="p-1.5 text-neutral-600 hover:bg-neutral-100 rounded-xs">
          <Eye size={16} />
        </button>
      )}
      {onEdit && (
        <button type="button" onClick={(e) => handleClick(e, onEdit)} className="p-1.5 text-primary hover:bg-neutral-100 rounded-xs">
          <EditIcon size={16} />
        </button>
      )}
      {onDelete && (
        <button type="button" onClick={(e) => handleClick(e, onDelete)} className="p-1.5 text-danger hover:bg-neutral-100 rounded-xs">
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
};

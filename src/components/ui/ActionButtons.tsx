import { Edit2, Trash2, RefreshCcw, Eye } from 'lucide-react';
import { clsx } from 'clsx';

interface ActionButtonsProps {
  isActive?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onRestore?: () => void;
  onDetails?: () => void;
  className?: string;
}

export const ActionButtons = ({
  isActive = true,
  onEdit,
  onDelete,
  onRestore,
  onDetails,
  className
}: ActionButtonsProps) => {

  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (!isActive) {
    return (
      <div className={clsx("flex justify-end gap-1", className)} onClick={stopPropagation}>
        {onRestore && (
          <button onClick={onRestore} title="Przywróć" className="p-1.5 text-success hover:bg-success-light rounded-xs">
            <RefreshCcw size={16} />
          </button>
        )}
        {onDelete && (
          <button onClick={onDelete} title="Usuń trwale" className="p-1.5 text-danger hover:bg-danger-light rounded-xs">
            <Trash2 size={16} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={clsx("flex justify-end gap-1", className)} onClick={stopPropagation}>
      {onDetails && (
        <button onClick={onDetails} title="Szczegóły" className="p-1.5 text-neutral-600 hover:bg-neutral-100 rounded-xs">
          <Eye size={16} />
        </button>
      )}
      {onEdit && (
        <button onClick={onEdit} title="Edytuj" className="p-1.5 text-primary hover:bg-neutral-100 rounded-xs">
          <Edit2 size={16} />
        </button>
      )}
      {onDelete && (
        <button onClick={onDelete} title="Usuń" className="p-1.5 text-danger hover:bg-neutral-100 rounded-xs">
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
};
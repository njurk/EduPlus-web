import { Edit2, Trash2, RefreshCcw } from 'lucide-react';
import { clsx } from 'clsx';

interface ActionButtonsProps {
  isActive?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onRestore?: () => void;
  className?: string;
}

export const ActionButtons = ({
  isActive = true,
  onEdit,
  onDelete,
  onRestore,
  className
}: ActionButtonsProps) => {

  if (!isActive) {
    return (
      <div className={clsx("flex justify-end gap-1", className)}>
        {onRestore && (
          <button
            onClick={onRestore}
            title="Przywróć"
            className="p-1.5 text-success hover:bg-success-light rounded transition-colors"
          >
            <RefreshCcw size={16} />
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            title="Usuń trwale"
            className="p-1.5 text-danger hover:bg-danger-light rounded transition-colors"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={clsx("flex justify-end gap-1", className)}>
      {onEdit && (
        <button
          onClick={onEdit}
          title="Edytuj"
          className="p-1.5 text-primary hover:bg-neutral-100 rounded transition-colors"
        >
          <Edit2 size={16} />
        </button>
      )}
      {onDelete && (
        <button
          onClick={onDelete}
          title="Usuń"
          className="p-1.5 text-danger hover:bg-neutral-100 rounded transition-colors"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
};
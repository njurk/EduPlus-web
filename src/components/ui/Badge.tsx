import { clsx } from 'clsx';

export const Badge = ({ active }: { active: boolean }) => (
  <span className={clsx(
    "px-2 py-0.5 text-xs font-semibold uppercase tracking-wide",
    active 
      ? "bg-success-light text-success-text" 
      : "bg-danger-light text-danger-text"
  )}>
    {active ? "Aktywny" : "Nieaktywny"}
  </span>
);
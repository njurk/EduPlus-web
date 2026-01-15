import { clsx } from 'clsx';

export const Input = ({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={clsx(
      "w-full px-3 py-1.5 text-sm border border-neutral-300 focus:border-primary focus:ring-0 outline-none transition-colors rounded-xs placeholder:text-neutral-300 bg-white text-neutral-900",
      className
    )}
    {...props}
  />
);
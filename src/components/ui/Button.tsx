import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}

export const Button = ({ variant = 'primary', className, ...props }: ButtonProps) => {
  const baseStyles = "px-4 py-1.5 flex text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 rounded-none";
  
  const variants = {
    primary: "bg-primary text-white hover:bg-primary-hover",
    secondary: "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 border border-neutral-300",
    danger: "bg-danger text-white hover:bg-danger-hover",
    ghost: "bg-transparent hover:bg-neutral-100 text-neutral-700"
  };

  return <button className={clsx(baseStyles, variants[variant], className)} {...props} />;
};
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  children?: React.ReactNode;
}

export const Button = ({ variant = 'primary', className, ...props }: ButtonProps) => {
  const baseStyles = "px-2 py-1 flex items-center text-sm font-medium transition-colors rounded-xs disabled:opacity-50";

  const variants = {
    primary: "bg-primary text-white border border-primary hover:bg-primary-hover",
    secondary: "bg-white text-neutral-700 hover:bg-neutral-50 border border-neutral-300",
    danger: "bg-danger text-white border border-danger hover:bg-danger-hover",
    ghost: "bg-transparent hover:bg-neutral-100 text-neutral-700 border border-transparent"
  };

  return <button className={clsx(baseStyles, variants[variant], className)} {...props} />;
};
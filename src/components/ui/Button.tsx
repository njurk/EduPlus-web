import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'soft';
  children?: React.ReactNode;
}

export const Button = ({ variant = 'primary', className, ...props }: ButtonProps) => {
  const base = "px-2 py-1 flex items-center text-sm font-medium transition-colors rounded-xs disabled:opacity-50";

  const variantStyles: Record<string, string> = {
    primary: "bg-primary text-white border border-primary hover:bg-primary-hover",
    outline: "bg-white text-neutral-700 hover:bg-neutral-50 border border-neutral-300",
    danger: "bg-danger text-white border border-danger hover:bg-danger-hover",
    soft: "bg-transparent hover:bg-neutral-100 text-neutral-700 border border-transparent"
  };

  return <button className={clsx(base, variantStyles[variant], className)} {...props} />;
};
import React from 'react';
import { Printer } from 'lucide-react';

interface PrintButtonProps {
  className?: string;
  label?: string;
}

const PrintButton: React.FC<PrintButtonProps> = ({ className = "", label }) => {
  const baseStyles = "flex items-center justify-center p-2 rounded-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  const defaultColor = className.includes('bg-') ? "" : "bg-green-700 text-white hover:bg-green-800 focus:ring-green-600";

  return (
    <button 
      onClick={() => window.print()}
      className={`${baseStyles} ${defaultColor} ${className}`}
      title="Drukuj"
      aria-label="Drukuj"
    >
      <Printer size={20} className={label ? "mr-2" : ""} />
      {label && <span>{label}</span>}
    </button>
  );
};

export default PrintButton;
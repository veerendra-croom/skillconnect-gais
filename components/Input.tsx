
import React, { ReactNode } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

const Input: React.FC<InputProps> = ({ label, error, icon, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-bold text-gray-800 mb-1.5 ml-1">{label}</label>}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500 z-10">
            {icon}
          </div>
        )}
        <input
          className={`input-field w-full ${icon ? 'pl-11' : 'px-4'} pr-4 py-3 bg-white text-gray-900 placeholder-gray-500 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all ${
            error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-300 hover:border-gray-400'
          } ${className}`}
          style={{ backgroundColor: '#ffffff', color: '#111827' }} 
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600 font-medium ml-1">{error}</p>}
    </div>
  );
};

export default Input;

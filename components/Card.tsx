import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hover?: boolean;
  noPadding?: boolean;
  glass?: boolean;
  active?: boolean;
}

const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  hover = false, 
  noPadding = false,
  glass = false,
  active = false,
  ...props 
}) => {
  return (
    <div 
      className={`
        relative overflow-hidden rounded-2xl transition-all duration-300
        ${glass 
          ? 'glass' 
          : 'bg-white border border-gray-100'}
        ${hover 
          ? 'hover:-translate-y-1 hover:shadow-xl hover:shadow-gray-200/50 cursor-pointer' 
          : 'shadow-sm shadow-gray-200/50'}
        ${active ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
        ${!noPadding ? 'p-6' : ''} 
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
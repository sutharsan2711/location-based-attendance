import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
  glass?: boolean;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  action,
  className = '',
  glass = false,
  onClick,
}) => {
  const cardStyle = glass
    ? 'glass rounded-3xl shadow-xl'
    : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm';

  return (
    <div onClick={onClick} className={`${cardStyle} p-6 transition-all duration-300 ${className}`}>
      {(title || subtitle || action) && (
        <div className="flex items-center justify-between border-b border-slate-100/50 dark:border-slate-800 pb-4 mb-5">
          <div>
            {title && <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
};

export default Card;

import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = Inbox,
  action,
}) => {
  return (
    <div
      className="flex flex-col items-center justify-center p-12 text-center rounded-xl my-4"
      style={{
        backgroundColor: 'rgba(18, 18, 18, 0.4)',
        border: '1px dashed #242424',
      }}
    >
      <div
        className="flex items-center justify-center rounded-full mb-4"
        style={{
          width: '56px',
          height: '56px',
          backgroundColor: 'rgba(212, 175, 55, 0.08)',
          border: '1px solid rgba(212, 175, 55, 0.2)',
          color: '#D4AF37',
        }}
      >
        <Icon size={26} />
      </div>
      <h4 className="text-base font-semibold text-white mb-1.5">{title}</h4>
      <p className="text-sm text-muted max-w-sm mb-6 leading-relaxed">{description}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all btn-gold"
          style={{
            background: 'linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)',
            color: '#070707',
            border: 'none',
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;


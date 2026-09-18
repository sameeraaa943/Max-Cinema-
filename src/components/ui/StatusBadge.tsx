import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const s = (status || '').toUpperCase();

  let bg = 'rgba(138, 138, 138, 0.12)';
  let text = '#8A8A8A';
  let border = 'rgba(138, 138, 138, 0.3)';

  if (s === 'ACTIVE' || s === 'ONLINE' || s === 'PUBLIC') {
    bg = 'rgba(34, 197, 94, 0.12)';
    text = '#4ade80';
    border = 'rgba(34, 197, 94, 0.3)';
  } else if (s === 'INACTIVE' || s === 'OFFLINE' || s === 'CANCELED') {
    bg = 'rgba(239, 68, 68, 0.12)';
    text = '#f87171';
    border = 'rgba(239, 68, 68, 0.3)';
  } else if (s === 'DRAFT' || s === 'PRIVATE') {
    bg = 'rgba(234, 179, 8, 0.12)';
    text = '#facc15';
    border = 'rgba(234, 179, 8, 0.3)';
  } else if (s === 'RETURNING') {
    bg = 'rgba(59, 130, 246, 0.12)';
    text = '#60a5fa';
    border = 'rgba(59, 130, 246, 0.3)';
  } else if (s === 'UPCOMING') {
    bg = 'rgba(168, 85, 247, 0.12)';
    text = '#c084fc';
    border = 'rgba(168, 85, 247, 0.3)';
  } else if (s === 'ENDED') {
    bg = 'rgba(148, 163, 184, 0.12)';
    text = '#94a3b8';
    border = 'rgba(148, 163, 184, 0.3)';
  }

  const isSmall = size === 'sm';

  return (
    <span
      className="inline-flex items-center gap-1.5 font-medium rounded-full tracking-wider uppercase"
      style={{
        backgroundColor: bg,
        color: text,
        border: `1px solid ${border}`,
        fontSize: isSmall ? '10px' : '12px',
        padding: isSmall ? '2px 8px' : '4px 12px',
        lineHeight: 1.4,
      }}
    >
      <span
        className="rounded-full"
        style={{
          width: isSmall ? '5px' : '6px',
          height: isSmall ? '5px' : '6px',
          backgroundColor: text,
        }}
      />
      {status}
    </span>
  );
};

export default StatusBadge;


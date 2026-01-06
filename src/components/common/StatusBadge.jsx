import React from 'react';
import { STATE_LABELS, STATE_COLORS } from '../../constants/workflowStates';

export default function StatusBadge({ status, size = 'md' }) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <span className={`
      inline-flex items-center font-medium rounded-full
      ${STATE_COLORS[status]}
      ${sizeClasses[size]}
    `}>
      {STATE_LABELS[status]}
    </span>
  );
}

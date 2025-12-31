import React from 'react';
import { cn } from '@/lib/utils';

const statusStyles = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const statusLabels = {
  pending: "Pending",
  delivered: "Delivered",
};

export default function StatusBadge({ status, className }) {
  // Treat any non-delivered status as "pending" (2-status model)
  const normalizedStatus = status === 'delivered' ? 'delivered' : 'pending';
  
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border",
      statusStyles[normalizedStatus],
      className
    )}>
      {statusLabels[normalizedStatus]}
    </span>
  );
}
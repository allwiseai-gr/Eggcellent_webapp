import React from 'react';
import { cn } from '@/lib/utils';

const statusStyles = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-slate-100 text-slate-600 border-slate-200",
};

const statusLabels = {
  pending: "Pending",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function StatusBadge({ status, className }) {
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border",
      statusStyles[status] || statusStyles.pending,
      className
    )}>
      {statusLabels[status] || status}
    </span>
  );
}
import React from 'react';
import { cn } from '@/lib/utils';

const statusStyles = {
  new: "bg-blue-50 text-blue-700 border-blue-200",
  needs_confirmation: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-indigo-50 text-indigo-700 border-indigo-200",
  packed: "bg-purple-50 text-purple-700 border-purple-200",
  out_for_delivery: "bg-cyan-50 text-cyan-700 border-cyan-200",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-slate-100 text-slate-600 border-slate-200",
};

const statusLabels = {
  new: "New",
  needs_confirmation: "Needs Confirmation",
  confirmed: "Confirmed",
  packed: "Packed",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function StatusBadge({ status, className }) {
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border",
      statusStyles[status] || statusStyles.new,
      className
    )}>
      {statusLabels[status] || status}
    </span>
  );
}
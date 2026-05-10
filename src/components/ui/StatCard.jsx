import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StatCard({
  title,
  value,
  subtitle,
  className
}) {
  return (
    <div className={cn(
      "bg-white rounded-2xl p-5 border border-slate-100 shadow-sm",
      className
    )}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p>
        <ArrowUpRight className="w-4 h-4 text-slate-300" />
      </div>
      <p className="text-4xl font-bold text-slate-900 tracking-tight mt-2">{value}</p>
      {subtitle && (
        <p className="text-xs text-slate-500 mt-2">{subtitle}</p>
      )}
    </div>
  );
}
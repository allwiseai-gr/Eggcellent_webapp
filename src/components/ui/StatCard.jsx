import React from 'react';
import { cn } from '@/lib/utils';

const colorMap = {
  amber:   { bg: 'bg-amber-100',   icon: 'text-amber-600'   },
  orange:  { bg: 'bg-orange-100',  icon: 'text-orange-600'  },
  emerald: { bg: 'bg-emerald-100', icon: 'text-emerald-600' },
  indigo:  { bg: 'bg-indigo-100',  icon: 'text-indigo-600'  },
  violet:  { bg: 'bg-violet-100',  icon: 'text-violet-600'  },
  default: { bg: 'bg-slate-100',   icon: 'text-slate-600'   },
};

export default function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  trendUp,
  color = 'default',
  className 
}) {
  const colors = colorMap[color] ?? colorMap.default;

  return (
    <div className={cn(
      "bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow duration-300",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p>
          <p className="text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-sm text-slate-500">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              "inline-flex items-center gap-1 text-xs font-medium mt-2 px-2 py-1 rounded-full",
              trendUp ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
            )}>
              {trend}
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", colors.bg)}>
            <Icon className={cn("w-6 h-6", colors.icon)} />
          </div>
        )}
      </div>
    </div>
  );
}
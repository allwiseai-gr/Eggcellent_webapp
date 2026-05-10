import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FeaturedStatCard({ title, value, subtitle, className }) {
  return (
    <div className={cn(
      "relative bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 shadow-sm overflow-hidden",
      className
    )}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/90">{title}</p>
        <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
          <ArrowUpRight className="w-4 h-4 text-white" />
        </div>
      </div>
      <p className="text-4xl font-bold text-white tracking-tight mt-2">{value}</p>
      {subtitle && (
        <p className="text-sm text-white/90 mt-1">{subtitle}</p>
      )}
    </div>
  );
}
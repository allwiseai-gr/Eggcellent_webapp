import React from 'react';
import { cn } from '@/lib/utils';
import { Sun, Sunset, Moon } from 'lucide-react';

const windowStyles = {
  morning: { bg: "bg-amber-50", text: "text-amber-700", icon: Sun },
  noon: { bg: "bg-orange-50", text: "text-orange-700", icon: Sunset },
  evening: { bg: "bg-indigo-50", text: "text-indigo-700", icon: Moon },
};

const windowLabels = {
  morning: "Morning",
  noon: "Noon",
  evening: "Evening",
};

export default function DeliveryWindowBadge({ window, className }) {
  if (!window) return null;
  
  const style = windowStyles[window] || windowStyles.morning;
  const Icon = style.icon;

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium",
      style.bg,
      style.text,
      className
    )}>
      <Icon className="w-3 h-3" />
      {windowLabels[window] || window}
    </span>
  );
}
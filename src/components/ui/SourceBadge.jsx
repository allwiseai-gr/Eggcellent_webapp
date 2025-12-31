import React from 'react';
import { cn } from '@/lib/utils';
import { MessageCircle, Phone, Edit3, Send } from 'lucide-react';

const sourceStyles = {
  messenger: { bg: "bg-blue-50", text: "text-blue-700", icon: MessageCircle },
  viber: { bg: "bg-purple-50", text: "text-purple-700", icon: MessageCircle },
  whatsapp: { bg: "bg-green-50", text: "text-green-700", icon: MessageCircle },
  telegram: { bg: "bg-sky-50", text: "text-sky-700", icon: Send },
  phone: { bg: "bg-orange-50", text: "text-orange-700", icon: Phone },
  manual: { bg: "bg-slate-50", text: "text-slate-700", icon: Edit3 },
};

const sourceLabels = {
  messenger: "Messenger",
  viber: "Viber",
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  phone: "Phone",
  manual: "Manual",
};

export default function SourceBadge({ source, className }) {
  const style = sourceStyles[source] || sourceStyles.manual;
  const Icon = style.icon;

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium",
      style.bg,
      style.text,
      className
    )}>
      <Icon className="w-3 h-3" />
      {sourceLabels[source] || source}
    </span>
  );
}
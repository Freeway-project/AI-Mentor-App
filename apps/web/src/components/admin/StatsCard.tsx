import { ReactNode } from 'react';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  color?: 'blue' | 'green' | 'amber' | 'purple' | 'red';
  sub?: string;
}

const colorMap = {
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600', value: 'text-blue-900' },
  green: { bg: 'bg-green-50', icon: 'text-green-600', value: 'text-green-900' },
  amber: { bg: 'bg-amber-50', icon: 'text-amber-600', value: 'text-amber-900' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600', value: 'text-purple-900' },
  red: { bg: 'bg-red-50', icon: 'text-red-600', value: 'text-red-900' },
};

export function StatsCard({ label, value, icon, color = 'blue', sub }: StatsCardProps) {
  const c = colorMap[color];
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4">
      <div className={`${c.bg} p-3 rounded-lg ${c.icon} shrink-0`}>{icon}</div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <p className={`text-2xl font-bold mt-0.5 ${c.value}`}>{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  color = 'blue',
}: StatsCardProps) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
  };

  return (
    <div className={`rounded-lg border p-6 ${colors[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium mb-1">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {description && (
            <p className="text-xs mt-1 opacity-75">{description}</p>
          )}
        </div>
        <Icon className="w-8 h-8 opacity-75" />
      </div>
    </div>
  );
}

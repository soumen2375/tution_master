import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconColor?: string;
  iconBg?: string;
  trend?: { value: string; up: boolean };
  className?: string;
}

export function StatCard({ label, value, icon: Icon, iconColor = 'text-primary', iconBg = 'bg-primary/10', trend, className }: StatCardProps) {
  return (
    <div className={cn(
      'rounded-2xl border p-6 transition-all hover:shadow-md hover:-translate-y-0.5',
      className
    )}
      style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
          <p className="text-3xl font-black tracking-tight">{value}</p>
          {trend && (
            <p className={cn('text-xs font-semibold', trend.up ? 'text-green-600' : 'text-red-500')}>
              {trend.up ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        <div className={cn('p-3 rounded-xl', iconBg)}>
          <Icon size={22} className={iconColor} />
        </div>
      </div>
    </div>
  );
}

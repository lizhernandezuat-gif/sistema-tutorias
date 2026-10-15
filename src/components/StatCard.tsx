import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'default' | 'emerald' | 'rose' | 'amber' | 'blue';
  badge?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  badge
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'emerald':
        return {
          iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/30',
          valueColor: 'text-emerald-600 dark:text-emerald-400',
          cardBorder: 'border-slate-200/90 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-900/50'
        };
      case 'rose':
        return {
          iconBg: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400 border border-rose-100 dark:border-rose-500/30',
          valueColor: 'text-rose-600 dark:text-rose-400',
          cardBorder: 'border-slate-200/90 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-900/50'
        };
      case 'amber':
        return {
          iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400 border border-amber-100 dark:border-amber-500/30',
          valueColor: 'text-amber-600 dark:text-amber-400',
          cardBorder: 'border-slate-200/90 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-900/50'
        };
      case 'blue':
        return {
          iconBg: 'bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400 border border-sky-100 dark:border-sky-500/30',
          valueColor: 'text-sky-600 dark:text-sky-400',
          cardBorder: 'border-slate-200/90 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-900/50'
        };
      case 'default':
      default:
        return {
          iconBg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/30',
          valueColor: 'text-slate-900 dark:text-white',
          cardBorder: 'border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 sm:p-5 shadow-xs transition-all duration-200 flex flex-col justify-between ${styles.cardBorder}`}
    >
      <div>
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium mb-2">
          <span className="truncate pr-2">{title}</span>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${styles.iconBg}`}>
            <Icon className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          <span className={`text-2xl sm:text-3xl font-heading font-bold tracking-tight tabular-nums ${styles.valueColor}`}>
            {value}
          </span>
          {badge && (
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {badge}
            </span>
          )}
        </div>
      </div>

      {subtitle && (
        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 truncate">
          {subtitle}
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, CheckCircle2, Calendar } from 'lucide-react';
import { differenceInDays, differenceInHours, isPast, isToday, isTomorrow, format } from 'date-fns';
import { cn } from '@/lib/utils';

interface SmartDeadlineIndicatorProps {
  dueDate: string | undefined;
  status: 'active' | 'completed' | 'archived';
  compact?: boolean;
}

export function SmartDeadlineIndicator({ dueDate, status, compact = false }: SmartDeadlineIndicatorProps) {
  if (!dueDate || status === 'completed') return null;

  const due = new Date(dueDate);
  const now = new Date();
  const daysUntil = differenceInDays(due, now);
  const hoursUntil = differenceInHours(due, now);
  const overdue = isPast(due);

  const getDeadlineInfo = () => {
    if (overdue) {
      const daysOverdue = Math.abs(daysUntil);
      return {
        label: daysOverdue === 0 ? 'Overdue' : `${daysOverdue}d overdue`,
        variant: 'destructive' as const,
        icon: AlertTriangle,
        className: 'bg-destructive text-destructive-foreground animate-pulse',
      };
    }

    if (isToday(due)) {
      return {
        label: hoursUntil <= 3 ? `${hoursUntil}h left` : 'Due today',
        variant: 'default' as const,
        icon: Clock,
        className: 'bg-amber-500 text-white',
      };
    }

    if (isTomorrow(due)) {
      return {
        label: 'Tomorrow',
        variant: 'secondary' as const,
        icon: Calendar,
        className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
      };
    }

    if (daysUntil <= 3) {
      return {
        label: `${daysUntil} days`,
        variant: 'secondary' as const,
        icon: Calendar,
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      };
    }

    if (daysUntil <= 7) {
      return {
        label: `${daysUntil} days`,
        variant: 'outline' as const,
        icon: Calendar,
        className: '',
      };
    }

    return {
      label: format(due, 'MMM d'),
      variant: 'outline' as const,
      icon: Calendar,
      className: 'text-muted-foreground',
    };
  };

  const info = getDeadlineInfo();
  const Icon = info.icon;

  if (compact) {
    return (
      <span className={cn(
        "inline-flex items-center gap-1 text-xs",
        overdue && "text-destructive font-medium",
        isToday(due) && !overdue && "text-amber-600 dark:text-amber-400 font-medium"
      )}>
        <Icon className="h-3 w-3" />
        {info.label}
      </span>
    );
  }

  return (
    <Badge variant={info.variant} className={cn("gap-1", info.className)}>
      <Icon className="h-3 w-3" />
      {info.label}
    </Badge>
  );
}

// Helper component for grouping
export function getDeadlineGroup(dueDate: string | undefined, status: string): string {
  if (status === 'completed') return 'completed';
  if (!dueDate) return 'no-date';

  const due = new Date(dueDate);
  const now = new Date();
  const daysUntil = differenceInDays(due, now);

  if (isPast(due)) return 'overdue';
  if (isToday(due)) return 'today';
  if (isTomorrow(due)) return 'tomorrow';
  if (daysUntil <= 7) return 'this-week';
  return 'later';
}

export const DEADLINE_GROUP_ORDER = ['overdue', 'today', 'tomorrow', 'this-week', 'later', 'no-date', 'completed'];

export const DEADLINE_GROUP_LABELS: Record<string, string> = {
  'overdue': '⚠️ Overdue',
  'today': '📅 Due Today',
  'tomorrow': '🗓 Tomorrow',
  'this-week': '📆 This Week',
  'later': '📋 Later',
  'no-date': '📝 No Due Date',
  'completed': '✅ Completed',
};

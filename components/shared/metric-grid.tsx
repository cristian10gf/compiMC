import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

export interface MetricItem {
  label: string;
  value: ReactNode;
  className?: string;
}

interface MetricGridProps {
  items: MetricItem[];
  cols?: 2 | 3 | 4;
  className?: string;
}

const colsClass = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 md:grid-cols-3',
  4: 'grid-cols-2 md:grid-cols-4',
};

export function MetricGrid({ items, cols = 4, className }: MetricGridProps) {
  return (
    <div className={cn('grid gap-4 text-sm', colsClass[cols], className)}>
      {items.map(({ label, value, className: itemClass }) => (
        <div key={label} className={cn('bg-muted/50 rounded-lg p-3', itemClass)}>
          <span className="text-muted-foreground block">{label}</span>
          <span className="font-medium">{value}</span>
        </div>
      ))}
    </div>
  );
}

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

const statusBannerVariants = cva(
  'flex items-center gap-2 rounded-md border p-3 text-sm [&>svg]:size-5 [&>svg]:shrink-0',
  {
    variants: {
      variant: {
        success: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100 [&>svg]:text-green-600 dark:[&>svg]:text-green-400',
        error:   'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100 [&>svg]:text-red-600 dark:[&>svg]:text-red-400',
        warning: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100 [&>svg]:text-amber-600 dark:[&>svg]:text-amber-400',
        muted:   'bg-muted border-transparent text-muted-foreground [&>svg]:text-muted-foreground',
      },
    },
    defaultVariants: { variant: 'muted' },
  }
);

interface StatusBannerProps extends VariantProps<typeof statusBannerVariants> {
  icon?: ReactNode;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function StatusBanner({ variant, icon, badge, children, className }: StatusBannerProps) {
  return (
    <div className={cn(statusBannerVariants({ variant }), className)}>
      {icon}
      <div className="flex-1">{children}</div>
      {badge}
    </div>
  );
}

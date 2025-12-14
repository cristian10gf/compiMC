'use client';

/**
 * Card de característica para la página home
 */

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { ArrowRight, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeatureCardProps {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  gradient?: string;
}

export function FeatureCard({
  title,
  description,
  href,
  icon: Icon,
  gradient = 'from-blue-500 to-cyan-500',
}: FeatureCardProps) {
  return (
    <Link href={href} className="group block">
      <Card className="h-full overflow-hidden border-2 transition-all hover:border-primary hover:shadow-lg">
        <div className="flex h-full flex-col p-6">
          {/* Icon with gradient background */}
          <div
            className={cn(
              'mb-4 inline-flex size-12 items-center justify-center rounded-lg bg-gradient-to-br text-white',
              gradient
            )}
          >
            <Icon className="size-6" />
          </div>

          {/* Content */}
          <div className="flex-1 space-y-2">
            <h3 className="text-balance font-semibold text-lg group-hover:text-primary transition-colors">
              {title}
            </h3>
            <p className="text-pretty text-muted-foreground text-sm leading-relaxed">
              {description}
            </p>
          </div>

          {/* Arrow indicator */}
          <div className="mt-4 flex items-center gap-2 text-primary text-sm font-medium">
            <span>Comenzar</span>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </Card>
    </Link>
  );
}

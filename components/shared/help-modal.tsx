'use client';

/**
 * Modal de ayuda reutilizable
 * Para mostrar instrucciones y guías en cualquier sección
 */

import { useState, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
} from '@/components/ui/dialog';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HelpModalProps {
  title: string;
  description?: string;
  children: ReactNode;
  buttonLabel?: string;
  buttonVariant?: 'ghost' | 'outline' | 'default' | 'secondary';
  buttonSize?: 'sm' | 'default' | 'lg' | 'icon';
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export function HelpModal({
  title,
  description,
  children,
  buttonLabel = 'Ayuda',
  buttonVariant = 'ghost',
  buttonSize = 'sm',
  className,
  maxWidth = 'md',
}: HelpModalProps) {
  const [open, setOpen] = useState(false);

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  }[maxWidth];

  return (
    <>
      <Button
        variant={buttonVariant}
        size={buttonSize}
        onClick={() => setOpen(true)}
        className={cn('gap-1.5', className)}
      >
        <HelpCircle className="h-4 w-4" />
        {buttonSize !== 'icon' && buttonLabel}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={cn('sm:max-w-lg', maxWidthClass)}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>
          
          <DialogBody>
            {children}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
}

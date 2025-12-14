'use client';

/**
 * Botón para copiar contenido al portapapeles mejorado con Sonner
 * Usa toast notifications para mejor UX y accesibilidad
 */

import { Button } from '@/components/ui/button';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface CopyButtonProps {
  content: string;
  className?: string;
  successMessage?: string;
}

export function CopyButton({ content, className, successMessage = 'Copiado al portapapeles' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success(successMessage);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error al copiar:', error);
      toast.error('Error al copiar al portapapeles');
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={handleCopy}
      className={className}
      title={copied ? 'Copiado!' : 'Copiar'}
      aria-label={copied ? 'Copiado' : 'Copiar al portapapeles'}
    >
      {copied ? (
        <Check className="size-4 text-green-600 dark:text-green-400" />
      ) : (
        <Copy className="size-4" />
      )}
    </Button>
  );
}

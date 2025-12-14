'use client';

/**
 * Botón para copiar contenido al portapapeles
 */

import { Button } from '@/components/ui/button';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

interface CopyButtonProps {
  content: string;
  className?: string;
}

export function CopyButton({ content, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error al copiar:', error);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={handleCopy}
      className={className}
      title={copied ? 'Copiado!' : 'Copiar'}
    >
      {copied ? (
        <Check className="size-4 text-green-600 dark:text-green-400" />
      ) : (
        <Copy className="size-4" />
      )}
    </Button>
  );
}

'use client';

/**
 * Slider de símbolos para inserción rápida
 * Botones clicables con símbolos comunes: =, +, -, *, /, (, ), etc.
 */

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SymbolSliderProps {
  symbols: string[];
  onSelect: (symbol: string) => void;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary';
}

export function SymbolSlider({
  symbols,
  onSelect,
  className,
  variant = 'outline',
}: SymbolSliderProps) {
  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {symbols.map((symbol, index) => (
        <Button
          key={index}
          variant={variant}
          size="sm"
          onClick={() => onSelect(symbol)}
          className="min-w-10 font-mono font-bold"
        >
          {symbol}
        </Button>
      ))}
      <span className="flex items-center text-muted-foreground px-2">...</span>
    </div>
  );
}

/**
 * Símbolos predefinidos comunes
 */
export const commonSymbols = {
  arithmetic: ['+', '-', '*', '/', '%', '^'],
  comparison: ['=', '==', '!=', '<', '>', '<=', '>='],
  logical: ['&&', '||', '!', '&', '|'],
  delimiters: ['(', ')', '{', '}', '[', ']', ';', ',', '.'],
  regex: ['|', '*', '+', '?', '.', '(', ')', 'ε'],
  alphabet: ['a', 'b', 'c', 'd', 'e'],
};

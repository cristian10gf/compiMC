'use client';

/**
 * Componente para input de lenguajes con chips removibles
 * Ejemplo: L = {a, d} | a
 */

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface LanguageInputProps {
  languages: string[];
  onChange: (languages: string[]) => void;
  placeholder?: string;
  className?: string;
  maxLanguages?: number;
}

export function LanguageInput({
  languages,
  onChange,
  placeholder = 'Ej: L={a,d}',
  className,
  maxLanguages = 10,
}: LanguageInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !languages.includes(trimmed) && languages.length < maxLanguages) {
      onChange([...languages, trimmed]);
      setInputValue('');
    }
  };

  const handleRemove = (index: number) => {
    onChange(languages.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1"
          disabled={languages.length >= maxLanguages}
        />
        <Button
          onClick={handleAdd}
          disabled={!inputValue.trim() || languages.length >= maxLanguages}
          size="sm"
        >
          <Plus />
          Agregar
        </Button>
      </div>

      {/* Lista de lenguajes */}
      {languages.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-md border">
          {languages.map((lang, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="text-sm py-1 px-3 flex items-center gap-2"
            >
              <span className="font-mono">{lang}</span>
              <button
                onClick={() => handleRemove(index)}
                className="hover:text-destructive transition-colors"
                aria-label="Eliminar lenguaje"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Ayuda */}
      <div className="text-xs text-muted-foreground">
        {languages.length}/{maxLanguages} lenguajes agregados
      </div>
    </div>
  );
}

'use client';

/**
 * Input de gramática con múltiples producciones
 * Permite agregar/eliminar producciones dinámicamente
 */

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Production } from '@/lib/types/grammar';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GrammarInputProps {
  productions: Production[];
  onChange: (productions: Production[]) => void;
  className?: string;
}

export function GrammarInput({ productions, onChange, className }: GrammarInputProps) {
  const handleAdd = () => {
    onChange([
      ...productions,
      {
        id: `prod-${Date.now()}`,
        left: '',
        right: [],
      },
    ]);
  };

  const handleRemove = (index: number) => {
    onChange(productions.filter((_, i) => i !== index));
  };

  const handleUpdate = (index: number, field: 'left' | 'right', value: string) => {
    const updated = [...productions];
    if (field === 'left') {
      updated[index].left = value;
    } else {
      updated[index].right = value.split(/\s+/).filter(Boolean);
    }
    onChange(updated);
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium">Producciones de la Gramática</label>
        <Button onClick={handleAdd} size="sm" variant="outline">
          <Plus className="mr-1" />
          Agregar producción
        </Button>
      </div>

      <div className="space-y-2">
        {productions.map((prod, index) => (
          <Card key={prod.id} className="p-3">
            <div className="flex items-center gap-2">
              <Input
                value={prod.left}
                onChange={(e) => handleUpdate(index, 'left', e.target.value)}
                placeholder="E"
                className="w-20 text-center font-mono font-bold"
              />
              <span className="text-muted-foreground font-bold">→</span>
              <Input
                value={prod.right.join(' ')}
                onChange={(e) => handleUpdate(index, 'right', e.target.value)}
                placeholder="E + T | T"
                className="flex-1 font-mono"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(index)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {productions.length === 0 && (
        <div className="text-center py-8 text-muted-foreground border border-dashed rounded-md">
          No hay producciones. Haz clic en "Agregar producción" para comenzar.
        </div>
      )}

      {/* Ayuda */}
      <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
        <strong>Formato:</strong> Use espacios para separar símbolos. Ejemplo: "E + T" o "T * F"
      </div>
    </div>
  );
}

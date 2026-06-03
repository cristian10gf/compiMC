'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react';

export interface CustomToken {
  id: string;
  symbol: string;
  regex: string;
}

interface CustomTokensEditorProps {
  tokens: CustomToken[];
  onChange: (tokens: CustomToken[]) => void;
}

export function CustomTokensEditor({ tokens, onChange }: CustomTokensEditorProps) {
  const [newSymbol, setNewSymbol] = useState('');
  const [newRegex, setNewRegex] = useState('');
  const symbolRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    if (!newSymbol.trim()) return;
    onChange([
      ...tokens,
      { id: Date.now().toString(), symbol: newSymbol.trim(), regex: newRegex.trim() },
    ]);
    setNewSymbol('');
    setNewRegex('');
    symbolRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1">
          <label className="text-xs text-muted-foreground">Símbolo</label>
          <Input
            ref={symbolRef}
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="*"
            className="h-8 font-mono text-xs"
          />
        </div>
        <div className="flex-2 space-y-1">
          <label className="text-xs text-muted-foreground">Regex (opcional)</label>
          <Input
            value={newRegex}
            onChange={(e) => setNewRegex(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Vacío = texto exacto"
            className="h-8 font-mono text-xs"
          />
        </div>
        <Button variant="default" size="sm" onClick={handleAdd} className="h-8">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {tokens.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Tokens agregados:</p>
          <div className="flex flex-wrap gap-2">
            {tokens.map((token) => (
              <div
                key={token.id}
                className="inline-flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-1.5 text-xs"
              >
                <code className="font-mono font-semibold">{token.symbol}</code>
                {token.regex && (
                  <>
                    <span className="text-muted-foreground">→</span>
                    <code className="font-mono text-muted-foreground">{token.regex}</code>
                  </>
                )}
                <button
                  onClick={() => onChange(tokens.filter((t) => t.id !== token.id))}
                  className="ml-1 rounded-sm hover:bg-muted p-0.5 transition-colors"
                  aria-label={`Eliminar token ${token.symbol}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-2">
          Sin regex, el token detecta el texto exacto del símbolo
        </p>
      )}
    </div>
  );
}

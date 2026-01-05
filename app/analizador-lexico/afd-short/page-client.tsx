'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  LanguageInput, 
  SyntaxTreeCytoscape, 
  FollowposTable,
  TransitionTable,
  AutomataGraphCytoscape 
} from '@/components/analizador-lexico';
import { SymbolSlider, commonSymbols, CollapsibleSection } from '@/components/shared';
import { useAutomata, useHistory } from '@/hooks';
import { Loader2, TreeDeciduous, Table2, GitGraph } from 'lucide-react';

export default function AFDShortClientPage() {
  const searchParams = useSearchParams();
  const [languages, setLanguages] = useState<string[]>([]);
  const [regex, setRegex] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  
  const { automaton, isProcessing, error, buildAutomaton } = useAutomata();
  const { addEntry } = useHistory();

  // Restaurar estado desde URL al montar
  useEffect(() => {
    if (isInitialized) return;
    
    const regexParam = searchParams.get('regex');
    const languagesParam = searchParams.get('languages');
    
    if (regexParam) {
      setRegex(regexParam);
    }
    if (languagesParam) {
      setLanguages(languagesParam.split(',').filter(Boolean));
    }
    
    setIsInitialized(true);
  }, [searchParams, isInitialized]);

  const handleAnalyze = async () => {
    // Construir AFD óptimo usando árbol sintáctico
    const result = await buildAutomaton({
      regex,
      languages,
      algorithm: 'afd-short',
    });

    if (result && !error) {
      addEntry({
        type: 'lexical-afd-short',
        input: regex,
        metadata: { 
          success: true,
          algorithm: 'AFD Óptimo (Árbol Sintáctico)',
          regex,
          languages,
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuración */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración</CardTitle>
          <CardDescription>
            Ingrese una expresión regular para construir el AFD óptimo mediante el método del árbol sintáctico
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <LanguageInput
            languages={languages}
            onChange={setLanguages}
            placeholder="Ej: L={a,d}"
            maxLanguages={5}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium">Expresión Regular</label>
            <Input
              value={regex}
              onChange={(e) => setRegex(e.target.value)}
              placeholder="Ej: (a|b)*abb"
              className="font-mono"
            />
            <SymbolSlider
              symbols={commonSymbols.regex}
              onSelect={(symbol) => setRegex(prev => prev + symbol)}
              variant="outline"
            />
          </div>

          <Button
            onClick={handleAnalyze}
            disabled={!regex || isProcessing}
            className="w-full sm:w-auto"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 animate-spin" />
                Construyendo AFD...
              </>
            ) : (
              'Construir AFD (Método Árbol Sintáctico)'
            )}
          </Button>

          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resultados */}
      {automaton?.syntaxTree && (
        <div className="space-y-6">
          
          {/* ============================================= */}
          {/* SECCIÓN 1: Árbol Sintáctico */}
          {/* ============================================= */}
          <CollapsibleSection
            title="Árbol Sintáctico"
            icon={<TreeDeciduous className="h-5 w-5 text-purple-500" />}
            defaultOpen
          >
            <div className="space-y-4">
              {/* Info del árbol */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-muted/50 rounded-lg p-3">
                  <span className="text-muted-foreground block">Expresión Aumentada</span>
                  <span className="font-medium font-mono text-xs">{automaton.syntaxTree.regex}</span>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <span className="text-muted-foreground block">Alfabeto</span>
                  <span className="font-medium font-mono">
                    {'{' + automaton.syntaxTree.alphabet.filter(s => s !== '#').join(', ') + '}'}
                  </span>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <span className="text-muted-foreground block">Posiciones</span>
                  <span className="font-medium">{automaton.syntaxTree.positions.size}</span>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <span className="text-muted-foreground block">Anulable (raíz)</span>
                  <span className={`font-medium ${automaton.syntaxTree.anulable ? 'text-green-600' : 'text-red-600'}`}>
                    {automaton.syntaxTree.anulable ? 'Sí' : 'No'}
                  </span>
                </div>
              </div>

              {/* Visualización del árbol */}
              <CollapsibleSection title="Visualización del Árbol" defaultOpen>
                <SyntaxTreeCytoscape tree={automaton.syntaxTree} />
              </CollapsibleSection>
            </div>
          </CollapsibleSection>

          {/* ============================================= */}
          {/* SECCIÓN 2: Funciones del Árbol (Tabla de valores) */}
          {/* ============================================= */}
          <CollapsibleSection
            title="Funciones del Árbol (Posición, Siguiente)"
            icon={<Table2 className="h-5 w-5 text-blue-500" />}
            defaultOpen
            className='space-y-4'
          >
            {/* Tabla de posiciones y siguiente */}
            <FollowposTable tree={automaton.syntaxTree} />
          </CollapsibleSection>

          {/* ============================================= */}
          {/* SECCIÓN 3: AFD Óptimo */}
          {/* ============================================= */}
          <CollapsibleSection
            title="AFD Óptimo (Método Directo)"
            icon={<GitGraph className="h-5 w-5 text-green-500" />}
            defaultOpen
          >
            <div className="space-y-4">
              {/* Info del AFD */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-muted/50 rounded-lg p-3">
                  <span className="text-muted-foreground block">Tipo</span>
                  <span className="font-medium">AFD Óptimo</span>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <span className="text-muted-foreground block">Estados</span>
                  <span className="font-medium">{automaton.automatonAFD.states.length}</span>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <span className="text-muted-foreground block">Transiciones</span>
                  <span className="font-medium">{automaton.automatonAFD.transitions.length}</span>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <span className="text-muted-foreground block">Alfabeto</span>
                  <span className="font-medium font-mono">
                    {'{' + automaton.automatonAFD.alphabet.join(', ') + '}'}
                  </span>
                </div>
              </div>

              {/* Explicación del método */}
              <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20 p-4">
                <h4 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2">
                  Método del Árbol Sintáctico (Directo)
                </h4>
                <p className="text-sm text-muted-foreground">
                  Este método construye el AFD directamente desde el árbol sintáctico sin pasar por un AFN.
                  El estado inicial es <span className="font-mono text-blue-600 dark:text-blue-400">primeros(raíz)</span>,
                  y las transiciones se calculan usando la función <span className="font-mono text-green-600 dark:text-green-400">siguiente(i)</span>.
                  Un estado es final si contiene la posición del marcador <span className="font-mono">#</span>.
                </p>
              </div>

              {/* Tabla de transiciones */}
              <CollapsibleSection title="Tabla de Transiciones (Estado × Símbolo)" defaultOpen>
                <TransitionTable automaton={automaton.automatonAFD} />
              </CollapsibleSection>

              {/* Grafo del AFD */}
              <CollapsibleSection title="Grafo del AFD Óptimo" defaultOpen>
                <AutomataGraphCytoscape automaton={automaton.automatonAFD} />
              </CollapsibleSection>
            </div>
          </CollapsibleSection>

        </div>
      )}
    </div>
  );
}

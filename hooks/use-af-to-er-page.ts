import { useState, useCallback, useMemo } from 'react';
import { useQueryStates } from 'nuqs';
import { useAutomata } from '@/hooks';
import { useHistory } from '@/lib/context';
import { afToErSearchParams } from '@/lib/nuqs';
import { createExampleAutomaton } from '@/lib/algorithms/lexical/af-to-er';
import type { Automaton } from '@/lib/types';

interface ConversionResult {
  regex: string;
  steps: any[];
  ardenEquations: any[];
}

export function useAfToErPage() {
  const [{ inputMode, alphabetMode, customAlphabet, automaton: automatonJson }, setParams] =
    useQueryStates(afToErSearchParams);
  const { clearAutomaton, isProcessing } = useAutomata();
  const { addEntry } = useHistory();

  const [resetKey, setResetKey] = useState(0);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Parse automaton JSON from URL into typed object
  const automaton = useMemo<Automaton | null>(() => {
    if (!automatonJson) return null;
    try { return JSON.parse(automatonJson) as Automaton; }
    catch { return null; }
  }, [automatonJson]);

  // Derive effective alphabet: custom when set, otherwise auto-detect from transitions
  const effectiveAlphabet = useMemo(() => {
    if (alphabetMode === 'custom' && customAlphabet.length > 0) return customAlphabet;
    if (automaton?.transitions) {
      return [...new Set(automaton.transitions.map((t) => t.symbol))]
        .filter((s) => s && s !== 'ε')
        .sort();
    }
    return ['a', 'b'];
  }, [alphabetMode, customAlphabet, automaton]);

  // Validate automaton readiness before conversion
  const automatonValidation = useMemo(() => {
    if (!automaton) return { valid: false, message: 'No hay autómata definido' };
    if (!automaton.states.length) return { valid: false, message: 'Agrega al menos un estado' };
    if (!automaton.states.some((s) => s.isInitial)) return { valid: false, message: 'Marca un estado como inicial' };
    if (!automaton.states.some((s) => s.isFinal)) return { valid: false, message: 'Marca al menos un estado como final' };
    if (!automaton.transitions.length) return { valid: false, message: 'Agrega al menos una transición' };
    return { valid: true, message: 'Listo para convertir' };
  }, [automaton]);

  const handleAutomatonChange = useCallback(
    (newAutomaton: Automaton) => {
      setParams({ automaton: JSON.stringify(newAutomaton) });
      setResult(null);
      setError(null);
    },
    [setParams]
  );

  const loadExample = useCallback(() => {
    const example = createExampleAutomaton();
    setParams({ automaton: JSON.stringify(example) });
    setResult(null);
    setError(null);
  }, [setParams]);

  const handleReset = useCallback(() => {
    setParams({ automaton: null, customAlphabet: [], inputMode: 'visual', alphabetMode: 'auto' });
    setResult(null);
    setError(null);
    setResetKey((prev) => prev + 1);
    clearAutomaton();
  }, [clearAutomaton, setParams]);

  // Conversion uses dynamic import to keep afToERByStateElimination out of the initial bundle
  const handleConvert = useCallback(async () => {
    if (!automaton) { setError('Debes definir un autómata primero'); return; }
    try {
      setError(null);
      if (!automaton.states.some((s) => s.isInitial))
        throw new Error('El autómata debe tener un estado inicial');
      if (!automaton.states.some((s) => s.isFinal))
        throw new Error('El autómata debe tener al menos un estado final');

      const { afToERByStateElimination } = await import('@/lib/algorithms/lexical/af-to-er');
      const conversionResult = afToERByStateElimination(automaton);
      setResult(conversionResult);

      addEntry({
        type: 'lexical-af-to-er',
        input: `AF con ${automaton.states.length} estados → ER`,
        metadata: {
          success: true,
          description: `Resultado: ${conversionResult.regex}`,
          algorithm: 'state-elimination',
          inputMode,
          alphabetMode,
          customAlphabet: customAlphabet.length > 0 ? customAlphabet : undefined,
          automatonJson: JSON.stringify(automaton),
        },
      });
    } catch (err: any) {
      setError(err.message || 'Error al convertir el autómata a expresión regular');
    }
  }, [automaton, addEntry, inputMode, alphabetMode, customAlphabet]);

  return {
    // URL state for inline JSX reads/writes
    inputMode,
    alphabetMode,
    customAlphabet,
    setParams,
    // Derived from URL
    automaton,
    effectiveAlphabet,
    automatonValidation,
    // Local state
    result,
    error,
    resetKey,
    // Hook state
    isProcessing,
    // Handlers
    handleAutomatonChange,
    loadExample,
    handleReset,
    handleConvert,
  };
}

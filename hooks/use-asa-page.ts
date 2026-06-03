import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useQueryStates } from 'nuqs';
import { useAscendenteAnalysis, useHistory } from '@/hooks';
import { asaSearchParams } from '@/lib/nuqs';
import type { PrecedenceStep, PrecedenceTable as PrecedenceTableType, ParsingResult } from '@/lib/types';
import type { LRAnalysisType } from '@/lib/types/syntax-analysis';

export function useAsaPage() {
  const [{ grammar, terminals, method, lrType, testString }, setParams] =
    useQueryStates(asaSearchParams);
  const { addEntry } = useHistory();

  const {
    state,
    isProcessing,
    error,
    analyze,
    analyzeLR,
    recognizeString,
    recognizeStringLR,
    setLRType,
    updatePrecedenceTable,
    hasAnalysis,
  } = useAscendenteAnalysis();

  const [isAutomatic, setIsAutomatic] = useState(true);
  const [localSteps, setLocalSteps] = useState<PrecedenceStep[] | null>(null);

  const initialValues = useMemo(
    () => ({ grammarText: grammar, terminals }),
    [grammar, terminals]
  );

  // Auto-analyze on URL navigation (history back/forward)
  const hasAutoAnalyzed = useRef(false);

  useEffect(() => {
    hasAutoAnalyzed.current = false;
  }, [grammar, terminals, method]);

  useEffect(() => {
    if (grammar && grammar.trim() && !hasAutoAnalyzed.current && !hasAnalysis) {
      hasAutoAnalyzed.current = true;
      if (method === 'precedence') {
        analyze({ grammarText: grammar, terminals, mode: 'automatic', autoDetectTerminals: false });
      } else {
        analyzeLR({ grammarText: grammar, terminals, autoDetectTerminals: false });
      }
    }
  }, [grammar, terminals, method, analyze, analyzeLR, hasAnalysis]);

  // Sync lrType URL param → hook state
  useEffect(() => {
    const mapped = lrType.toUpperCase() as LRAnalysisType;
    if (mapped === 'SLR' || mapped === 'LR1' || mapped === 'LALR') {
      setLRType(mapped);
    }
  }, [lrType, setLRType]);

  const handleAnalyze = useCallback(
    async (grammarText: string, terminalStr: string) => {
      setLocalSteps(null);
      setParams({ grammar: grammarText, terminals: terminalStr, testString: '' });

      if (method === 'precedence') {
        await analyze({ grammarText, terminals: terminalStr, mode: 'automatic', autoDetectTerminals: false });
        addEntry({
          type: 'syntax-precedence',
          input: grammarText.split('\n')[0] + '...',
          metadata: { success: !error, grammarText, terminals: terminalStr, method: 'precedence' },
        });
      } else {
        await analyzeLR({ grammarText, terminals: terminalStr, autoDetectTerminals: false });
        addEntry({
          type: 'syntax-lr',
          input: grammarText.split('\n')[0] + '...',
          metadata: {
            success: !error,
            grammarText,
            terminals: terminalStr,
            method: 'lr',
            lrType: state.lrAnalysis?.selectedType?.toLowerCase() as 'slr' | 'lr1' | 'lalr' | undefined,
          },
        });
      }
    },
    [analyze, analyzeLR, method, addEntry, error, state.lrAnalysis?.selectedType, setParams]
  );

  const handleModeChange = useCallback(
    (automatic: boolean) => {
      setIsAutomatic(automatic);
      setParams({ testString: '' });
      setLocalSteps(null);
    },
    [setParams]
  );

  const handleGenerateSteps = useCallback(
    (steps: PrecedenceStep[], table?: PrecedenceTableType) => {
      setLocalSteps(steps);
      if (table) updatePrecedenceTable(table, steps);
    },
    [updatePrecedenceTable]
  );

  const handleRecognize = useCallback(
    async (input: string) => {
      setParams({ testString: input });
      return recognizeString(input, state.precedenceTable || undefined);
    },
    [recognizeString, state.precedenceTable, setParams]
  );

  const handleTestStringChange = useCallback(
    (value: string) => { setParams({ testString: value }); },
    [setParams]
  );

  const handleRecognizeLR = useCallback(
    async (input: string, type: LRAnalysisType): Promise<ParsingResult | null> => {
      setParams({ testString: input });
      return recognizeStringLR(input, type);
    },
    [recognizeStringLR, setParams]
  );

  const handleLRTypeChange = useCallback(
    (type: LRAnalysisType) => { setLRType(type); },
    [setLRType]
  );

  return {
    // URL state for inline JSX reads
    grammar,
    terminals,
    method,
    lrType,
    testString,
    setParams,
    // Analysis state
    state,
    isProcessing,
    error,
    hasAnalysis,
    // Local UI state
    isAutomatic,
    localSteps,
    // Anti-pattern fix: expose analysis state directly (replaces useState+useEffect in the old page)
    localGrammar: state.grammar,
    validationResult: state.operatorValidation,
    // Computed
    initialValues,
    hasLRAnalysis: state.lrAnalysis !== null,
    hasPrecedenceAnalysis: state.precedenceTable !== null || state.operatorValidation !== null,
    // Handlers
    handleAnalyze,
    handleModeChange,
    handleGenerateSteps,
    handleRecognize,
    handleTestStringChange,
    handleRecognizeLR,
    handleLRTypeChange,
  };
}

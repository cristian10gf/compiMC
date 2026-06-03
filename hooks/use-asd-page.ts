import { useCallback, useMemo, useEffect, useRef } from 'react';
import { useQueryStates } from 'nuqs';
import { useDescendenteAnalysis, useHistory } from '@/hooks';
import { asdSearchParams } from '@/lib/nuqs';
import type { ParsingResult } from '@/lib/types';

export function useAsdPage() {
  const [{ grammar, terminals, autoDetect, testString }, setParams] =
    useQueryStates(asdSearchParams);
  const { addEntry } = useHistory();

  const {
    state,
    recognition,
    isProcessing,
    error,
    analyze,
    recognizeString,
    hasAnalysis,
  } = useDescendenteAnalysis();

  // Memo-ize to stabilize the object reference passed to GrammarInputEnhanced
  const initialValues = useMemo(
    () => ({ grammarText: grammar, terminals, autoDetect }),
    [grammar, terminals, autoDetect]
  );

  // Auto-analyze when URL params are present (history navigation)
  const hasAutoAnalyzed = useRef(false);

  useEffect(() => {
    hasAutoAnalyzed.current = false;
  }, [grammar, terminals, autoDetect]);

  useEffect(() => {
    if (grammar && grammar.trim() && !hasAutoAnalyzed.current && !hasAnalysis) {
      hasAutoAnalyzed.current = true;
      analyze({ grammarText: grammar, terminals, autoDetectTerminals: autoDetect });
    }
  }, [grammar, terminals, autoDetect, analyze, hasAnalysis]);

  const handleAnalyze = useCallback(
    async (grammarText: string, terminalStr: string, autoDetectTerminals: boolean) => {
      setParams({ grammar: grammarText, terminals: terminalStr, autoDetect: autoDetectTerminals });
      await analyze({ grammarText, terminals: terminalStr, autoDetectTerminals });
      addEntry({
        type: 'syntax-ll',
        input: grammarText.split('\n')[0] + '...',
        metadata: { success: !error, grammarText, terminals: terminalStr, autoDetectTerminals },
      });
    },
    [analyze, addEntry, error, setParams]
  );

  const handleRecognize = useCallback(
    async (input: string): Promise<ParsingResult | null> => {
      setParams({ testString: input });
      return recognizeString(input);
    },
    [recognizeString, setParams]
  );

  return {
    // URL state exposed for inline JSX reads
    testString,
    setParams,
    // Analysis state
    state,
    recognition,
    isProcessing,
    error,
    hasAnalysis,
    // Derived
    initialValues,
    // Handlers
    handleAnalyze,
    handleRecognize,
  };
}

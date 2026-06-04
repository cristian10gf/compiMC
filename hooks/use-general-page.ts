import { useState, useMemo, useEffect, useCallback } from 'react';
import { useQueryStates } from 'nuqs';
import { toast } from 'sonner';
import { useCompilerFull, useHistory } from '@/hooks';
import { compilerSearchParams } from '@/lib/nuqs';
import { createCustomTokenPatterns } from '@/lib/algorithms/general/compiler';
import type { CustomToken } from '@/components/general/custom-tokens-editor';

export function useGeneralPage() {
  const [{ code, tokens: tokensJson }, setParams] = useQueryStates(compilerSearchParams);
  const { addEntry } = useHistory();
  const {
    sourceCode,
    result,
    isProcessing,
    error,
    setSourceCode,
    compile: compileCode,
  } = useCompilerFull();

  const [activeTab, setActiveTab] = useState<'analysis' | 'synthesis'>('analysis');
  const [customTokens, setCustomTokens] = useState<CustomToken[]>([]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  // Initialize sourceCode from URL on mount only
  useEffect(() => {
    if (code) setSourceCode(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize customTokens from URL JSON on mount only
  useEffect(() => {
    if (!tokensJson) return;
    try {
      const parsed = JSON.parse(tokensJson);
      setCustomTokens(
        parsed.map((t: { symbol: string; regex: string }, idx: number) => ({
          id: `${Date.now()}-${idx}`,
          symbol: t.symbol,
          regex: t.regex,
        }))
      );
    } catch { /* invalid JSON — ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const customPatterns = useMemo(
    () => createCustomTokenPatterns(customTokens),
    [customTokens]
  );

  const handleCompile = useCallback(async () => {
    setParams({
      code: sourceCode,
      tokens:
        customTokens.length > 0
          ? JSON.stringify(customTokens.map((t) => ({ symbol: t.symbol, regex: t.regex })))
          : null,
    });
    await compileCode(customPatterns);
    addEntry({
      type: 'compiler',
      input: sourceCode.substring(0, 50) + (sourceCode.length > 50 ? '...' : ''),
      metadata: {
        success: !error,
        sourceCode,
        customTokens:
          customTokens.length > 0
            ? customTokens.map((t) => ({ symbol: t.symbol, regex: t.regex }))
            : undefined,
      },
    });
  }, [sourceCode, customTokens, customPatterns, compileCode, addEntry, error, setParams]);

  return {
    sourceCode,
    setSourceCode,
    result,
    isProcessing,
    error,
    activeTab,
    setActiveTab,
    customTokens,
    setCustomTokens,
    handleCompile,
  };
}

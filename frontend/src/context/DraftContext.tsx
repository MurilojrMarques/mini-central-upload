import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Draft, DraftPayload } from '../types';

const STORAGE_KEY = 'mini-central-draft';

const emptyDraft: Draft = { payload: {}, step: 0 };

interface DraftContextType {
  draft: Draft;
  updatePayload: (patch: Partial<DraftPayload>) => void;
  setStep: (step: number) => void;
  setIdempotencyKey: (key: string) => void;
  setPreflightSessionId: (sessionId: string) => void;
  reset: () => void;
}

const DraftContext = createContext<DraftContextType | null>(null);

export function DraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<Draft>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : emptyDraft;
    } catch {
      return emptyDraft;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [draft]);

  const updatePayload = (patch: Partial<DraftPayload>) =>
    setDraft((d) => ({ ...d, payload: { ...d.payload, ...patch } }));

  const setStep = (step: number) => setDraft((d) => ({ ...d, step }));

  const setIdempotencyKey = (idempotencyKey: string) =>
    setDraft((d) => ({ ...d, idempotencyKey }));

  const setPreflightSessionId = (preflightSessionId: string) =>
    setDraft((d) => ({ ...d, preflightSessionId }));

  const reset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setDraft(emptyDraft);
  };

  return (
    <DraftContext.Provider
      value={{ draft, updatePayload, setStep, setIdempotencyKey, setPreflightSessionId, reset }}> 
       {children}
    </DraftContext.Provider>
  );
}

export function useDraft() {
  const ctx = useContext(DraftContext);
  if (!ctx) throw new Error('useDraft precisa estar dentro de DraftProvider');
  return ctx;
}
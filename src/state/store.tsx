import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import type { AppState, PensionAccount, Profile, SavingsAccount } from '../lib/types';
import type { ImportResult } from '../integrations/connectors';
import { calcSummary, type PensionSummary } from '../lib/calc';

const STORAGE_KEY = 'boost-pensjon-v1';

export const defaultState: AppState = {
  profile: {
    name: '',
    birthYear: 1985,
    salary: 650_000,
    startWorkAge: 24,
    withdrawalAge: 67,
    afp: 'privat',
    tjenestepensjon: 'innskudd',
    employerRate: 5,
    employerRateAbove71G: 0,
    employerStandardFee: 0.3,
    targetPercent: 80,
    payoutReturn: 2,
  },
  pensionAccounts: [],
  savings: [],
  connections: [],
};

type Action =
  | { type: 'profile'; patch: Partial<Profile> }
  | { type: 'upsertPension'; account: PensionAccount }
  | { type: 'removePension'; id: string }
  | { type: 'upsertSavings'; account: SavingsAccount }
  | { type: 'removeSavings'; id: string }
  | { type: 'import'; connectorId: string; result: ImportResult }
  | { type: 'disconnect'; connectorId: string }
  | { type: 'reset' };

const sameAccount = (a: PensionAccount, b: PensionAccount) =>
  a.id === b.id || (a.provider === b.provider && a.kind === b.kind && a.active === b.active);
// Merk: EPK og EPK-S hos samme leverandør regnes som ulike kontoer.

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'profile':
      return { ...state, profile: { ...state.profile, ...action.patch } };
    case 'upsertPension': {
      const exists = state.pensionAccounts.some((a) => a.id === action.account.id);
      return {
        ...state,
        pensionAccounts: exists
          ? state.pensionAccounts.map((a) => (a.id === action.account.id ? action.account : a))
          : [...state.pensionAccounts, action.account],
      };
    }
    case 'removePension':
      return { ...state, pensionAccounts: state.pensionAccounts.filter((a) => a.id !== action.id) };
    case 'upsertSavings': {
      const exists = state.savings.some((a) => a.id === action.account.id);
      return {
        ...state,
        savings: exists
          ? state.savings.map((a) => (a.id === action.account.id ? action.account : a))
          : [...state.savings, action.account],
      };
    }
    case 'removeSavings':
      return { ...state, savings: state.savings.filter((a) => a.id !== action.id) };
    case 'import': {
      const { result, connectorId } = action;
      const now = new Date().toISOString();
      // Fjern duplikater: samme konto kan komme både fra Norsk Pensjon og direkte fra leverandøren.
      // Nyeste import vinner, men brukerens egne valg (aksjeandel, med i beregning) beholdes.
      let pensionAccounts = state.pensionAccounts;
      for (const acc of result.pensionAccounts ?? []) {
        const prev = pensionAccounts.find((a) => sameAccount(a, acc));
        pensionAccounts = [
          ...pensionAccounts.filter((a) => !sameAccount(a, acc)),
          prev ? { ...acc, stockShare: prev.stockShare, profile: prev.profile } : acc,
        ];
      }
      let savings = state.savings;
      for (const s of result.savings ?? []) {
        const prev = savings.find((x) => x.id === s.id);
        savings = [
          ...savings.filter((x) => x.id !== s.id),
          prev ? { ...s, includeInPension: prev.includeInPension, agreement: prev.agreement, monthly: prev.monthly } : s,
        ];
      }
      const connections = [
        ...state.connections.filter((c) => c.connectorId !== connectorId),
        {
          connectorId,
          connectedAt: state.connections.find((c) => c.connectorId === connectorId)?.connectedAt ?? now,
          lastSync: now,
        },
      ];
      return {
        ...state,
        pensionAccounts,
        savings,
        connections,
        profile:
          result.folketrygdBeholdning != null
            ? { ...state.profile, folketrygdBeholdning: result.folketrygdBeholdning }
            : state.profile,
      };
    }
    case 'disconnect':
      return {
        ...state,
        connections: state.connections.filter((c) => c.connectorId !== action.connectorId),
        pensionAccounts: state.pensionAccounts.filter((a) => a.source !== action.connectorId),
        savings: state.savings.filter((s) => s.source !== action.connectorId),
      };
    case 'reset':
      return defaultState;
  }
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as AppState;
    return { ...defaultState, ...parsed, profile: { ...defaultState.profile, ...parsed.profile } };
  } catch {
    return defaultState;
  }
}

interface Ctx {
  state: AppState;
  summary: PensionSummary;
  dispatch: React.Dispatch<Action>;
}

const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* lagring er ikke kritisk */
    }
  }, [state]);
  const summary = useMemo(() => calcSummary(state), [state]);
  return <StoreContext.Provider value={{ state, summary, dispatch }}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore må brukes inne i StoreProvider');
  return ctx;
}

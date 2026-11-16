// Koblinger mot pensjonsleverandører, Norsk Pensjon, NAV og banker.
//
// Alle koblinger implementerer samme grensesnitt (Connector). I denne versjonen er det
// demo-implementasjoner som returnerer realistiske testdata. For produksjon byttes
// `fetch`, `updateStockShare` og `createSavingsAgreement` ut med ekte API-kall – se
// docs/INTEGRASJONER.md for hva som kreves for hver kilde (avtaler, autentisering, lisenser).

import type { PensionAccount, Profile, SavingsAccount } from '../lib/types';
import { G } from '../lib/constants';

export type ConnectorCategory = 'samlet' | 'offentlig' | 'leverandor' | 'bank';

export interface ImportResult {
  pensionAccounts?: PensionAccount[];
  savings?: SavingsAccount[];
  folketrygdBeholdning?: number;
}

export interface Connector {
  id: string;
  name: string;
  category: ConnectorCategory;
  auth: 'BankID' | 'ID-porten' | 'PSD2 (BankID)';
  description: string;
  /** Hva som hentes */
  provides: string[];
  /** Kan endre aksjeandel/investeringsprofil på pensjonskonto */
  canChangeStockShare: boolean;
  /** Kan opprette spareavtale */
  canCreateAgreement: boolean;
  fetch(profile: Profile): Promise<ImportResult>;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Enkel deterministisk "tilfeldighet" basert på navn, slik at demo-data er stabile */
function seeded(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const age = (p: Profile) => new Date().getFullYear() - p.birthYear;
const round = (v: number, to = 100) => Math.round(v / to) * to;

function demoEpk(p: Profile, provider: string, id: string, active: boolean): PensionAccount {
  const rnd = seeded(provider + p.birthYear);
  // OTP ble obligatorisk i 2006, så opptjeningen regnes fra da
  const years = Math.max(1, Math.min(age(p) - p.startWorkAge, new Date().getFullYear() - 2006));
  const balance = round(p.salary * (0.03 + rnd() * 0.02) * years * (active ? 0.5 : 0.35));
  return {
    id,
    kind: 'EPK',
    provider,
    employer: active ? 'Nåværende arbeidsgiver' : 'Tidligere arbeidsgivere',
    balance,
    stockShare: 100,
    profile: 'livsfase',
    fee: active ? 0.25 : 0.45,
    active,
    source: '',
  };
}

const norskPensjon: Connector = {
  id: 'norsk-pensjon',
  name: 'Norsk Pensjon',
  category: 'samlet',
  auth: 'BankID',
  description:
    'Samlet oversikt over pensjon fra folketrygden, tjenestepensjon (EPK, fripoliser, PKB, offentlig) og IPS hos alle norske leverandører.',
  provides: ['EPK og EPK-S', 'Fripoliser og PKB', 'Offentlig tjenestepensjon', 'IPS', 'Folketrygd (via NAV)'],
  canChangeStockShare: false,
  canCreateAgreement: false,
  async fetch(p) {
    await delay(900);
    const accounts: PensionAccount[] = [
      { ...demoEpk(p, 'Storebrand', 'np-epk-1', true), source: this.id },
      { ...demoEpk(p, 'DNB Livsforsikring', 'np-epk-2', false), source: this.id },
      {
        id: 'np-fripolise-1',
        kind: 'Fripolise',
        provider: 'Gjensidige Pensjon',
        employer: 'Tidligere arbeidsgiver',
        balance: round(p.salary * 0.12),
        stockShare: 0,
        profile: 'fast',
        fee: 0.6,
        active: false,
        source: this.id,
      },
    ];
    const savings: SavingsAccount[] = [
      {
        id: 'np-ips-1',
        name: 'IPS',
        type: 'IPS',
        provider: 'Nordnet',
        balance: round(15_000 * Math.max(1, Math.min(6, age(p) - 40))),
        monthly: 1250,
        stockShare: 100,
        fee: 0.3,
        includeInPension: true,
        source: this.id,
      },
    ];
    return {
      pensionAccounts: accounts,
      savings,
      folketrygdBeholdning: round(0.181 * Math.min(p.salary, 7.1 * G) * Math.max(0, age(p) - p.startWorkAge) * 1.05, 1000),
    };
  },
};

const nav: Connector = {
  id: 'nav',
  name: 'NAV – Din pensjon',
  category: 'offentlig',
  auth: 'ID-porten',
  description: 'Henter pensjonsbeholdningen din i folketrygden og opptjeningshistorikk.',
  provides: ['Pensjonsbeholdning', 'Opptjening per år', 'Uttaksalder og delingstall'],
  canChangeStockShare: false,
  canCreateAgreement: false,
  async fetch(p) {
    await delay(700);
    return {
      folketrygdBeholdning: round(0.181 * Math.min(p.salary, 7.1 * G) * Math.max(0, age(p) - p.startWorkAge) * 1.05, 1000),
    };
  },
};

function provider(id: string, name: string, kind: 'privat' | 'offentlig' = 'privat'): Connector {
  return {
    id,
    name,
    category: 'leverandor',
    auth: 'BankID',
    description:
      kind === 'offentlig'
        ? `Offentlig tjenestepensjon hos ${name}. Henter opptjening og forventet pensjon.`
        : `Tjenestepensjon fra arbeidsgiver hos ${name}. Henter EPK, EPK-S og fripoliser, og lar deg endre aksjeandel.`,
    provides: kind === 'offentlig' ? ['Offentlig tjenestepensjon', 'AFP-opptjening'] : ['EPK', 'EPK-S', 'Fripoliser', 'Investeringsprofil'],
    canChangeStockShare: kind === 'privat',
    canCreateAgreement: kind === 'privat',
    async fetch(p) {
      await delay(800);
      if (kind === 'offentlig') {
        const cap = Math.min(p.salary, 12 * G);
        return {
          pensionAccounts: [
            {
              id: `${id}-otp`,
              kind: 'Offentlig TP',
              provider: name,
              employer: 'Offentlig arbeidsgiver',
              balance: round(0.057 * cap * Math.max(1, age(p) - p.startWorkAge) * 0.5),
              stockShare: 0,
              profile: 'fast',
              fee: 0,
              active: p.tjenestepensjon === 'offentlig',
              source: id,
            },
          ],
        };
      }
      const epk = { ...demoEpk(p, name, `${id}-epk`, true), source: id };
      const accounts: PensionAccount[] = [epk];
      if (p.epkSelfRate > 0) {
        accounts.push({
          ...epk,
          id: `${id}-epks`,
          kind: 'EPK-S',
          balance: round(p.salary * (p.epkSelfRate / 100) * 1.5),
        });
      }
      return { pensionAccounts: accounts };
    },
  };
}

function bank(id: string, name: string, products: ('Sparekonto' | 'BSU' | 'Fond' | 'ASK' | 'Aksjer')[]): Connector {
  return {
    id,
    name,
    category: 'bank',
    auth: 'PSD2 (BankID)',
    description: `Henter sparekontoer, fond og aksjesparekonto fra ${name}. Du kan opprette spareavtaler direkte.`,
    provides: products,
    canChangeStockShare: false,
    canCreateAgreement: true,
    async fetch(p) {
      await delay(800);
      const rnd = seeded(name + p.salary);
      const names: Record<string, string> = {
        Sparekonto: 'Høyrentekonto',
        BSU: 'BSU',
        Fond: 'Indeksfond',
        ASK: 'Aksjesparekonto',
        Aksjer: 'Aksjer',
      };
      return {
        savings: products.map((t, i) => ({
          id: `${id}-${t}-${i}`,
          name: `${names[t]} – ${name}`,
          type: t,
          provider: name,
          balance: round(20_000 + rnd() * (t === 'BSU' ? 100_000 : 250_000), 1000),
          monthly: t === 'Sparekonto' ? 0 : round(500 + rnd() * 1500, 100),
          stockShare: t === 'Sparekonto' || t === 'BSU' ? 0 : 100,
          fee: t === 'Fond' || t === 'ASK' ? 0.2 : 0,
          includeInPension: t === 'Fond' || t === 'ASK' || t === 'Aksjer',
          source: id,
        })),
      };
    },
  };
}

export const CONNECTORS: Connector[] = [
  norskPensjon,
  nav,
  provider('storebrand', 'Storebrand'),
  provider('dnb-liv', 'DNB Livsforsikring'),
  provider('gjensidige-pensjon', 'Gjensidige Pensjon'),
  provider('sb1-forsikring', 'SpareBank 1 Forsikring'),
  provider('nordea-liv', 'Nordea Liv'),
  provider('if-pensjon', 'Tryg / If Pensjon'),
  provider('klp', 'KLP', 'offentlig'),
  provider('spk', 'Statens pensjonskasse', 'offentlig'),
  bank('bank-dnb', 'DNB', ['Sparekonto', 'BSU', 'Fond']),
  bank('bank-nordea', 'Nordea', ['Sparekonto', 'Fond']),
  bank('bank-sb1', 'SpareBank 1', ['Sparekonto', 'BSU', 'ASK']),
  bank('bank-danske', 'Danske Bank', ['Sparekonto', 'Fond']),
  bank('bank-handelsbanken', 'Handelsbanken', ['Sparekonto', 'Fond']),
  bank('bank-nordnet', 'Nordnet', ['ASK', 'Aksjer']),
  bank('bank-kron', 'Kron', ['ASK']),
];

export const connectorById = (id: string) => CONNECTORS.find((c) => c.id === id);

/** Sender endring av aksjeandel/investeringsprofil til leverandøren (demo) */
export async function requestStockShareChange(accountId: string, share: number, profile: 'livsfase' | 'fast') {
  await delay(600);
  return { ok: true, accountId, share, profile, reference: `ENDR-${Date.now().toString(36).toUpperCase()}` };
}

/** Oppretter spareavtale hos bank/leverandør (demo) */
export async function requestSavingsAgreement(providerName: string, monthly: number) {
  await delay(700);
  return { ok: true, providerName, monthly, reference: `AVT-${Date.now().toString(36).toUpperCase()}` };
}

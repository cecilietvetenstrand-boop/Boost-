// Felles datatyper for appen. Alle beløp er i dagens kroner (reelle verdier).

export type AfpType = 'ingen' | 'privat' | 'offentlig';
export type TjenestepensjonType = 'innskudd' | 'offentlig' | 'ingen';
export type InvestmentProfile = 'livsfase' | 'fast';

export interface Profile {
  name: string;
  birthYear: number;
  /** Brutto årslønn i dag */
  salary: number;
  /** Alder du begynte å jobbe (brukes til å anslå opptjening hvis NAV-data mangler) */
  startWorkAge: number;
  /** Ønsket uttaksalder (62–75) */
  withdrawalAge: number;
  afp: AfpType;
  tjenestepensjon: TjenestepensjonType;
  /** Arbeidsgivers innskuddssats (prosent av lønn 0–7,1G, typisk 2–7) */
  employerRate: number;
  /** Tilleggssats for lønn mellom 7,1G og 12G (0–18,1) */
  employerRateAbove71G: number;
  /** Egen sparing i EPK-S (prosent av lønn, maks 5 og maks arbeidsgivers sats) */
  epkSelfRate: number;
  /** Pensjonsbeholdning i folketrygden hentet fra NAV (valgfri) */
  folketrygdBeholdning?: number;
  /** Mål for pensjon i prosent av dagens lønn */
  targetPercent: number;
  /** Forventet årlig reell avkastning i utbetalingsfasen */
  payoutReturn: number;
}

export type PensionKind = 'EPK' | 'EPK-S' | 'Fripolise' | 'PKB' | 'Offentlig TP';

export interface PensionAccount {
  id: string;
  kind: PensionKind;
  provider: string;
  /** Hvilken arbeidsgiver kontoen stammer fra (valgfritt) */
  employer?: string;
  balance: number;
  /** Aksjeandel 0–100 (brukes ved fast profil) */
  stockShare: number;
  profile: InvestmentProfile;
  /** Årlig forvaltningskostnad i prosent */
  fee: number;
  /** Om kontoen får løpende innskudd fra nåværende arbeidsgiver */
  active: boolean;
  source: string; // 'manuell' eller id til kobling
}

export type SavingsType = 'IPS' | 'ASK' | 'Fond' | 'Aksjer' | 'Sparekonto' | 'BSU' | 'Annet';

export interface SavingsAccount {
  id: string;
  name: string;
  type: SavingsType;
  provider: string;
  balance: number;
  /** Månedlig sparebeløp */
  monthly: number;
  stockShare: number;
  fee: number;
  /** Om sparingen skal tas med i pensjonsberegningen */
  includeInPension: boolean;
  /** Opprettet som spareavtale i appen */
  agreement?: {
    startDate: string;
    dayOfMonth: number;
    status: 'aktiv' | 'pause';
  };
  source: string;
}

export interface Connection {
  connectorId: string;
  connectedAt: string;
  lastSync: string;
}

export interface AppState {
  profile: Profile;
  pensionAccounts: PensionAccount[];
  savings: SavingsAccount[];
  connections: Connection[];
}

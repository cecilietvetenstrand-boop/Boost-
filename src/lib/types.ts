// Felles datatyper for appen. Alle beløp er i dagens kroner (reelle verdier).

export type AfpType = 'ingen' | 'privat' | 'offentlig';
export type TjenestepensjonType = 'innskudd' | 'offentlig' | 'ingen';
export type InvestmentProfile = 'livsfase' | 'fast';

export interface Profile {
  name: string;
  /** Arbeidsgiver (valgfritt) */
  employer?: string;
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
  /** Pensjonsbeholdning i folketrygden hentet fra NAV (valgfri) */
  folketrygdBeholdning?: number;
  /** Arbeidsgivers avtalte pris for standardforvaltning (prosent per år). Brukes til EPK-S-kompensasjon. */
  employerStandardFee: number;
  /** Mål for pensjon i prosent av dagens lønn */
  targetPercent: number;
  /** Forventet årlig reell avkastning i utbetalingsfasen */
  payoutReturn: number;
}

/** EPK = egen pensjonskonto hos arbeidsgivers leverandør. EPK-S = egen pensjonskonto selvvalgt (du har valgt leverandør selv). */
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
  /** Hvor mye av saldoen som er opptjent i nåværende jobb (resten regnes som tidligere jobber). Tom = hele saldoen. */
  currentJobBalance?: number;
  /** Administrasjonskostnad du betaler selv, kr per år (gjelder EPK-S) */
  adminFeeKr?: number;
  source: string; // 'manuell' eller id til kobling
}

export type SavingsType = 'IPS' | 'ASK' | 'Fond' | 'VPS' | 'Aksjer' | 'Sparekonto' | 'BSU' | 'Annet';

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
    status: 'aktiv' | 'pause' | 'stoppet';
  };
  /** Valgt fond for fondskonto/ASK */
  fund?: string;
  source: string;
}

export interface Connection {
  connectorId: string;
  connectedAt: string;
  lastSync: string;
}

export type InsuranceType =
  | 'Gruppeliv'
  | 'Yrkesskade'
  | 'Behandlingsforsikring'
  | 'Livsforsikring'
  | 'Uføreforsikring'
  | 'Kritisk sykdom'
  | 'Barneforsikring'
  | 'Ektefellepensjon'
  | 'Barnepensjon'
  | 'Annet';

/** Hva forsikringen utløser: dødsfall, uførhet, sykdom eller behandling */
export type InsuranceEvent = 'død' | 'uførhet' | 'sykdom' | 'behandling' | 'barn';

export interface Insurance {
  id: string;
  type: InsuranceType;
  provider: string;
  /** Betalt av arbeidsgiver (del av pensjons- og forsikringsordningen) eller privat */
  source: 'arbeidsgiver' | 'privat';
  event: InsuranceEvent;
  /** Forsikringssum i kroner (engangsutbetaling). Tom for f.eks. behandlingsforsikring. */
  amount?: number;
  /** Løpende utbetaling per år (f.eks. ektefelle- eller barnepensjon) */
  yearlyPayout?: number;
  /** Årlig premie du betaler selv (privat) */
  yearlyPremium?: number;
  note?: string;
  source_id: string; // 'manuell', 'eksempel' eller id til kobling
}

/** Uføredekning i tjenestepensjonsordningen (uførepensjon + innskuddsfritak) */
export interface DisabilityCover {
  enabled: boolean;
  provider: string;
  /** Prosent av lønn opp til 12 G */
  percentOfSalary: number;
  /** Tillegg i G per år */
  gSupplement: number;
  /** Prosent av lønn mellom 6 G og 12 G (det NAV ikke dekker) */
  percentAbove6G: number;
  /** Innskuddsfritak: sparingen til alderspensjon fortsetter ved uførhet */
  premiumWaiver: boolean;
  /** Barnetillegg i prosent av G per barn */
  childSupplementG: number;
  children: number;
}

export interface AppState {
  profile: Profile;
  pensionAccounts: PensionAccount[];
  savings: SavingsAccount[];
  connections: Connection[];
  insurances: Insurance[];
  disability: DisabilityCover;
  /** Satt når appen viser eksempeldata */
  isExample?: boolean;
}

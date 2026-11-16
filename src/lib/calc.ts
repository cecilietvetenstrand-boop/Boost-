import * as C from './constants';
import type { AppState, DisabilityCover, Insurance, InvestmentProfile, PensionAccount, Profile, SavingsAccount } from './types';

// ---------------------------------------------------------------------------
// Hjelpefunksjoner
// ---------------------------------------------------------------------------

export const currentYear = () => new Date().getFullYear();
export const ageOf = (p: Profile) => currentYear() - p.birthYear;

/** Forventet reell årlig avkastning gitt aksjeandel (0–100) og kostnad (prosent) */
export function expectedReturn(stockShare: number, feePercent = 0): number {
  const s = clamp(stockShare, 0, 100) / 100;
  return C.REAL_RETURN_BONDS * (1 - s) + C.REAL_RETURN_STOCKS * s - feePercent / 100;
}

export function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

/** Aksjeandel i livsfaseprofil ved gitt alder */
export function lifecycleShare(age: number): number {
  if (age <= C.LIFECYCLE_START_AGE) return C.LIFECYCLE_START_SHARE;
  if (age >= C.LIFECYCLE_END_AGE) return C.LIFECYCLE_END_SHARE;
  const t = (age - C.LIFECYCLE_START_AGE) / (C.LIFECYCLE_END_AGE - C.LIFECYCLE_START_AGE);
  return C.LIFECYCLE_START_SHARE + t * (C.LIFECYCLE_END_SHARE - C.LIFECYCLE_START_SHARE);
}

export function shareAtAge(profile: InvestmentProfile, fixedShare: number, age: number) {
  return profile === 'livsfase' ? lifecycleShare(age) : fixedShare;
}

/** Antall år innskuddspensjon/IPS utbetales: minst 10 år og minst til 80 år */
export function payoutYears(withdrawalAge: number): number {
  return Math.max(C.MIN_PAYOUT_YEARS, C.MIN_PAYOUT_END_AGE - withdrawalAge);
}

/** Årlig utbetaling fra en kapital over n år med reell avkastning r (annuitet) */
export function annuity(capital: number, years: number, r: number): number {
  if (capital <= 0 || years <= 0) return 0;
  if (Math.abs(r) < 1e-9) return capital / years;
  return (capital * r) / (1 - Math.pow(1 + r, -years));
}

/** Kapital som trengs for å betale ut et årlig beløp over n år */
export function capitalForAnnuity(yearly: number, years: number, r: number): number {
  if (yearly <= 0 || years <= 0) return 0;
  if (Math.abs(r) < 1e-9) return yearly * years;
  return (yearly * (1 - Math.pow(1 + r, -years))) / r;
}

/** Månedlig sparing som trengs for å nå en kapital etter n år med årlig avkastning r */
export function monthlySavingForTarget(target: number, years: number, r: number): number {
  if (target <= 0) return 0;
  const months = Math.round(years * 12);
  if (months <= 0) return Infinity;
  const rm = Math.pow(1 + r, 1 / 12) - 1;
  if (Math.abs(rm) < 1e-12) return target / months;
  return (target * rm) / (Math.pow(1 + rm, months) - 1);
}

/**
 * Delingstall – forenklet anslag. Delingstallet øker for yngre årskull (høyere forventet levealder)
 * og synker jo senere du tar ut pensjonen.
 */
export function delingstall(birthYear: number, withdrawalAge: number): number {
  const at67 = 16.9 + 0.07 * Math.max(0, birthYear - 1963);
  return Math.max(8, at67 - 0.9 * (withdrawalAge - 67));
}

// ---------------------------------------------------------------------------
// Folketrygden
// ---------------------------------------------------------------------------

export function folketrygdYearlyAccrual(salary: number) {
  return C.FOLKETRYGD_ACCRUAL_RATE * Math.min(salary, C.FOLKETRYGD_INCOME_CAP_G * C.G);
}

export interface FolketrygdResult {
  beholdningNow: number;
  beholdningAtWithdrawal: number;
  estimatedFromSalary: boolean;
  inntektspensjon: number;
  garantipensjon: number;
  yearly: number;
  delingstall: number;
}

export function calcFolketrygd(p: Profile): FolketrygdResult {
  const age = ageOf(p);
  const yearsWorked = Math.max(0, age - p.startWorkAge);
  const estimatedFromSalary = p.folketrygdBeholdning == null || p.folketrygdBeholdning <= 0;
  const beholdningNow = estimatedFromSalary
    ? folketrygdYearlyAccrual(p.salary) * yearsWorked
    : p.folketrygdBeholdning!;
  // Opptjening frem til uttak (antar at du jobber til uttaksalder; opptjening er mulig til 75)
  const yearsLeft = Math.max(0, p.withdrawalAge - age);
  const beholdningAtWithdrawal = beholdningNow + folketrygdYearlyAccrual(p.salary) * yearsLeft;
  const d = delingstall(p.birthYear, p.withdrawalAge);
  const inntektspensjon = beholdningAtWithdrawal / d;
  // Garantipensjon gis tidligst fra 67 år
  const garantipensjon =
    p.withdrawalAge >= 67
      ? Math.max(0, C.GARANTIPENSJON_SATS_G * C.G - C.GARANTIPENSJON_AVKORTING * inntektspensjon)
      : 0;
  return {
    beholdningNow,
    beholdningAtWithdrawal,
    estimatedFromSalary,
    inntektspensjon,
    garantipensjon,
    yearly: inntektspensjon + garantipensjon,
    delingstall: d,
  };
}

// ---------------------------------------------------------------------------
// AFP
// ---------------------------------------------------------------------------

export function calcAfp(p: Profile): number {
  if (p.afp === 'ingen') return 0;
  const rate = p.afp === 'privat' ? C.AFP_PRIVAT_RATE : C.AFP_OFFENTLIG_RATE;
  const from = Math.max(13, p.startWorkAge);
  const years = Math.max(0, C.AFP_LAST_ACCRUAL_AGE - from + 1);
  const base = rate * Math.min(p.salary, C.FOLKETRYGD_INCOME_CAP_G * C.G) * years;
  // Justering for uttaksalder (fordeles over forventet levetid fra 62 år)
  const ageAdj = delingstall(p.birthYear, 62) / delingstall(p.birthYear, Math.max(62, p.withdrawalAge));
  return base * ageAdj;
}

// ---------------------------------------------------------------------------
// Tjenestepensjon
// ---------------------------------------------------------------------------

/** Årlig innskudd fra arbeidsgiver i innskuddspensjon */
export function employerContribution(p: Profile): number {
  if (p.tjenestepensjon !== 'innskudd') return 0;
  const capped = Math.min(p.salary, C.OTP_SALARY_CAP_G * C.G);
  const above = Math.max(0, capped - C.FOLKETRYGD_INCOME_CAP_G * C.G);
  return (p.employerRate / 100) * capped + (p.employerRateAbove71G / 100) * above;
}

export interface GrowthPoint {
  age: number;
  [key: string]: number;
}

/**
 * Fremskriver en saldo med årlige innskudd frem til uttaksalder.
 * Returnerer saldo ved uttak og saldo per år.
 */
export function projectBalance(opts: {
  balance: number;
  yearlyContribution: number;
  fromAge: number;
  toAge: number;
  profile: InvestmentProfile;
  stockShare: number;
  fee: number;
}): { final: number; path: { age: number; value: number }[] } {
  let b = opts.balance;
  const path = [{ age: opts.fromAge, value: b }];
  for (let a = opts.fromAge; a < opts.toAge; a++) {
    const r = expectedReturn(shareAtAge(opts.profile, opts.stockShare, a), opts.fee);
    b = b * (1 + r) + opts.yearlyContribution * (1 + r / 2);
    path.push({ age: a + 1, value: b });
  }
  return { final: b, path };
}

export interface AccountProjection {
  id: string;
  label: string;
  kind: string;
  balanceNow: number;
  balanceAtWithdrawal: number;
  yearlyContribution: number;
  yearlyPayout: number;
  path: { age: number; value: number }[];
}

/** EPK og EPK-S (selvvalgt leverandør) er samme type konto og får arbeidsgiverinnskudd når de er aktive */
export const isEpk = (a: { kind: string }) => a.kind === 'EPK' || a.kind === 'EPK-S';

/** Aksjeandel kan bare endres fra appen for kontoer hos Boost */
export const canChangeStockShare = (a: { provider: string; kind: string }) => a.provider === 'Boost' && a.kind !== 'Offentlig TP';

/**
 * Hvem betaler forvaltningen?
 * - EPK hos arbeidsgivers leverandør: arbeidsgiver betaler forvaltningen av pensjonen fra nåværende jobb
 *   (og administrasjonen). Du betaler for pensjon fra tidligere jobber, til samme pris som arbeidsgiver har avtalt.
 * - EPK-S (selvvalgt leverandør): du betaler forvaltningen av hele kapitalen, men får kompensasjon fra
 *   arbeidsgiver tilsvarende standardforvaltningen for pensjonen fra nåværende jobb. Dyrere forvaltning betaler
 *   du selv; er den billigere, blir overskuddet på kontoen. Tidligere jobber og administrasjon betaler du selv.
 * - Hvilende kontoer (fripoliser, PKB, EPK uten innskudd): du betaler alt selv.
 */
export interface FeeSplit {
  /** Kapital fra nåværende jobb */
  currentBalance: number;
  /** Kapital fra tidligere jobber */
  priorBalance: number;
  /** Netto årlig kostnad (prosent) du bærer på kapital fra nåværende jobb. Negativ = overskudd til kontoen. */
  currentFee: number;
  /** Årlig kostnad (prosent) på kapital fra tidligere jobber */
  priorFee: number;
  /** Administrasjonskostnad du betaler selv (kr per år) */
  adminFeeKr: number;
  /** Kompensasjon fra arbeidsgiver (prosent), kun EPK-S */
  compensation: number;
}

export function feeSplit(p: Profile, acc: PensionAccount): FeeSplit {
  const fromCurrentJob = acc.active && isEpk(acc);
  const currentBalance = fromCurrentJob ? Math.min(acc.balance, acc.currentJobBalance ?? acc.balance) : 0;
  const priorBalance = acc.balance - currentBalance;
  if (fromCurrentJob && acc.kind === 'EPK') {
    // Tidligere jobber: samme pris som arbeidsgiver har avtalt
    return { currentBalance, priorBalance, currentFee: 0, priorFee: acc.fee, adminFeeKr: 0, compensation: 0 };
  }
  if (fromCurrentJob && acc.kind === 'EPK-S') {
    return {
      currentBalance,
      priorBalance,
      currentFee: acc.fee - p.employerStandardFee,
      priorFee: acc.fee,
      adminFeeKr: acc.adminFeeKr ?? 0,
      compensation: p.employerStandardFee,
    };
  }
  return { currentBalance, priorBalance, currentFee: acc.fee, priorFee: acc.fee, adminFeeKr: acc.adminFeeKr ?? 0, compensation: 0 };
}

function projectPensionAccount(p: Profile, acc: PensionAccount, contribs: { emp: number }) {
  const age = ageOf(p);
  const contribution = acc.active && isEpk(acc) ? contribs.emp : 0;
  const fees = feeSplit(p, acc);
  const common = { fromAge: age, toAge: p.withdrawalAge, profile: acc.profile, stockShare: acc.stockShare };
  const current = projectBalance({ ...common, balance: fees.currentBalance, yearlyContribution: contribution - fees.adminFeeKr, fee: fees.currentFee });
  const prior = projectBalance({ ...common, balance: fees.priorBalance, yearlyContribution: 0, fee: fees.priorFee });
  const path = current.path.map((pt, i) => ({ age: pt.age, value: Math.max(0, pt.value + prior.path[i].value) }));
  const final = Math.max(0, current.final + prior.final);
  return {
    id: acc.id,
    label: `${acc.kind} – ${acc.provider}`,
    kind: acc.kind,
    balanceNow: acc.balance,
    balanceAtWithdrawal: final,
    yearlyContribution: contribution,
    yearlyPayout: annuity(final, payoutYears(p.withdrawalAge), p.payoutReturn / 100),
    path,
  } satisfies AccountProjection;
}

export interface OffentligTpResult {
  yearly: number;
  beholdningAtWithdrawal: number;
}

export function calcOffentligTp(p: Profile, accounts: PensionAccount[]): OffentligTpResult {
  if (p.tjenestepensjon !== 'offentlig') {
    // Eventuelle opptjente offentlige beholdninger fra tidligere jobber regnes likevel med
    const existing = accounts.filter((a) => a.kind === 'Offentlig TP').reduce((s, a) => s + a.balance, 0);
    const d = delingstall(p.birthYear, p.withdrawalAge);
    return { yearly: existing / d, beholdningAtWithdrawal: existing };
  }
  const age = ageOf(p);
  const capped = Math.min(p.salary, C.OTP_SALARY_CAP_G * C.G);
  const above = Math.max(0, capped - C.FOLKETRYGD_INCOME_CAP_G * C.G);
  const yearly = C.OFFENTLIG_TP_RATE * capped + C.OFFENTLIG_TP_EXTRA_RATE * above;
  const existingAccounts = accounts.filter((a) => a.kind === 'Offentlig TP');
  const existing = existingAccounts.length
    ? existingAccounts.reduce((s, a) => s + a.balance, 0)
    : yearly * Math.max(0, age - p.startWorkAge);
  const beholdning = existing + yearly * Math.max(0, p.withdrawalAge - age);
  return { yearly: beholdning / delingstall(p.birthYear, p.withdrawalAge), beholdningAtWithdrawal: beholdning };
}

// ---------------------------------------------------------------------------
// Annen sparing
// ---------------------------------------------------------------------------

/** IPS følger reglene for pensjonssparing; frie midler brukes jevnt frem til 90 år */
export function savingsPayoutYears(type: string, withdrawalAge: number) {
  return type === 'IPS' ? payoutYears(withdrawalAge) : Math.max(1, C.FREE_SAVINGS_END_AGE - withdrawalAge);
}

/** Månedlig sparing som faktisk trekkes (0 hvis avtalen er satt på pause eller stoppet) */
export function activeMonthly(s: SavingsAccount): number {
  return s.agreement && s.agreement.status !== 'aktiv' ? 0 : s.monthly;
}

export function projectSavings(p: Profile, s: SavingsAccount): AccountProjection {
  const age = ageOf(p);
  const monthly = activeMonthly(s);
  const proj = projectBalance({
    balance: s.balance,
    yearlyContribution: monthly * 12,
    fromAge: age,
    toAge: p.withdrawalAge,
    profile: 'fast',
    stockShare: s.stockShare,
    fee: s.fee,
  });
  return {
    id: s.id,
    label: s.name,
    kind: s.type,
    balanceNow: s.balance,
    balanceAtWithdrawal: proj.final,
    yearlyContribution: monthly * 12,
    yearlyPayout: annuity(proj.final, savingsPayoutYears(s.type, p.withdrawalAge), p.payoutReturn / 100),
    path: proj.path,
  };
}

// ---------------------------------------------------------------------------
// Totalberegning
// ---------------------------------------------------------------------------

export interface PensionSummary {
  age: number;
  yearsToWithdrawal: number;
  payoutYears: number;
  folketrygd: FolketrygdResult;
  afp: number;
  offentligTp: OffentligTpResult;
  pensionAccounts: AccountProjection[];
  savings: AccountProjection[];
  /** Summer per kilde (årlig, fra uttaksalder) */
  bySource: { key: string; label: string; yearly: number; lifelong: boolean; untilAge?: number }[];
  /** Total årlig pensjon i perioden fra uttak til innskuddspensjonen er ferdig utbetalt */
  totalYearly: number;
  /** Livsvarig del (etter at tidsbegrensede utbetalinger er ferdige) */
  lifelongYearly: number;
  /** Differanse mot dagens lønn */
  gapYearly: number;
  replacementRate: number;
  /** Ekstra sparing som trengs for å nå målet */
  target: TargetResult;
  employerContribution: number;
}

export interface TargetResult {
  targetYearly: number;
  shortfallYearly: number;
  capitalNeeded: number;
  monthlyNeeded: number;
  /** Månedlig sparing som trengs hvis du venter 5 år med å starte */
  monthlyNeededIfWait5: number;
  stockShareAssumed: number;
}

export function calcTarget(
  p: Profile,
  totalYearly: number,
  stockShare = 80,
  fee = 0.3,
): TargetResult {
  const age = ageOf(p);
  const targetYearly = (p.targetPercent / 100) * p.salary;
  const shortfallYearly = Math.max(0, targetYearly - totalYearly);
  const years = payoutYears(p.withdrawalAge);
  const capitalNeeded = capitalForAnnuity(shortfallYearly, years, p.payoutReturn / 100);
  const saveYears = Math.max(0, p.withdrawalAge - age);
  // Bruk gjennomsnittlig avkastning med fast aksjeandel for ny sparing
  const r = expectedReturn(stockShare, fee);
  return {
    targetYearly,
    shortfallYearly,
    capitalNeeded,
    monthlyNeeded: monthlySavingForTarget(capitalNeeded, saveYears, r),
    monthlyNeededIfWait5: monthlySavingForTarget(capitalNeeded, saveYears - 5, r),
    stockShareAssumed: stockShare,
  };
}

export function calcSummary(state: AppState): PensionSummary {
  const p = state.profile;
  const age = ageOf(p);
  const contribs = { emp: employerContribution(p) };

  const folketrygd = calcFolketrygd(p);
  const afp = calcAfp(p);
  const offentligTp = calcOffentligTp(p, state.pensionAccounts);

  const pensionAccounts: AccountProjection[] = state.pensionAccounts
    .filter((a) => a.kind !== 'Offentlig TP')
    .map((a) => projectPensionAccount(p, a, contribs));

  // Hvis brukeren har innskuddspensjon men ingen aktiv EPK/EPK-S registrert, legg til en beregnet konto
  if (p.tjenestepensjon === 'innskudd' && !state.pensionAccounts.some((a) => isEpk(a) && a.active)) {
    pensionAccounts.push(
      projectPensionAccount(
        p,
        {
          id: 'beregnet-epk',
          kind: 'EPK',
          provider: 'nåværende arbeidsgiver (beregnet)',
          balance: 0,
          stockShare: 90,
          profile: 'livsfase',
          fee: 0.3,
          active: true,
          source: 'beregnet',
        },
        contribs,
      ),
    );
  }

  const savings = state.savings.filter((s) => s.includeInPension).map((s) => projectSavings(p, s));

  const sum = (xs: AccountProjection[], pred: (x: AccountProjection) => boolean) =>
    xs.filter(pred).reduce((s, x) => s + x.yearlyPayout, 0);

  const bySource = [
    { key: 'folketrygd', label: 'Folketrygden (NAV)', yearly: folketrygd.yearly, lifelong: true },
    { key: 'afp', label: p.afp === 'offentlig' ? 'AFP offentlig' : 'AFP privat', yearly: afp, lifelong: true },
    { key: 'offentligTp', label: 'Offentlig tjenestepensjon', yearly: offentligTp.yearly, lifelong: true },
    {
      key: 'epk',
      label: 'Tjenestepensjon (EPK/EPK-S, fripoliser, PKB)',
      yearly: sum(pensionAccounts, () => true),
      lifelong: false,
      untilAge: p.withdrawalAge + payoutYears(p.withdrawalAge),
    },
    { key: 'ips', label: 'IPS', yearly: sum(savings, (x) => x.kind === 'IPS'), lifelong: false, untilAge: p.withdrawalAge + payoutYears(p.withdrawalAge) },
    {
      key: 'savings',
      label: 'Frie midler (ASK, fond, bank)',
      yearly: sum(savings, (x) => x.kind !== 'IPS'),
      lifelong: false,
      untilAge: Math.max(p.withdrawalAge + 1, C.FREE_SAVINGS_END_AGE),
    },
  ].filter((s) => s.yearly > 0.5);

  const totalYearly = bySource.reduce((s, x) => s + x.yearly, 0);
  const lifelongYearly = bySource.filter((x) => x.lifelong).reduce((s, x) => s + x.yearly, 0);

  return {
    age,
    yearsToWithdrawal: Math.max(0, p.withdrawalAge - age),
    payoutYears: payoutYears(p.withdrawalAge),
    folketrygd,
    afp,
    offentligTp,
    pensionAccounts,
    savings,
    bySource,
    totalYearly,
    lifelongYearly,
    gapYearly: p.salary - totalYearly,
    replacementRate: p.salary > 0 ? totalYearly / p.salary : 0,
    target: calcTarget(p, totalYearly),
    employerContribution: contribs.emp,
  };
}

/** Pensjon for alle uttaksaldre 62–75, for sammenligning */
export function summaryByWithdrawalAge(state: AppState) {
  const out: { age: number; total: number; lifelong: number }[] = [];
  for (let a = C.MIN_WITHDRAWAL_AGE; a <= C.MAX_WITHDRAWAL_AGE; a++) {
    if (a < ageOf(state.profile)) continue;
    const s = calcSummary({ ...state, profile: { ...state.profile, withdrawalAge: a } });
    out.push({ age: a, total: s.totalYearly, lifelong: s.lifelongYearly });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Uførhet og personforsikring
// ---------------------------------------------------------------------------

export interface DisabilityResult {
  nav: number;
  tjenestepensjon: number;
  childSupplement: number;
  total: number;
  replacementRate: number;
  gapYearly: number;
  /** Årlig innskudd til alderspensjon som fortsetter ved innskuddsfritak */
  premiumWaiverYearly: number;
  /** Engangsutbetalinger ved uførhet (uføreforsikringer) */
  lumpSum: number;
}

/** Anslått inntekt hvis du blir 100 % ufør i dag (forenklet, før skatt) */
export function calcDisability(p: Profile, d: DisabilityCover, insurances: Insurance[]): DisabilityResult {
  const nav = C.UFORETRYGD_RATE * Math.min(p.salary, C.UFORETRYGD_CAP_G * C.G);
  const capped = Math.min(p.salary, C.OTP_SALARY_CAP_G * C.G);
  const tjenestepensjon = d.enabled
    ? (d.percentOfSalary / 100) * capped + d.gSupplement * C.G + (d.percentAbove6G / 100) * Math.max(0, capped - C.UFORETRYGD_CAP_G * C.G)
    : 0;
  const childSupplement = d.enabled ? d.childSupplementG * C.G * d.children : 0;
  const total = nav + tjenestepensjon + childSupplement;
  return {
    nav,
    tjenestepensjon,
    childSupplement,
    total,
    replacementRate: p.salary > 0 ? total / p.salary : 0,
    gapYearly: Math.max(0, p.salary - total),
    premiumWaiverYearly: d.enabled && d.premiumWaiver ? employerContribution(p) : 0,
    lumpSum: insurances.filter((i) => i.event === 'uførhet').reduce((s, i) => s + (i.amount ?? 0), 0),
  };
}

export interface InsuranceSummary {
  deathLumpSum: number;
  deathYearly: number;
  disabilityLumpSum: number;
  illnessLumpSum: number;
  privatePremiumYearly: number;
  fromEmployer: number;
  private: number;
}

export function summarizeInsurances(list: Insurance[]): InsuranceSummary {
  const sum = (pred: (i: Insurance) => boolean, f: (i: Insurance) => number) => list.filter(pred).reduce((s, i) => s + f(i), 0);
  return {
    deathLumpSum: sum((i) => i.event === 'død', (i) => i.amount ?? 0),
    deathYearly: sum((i) => i.event === 'død', (i) => i.yearlyPayout ?? 0),
    disabilityLumpSum: sum((i) => i.event === 'uførhet', (i) => i.amount ?? 0),
    illnessLumpSum: sum((i) => i.event === 'sykdom', (i) => i.amount ?? 0),
    privatePremiumYearly: sum((i) => i.source === 'privat', (i) => i.yearlyPremium ?? 0),
    fromEmployer: list.filter((i) => i.source === 'arbeidsgiver').length,
    private: list.filter((i) => i.source === 'privat').length,
  };
}

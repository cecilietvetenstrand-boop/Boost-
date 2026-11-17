import { describe, expect, it } from 'vitest';
import {
  annuity,
  calcAfp,
  calcFolketrygd,
  calcSummary,
  capitalForAnnuity,
  employerContribution,
  feeSplit,
  lifecycleShare,
  monthlySavingForTarget,
  payoutYears,
} from './calc';
import { G } from './constants';
import { defaultState } from '../state/store';

const profile = { ...defaultState.profile, birthYear: new Date().getFullYear() - 40 };

describe('regler', () => {
  it('innskuddspensjon utbetales minst 10 år og til 80', () => {
    expect(payoutYears(67)).toBe(13);
    expect(payoutYears(62)).toBe(18);
    expect(payoutYears(72)).toBe(10);
  });

  it('arbeidsgiverinnskudd begrenses til 12 G', () => {
    const p = { ...profile, salary: 20 * G, employerRate: 7, employerRateAbove71G: 18.1 };
    expect(employerContribution(p)).toBeCloseTo(0.07 * 12 * G + 0.181 * 4.9 * G);
  });

  it('livsfaseprofil trapper ned', () => {
    expect(lifecycleShare(40)).toBe(90);
    expect(lifecycleShare(60)).toBe(90);
    expect(lifecycleShare(67.5)).toBeCloseTo(52.5);
    expect(lifecycleShare(75)).toBe(15);
    expect(lifecycleShare(80)).toBe(15);
  });
});

describe('matematikk', () => {
  it('annuitet og nåverdi er inverse', () => {
    const c = capitalForAnnuity(100_000, 13, 0.02);
    expect(annuity(c, 13, 0.02)).toBeCloseTo(100_000, 6);
  });
  it('månedlig sparing når målet', () => {
    const m = monthlySavingForTarget(1_000_000, 25, 0.04);
    const rm = Math.pow(1.04, 1 / 12) - 1;
    const fv = (m * (Math.pow(1 + rm, 300) - 1)) / rm;
    expect(fv).toBeCloseTo(1_000_000, 2);
  });
});

describe('pensjonsberegning', () => {
  it('folketrygd gir en rimelig andel av lønnen', () => {
    const f = calcFolketrygd(profile);
    expect(f.yearly / profile.salary).toBeGreaterThan(0.3);
    expect(f.yearly / profile.salary).toBeLessThan(0.7);
  });
  it('senere uttak gir mer per år', () => {
    expect(calcFolketrygd({ ...profile, withdrawalAge: 70 }).yearly).toBeGreaterThan(calcFolketrygd(profile).yearly);
    expect(calcAfp({ ...profile, withdrawalAge: 70 })).toBeGreaterThan(calcAfp(profile));
  });
  it('ingen AFP gir 0', () => {
    expect(calcAfp({ ...profile, afp: 'ingen' })).toBe(0);
  });
  it('annen sparing tas bare med når valgt', () => {
    const acc = { id: 'a', name: 'ASK', type: 'ASK' as const, provider: 'x', balance: 500_000, monthly: 0, stockShare: 100, fee: 0, includeInPension: false, source: 'manuell' };
    const without = calcSummary({ ...defaultState, profile, savings: [acc] });
    const withIt = calcSummary({ ...defaultState, profile, savings: [{ ...acc, includeInPension: true }] });
    expect(withIt.totalYearly).toBeGreaterThan(without.totalYearly);
  });
  it('sparebehov dekker gapet til målet', () => {
    const s = calcSummary({ ...defaultState, profile });
    expect(s.target.targetYearly).toBeCloseTo(0.8 * profile.salary);
    if (s.target.shortfallYearly > 0) expect(s.target.monthlyNeededIfWait5).toBeGreaterThan(s.target.monthlyNeeded);
  });
});

describe('kostnader EPK og EPK-S', () => {
  const base = {
    id: 'x', provider: 'L', balance: 500_000, stockShare: 100, profile: 'fast' as const, active: true, source: 'manuell',
  };
  const p = { ...profile, employerStandardFee: 0.3 };

  it('EPK: arbeidsgiver betaler nåværende jobb, du betaler tidligere jobber', () => {
    const f = feeSplit(p, { ...base, kind: 'EPK', fee: 0.4, currentJobBalance: 300_000 });
    expect(f.currentFee).toBe(0);
    expect(f.priorBalance).toBe(200_000);
    expect(f.priorFee).toBe(0.4);
    expect(f.adminFeeKr).toBe(0);
  });

  it('EPK-S: du betaler, men får kompensasjon lik standardprisen', () => {
    expect(feeSplit(p, { ...base, kind: 'EPK-S', fee: 0.5 }).currentFee).toBeCloseTo(0.2);
    // Billigere forvaltning: overskuddet blir på kontoen (negativ netto kostnad)
    expect(feeSplit(p, { ...base, kind: 'EPK-S', fee: 0.1 }).currentFee).toBeCloseTo(-0.2);
  });

  it('EPK-S med billig forvaltning gir mer enn EPK med samme pris som standard', () => {
    const acc = { ...base, kind: 'EPK' as const, fee: 0.3 };
    const epk = calcSummary({ ...defaultState, profile: p, pensionAccounts: [acc] });
    const cheap = calcSummary({ ...defaultState, profile: p, pensionAccounts: [{ ...acc, kind: 'EPK-S', fee: 0.1 }] });
    const pricey = calcSummary({ ...defaultState, profile: p, pensionAccounts: [{ ...acc, kind: 'EPK-S', fee: 0.8, adminFeeKr: 500 }] });
    expect(cheap.totalYearly).toBeGreaterThan(epk.totalYearly);
    expect(pricey.totalYearly).toBeLessThan(epk.totalYearly);
  });
});

describe('eksempeldata', () => {
  it('gir en rimelig pensjon og skiller IPS fra frie midler', async () => {
    const { exampleState } = await import('../state/example');
    const s = calcSummary(exampleState);
    expect(s.replacementRate).toBeGreaterThan(0.5);
    expect(s.replacementRate).toBeLessThan(1);
    const keys = s.bySource.map((x) => x.key);
    expect(keys).toContain('ips');
    expect(keys).not.toContain('savings');
    // Frie midler slås på manuelt og brukes til 90 år
    const all = calcSummary({ ...exampleState, savings: exampleState.savings.map((x) => ({ ...x, includeInPension: true })) });
    expect(all.bySource.find((x) => x.key === 'savings')!.untilAge).toBe(90);
    expect(all.totalYearly).toBeGreaterThan(s.totalYearly);
  });
});

describe('uførhet', () => {
  it('NAV dekker 66 % opp til 6 G, uførepensjonen resten', async () => {
    const { calcDisability } = await import('./calc');
    const d = { ...defaultState.disability, percentOfSalary: 3, gSupplement: 0.25, percentAbove6G: 66, children: 0 };
    const low = calcDisability({ ...profile, salary: 500_000 }, d, []);
    expect(low.nav).toBeCloseTo(0.66 * 500_000);
    const high = calcDisability({ ...profile, salary: 10 * G }, d, []);
    expect(high.nav).toBeCloseTo(0.66 * 6 * G);
    expect(high.tjenestepensjon).toBeCloseTo(0.03 * 10 * G + 0.25 * G + 0.66 * 4 * G);
    expect(calcDisability(profile, { ...d, enabled: false }, []).tjenestepensjon).toBe(0);
  });
});

describe('spareavtaler', () => {
  it('pause og stopp gir ingen nye innskudd', async () => {
    const { activeMonthly } = await import('./calc');
    const base = { id: 'f', name: 'Fond', type: 'Fond' as const, provider: 'x', balance: 0, monthly: 1000, stockShare: 100, fee: 0.2, includeInPension: true, source: 'app' };
    const ag = { startDate: '2026-01-01', dayOfMonth: 25 };
    expect(activeMonthly({ ...base, agreement: { ...ag, status: 'aktiv' } })).toBe(1000);
    expect(activeMonthly({ ...base, agreement: { ...ag, status: 'pause' } })).toBe(0);
    expect(activeMonthly({ ...base, agreement: { ...ag, status: 'stoppet' } })).toBe(0);
  });
});

describe('endring av aksjeandel', () => {
  it('er bare mulig hos Boost', async () => {
    const { canChangeStockShare } = await import('./calc');
    expect(canChangeStockShare({ provider: 'Boost', kind: 'EPK' })).toBe(true);
    expect(canChangeStockShare({ provider: 'Kystlys Livsforsikring', kind: 'PKB' })).toBe(false);
    expect(canChangeStockShare({ provider: 'Havbris Pensjon', kind: 'EPK' })).toBe(false);
  });
});

describe('klimaavtrykk', () => {
  it('beregner tonn CO2e fra saldo og intensitet', async () => {
    const { savingsCarbon, intensityForShare, carbonSummary } = await import('./carbon');
    expect(intensityForShare(100)).toBeCloseTo(5.5);
    expect(intensityForShare(0)).toBeCloseTo(3.5);
    const fond = { id: 'f', name: 'F', type: 'Fond' as const, provider: 'Boost', balance: 1_000_000, monthly: 0, stockShare: 100, fee: 0.2, includeInPension: true, source: 'app', fund: 'Boost Global Bærekraft' };
    expect(savingsCarbon(fond)!.tonnes).toBeCloseTo(2.5);
    const bank = { ...fond, id: 'b', type: 'Sparekonto' as const, fund: undefined };
    expect(savingsCarbon(bank)!.intensity).toBeNull();
    const sum = carbonSummary([], [fond, bank], 40);
    expect(sum.tonnes).toBeCloseTo(2.5);
    expect(sum.invested).toBe(1_000_000);
  });
});

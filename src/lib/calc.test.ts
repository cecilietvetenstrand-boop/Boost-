import { describe, expect, it } from 'vitest';
import {
  annuity,
  calcAfp,
  calcFolketrygd,
  calcSummary,
  capitalForAnnuity,
  employerContribution,
  lifecycleShare,
  maxEpksRate,
  monthlySavingForTarget,
  payoutYears,
  selfContribution,
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

  it('EPK-S er maks 5 % og maks arbeidsgivers sats', () => {
    expect(maxEpksRate({ ...profile, employerRate: 7 })).toBe(5);
    expect(maxEpksRate({ ...profile, employerRate: 3 })).toBe(3);
    expect(selfContribution({ ...profile, employerRate: 3, epkSelfRate: 5 })).toBeCloseTo(0.03 * profile.salary);
  });

  it('arbeidsgiverinnskudd begrenses til 12 G', () => {
    const p = { ...profile, salary: 20 * G, employerRate: 7, employerRateAbove71G: 18.1 };
    expect(employerContribution(p)).toBeCloseTo(0.07 * 12 * G + 0.181 * 4.9 * G);
  });

  it('livsfaseprofil trapper ned', () => {
    expect(lifecycleShare(40)).toBe(100);
    expect(lifecycleShare(75)).toBe(20);
    expect(lifecycleShare(62.5)).toBeCloseTo(60);
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

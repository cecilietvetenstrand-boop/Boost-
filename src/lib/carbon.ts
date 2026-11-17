// Klimaavtrykk for sparing og pensjon.
//
// Målet er «finansierte utslipp»: tonn CO₂-ekvivalenter (scope 1 og 2) per million kroner investert,
// slik fond rapporterer karbonavtrykk etter EUs regler for bærekraftsinformasjon (SFDR).
// Alle tall her er EKSEMPELVERDIER for demo. I en ekte løsning hentes karbonavtrykket for hvert fond
// og hver investeringsprofil fra forvalterens bærekraftsrapportering.

import type { PensionAccount, SavingsAccount } from './types';
import { FUNDS } from './funds';
import { lifecycleShare, shareAtAge } from './calc';

/** Eksempelverdier i tonn CO₂e per million kroner */
export const CARBON_STOCKS = 5.5; // bred global aksjeportefølje
export const CARBON_BONDS = 3.5; // rentepapirer fra selskaper
/** En fossilbil slipper ut omtrent 0,14 kg CO₂ per km (brukes som sammenligning) */
export const KG_CO2_PER_KM_CAR = 0.14;

/** Karbonintensitet (t CO₂e per mill. kr) for en blanding av aksjer og renter */
export function intensityForShare(stockShare: number) {
  const s = Math.max(0, Math.min(100, stockShare)) / 100;
  return s * CARBON_STOCKS + (1 - s) * CARBON_BONDS;
}

export interface CarbonItem {
  id: string;
  label: string;
  provider: string;
  balance: number;
  /** t CO₂e per mill. kr, eller null når det ikke beregnes (bankinnskudd) */
  intensity: number | null;
  /** tonn CO₂e */
  tonnes: number;
  kind: 'pensjon' | 'sparing';
}

export function pensionCarbon(a: PensionAccount, age: number): CarbonItem | null {
  if (a.kind === 'Offentlig TP' || a.balance <= 0) return null;
  const share = a.profile === 'livsfase' ? lifecycleShare(age) : shareAtAge(a.profile, a.stockShare, age);
  const intensity = intensityForShare(share);
  return { id: a.id, label: a.kind, provider: a.provider, balance: a.balance, intensity, tonnes: (a.balance / 1e6) * intensity, kind: 'pensjon' };
}

export function savingsCarbon(s: SavingsAccount): CarbonItem | null {
  if (s.balance <= 0) return null;
  // Bankinnskudd (sparekonto, BSU) har ikke et sammenlignbart karbonavtrykk
  if (s.type === 'Sparekonto' || s.type === 'BSU') {
    return { id: s.id, label: s.name, provider: s.provider, balance: s.balance, intensity: null, tonnes: 0, kind: 'sparing' };
  }
  const fund = s.fund ? FUNDS.find((f) => f.name === s.fund) : undefined;
  const intensity = fund ? fund.carbon : intensityForShare(s.stockShare);
  return { id: s.id, label: s.name, provider: s.provider, balance: s.balance, intensity, tonnes: (s.balance / 1e6) * intensity, kind: 'sparing' };
}

export interface CarbonSummary {
  items: CarbonItem[];
  tonnes: number;
  invested: number;
  /** Vektet karbonintensitet for det som er beregnet */
  intensity: number;
  carKm: number;
}

export function carbonSummary(pension: PensionAccount[], savings: SavingsAccount[], age: number): CarbonSummary {
  const items = [
    ...pension.map((a) => pensionCarbon(a, age)),
    ...savings.map((s) => savingsCarbon(s)),
  ].filter((x): x is CarbonItem => x !== null);
  const counted = items.filter((i) => i.intensity !== null);
  const tonnes = counted.reduce((s, i) => s + i.tonnes, 0);
  const invested = counted.reduce((s, i) => s + i.balance, 0);
  return {
    items,
    tonnes,
    invested,
    intensity: invested > 0 ? tonnes / (invested / 1e6) : 0,
    carKm: (tonnes * 1000) / KG_CO2_PER_KM_CAR,
  };
}

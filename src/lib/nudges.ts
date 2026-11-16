// Personlige "dytt" (nudges): små, konkrete forslag basert på brukerens egne tall.
import type { AppState } from './types';
import { calcSummary, maxSelfRate, type PensionSummary } from './calc';
import { IPS_MAX_YEARLY, TAX_RATE_ORDINARY_INCOME } from './constants';
import { kr } from './format';

export interface Nudge {
  id: string;
  tone: 'good' | 'warn' | 'info';
  title: string;
  text: string;
  action?: { label: string; tab: TabId };
}

export type TabId = 'oversikt' | 'pensjon' | 'sparing' | 'spar' | 'koblinger' | 'laer' | 'profil';

export function buildNudges(state: AppState, s: PensionSummary): Nudge[] {
  const p = state.profile;
  const out: Nudge[] = [];

  if (state.connections.length === 0) {
    out.push({
      id: 'connect',
      tone: 'info',
      title: 'Få ekte tall på 2 minutter',
      text: 'Koble til Norsk Pensjon og NAV med BankID, så henter vi alle pensjonsavtalene dine automatisk.',
      action: { label: 'Koble til', tab: 'koblinger' },
    });
  }

  const maxRate = maxSelfRate(p);
  if (p.tjenestepensjon === 'innskudd' && p.epkSelfRate < maxRate) {
    const extraRate = maxRate - p.epkSelfRate;
    const yearly = (extraRate / 100) * p.salary;
    const better = calcSummary({ ...state, profile: { ...p, epkSelfRate: maxRate } });
    out.push({
      id: 'eget-innskudd',
      tone: 'good',
      title: 'Spar selv i pensjonskontoen – med skattefradrag',
      text: `Setter du inn ${maxRate} % selv i pensjonskontoen (ca. ${kr(yearly / 12)}/mnd), får du ${kr(
        yearly * TAX_RATE_ORDINARY_INCOME,
      )} i skattefradrag i året og ca. ${kr((better.totalYearly - s.totalYearly) / 12)} mer i pensjon per måned.`,
      action: { label: 'Se eget innskudd', tab: 'pensjon' },
    });
  }

  const ips = state.savings.filter((x) => x.type === 'IPS').reduce((a, x) => a + x.monthly * 12, 0);
  if (ips < IPS_MAX_YEARLY && s.target.shortfallYearly > 0) {
    out.push({
      id: 'ips',
      tone: 'info',
      title: 'IPS gir 22 % skattefradrag',
      text: `Du kan spare ${kr(IPS_MAX_YEARLY)} i året i IPS og få ${kr(
        (IPS_MAX_YEARLY - ips) * TAX_RATE_ORDINARY_INCOME,
      )} mer i skattefradrag. Pengene er bundet til du er 62.`,
      action: { label: 'Start IPS', tab: 'spar' },
    });
  }

  const lowShare = state.pensionAccounts.filter(
    (a) => a.profile === 'fast' && a.stockShare < 60 && s.yearsToWithdrawal > 15 && a.kind !== 'Offentlig TP',
  );
  if (lowShare.length) {
    out.push({
      id: 'stocks',
      tone: 'warn',
      title: 'Lav aksjeandel med lang tid igjen',
      text: `${lowShare.length} pensjonskonto(er) har under 60 % aksjer, selv om du har ${s.yearsToWithdrawal} år til pensjon. Over lang tid gir aksjer normalt mer pensjon.`,
      action: { label: 'Endre aksjeandel', tab: 'spar' },
    });
  }

  const epk = state.pensionAccounts.find((a) => a.kind === 'EPK' && a.active);
  if (epk && epk.fee >= 0.4 && !state.pensionAccounts.some((a) => a.kind === 'EPK-S')) {
    out.push({
      id: 'epk-s',
      tone: 'info',
      title: 'Vurder EPK-S – velg leverandør selv',
      text: `Pensjonskontoen din hos ${epk.provider} koster ${epk.fee.toLocaleString('nb-NO')} % i året. Med EPK-S (egen pensjonskonto selvvalgt) kan du flytte den til en leverandør du velger selv – med samme skattefordeler.`,
      action: { label: 'Les om EPK-S', tab: 'laer' },
    });
  }

  const fripoliser = state.pensionAccounts.filter((a) => a.kind === 'Fripolise' || (a.kind === 'EPK' && !a.active && a.fee > 0.4));
  if (fripoliser.length) {
    out.push({
      id: 'fees',
      tone: 'warn',
      title: 'Samle gamle pensjoner og spar kostnader',
      text: 'Du har pensjon fra tidligere arbeidsgivere med høyere kostnader. Vurder å flytte dem inn i egen pensjonskonto hos nåværende leverandør.',
      action: { label: 'Se kontoene', tab: 'pensjon' },
    });
  }

  if (s.target.shortfallYearly > 0 && Number.isFinite(s.target.monthlyNeeded)) {
    const cost = s.target.monthlyNeededIfWait5 - s.target.monthlyNeeded;
    if (Number.isFinite(cost) && cost > 0) {
      out.push({
        id: 'wait',
        tone: 'info',
        title: 'Det koster å vente',
        text: `Starter du om 5 år i stedet for nå, må du spare ca. ${kr(cost)} mer i måneden for å nå målet.`,
        action: { label: 'Start sparing nå', tab: 'spar' },
      });
    }
  } else if (s.target.shortfallYearly <= 0) {
    out.push({
      id: 'ontrack',
      tone: 'good',
      title: 'Du er på god vei!',
      text: `Med dagens sparing ser det ut til at du når målet om ${p.targetPercent} % av lønnen. Husk å sjekke igjen hvert år.`,
    });
  }

  return out;
}

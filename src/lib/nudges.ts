// Personlige "dytt" (nudges): små, konkrete forslag basert på brukerens egne tall.
import type { AppState } from './types';
import { activeMonthly, calcSummary, canChangeStockShare, type PensionSummary } from './calc';
import { IPS_MAX_YEARLY, TAX_RATE_ORDINARY_INCOME } from './constants';
import { kr } from './format';

export interface Nudge {
  id: string;
  tone: 'good' | 'warn' | 'info';
  title: string;
  text: string;
  action?: { label: string; tab: TabId };
}

export type TabId = 'forside' | 'oversikt' | 'forsikring' | 'pensjon' | 'sparing' | 'spar' | 'koblinger' | 'laer' | 'profil';

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

  const ipsYearly = state.savings.filter((x) => x.type === 'IPS').reduce((a, x) => a + activeMonthly(x) * 12, 0);
  if (ipsYearly < IPS_MAX_YEARLY) {
    const extra = IPS_MAX_YEARLY - ipsYearly;
    const better = calcSummary({
      ...state,
      savings: [
        ...state.savings,
        { id: 'ips-preview', name: 'IPS', type: 'IPS', provider: '', balance: 0, monthly: extra / 12, stockShare: 100, fee: 0.3, includeInPension: true, source: 'app' },
      ],
    });
    out.push({
      id: 'ips',
      tone: 'good',
      title: 'Spar selv til pensjon med skattefordel: IPS',
      text: `Sparer du ${kr(extra / 12)} mer i måneden i IPS, får du ${kr(extra * TAX_RATE_ORDINARY_INCOME)} i skattefradrag i året og ca. ${kr(
        (better.totalYearly - s.totalYearly) / 12,
      )} mer i pensjon per måned.`,
      action: { label: 'Start IPS', tab: 'spar' },
    });
  }

  const lowShare = state.pensionAccounts.filter(
    (a) => a.profile === 'fast' && a.stockShare < 60 && s.yearsToWithdrawal > 15 && a.kind !== 'Offentlig TP',
  );
  const lowBoost = lowShare.filter((a) => canChangeStockShare(a));
  const lowOther = lowShare.filter((a) => !canChangeStockShare(a));
  if (lowBoost.length) {
    out.push({
      id: 'stocks',
      tone: 'warn',
      title: 'Lav aksjeandel med lang tid igjen',
      text: `${lowBoost.length} pensjonskonto(er) hos Boost har under 60 % aksjer, selv om du har ${s.yearsToWithdrawal} år til pensjon. Over lang tid gir aksjer normalt mer pensjon.`,
      action: { label: 'Endre aksjeandel', tab: 'spar' },
    });
  } else if (lowOther.length) {
    out.push({
      id: 'stocks-other',
      tone: 'info',
      title: 'Lav aksjeandel hos et annet selskap',
      text: `Pensjonen din hos ${lowOther[0].provider} har ${lowOther[0].stockShare} % aksjer, selv om du har ${s.yearsToWithdrawal} år til pensjon. Du kan endre den hos ${lowOther[0].provider}, eller samle pensjonen hos Boost og velge aksjeandel selv.`,
      action: { label: 'Se kontoene', tab: 'pensjon' },
    });
  }

  const epk = state.pensionAccounts.find((a) => a.kind === 'EPK' && a.active);
  if (epk && !state.pensionAccounts.some((a) => a.kind === 'EPK-S')) {
    out.push({
      id: 'epk-s',
      tone: 'info',
      title: 'Vurder EPK-S – velg leverandør selv',
      text: `Med EPK-S betaler du forvaltningen selv, men får ${p.employerStandardFee.toLocaleString('nb-NO')} % i kompensasjon fra arbeidsgiver. Velger du billigere forvaltning enn det, blir overskuddet på pensjonskontoen din.`,
      action: { label: 'Sammenlign', tab: 'pensjon' },
    });
  }

  const fripoliser = state.pensionAccounts.filter((a) => a.kind === 'Fripolise' || (a.kind === 'EPK' && !a.active && a.fee > 0.4));
  if (fripoliser.length) {
    out.push({
      id: 'fees',
      tone: 'warn',
      title: 'Samle gamle pensjoner og spar kostnader',
      text: 'Forvaltningen av pensjon fra tidligere jobber betaler du selv. Vurder å samle den i pensjonskontoen din – da får du samme pris som arbeidsgiveren din har avtalt.',
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

  if (!state.disability.enabled && p.tjenestepensjon !== 'ingen') {
    out.push({
      id: 'ufore',
      tone: 'warn',
      title: 'Sjekk uføredekningen din',
      text: 'Du har ikke registrert uførepensjon i pensjonsordningen. Uten den får du bare NAVs uføretrygd, som er 66 % av lønn opp til 6 G.',
      action: { label: 'Se forsikring', tab: 'forsikring' },
    });
  }

  return out;
}

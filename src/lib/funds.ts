// Nordea-fond for spareavtaler i fondskonto og aksjesparekonto.
//
// Navn, kategori og aksjeandel er hentet fra Nordeas offentlige fondssider på nordea.no (lest 16.11.2026):
//   /privat/vare-produkter/sparing-og-investering/fond/indeksfond.html
//   /privat/vare-produkter/sparing-og-investering/fond/aksjefond.html
//   /privat/vare-produkter/sparing-og-investering/fond/kombinasjonsfond.html
//   /privat/vare-produkter/sparing-og-investering/fond/nordea-plan-fond.html
//   /privat/vare-produkter/sparing-og-investering/fond/rentefond.html
//   /privat/vare-produkter/sparing-og-investering/fond/stabile-fond.html
//
// Faktiske kostnader står i Nordeas fondsliste (levert av FundConnect) og er IKKE hentet.
// `assumedFee` er et forsiktig anslag per kategori som bare brukes i beregningen,
// og skal erstattes med fondets faktiske løpende kostnad fra fondslisten.

export type FundCategory = 'Indeksfond' | 'Aksjefond' | 'Kombinasjonsfond' | 'Rentefond';

export interface Fund {
  name: string;
  category: FundCategory;
  /** Aksjeandel i prosent (for Plan-fondene: omtrentlig andel over tid, slik Nordea oppgir) */
  stockShare: number;
  info: string;
  /** Anslått årlig kostnad i prosent, kun for beregning – ikke fondets faktiske kostnad */
  assumedFee: number;
}

export const FUNDS_SOURCE = {
  label: 'nordea.no – fondssider',
  url: 'https://www.nordea.no/privat/vare-produkter/sparing-og-investering/fond/vare-fond.html',
  date: '16.11.2026',
};

export const FUNDS: Fund[] = [
  { name: 'Nordea Global Indeks Select', category: 'Indeksfond', stockShare: 100, info: 'Investerer i selskaper over hele verden', assumedFee: 0.25 },
  { name: 'Nordea Norge Indeks Select', category: 'Indeksfond', stockShare: 100, info: 'Investerer i norske selskaper', assumedFee: 0.25 },
  { name: 'Nordea Europa Indeks Select', category: 'Indeksfond', stockShare: 100, info: 'Investerer i europeiske selskaper', assumedFee: 0.25 },
  { name: 'Nordea USA Indeks Select', category: 'Indeksfond', stockShare: 100, info: 'Investerer i amerikanske selskaper', assumedFee: 0.25 },
  { name: 'Nordea Global Enhanced', category: 'Aksjefond', stockShare: 100, info: 'Globale aksjer, indeksnær forvaltning', assumedFee: 0.6 },
  { name: 'Nordea Norge Verdi', category: 'Aksjefond', stockShare: 100, info: 'Hovedsakelig selskaper på Oslo Børs', assumedFee: 1.0 },
  { name: 'Nordea Stabile Aksjer Global', category: 'Aksjefond', stockShare: 100, info: 'Globale aksjer med mål om stabil avkastning', assumedFee: 1.0 },
  { name: 'Nordea Plan Offensiv', category: 'Kombinasjonsfond', stockShare: 90, info: 'Ca. 90 % aksjer over tid', assumedFee: 0.8 },
  { name: 'Nordea Plan Vekstorientert', category: 'Kombinasjonsfond', stockShare: 70, info: 'Ca. 70 % aksjer over tid', assumedFee: 0.8 },
  { name: 'Nordea Plan Balansert', category: 'Kombinasjonsfond', stockShare: 50, info: 'Ca. 50 % aksjer over tid', assumedFee: 0.8 },
  { name: 'Nordea Plan Moderat', category: 'Kombinasjonsfond', stockShare: 30, info: 'Ca. 30 % aksjer over tid', assumedFee: 0.7 },
  { name: 'Nordea Plan Konservativ', category: 'Kombinasjonsfond', stockShare: 15, info: 'Ca. 15 % aksjer over tid', assumedFee: 0.6 },
  { name: 'Nordea FRN Kreditt Fund I', category: 'Rentefond', stockShare: 0, info: 'Obligasjoner og sertifikater fra norske banker og selskaper', assumedFee: 0.4 },
];

export const FUND_CATEGORIES: FundCategory[] = ['Indeksfond', 'Aksjefond', 'Kombinasjonsfond', 'Rentefond'];

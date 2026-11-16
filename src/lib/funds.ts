// Eksempelfond for spareavtaler i fondskonto og aksjesparekonto.
//
// Alle navn er oppdiktede (demo). Kategori og aksjeandel er typiske for slike fond.
// `assumedFee` er et anslag per kategori som bare brukes i beregningen. I en ekte løsning
// hentes fondsliste, løpende kostnad og risiko fra fondsleverandørens egne data.

export type FundCategory = 'Indeksfond' | 'Aksjefond' | 'Kombinasjonsfond' | 'Rentefond';

export interface Fund {
  name: string;
  category: FundCategory;
  /** Aksjeandel i prosent (for kombinasjonsfondene: omtrentlig andel over tid) */
  stockShare: number;
  info: string;
  /** Anslått årlig kostnad i prosent, kun for beregning – ikke fondets faktiske kostnad */
  assumedFee: number;
}


export const FUNDS: Fund[] = [
  { name: 'Boost Global Indeks', category: 'Indeksfond', stockShare: 100, info: 'Investerer i selskaper over hele verden', assumedFee: 0.25 },
  { name: 'Boost Norge Indeks', category: 'Indeksfond', stockShare: 100, info: 'Investerer i norske selskaper', assumedFee: 0.25 },
  { name: 'Boost Europa Indeks', category: 'Indeksfond', stockShare: 100, info: 'Investerer i europeiske selskaper', assumedFee: 0.25 },
  { name: 'Boost USA Indeks', category: 'Indeksfond', stockShare: 100, info: 'Investerer i amerikanske selskaper', assumedFee: 0.25 },
  { name: 'Boost Global Pluss', category: 'Aksjefond', stockShare: 100, info: 'Globale aksjer, indeksnær forvaltning', assumedFee: 0.6 },
  { name: 'Boost Norge Aksje', category: 'Aksjefond', stockShare: 100, info: 'Hovedsakelig selskaper på Oslo Børs', assumedFee: 1.0 },
  { name: 'Boost Global Stabil', category: 'Aksjefond', stockShare: 100, info: 'Globale aksjer med mål om stabil avkastning', assumedFee: 1.0 },
  { name: 'Boost Kombi Offensiv', category: 'Kombinasjonsfond', stockShare: 90, info: 'Ca. 90 % aksjer over tid', assumedFee: 0.8 },
  { name: 'Boost Kombi Vekstorientert', category: 'Kombinasjonsfond', stockShare: 70, info: 'Ca. 70 % aksjer over tid', assumedFee: 0.8 },
  { name: 'Boost Kombi Balansert', category: 'Kombinasjonsfond', stockShare: 50, info: 'Ca. 50 % aksjer over tid', assumedFee: 0.8 },
  { name: 'Boost Kombi Moderat', category: 'Kombinasjonsfond', stockShare: 30, info: 'Ca. 30 % aksjer over tid', assumedFee: 0.7 },
  { name: 'Boost Kombi Konservativ', category: 'Kombinasjonsfond', stockShare: 15, info: 'Ca. 15 % aksjer over tid', assumedFee: 0.6 },
  { name: 'Boost Rente Kreditt', category: 'Rentefond', stockShare: 0, info: 'Obligasjoner og sertifikater fra norske banker og selskaper', assumedFee: 0.4 },
];

export const FUND_CATEGORIES: FundCategory[] = ['Indeksfond', 'Aksjefond', 'Kombinasjonsfond', 'Rentefond'];

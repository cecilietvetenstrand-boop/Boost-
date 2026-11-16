# Boost – spare- og pensjonsapp

Boost gir deg en samlet oversikt over pensjonen din: hva du kan forvente fra folketrygden, arbeidsgiver (EPK/EPK-S,
offentlig tjenestepensjon), AFP og egen sparing. Appen viser hvor mye mindre du får enn dagens lønn, og hvor mye du må
spare for å nå rundt 80 % av lønnen.

## Funksjoner

| Fane | Innhold |
|---|---|
| **Oversikt** | Forventet pensjon per måned, gapet mot dagens lønn, sparebehov for å nå målet (standard 80 %), personlige forslag (nudging), pensjon ved ulike uttaksaldre og fordeling per kilde |
| **Pensjonen min** | Folketrygden (beholdning, delingstall, garantipensjon), tjenestepensjon (innskudd/offentlig), EPK og EPK-S (egen pensjonskonto selvvalgt), IPS, AFP privat/offentlig, alle pensjonskontoer og vekstgraf |
| **Annen sparing** | IPS, ASK, fond, aksjer, sparekonto og BSU – med egen bryter for om hver konto skal tas med i pensjonsberegningen |
| **Spar** | Opprett spareavtale (IPS/ASK/fond) med forhåndsvisning av effekten, og endre aksjeandel/livsfaseprofil på pensjonskontoene |
| **Koblinger** | Norsk Pensjon, NAV, pensjonsleverandører (Storebrand, DNB, Gjensidige, SpareBank 1, Nordea, KLP, SPK m.fl.) og banker via PSD2 |
| **Lær** | Sparekalkulator, kostnadskalkulator og faktasider om nudging, is i magen, spredning, EPK, EPK-S, ASK/IPS/BSU, folketrygden, tjenestepensjon, AFP m.m. |
| **Profil** | Lønn, fødselsår, uttaksalder, pensjonsmål og forutsetninger |

## Kom i gang

```bash
npm install
npm run dev      # utviklingsserver
npm test         # tester for beregningsmotoren
npm run build    # produksjonsbygg i dist/
```

## Struktur

```
src/
  lib/calc.ts               Beregningsmotor (folketrygd, OTP, EPK-S, AFP, sparing, sparebehov)
  lib/constants.ts          Satser og regler (G, opptjeningssatser, grenser) – oppdateres årlig
  lib/nudges.ts             Personlige forslag basert på brukerens tall
  integrations/connectors.ts  Koblinger (felles grensesnitt, demo-implementasjoner)
  state/store.tsx           Tilstand, import/dedup av kontoer, lagring lokalt
  tabs/                     Én fil per fane
```

## Viktig

- **Koblingene er i demo-modus** og returnerer testdata. Se [docs/INTEGRASJONER.md](docs/INTEGRASJONER.md) for hva som
  kreves for ekte integrasjoner.
- Beregningene er **forenklede anslag** i dagens kroner, før skatt. De erstatter ikke NAVs eller leverandørenes
  beregninger, og appen gir ikke personlig finansiell rådgivning.
- Grunnbeløpet (G) og andre satser ligger i `src/lib/constants.ts` og må oppdateres ved hver regulering.

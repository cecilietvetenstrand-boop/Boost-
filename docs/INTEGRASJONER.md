# Integrasjoner

Alle koblinger implementerer `Connector`-grensesnittet i `src/integrations/connectors.ts`:

```ts
fetch(profile) => Promise<{ pensionAccounts?, savings?, folketrygdBeholdning? }>
```

I dag er dette demo-implementasjoner. For produksjon trengs en backend (tokens og nøkler skal aldri ligge i
nettleseren) og følgende avtaler:

| Kilde | Hva | Hva kreves |
|---|---|---|
| **Norsk Pensjon** | Samlet oversikt over privat og offentlig tjenestepensjon, IPS, fripoliser | Samarbeidsavtale med Norsk Pensjon AS. Innlogging med BankID/ID-porten. |
| **NAV** | Pensjonsbeholdning, opptjening, beregning av alderspensjon | Tilgang til NAVs pensjons-API-er via Maskinporten/ID-porten og avtale med NAV. Brukersamtykke. |
| **Pensjonsleverandører** (private selskaper og offentlige pensjonskasser) | EPK, EPK-S, fripoliser, endring av investeringsprofil, opprettelse av spareavtaler | Bilaterale avtaler/API-tilgang med hver leverandør. Endring av aksjeandel og avtaler krever signering med BankID hos leverandøren. |
| **Banker** | Kontoer og saldo (sparekonto, BSU) | PSD2 kontoinformasjon (AIS) – egen lisens fra Finanstilsynet, eller via en lisensiert aggregator. |
| **Fond/ASK/spareavtaler** | Fondsbeholdning, opprettelse av spareavtaler | Ikke dekket av PSD2 – krever avtale med bank/fondsplattform (eller distributøravtale). |

## Personvern

- Data hentes bare med eksplisitt samtykke per kilde (vises i appen før innlogging).
- «Koble fra» sletter all data fra kilden.
- I denne versjonen lagres alt kun lokalt i nettleseren (`localStorage`). Med backend kreves databehandleravtaler,
  DPIA og lagring i EU/EØS (GDPR).

## Duplikater

Samme konto kan komme både fra Norsk Pensjon og direkte fra leverandøren. `store.tsx` slår sammen kontoer med samme
leverandør, type og status, og beholder brukerens egne valg (aksjeandel, om sparingen er med i beregningen).

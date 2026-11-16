import { useState } from 'react';
import { useStore } from '../state/store';
import { Callout, Card, NumberField, Slider, TextField } from '../components/ui';
import { G, MAX_WITHDRAWAL_AGE, MIN_WITHDRAWAL_AGE } from '../lib/constants';
import { kr } from '../lib/format';

export function Profil() {
  const { state, summary: s, dispatch } = useStore();
  const p = state.profile;
  const [confirmReset, setConfirmReset] = useState(false);
  const set = (patch: Partial<typeof p>) => dispatch({ type: 'profile', patch });
  return (
    <div className="stack">
      <Card title="Om deg" subtitle="Grunnlaget for beregningen">
        <div className="grid2">
          <TextField label="Navn" value={p.name} onChange={(v) => set({ name: v })} placeholder="Valgfritt" />
          <TextField label="Arbeidsgiver" value={p.employer ?? ''} onChange={(v) => set({ employer: v })} placeholder="Valgfritt" />
          <NumberField label="Fødselsår" value={p.birthYear} min={1950} max={2010} onChange={(v) => set({ birthYear: v })} />
          <NumberField label="Årslønn før skatt" value={p.salary} suffix="kr" step={10000} onChange={(v) => set({ salary: v })} help={`${kr(p.salary / 12)} per måned`} />
          <NumberField
            label="Alder da du begynte å jobbe"
            value={p.startWorkAge}
            min={13}
            max={60}
            onChange={(v) => set({ startWorkAge: v })}
            help="Brukes til å anslå opptjening hvis vi ikke har hentet data fra NAV"
          />
          <NumberField
            label="Pensjonsbeholdning i folketrygden"
            value={p.folketrygdBeholdning}
            suffix="kr"
            step={10000}
            onChange={(v) => set({ folketrygdBeholdning: v || undefined })}
            help="Finn den på nav.no/pensjon, eller koble til NAV. La stå tom for anslag."
          />
        </div>
        {p.birthYear < 1963 && (
          <Callout tone="warn">Du er født før 1963 og har (delvis) opptjening etter gamle regler. Beregningen er mindre presis for deg.</Callout>
        )}
      </Card>

      <Card title="Mål og forutsetninger">
        <Slider label="Uttaksalder" value={p.withdrawalAge} min={Math.max(MIN_WITHDRAWAL_AGE, s.age)} max={MAX_WITHDRAWAL_AGE} onChange={(v) => set({ withdrawalAge: v })} format={(v) => `${v} år`} />
        <Slider label="Pensjonsmål (andel av dagens lønn)" value={p.targetPercent} min={50} max={100} step={5} onChange={(v) => set({ targetPercent: v })} format={(v) => `${v} %`} />
        <Slider label="Reell avkastning i utbetalingsperioden" value={p.payoutReturn} min={0} max={4} step={0.5} onChange={(v) => set({ payoutReturn: v })} format={(v) => `${v.toLocaleString('nb-NO')} %`} />
        <p className="fineprint">
          Grunnbeløpet (G) er satt til {kr(G)}. Alle beløp er i dagens kroner, slik at du kan sammenligne direkte med lønnen din i dag.
          Lønnsvekst og inflasjon er ikke tatt med, fordi både lønn og pensjon reguleres omtrent i takt med disse.
        </p>
      </Card>

      <Card title="Personvern og data">
        <p>Dataene dine lagres bare på denne enheten. Ingenting sendes videre uten ditt samtykke.</p>
        {confirmReset ? (
          <div className="row">
            <span>Slette alle tall og kontoer?</span>
            <button className="btn btn-primary btn-small" onClick={() => { dispatch({ type: 'reset' }); setConfirmReset(false); }}>
              Ja, slett
            </button>
            <button className="btn btn-ghost btn-small" onClick={() => setConfirmReset(false)}>Avbryt</button>
          </div>
        ) : (
          <div className="row">
            <button className="btn btn-ghost" onClick={() => setConfirmReset(true)}>Slett alle data</button>
            <button className="btn btn-ghost" onClick={() => dispatch({ type: 'loadExample' })}>Vis eksempel</button>
          </div>
        )}
      </Card>
    </div>
  );
}

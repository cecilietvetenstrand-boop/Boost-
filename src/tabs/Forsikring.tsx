import { useState } from 'react';
import { Baby, HeartPulse, ShieldCheck, Stethoscope, Umbrella } from 'lucide-react';
import { useStore } from '../state/store';
import { Badge, Callout, Card, NumberField, Select, Stat, TextField, Toggle } from '../components/ui';
import { kr, pct, uid } from '../lib/format';
import { calcDisability, summarizeInsurances } from '../lib/calc';
import { G, UFORETRYGD_CAP_G } from '../lib/constants';
import type { Insurance, InsuranceEvent, InsuranceType } from '../lib/types';
import type { TabId } from '../lib/nudges';

const TYPES: { value: InsuranceType; label: string; event: InsuranceEvent }[] = [
  { value: 'Gruppeliv', label: 'Gruppeliv (dødsfall)', event: 'død' },
  { value: 'Livsforsikring', label: 'Livsforsikring', event: 'død' },
  { value: 'Ektefellepensjon', label: 'Ektefelle-/samboerpensjon', event: 'død' },
  { value: 'Barnepensjon', label: 'Barnepensjon', event: 'død' },
  { value: 'Uføreforsikring', label: 'Uføreforsikring (engangsbeløp)', event: 'uførhet' },
  { value: 'Yrkesskade', label: 'Yrkesskadeforsikring', event: 'uførhet' },
  { value: 'Kritisk sykdom', label: 'Kritisk sykdom', event: 'sykdom' },
  { value: 'Behandlingsforsikring', label: 'Behandlingsforsikring', event: 'behandling' },
  { value: 'Barneforsikring', label: 'Barneforsikring', event: 'barn' },
  { value: 'Annet', label: 'Annet', event: 'død' },
];

const EVENT_LABEL: Record<InsuranceEvent, string> = {
  død: 'Ved dødsfall',
  uførhet: 'Ved uførhet',
  sykdom: 'Ved alvorlig sykdom',
  behandling: 'Ved behov for behandling',
  barn: 'For barna',
};
const EVENT_ICON = { død: Umbrella, uførhet: ShieldCheck, sykdom: HeartPulse, behandling: Stethoscope, barn: Baby };

export function Forsikring({ go }: { go: (t: TabId) => void }) {
  const { state, dispatch } = useStore();
  const p = state.profile;
  const d = state.disability;
  const u = calcDisability(p, d, state.insurances);
  const sum = summarizeInsurances(state.insurances);
  const setD = (patch: Partial<typeof d>) => dispatch({ type: 'disability', patch });
  const max = Math.max(p.salary, u.total) || 1;

  return (
    <div className="stack">
      <header className="page-head">
        <h1>Forsikring</h1>
        <p>Hva du og familien får hvis du blir ufør, syk eller dør – fra NAV, arbeidsgiveren og egne forsikringer.</p>
      </header>

      <section className="age-hero">
        <p className="age-hero-label">Hvis du blir 100 % ufør i dag</p>
        <p className="age-hero-age">{kr(u.total / 12)}<span className="hero-unit">/mnd</span></p>
        <div className="age-hero-panel">
          <div className="dis-bars" role="img" aria-label="Inntekt ved uførhet sammenlignet med lønn">
            <div className="dis-row">
              <span className="dis-label">Lønn i dag</span>
              <div className="dis-track">
                <span className="dis-seg" style={{ width: `${(p.salary / max) * 100}%`, background: 'var(--text-muted)' }} />
              </div>
              <strong>{kr(p.salary / 12)}/mnd</strong>
            </div>
            <div className="dis-row">
              <span className="dis-label">Ved uførhet</span>
              <div className="dis-track">
                <span className="dis-seg" style={{ width: `${(u.nav / max) * 100}%`, background: 'var(--series-1)' }} title="NAV uføretrygd" />
                <span className="dis-seg" style={{ width: `${(u.tjenestepensjon / max) * 100}%`, background: 'var(--series-4)' }} title="Uførepensjon" />
                {u.childSupplement > 0 && (
                  <span className="dis-seg" style={{ width: `${(u.childSupplement / max) * 100}%`, background: 'var(--series-3)' }} title="Barnetillegg" />
                )}
              </div>
              <strong>{kr(u.total / 12)}/mnd</strong>
            </div>
          </div>
          <ul className="legend">
            <li><span className="swatch" style={{ background: 'var(--series-1)' }} />NAV uføretrygd <span className="muted">{kr(u.nav / 12)}/mnd</span></li>
            <li><span className="swatch" style={{ background: 'var(--series-4)' }} />Uførepensjon fra arbeidsgiver <span className="muted">{kr(u.tjenestepensjon / 12)}/mnd</span></li>
            {u.childSupplement > 0 && (
              <li><span className="swatch" style={{ background: 'var(--series-3)' }} />Barnetillegg <span className="muted">{kr(u.childSupplement / 12)}/mnd</span></li>
            )}
          </ul>
          <p className="fineprint">
            {pct(u.replacementRate)} av lønnen · {kr(u.gapYearly / 12)}/mnd mindre enn i dag · før skatt
            {u.lumpSum > 0 && <> · i tillegg {kr(u.lumpSum)} i engangsutbetaling</>}
          </p>
        </div>
      </section>

      <div className="stats">
        <Stat label="Til familien ved dødsfall" value={kr(sum.deathLumpSum)} hint={sum.deathYearly > 0 ? `+ ${kr(sum.deathYearly)} i året` : 'Engangsutbetaling'} />
        <Stat label="Engangsbeløp ved uførhet" value={kr(sum.disabilityLumpSum)} />
        <Stat label="Ved kritisk sykdom" value={kr(sum.illnessLumpSum)} />
        <Stat label="Du betaler selv" value={`${kr(sum.privatePremiumYearly)}/år`} hint={`${sum.private} private, ${sum.fromEmployer} fra arbeidsgiver`} />
      </div>

      <Card
        title="Uføredekning i pensjonsordningen"
        subtitle={d.provider ? `Hos ${d.provider} · betalt av arbeidsgiver` : 'Betalt av arbeidsgiver'}
        actions={d.enabled ? <Badge tone="good">Har dekning</Badge> : <Badge tone="warn">Ingen dekning</Badge>}
      >
        <Toggle checked={d.enabled} onChange={(v) => setD({ enabled: v })} label="Pensjonsordningen min har uførepensjon" />
        {d.enabled && (
          <>
            <div className="grid3" style={{ marginTop: 12 }}>
              <NumberField label="Prosent av lønn" suffix="%" step={0.5} value={d.percentOfSalary} onChange={(v) => setD({ percentOfSalary: Math.max(0, v) })} help="Av lønn opp til 12 G" />
              <NumberField label="Tillegg" suffix="G" step={0.05} value={d.gSupplement} onChange={(v) => setD({ gSupplement: Math.max(0, v) })} help={`${kr(d.gSupplement * G)} i året`} />
              <NumberField label="Av lønn over 6 G" suffix="%" step={1} value={d.percentAbove6G} onChange={(v) => setD({ percentAbove6G: Math.max(0, v) })} help="Den delen NAV ikke dekker" />
              <NumberField label="Barnetillegg per barn" suffix="G" step={0.05} value={d.childSupplementG} onChange={(v) => setD({ childSupplementG: Math.max(0, v) })} />
              <NumberField label="Antall barn under 21" step={1} value={d.children} onChange={(v) => setD({ children: Math.max(0, Math.round(v)) })} />
              <TextField label="Leverandør" value={d.provider} onChange={(v) => setD({ provider: v })} placeholder="F.eks. Boost" />
            </div>
            <Toggle checked={d.premiumWaiver} onChange={(v) => setD({ premiumWaiver: v })} label="Innskuddsfritak ved uførhet" />
            {d.premiumWaiver && u.premiumWaiverYearly > 0 && (
              <Callout tone="good">
                Med innskuddsfritak fortsetter sparingen til alderspensjonen selv om du blir ufør: ca. {kr(u.premiumWaiverYearly / 12)}/mnd
                settes fortsatt inn på pensjonskontoen din.
              </Callout>
            )}
          </>
        )}
        <p className="fineprint">
          NAV gir uføretrygd på 66 % av inntekten opp til {UFORETRYGD_CAP_G} G ({kr(UFORETRYGD_CAP_G * G)}). Har du høyere lønn, er det
          uførepensjonen fra arbeidsgiver som dekker resten. Beløpene er forenklede anslag før skatt og samordning.
        </p>
      </Card>

      <Card title="Personforsikringer" subtitle="Fra arbeidsgiveren og dine egne" actions={<button className="btn btn-ghost btn-small" onClick={() => go('koblinger')}>Hent automatisk</button>}>
        {state.insurances.length === 0 && <Callout>Ingen forsikringer registrert. Koble til leverandøren din eller legg dem inn selv.</Callout>}
        {(['arbeidsgiver', 'privat'] as const).map((src) => {
          const list = state.insurances.filter((i) => i.source === src);
          if (!list.length) return null;
          return (
            <div key={src} className="ins-group">
              <h3 className="ins-group-title">{src === 'arbeidsgiver' ? 'Fra arbeidsgiveren' : 'Egne forsikringer'}</h3>
              <div className="ins-list">
                {list.map((i) => (
                  <InsuranceRow key={i.id} ins={i} />
                ))}
              </div>
            </div>
          );
        })}
        <AddInsurance />
      </Card>

      <Card title="Verdt å sjekke">
        <ul className="dot-list">
          <li><span>Gruppeliv og uføredekning følger jobben. Bytter du jobb eller slutter, faller de ofte bort – sjekk om du kan videreføre dem.</span></li>
          <li><span>Har du boliglån eller forsørger noen, bør utbetalingen ved dødsfall dekke gjelden og noen års utgifter.</span></li>
          <li><span>Samboere er ikke automatisk begunstiget slik ektefeller er. Sjekk begunstigelsen hos leverandøren.</span></li>
          <li><span>Uføreforsikring med engangsbeløp kommer i tillegg til uføretrygd og uførepensjon.</span></li>
        </ul>
      </Card>
    </div>
  );
}

function InsuranceRow({ ins }: { ins: Insurance }) {
  const { dispatch } = useStore();
  const Icon = EVENT_ICON[ins.event];
  return (
    <article className="ins-row">
      <span className="icon-chip"><Icon size={18} aria-hidden /></span>
      <div className="ins-main">
        <strong>{ins.type}</strong>
        <span className="muted">
          {ins.provider} · {EVENT_LABEL[ins.event]}
          {ins.note && <> · {ins.note}</>}
        </span>
      </div>
      <div className="ins-val">
        {ins.amount ? <strong>{kr(ins.amount)}</strong> : ins.yearlyPayout ? <strong>{kr(ins.yearlyPayout)}/år</strong> : <strong>Inkludert</strong>}
        {ins.yearlyPremium ? <span className="muted">{kr(ins.yearlyPremium)}/år i premie</span> : ins.source === 'arbeidsgiver' && <span className="muted">Betalt av arbeidsgiver</span>}
      </div>
      {(ins.source_id === 'manuell' || ins.source_id === 'eksempel') && (
        <button className="btn btn-ghost btn-small" onClick={() => dispatch({ type: 'removeInsurance', id: ins.id })} aria-label={`Slett ${ins.type}`}>
          Slett
        </button>
      )}
    </article>
  );
}

function AddInsurance() {
  const { dispatch } = useStore();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<InsuranceType>('Livsforsikring');
  const [provider, setProvider] = useState('');
  const [source, setSource] = useState<'privat' | 'arbeidsgiver'>('privat');
  const [amount, setAmount] = useState(0);
  const [premium, setPremium] = useState(0);
  if (!open) return <button className="btn btn-ghost" onClick={() => setOpen(true)}>+ Legg til forsikring</button>;
  const save = () => {
    dispatch({
      type: 'upsertInsurance',
      insurance: {
        id: uid(),
        type,
        provider: provider || 'Ukjent',
        source,
        event: TYPES.find((t) => t.value === type)!.event,
        amount: amount || undefined,
        yearlyPremium: source === 'privat' ? premium || undefined : undefined,
        source_id: 'manuell',
      },
    });
    setOpen(false);
    setProvider('');
    setAmount(0);
    setPremium(0);
  };
  return (
    <div className="form-inline">
      <Select label="Type" value={type} onChange={setType} options={TYPES} />
      <TextField label="Selskap" value={provider} onChange={setProvider} placeholder="F.eks. Trygghavn Forsikring" />
      <Select
        label="Betales av"
        value={source}
        onChange={setSource}
        options={[
          { value: 'privat', label: 'Meg selv' },
          { value: 'arbeidsgiver', label: 'Arbeidsgiver' },
        ]}
      />
      <NumberField label="Forsikringssum" value={amount} onChange={setAmount} suffix="kr" step={50000} />
      {source === 'privat' && <NumberField label="Premie per år" value={premium} onChange={setPremium} suffix="kr" step={100} />}
      <div className="row">
        <button className="btn btn-primary" onClick={save}>Lagre</button>
        <button className="btn btn-ghost" onClick={() => setOpen(false)}>Avbryt</button>
      </div>
    </div>
  );
}

import { useMemo, useState, type ReactNode } from 'react';
import { useStore } from '../state/store';
import { Badge, Callout, Card, NumberField, Select, Slider, Stat, TextField } from '../components/ui';
import { GrowthChart, SOURCE_COLOR, WithdrawalAgeChart } from '../components/charts';
import { kr, pct, uid } from '../lib/format';
import { activeMonthly, calcSummary, canChangeStockShare, feeSplit, isEpk, summaryByWithdrawalAge } from '../lib/calc';
import { G, IPS_MAX_YEARLY, MAX_WITHDRAWAL_AGE, TAX_RATE_ORDINARY_INCOME, MIN_WITHDRAWAL_AGE, OTP_MAX_EXTRA_RATE, OTP_MAX_RATE, OTP_MIN_RATE } from '../lib/constants';
import type { PensionAccount, PensionKind } from '../lib/types';
import type { TabId } from '../lib/nudges';

export function Pensjon({ go }: { go: (t: TabId) => void }) {
  const { state, summary: s, dispatch } = useStore();
  const p = state.profile;
  const set = (patch: Partial<typeof p>) => dispatch({ type: 'profile', patch });
  const ft = s.folketrygd;

  const byAge = useMemo(() => summaryByWithdrawalAge(state), [state]);
  const birthYear = p.birthYear;
  const sourceSub: Record<string, string> = {
    folketrygd: 'NAV · livsvarig',
    afp: 'Avtalefestet pensjon · livsvarig',
    offentligTp: 'Offentlig arbeidsgiver · livsvarig',
    epk: `Arbeidsgiver · ${s.payoutYears} år`,
    ips: `Egen pensjonssparing · ${s.payoutYears} år`,
    savings: `ASK, fond, VPS og bank · brukes jevnt til 90 år`,
  };

  const growthSeries = s.pensionAccounts.map((a, i) => ({
    key: a.id,
    name: a.label,
    color: `var(--series-${(i % 6) + 1})`,
    path: a.path,
  }));

  return (
    <div className="stack">
      <header className="page-head">
        <h1>Din pensjon</h1>
        <p>
          Du er {s.age} år og tjener {kr(p.salary)} i året
        </p>
      </header>

      <section className="age-hero">
        <p className="age-hero-label">Hvis du tar ut pensjon ved</p>
        <p className="age-hero-age">{p.withdrawalAge} år</p>
        <div className="age-hero-panel">
          <Slider
            label="Uttaksalder"
            value={p.withdrawalAge}
            min={Math.max(MIN_WITHDRAWAL_AGE, s.age)}
            max={MAX_WITHDRAWAL_AGE}
            onChange={(v) => set({ withdrawalAge: v })}
            format={(v) => `${v} år · ${birthYear + v}`}
          />
          <div className="age-hero-nums">
            <div>
              <div className="lbl">Per måned</div>
              <div className="big">{kr(s.totalYearly / 12)}</div>
            </div>
            <div>
              <div className="lbl">Per år, før skatt</div>
              <div className="big">{kr(s.totalYearly)}</div>
            </div>
          </div>
          <p className="fineprint">
            {pct(s.replacementRate)} av dagens lønn · om {s.yearsToWithdrawal} år ({birthYear + p.withdrawalAge})
          </p>
        </div>
      </section>

      <Card title="Hva pensjonen består av" subtitle="Beløp per måned før skatt, i dagens kroner">
        <ul className="source-list">
          {s.bySource.map((x) => (
            <li key={x.key}>
              <span className="source-dot" style={{ background: SOURCE_COLOR[x.key] }} />
              <div>
                <div className="src-name">{x.label}</div>
                <div className="src-sub">{sourceSub[x.key]}</div>
              </div>
              <div className="src-val">{kr(x.yearly / 12)}</div>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Uttak ved ulike aldre" subtitle="Trykk på en søyle for å velge alder. Jo senere uttak, jo mer per måned.">
        <WithdrawalAgeChart data={byAge} selected={p.withdrawalAge} salary={p.salary} onSelect={(a) => set({ withdrawalAge: a })} />
      </Card>

      <Card
        title="Folketrygden (NAV)"
        subtitle="Alderspensjon fra staten – livsvarig"
        actions={ft.estimatedFromSalary ? <Badge tone="warn">Anslag</Badge> : <Badge tone="good">Hentet fra NAV</Badge>}
      >
        <div className="stats">
          <Stat label="Pensjonsbeholdning i dag" value={kr(ft.beholdningNow)} />
          <Stat label={`Beholdning ved ${p.withdrawalAge} år`} value={kr(ft.beholdningAtWithdrawal)} />
          <Stat label="Delingstall (anslag)" value={ft.delingstall.toLocaleString('nb-NO', { maximumFractionDigits: 1 })} />
          <Stat label="Alderspensjon" value={`${kr(ft.yearly / 12)}/mnd`} hint={`${kr(ft.yearly)} i året`} />
        </div>
        {ft.garantipensjon > 0 && (
          <Callout>Garantipensjon på ca. {kr(ft.garantipensjon / 12)}/mnd er inkludert.</Callout>
        )}
        <p className="muted">
          Du tjener opp 18,1 % av inntekten din opp til 7,1 G ({kr(7.1 * G)}) hvert år. Beholdningen deles på et delingstall som avhenger av
          årskull og uttaksalder.
        </p>
        {ft.estimatedFromSalary && (
          <button className="btn btn-ghost" onClick={() => go('koblinger')}>Hent ekte beholdning fra NAV</button>
        )}
      </Card>

      <Card title="Tjenestepensjon fra arbeidsgiver" subtitle="Obligatorisk tjenestepensjon (OTP)">
        <div className="grid2">
          <Select
            label="Type ordning"
            value={p.tjenestepensjon}
            onChange={(v) => set({ tjenestepensjon: v })}
            options={[
              { value: 'innskudd', label: 'Innskuddspensjon (privat sektor)' },
              { value: 'offentlig', label: 'Offentlig tjenestepensjon (KLP, SPK m.fl.)' },
              { value: 'ingen', label: 'Har ikke tjenestepensjon' },
            ]}
          />
          {p.tjenestepensjon === 'innskudd' && (
            <>
              <NumberField
                label="Arbeidsgivers sparesats"
                suffix="%"
                step={0.5}
                min={OTP_MIN_RATE}
                max={OTP_MAX_RATE}
                value={p.employerRate}
                onChange={(v) => set({ employerRate: Math.min(OTP_MAX_RATE, Math.max(0, v)) })}
                help="Lovens minimum er 2 %, maks 7 % av lønn opp til 12 G"
              />
              <NumberField
                label="Tillegg for lønn mellom 7,1 G og 12 G"
                suffix="%"
                step={0.5}
                min={0}
                max={OTP_MAX_EXTRA_RATE}
                value={p.employerRateAbove71G}
                onChange={(v) => set({ employerRateAbove71G: Math.min(OTP_MAX_EXTRA_RATE, Math.max(0, v)) })}
                help="Gjelder bare hvis lønnen er over 7,1 G"
              />
              <NumberField
                label="Arbeidsgivers pris for standardforvaltning"
                suffix="%"
                step={0.05}
                min={0}
                max={2}
                value={p.employerStandardFee}
                onChange={(v) => set({ employerStandardFee: Math.max(0, v) })}
                help="Det arbeidsgiver betaler for forvaltningen per år. Har du EPK-S, får du dette som kompensasjon."
              />
            </>
          )}
        </div>
        {p.tjenestepensjon === 'innskudd' && (
          <p>
            Arbeidsgiveren din sparer <strong>{kr(s.employerContribution / 12)}/mnd</strong> ({kr(s.employerContribution)} i året) til
            pensjonen din.
          </p>
        )}
        {p.tjenestepensjon === 'offentlig' && (
          <p>
            Offentlig tjenestepensjon (påslagsmodellen) gir ca. <strong>{kr(s.offentligTp.yearly / 12)}/mnd</strong> livsvarig fra{' '}
            {p.withdrawalAge} år.
          </p>
        )}
      </Card>

      <IpsCard go={go} />

      <Card title="AFP – avtalefestet pensjon" subtitle="Livsvarig tillegg hvis arbeidsgiveren har AFP-avtale">
        <Select
          label="Har du AFP?"
          value={p.afp}
          onChange={(v) => set({ afp: v })}
          options={[
            { value: 'privat', label: 'Ja – AFP i privat sektor' },
            { value: 'offentlig', label: 'Ja – AFP i offentlig sektor' },
            { value: 'ingen', label: 'Nei / vet ikke' },
          ]}
          help="Sjekk med arbeidsgiver eller tillitsvalgt. Du må normalt jobbe i en AFP-bedrift frem til du tar ut AFP."
        />
        {p.afp !== 'ingen' && <p>Forventet AFP: <strong>{kr(s.afp / 12)}/mnd</strong> livsvarig.</p>}
      </Card>

      <Card
        title="Pensjonskontoer"
        subtitle="EPK, EPK-S (selvvalgt), fripoliser og pensjonskapitalbevis"
        actions={<button className="btn btn-ghost btn-small" onClick={() => go('koblinger')}>Hent automatisk</button>}
      >
        {state.pensionAccounts.length === 0 && (
          <Callout>Ingen kontoer registrert ennå. Vi beregner EPK ut fra lønn og sparesats. Koble til Norsk Pensjon for faktisk saldo.</Callout>
        )}
        <p className="muted">
          <strong>EPK</strong> er pensjonskontoen hos leverandøren arbeidsgiveren har valgt – arbeidsgiver betaler forvaltningen av
          pensjonen fra nåværende jobb. <strong>EPK-S</strong> (egen pensjonskonto selvvalgt) er når du selv har valgt leverandør – du betaler
          forvaltningen selv, men får kompensasjon tilsvarende arbeidsgivers standardpris. Samme skattefordeler.
        </p>
        <div className="accounts">
          {state.pensionAccounts.map((a) => {
            return (
              <PensionAccountCard key={a.id} account={a} go={go} />
            );
          })}
        </div>
        <AddPensionAccount />
      </Card>

      {growthSeries.length > 0 && (
        <Card title="Slik vokser pensjonskontoene" subtitle="Forventet saldo frem til uttak (dagens kroner)">
          <GrowthChart series={growthSeries} />
        </Card>
      )}

      <p className="fineprint">
        Pensjonen din er {pct(s.replacementRate)} av lønnen. Alle tall er anslag i dagens kroner før skatt.
      </p>
    </div>
  );
}

function AddPensionAccount() {
  const { dispatch } = useStore();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<PensionKind>('EPK');
  const [provider, setProvider] = useState('');
  const [balance, setBalance] = useState(0);
  const [active, setActive] = useState(false);

  if (!open) return <button className="btn btn-ghost" onClick={() => setOpen(true)}>+ Legg til konto manuelt</button>;

  const save = () => {
    const acc: PensionAccount = {
      id: uid(),
      kind,
      provider: provider || 'Ukjent',
      balance,
      stockShare: kind === 'Fripolise' ? 0 : 100,
      profile: kind === 'Fripolise' ? 'fast' : 'livsfase',
      fee: 0.4,
      active,
      source: 'manuell',
    };
    dispatch({ type: 'upsertPension', account: acc });
    setOpen(false);
    setProvider('');
    setBalance(0);
  };

  return (
    <div className="form-inline">
      <Select
        label="Type"
        value={kind}
        onChange={setKind}
        options={[
          { value: 'EPK', label: 'Egen pensjonskonto (EPK)' },
          { value: 'EPK-S', label: 'EPK-S (egen pensjonskonto selvvalgt)' },
          { value: 'Fripolise', label: 'Fripolise' },
          { value: 'PKB', label: 'Pensjonskapitalbevis (PKB)' },
          { value: 'Offentlig TP', label: 'Offentlig tjenestepensjon' },
        ]}
      />
      <TextField label="Leverandør" value={provider} onChange={setProvider} placeholder="F.eks. Nordea Liv" />
      <NumberField label="Saldo / beholdning" value={balance} onChange={setBalance} suffix="kr" step={1000} />
      <label className="toggle">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        <span className="toggle-track" aria-hidden />
        <span>Nåværende arbeidsgiver (får innskudd)</span>
      </label>
      <div className="row">
        <button className="btn" onClick={save}>Lagre</button>
        <button className="btn btn-ghost" onClick={() => setOpen(false)}>Avbryt</button>
      </div>
    </div>
  );
}

/** Pensjonskonto med saldo, prognose og hvem som betaler kostnadene */
function PensionAccountCard({ account: a, go }: { account: PensionAccount; go: (t: TabId) => void }) {
  const { state, summary: s, dispatch } = useStore();
  const p = state.profile;
  const [open, setOpen] = useState(false);
  const proj = s.pensionAccounts.find((x) => x.id === a.id);
  const fees = feeSplit(p, a);
  const update = (patch: Partial<PensionAccount>) => dispatch({ type: 'upsertPension', account: { ...a, ...patch } });
  const nb = (v: number) => v.toLocaleString('nb-NO', { maximumFractionDigits: 2 });
  const isCurrentEpk = a.active && isEpk(a);

  // Sammenlign med å ha kontoen som den andre typen (EPK hos arbeidsgivers leverandør vs. EPK-S)
  const altKind = a.kind === 'EPK' ? 'EPK-S' : 'EPK';
  const alt = isCurrentEpk
    ? calcSummary({ ...state, pensionAccounts: state.pensionAccounts.map((x) => (x.id === a.id ? { ...x, kind: altKind } : x)) })
    : null;
  const altDiff = alt ? (alt.totalYearly - s.totalYearly) / 12 : 0;

  let costText: ReactNode;
  if (isCurrentEpk && a.kind === 'EPK') {
    costText = (
      <>
        Arbeidsgiver betaler forvaltning og administrasjon for pensjonen fra nåværende jobb
        {fees.priorBalance > 0 && (
          <>. Du betaler {nb(a.fee)} % i året for {kr(fees.priorBalance)} fra tidligere jobber (arbeidsgivers avtalte pris)</>
        )}
        .
      </>
    );
  } else if (isCurrentEpk && a.kind === 'EPK-S') {
    const net = fees.currentFee;
    costText = (
      <>
        Du betaler {nb(a.fee)} % i året selv og får {nb(fees.compensation)} % i kompensasjon fra arbeidsgiver for pensjonen fra nåværende
        jobb.{' '}
        {net > 0 ? (
          <>Du betaler mellomlegget på {nb(net)} %.</>
        ) : net < 0 ? (
          <>Forvaltningen er billigere – overskuddet på {nb(-net)} % blir igjen på kontoen din.</>
        ) : (
          <>Det går akkurat opp.</>
        )}
        {fees.priorBalance > 0 && <> Pensjon fra tidligere jobber ({kr(fees.priorBalance)}) betaler du full pris for.</>}
        {fees.adminFeeKr > 0 && <> Administrasjon: {kr(fees.adminFeeKr)} i året.</>}
      </>
    );
  } else if (a.kind === 'Offentlig TP') {
    costText = <>Offentlig tjenestepensjon har ingen forvaltningskostnad for deg.</>;
  } else {
    costText = <>Du betaler selv {nb(a.fee)} % i året i forvaltning for denne kontoen.</>;
  }

  return (
    <article className="account">
      <div className="account-head">
        <div>
          <h3>
            {a.kind === 'EPK-S' ? 'EPK-S (selvvalgt)' : a.kind} · {a.provider}
          </h3>
          <p className="muted">
            {a.employer ?? 'Ukjent arbeidsgiver'} · {a.profile === 'livsfase' ? 'Livsfaseprofil' : `${a.stockShare} % aksjer`} · kostnad{' '}
            {nb(a.fee)} %
          </p>
        </div>
        {a.active ? <Badge tone="good">Aktiv</Badge> : <Badge>Hvilende</Badge>}
      </div>
      <div className="stats">
        <Stat label="Saldo i dag" value={kr(a.balance)} />
        {proj && <Stat label={`Ved ${p.withdrawalAge} år`} value={kr(proj.balanceAtWithdrawal)} />}
        {proj && <Stat label="Utbetaling" value={`${kr(proj.yearlyPayout / 12)}/mnd`} />}
      </div>
      <p className="cost-line">
        <strong>Hvem betaler kostnadene?</strong> {costText}
      </p>
      {alt && Math.abs(altDiff) >= 1 && (
        <Callout tone={altDiff > 0 ? 'good' : 'info'}>
          Som {altKind === 'EPK-S' ? `EPK-S med samme forvaltningspris (${nb(a.fee)} %)` : 'EPK hos arbeidsgivers leverandør'} ville du fått ca.{' '}
          <strong>
            {altDiff > 0 ? '+' : ''}
            {kr(altDiff)}/mnd
          </strong>{' '}
          i pensjon.
          {altKind === 'EPK-S' && altDiff < 0 && ' EPK-S lønner seg bare hvis du velger forvaltning som er billigere enn arbeidsgivers standardpris.'}
        </Callout>
      )}
      {open && (
        <div className="grid3">
          <NumberField label="Forvaltningskostnad" suffix="%" step={0.05} min={0} value={a.fee} onChange={(v) => update({ fee: Math.max(0, v) })} />
          {isCurrentEpk && (
            <NumberField
              label="Herav fra nåværende jobb"
              suffix="kr"
              step={10000}
              value={a.currentJobBalance ?? a.balance}
              onChange={(v) => update({ currentJobBalance: Math.max(0, Math.min(a.balance, v)) })}
              help="Resten regnes som pensjon fra tidligere jobber"
            />
          )}
          {a.kind === 'EPK-S' && (
            <NumberField
              label="Administrasjonskostnad"
              suffix="kr/år"
              step={50}
              min={0}
              value={a.adminFeeKr ?? 0}
              onChange={(v) => update({ adminFeeKr: Math.max(0, v) })}
            />
          )}
          {isCurrentEpk && (
            <Select
              label="Leverandør valgt av"
              value={a.kind}
              onChange={(v) => update({ kind: v })}
              options={[
                { value: 'EPK', label: 'Arbeidsgiver (EPK)' },
                { value: 'EPK-S', label: 'Meg selv (EPK-S)' },
              ]}
            />
          )}
        </div>
      )}
      <div className="row">
        {canChangeStockShare(a) ? (
          <button className="btn btn-small" onClick={() => go('spar')}>Endre aksjeandel</button>
        ) : (
          a.kind !== 'Offentlig TP' && <span className="fineprint">Aksjeandelen endres hos {a.provider}</span>
        )}
        <button className="btn btn-ghost btn-small" onClick={() => setOpen(!open)}>{open ? 'Ferdig' : 'Endre kostnader'}</button>
        {(a.source === 'manuell' || a.source === 'eksempel') && (
          <button className="btn btn-ghost btn-small" onClick={() => dispatch({ type: 'removePension', id: a.id })}>Slett</button>
        )}
      </div>
    </article>
  );
}

/** IPS – den eneste måten å spare til pensjon selv med skattefordel */
function IpsCard({ go }: { go: (t: TabId) => void }) {
  const { state, summary: s } = useStore();
  const ips = state.savings.filter((x) => x.type === 'IPS');
  const yearly = ips.reduce((a, x) => a + activeMonthly(x) * 12, 0);
  const balance = ips.reduce((a, x) => a + x.balance, 0);
  const fromIps = s.savings.filter((x) => x.kind === 'IPS').reduce((a, x) => a + x.yearlyPayout, 0);
  const room = Math.max(0, IPS_MAX_YEARLY - yearly);
  return (
    <Card title="Spar selv til pensjon med skattefordel" subtitle="IPS – individuell pensjonssparing">
      <div className="stats">
        <Stat label="Du sparer i IPS" value={`${kr(yearly / 12)}/mnd`} hint={`${kr(yearly)} av maks ${kr(IPS_MAX_YEARLY)} i året`} />
        <Stat label="Skattefradrag" value={`${kr(Math.min(yearly, IPS_MAX_YEARLY) * TAX_RATE_ORDINARY_INCOME)}/år`} tone="good" />
        <Stat label="Saldo i dag" value={kr(balance)} />
        <Stat label="Gir i pensjon" value={`${kr(fromIps / 12)}/mnd`} hint={`Til ${state.profile.withdrawalAge + s.payoutYears} år`} />
      </div>
      {room > 0 && (
        <Callout tone="good">
          Du kan spare {kr(room / 12)} mer i måneden i IPS og få {kr(room * TAX_RATE_ORDINARY_INCOME)} mer i skattefradrag i året.{' '}
          <button className="link" onClick={() => go('spar')}>Start IPS →</button>
        </Callout>
      )}
      <p className="fineprint">
        Inntil {kr(IPS_MAX_YEARLY)} i året med 22 % fradrag i alminnelig inntekt. Pengene er bundet til du fyller 62 år og utbetales over
        minst 10 år og til minst 80 år. IPS tas med i pensjonsberegningen hvis bryteren under «Sparing» er på.
      </p>
    </Card>
  );
}

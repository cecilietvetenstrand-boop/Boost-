import { useMemo, useState } from 'react';
import { useStore } from '../state/store';
import { Badge, Callout, Card, NumberField, Select, Slider, Stat, TextField } from '../components/ui';
import { GrowthChart, SOURCE_COLOR, WithdrawalAgeChart } from '../components/charts';
import { kr, pct, uid } from '../lib/format';
import { calcSummary, selfContributionTaxBenefit, maxSelfRate, summaryByWithdrawalAge } from '../lib/calc';
import { G, MAX_WITHDRAWAL_AGE, MIN_WITHDRAWAL_AGE, OTP_MAX_EXTRA_RATE, OTP_MAX_RATE, OTP_MIN_RATE } from '../lib/constants';
import type { PensionAccount, PensionKind } from '../lib/types';
import type { TabId } from '../lib/nudges';

export function Pensjon({ go }: { go: (t: TabId) => void }) {
  const { state, summary: s, dispatch } = useStore();
  const p = state.profile;
  const set = (patch: Partial<typeof p>) => dispatch({ type: 'profile', patch });
  const ft = s.folketrygd;
  const maxRate = maxSelfRate(p);
  const withMaxEpks = calcSummary({ ...state, profile: { ...p, epkSelfRate: maxRate } });

  const byAge = useMemo(() => summaryByWithdrawalAge(state), [state]);
  const birthYear = p.birthYear;
  const sourceSub: Record<string, string> = {
    folketrygd: 'NAV · livsvarig',
    afp: 'Avtalefestet pensjon · livsvarig',
    offentligTp: 'Offentlig arbeidsgiver · livsvarig',
    epk: `Arbeidsgiver · ${s.payoutYears} år`,
    egen: `Eget innskudd · ${s.payoutYears} år`,
    savings: `Valgt sparing · ${s.payoutYears} år`,
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

      {p.tjenestepensjon === 'innskudd' && (
        <Card title="Eget innskudd i pensjonskontoen" subtitle="Spar selv i EPK/EPK-S via lønna og få 22 % skattefradrag">
          <Slider
            label="Egen sparesats"
            value={Math.min(p.epkSelfRate, maxRate)}
            min={0}
            max={maxRate}
            step={0.5}
            onChange={(v) => set({ epkSelfRate: v })}
            format={(v) => `${v.toLocaleString('nb-NO')} %`}
          />
          <div className="stats">
            <Stat label="Du sparer" value={`${kr(s.selfContribution / 12)}/mnd`} />
            <Stat label="Skattefradrag" value={`${kr(selfContributionTaxBenefit(p))}/år`} tone="good" />
            <Stat label="Netto kostnad" value={`${kr((s.selfContribution - selfContributionTaxBenefit(p)) / 12)}/mnd`} />
            <Stat
              label="Mer pensjon"
              value={`${kr((s.bySource.find((x) => x.key === 'egen')?.yearly ?? 0) / 12)}/mnd`}
              hint={`Til ${p.withdrawalAge + s.payoutYears} år`}
            />
          </div>
          {p.epkSelfRate < maxRate && (
            <Callout tone="good">
              Sparer du maks ({maxRate} %), får du ca. {kr((withMaxEpks.totalYearly - s.totalYearly) / 12)} mer i pensjon per måned.
            </Callout>
          )}
          <p className="fineprint">
            Du kan spare inntil 5 % av lønnen (opp til 12 G), men ikke mer enn arbeidsgiveren sparer for deg ({p.employerRate} %). Pengene
            trekkes fra lønnen og er bundet til uttak av pensjon. Endringen må registreres hos arbeidsgiver/leverandør.
          </p>
        </Card>
      )}

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
          <strong>EPK</strong> er pensjonskontoen hos leverandøren arbeidsgiveren har valgt. <strong>EPK-S</strong> (egen pensjonskonto
          selvvalgt) er når du selv har valgt leverandør – innskuddene fra arbeidsgiver går dit, med de samme skattefordelene.
        </p>
        <div className="accounts">
          {state.pensionAccounts.map((a) => {
            const proj = s.pensionAccounts.find((x) => x.id === a.id);
            return (
              <article key={a.id} className="account">
                <div className="account-head">
                  <div>
                    <h3>{a.kind} · {a.provider}</h3>
                    <p className="muted">
                      {a.employer ?? 'Ukjent arbeidsgiver'} · {a.profile === 'livsfase' ? 'Livsfaseprofil' : `${a.stockShare} % aksjer`} ·
                      kostnad {a.fee.toLocaleString('nb-NO')} %
                    </p>
                  </div>
                  {a.active ? <Badge tone="good">Aktiv</Badge> : <Badge>Hvilende</Badge>}
                </div>
                <div className="stats">
                  <Stat label="Saldo i dag" value={kr(a.balance)} />
                  {proj && <Stat label={`Ved ${p.withdrawalAge} år`} value={kr(proj.balanceAtWithdrawal)} />}
                  {proj && <Stat label="Utbetaling" value={`${kr(proj.yearlyPayout / 12)}/mnd`} />}
                </div>
                <div className="row">
                  {a.kind !== 'Offentlig TP' && (
                    <button className="btn btn-small" onClick={() => go('spar')}>Endre aksjeandel</button>
                  )}
                  {a.source === 'manuell' && (
                    <button className="btn btn-ghost btn-small" onClick={() => dispatch({ type: 'removePension', id: a.id })}>Slett</button>
                  )}
                </div>
              </article>
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
      <TextField label="Leverandør" value={provider} onChange={setProvider} placeholder="F.eks. Storebrand" />
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

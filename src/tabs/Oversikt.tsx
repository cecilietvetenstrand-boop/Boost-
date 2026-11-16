import { useMemo } from 'react';
import { useStore } from '../state/store';
import { Callout, Card, Slider, Stat } from '../components/ui';
import { IncomeComparison, WithdrawalAgeChart } from '../components/charts';
import { kr, pct } from '../lib/format';
import { calcDisability, summarizeInsurances, summaryByWithdrawalAge } from '../lib/calc';
import { buildNudges, type TabId } from '../lib/nudges';
import { MAX_WITHDRAWAL_AGE, MIN_WITHDRAWAL_AGE } from '../lib/constants';

export function Oversikt({ go }: { go: (t: TabId) => void }) {
  const { state, summary: s, dispatch } = useStore();
  const p = state.profile;
  const byAge = useMemo(() => summaryByWithdrawalAge(state), [state]);
  const nudges = useMemo(() => buildNudges(state, s), [state, s]);
  const monthly = s.totalYearly / 12;
  const gapMonthly = s.gapYearly / 12;
  const reached = s.target.shortfallYearly <= 0;

  return (
    <div className="stack">
      <header className="page-head">
        <h1>{p.name ? `Hei, ${p.name}` : 'Din økonomi'}</h1>
        <p>Pensjon fra NAV og arbeidsgiver, sammen med all egen sparing.</p>
      </header>
      <section className="hero">
        <div className="hero-main">
          <p className="hero-kicker">Forventet pensjon fra {p.withdrawalAge} år</p>
          <p className="hero-number">{kr(monthly)}<span>/mnd</span></p>
          <p className="hero-sub">
            {pct(s.replacementRate)} av dagens lønn · før skatt · i dagens kroner
          </p>
        </div>
        <div className="hero-stats">
          <Stat
            label="Mindre enn lønnen i dag"
            value={gapMonthly > 0 ? `${kr(gapMonthly)}/mnd` : 'Ingen nedgang'}
            hint={gapMonthly > 0 ? `${kr(s.gapYearly)} i året` : undefined}
            tone={gapMonthly > 0 ? 'warn' : 'good'}
          />
          <Stat
            label={`Spar for å nå ${p.targetPercent} % av lønn`}
            value={reached ? 'Du er i mål' : `${kr(s.target.monthlyNeeded)}/mnd`}
            hint={reached ? undefined : `fra nå til ${p.withdrawalAge} år, ${s.target.stockShareAssumed} % aksjer`}
            tone={reached ? 'good' : undefined}
          />
          <Stat
            label="Etter 80 år (livsvarig)"
            value={`${kr(s.lifelongYearly / 12)}/mnd`}
            hint="Tjenestepensjon og sparing er utbetalt"
          />
        </div>
      </section>

      <Card title="Lønn i dag mot pensjon" subtitle={`Fra ${p.withdrawalAge} til ${p.withdrawalAge + s.payoutYears} år, per måned før skatt`}>
        <IncomeComparison salary={p.salary} sources={s.bySource} target={s.target.targetYearly} />
        {!reached && (
          <Callout tone="info">
            For å få ca. {p.targetPercent} % av lønnen ({kr(s.target.targetYearly / 12)}/mnd) mangler du{' '}
            <strong>{kr(s.target.shortfallYearly / 12)}/mnd</strong>. Det tilsvarer en sparekapital på{' '}
            {kr(s.target.capitalNeeded)} ved {p.withdrawalAge} år – eller{' '}
            <strong>{kr(s.target.monthlyNeeded)} i måneden</strong> fra i dag.{' '}
            <button className="link" onClick={() => go('spar')}>Start sparing →</button>
          </Callout>
        )}
      </Card>

      {nudges.length > 0 && (
        <Card title="Forslag til deg" subtitle="Små grep som gir mer pensjon">
          <div className="nudges">
            {nudges.map((n) => (
              <article key={n.id} className={`nudge nudge-${n.tone}`}>
                <h3>{n.title}</h3>
                <p>{n.text}</p>
                {n.action && (
                  <button className="btn btn-small" onClick={() => go(n.action!.tab)}>
                    {n.action.label}
                  </button>
                )}
              </article>
            ))}
          </div>
        </Card>
      )}

      <Card
        title="Er du og familien sikret?"
        subtitle="Hvis noe skjer før du blir pensjonist"
        actions={<button className="btn btn-small" onClick={() => go('forsikring')}>Se forsikringer</button>}
      >
        {(() => {
          const u = calcDisability(p, state.disability, state.insurances);
          const ins = summarizeInsurances(state.insurances);
          return (
            <div className="stats">
              <Stat label="Hvis du blir ufør" value={`${kr(u.total / 12)}/mnd`} hint={`${pct(u.replacementRate)} av lønnen`} tone={u.replacementRate < 0.6 ? 'warn' : undefined} />
              <Stat label="Til familien ved dødsfall" value={kr(ins.deathLumpSum)} hint={ins.deathYearly > 0 ? `+ ${kr(ins.deathYearly)} i året` : undefined} />
              <Stat label="Uføredekning i pensjonen" value={state.disability.enabled ? 'Ja' : 'Nei'} hint={state.disability.premiumWaiver && state.disability.enabled ? 'Med innskuddsfritak' : undefined} tone={state.disability.enabled ? 'good' : 'warn'} />
            </div>
          );
        })()}
      </Card>

      <Card title="Når vil du gå av?" subtitle="Jo senere uttak, jo mer får du hvert år">
        <Slider
          label="Uttaksalder"
          value={p.withdrawalAge}
          min={Math.max(MIN_WITHDRAWAL_AGE, s.age)}
          max={MAX_WITHDRAWAL_AGE}
          onChange={(v) => dispatch({ type: 'profile', patch: { withdrawalAge: v } })}
          format={(v) => `${v} år`}
        />
        <WithdrawalAgeChart data={byAge} selected={p.withdrawalAge} salary={p.salary} />
      </Card>

      <Card title="Hvor kommer pensjonen fra?">
        <table className="table">
          <thead>
            <tr>
              <th>Kilde</th>
              <th className="num">Per måned</th>
              <th className="num">Per år</th>
              <th>Varighet</th>
            </tr>
          </thead>
          <tbody>
            {s.bySource.map((x) => (
              <tr key={x.key}>
                <td>{x.label}</td>
                <td className="num">{kr(x.yearly / 12)}</td>
                <td className="num">{kr(x.yearly)}</td>
                <td>{x.lifelong ? 'Livsvarig' : `Til ${x.untilAge} år`}</td>
              </tr>
            ))}
            <tr className="total">
              <td>Sum</td>
              <td className="num">{kr(monthly)}</td>
              <td className="num">{kr(s.totalYearly)}</td>
              <td />
            </tr>
          </tbody>
        </table>
        <p className="fineprint">
          Anslag i dagens kroner, før skatt, basert på dagens lønn og regelverk. Forventet reell avkastning: 0,5 % for renter og 4 % for
          aksjer, minus kostnader. Faktisk pensjon vil avvike. Se NAV og leverandørene dine for offisielle beregninger.
        </p>
      </Card>
    </div>
  );
}

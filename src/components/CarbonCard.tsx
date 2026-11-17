import { Leaf } from 'lucide-react';
import { useStore } from '../state/store';
import { Card, Stat } from './ui';
import { kr } from '../lib/format';
import { ageOf } from '../lib/calc';
import { carbonSummary } from '../lib/carbon';
import { FUNDS } from '../lib/funds';

const t = (v: number) => v.toLocaleString('nb-NO', { maximumFractionDigits: 1, minimumFractionDigits: v < 10 ? 1 : 0 });

/** Klimaavtrykket til pensjon og sparing, i tonn CO₂e */
export function CarbonCard() {
  const { state } = useStore();
  const c = carbonSummary(state.pensionAccounts, state.savings, ageOf(state.profile));
  if (!c.items.length) return null;
  const greenest = FUNDS.reduce((a, f) => (f.carbon < a.carbon ? f : a));
  const alt = (c.invested / 1e6) * greenest.carbon;
  const max = Math.max(...c.items.map((i) => i.tonnes), 0.0001);
  const sorted = [...c.items].sort((a, b) => b.tonnes - a.tonnes);

  return (
    <Card
      title={
        <>
          <Leaf size={18} aria-hidden style={{ verticalAlign: '-3px', marginRight: 6 }} />
          Klimaavtrykket til sparingen din
        </>
      }
      subtitle="Utslipp fra selskapene pengene dine er investert i"
    >
      <div className="stats">
        <Stat label="Totalt avtrykk" value={`${t(c.tonnes)} tonn CO₂e`} hint={`for ${kr(c.invested)} investert`} />
        <Stat label="Per million kroner" value={`${t(c.intensity)} tonn`} hint="Vektet snitt for sparingen din" />
        <Stat label="Tilsvarer omtrent" value={`${Math.round(c.carKm / 100) * 100 > 0 ? (Math.round(c.carKm / 100) * 100).toLocaleString('nb-NO') : '0'} km`} hint="kjøring med fossilbil" />
      </div>
      <ul className="carbon-list">
        {sorted.map((i) => (
          <li key={i.id}>
            <div className="carbon-name">
              <strong>{i.label}</strong>
              <span className="muted">
                {i.provider} · {kr(i.balance)}
              </span>
            </div>
            {i.intensity === null ? (
              <span className="muted carbon-na">Ikke beregnet for bankinnskudd</span>
            ) : (
              <>
                <div className="carbon-track" aria-hidden>
                  <span style={{ width: `${(i.tonnes / max) * 100}%` }} />
                </div>
                <span className="carbon-val">
                  {t(i.tonnes)} t <span className="muted">· {t(i.intensity)} t per mill.</span>
                </span>
              </>
            )}
          </li>
        ))}
      </ul>
      {alt < c.tonnes * 0.9 && (
        <p className="carbon-tip">
          Hadde alt stått i et fond som <strong>{greenest.name}</strong> ({t(greenest.carbon)} t per mill. kr), ville avtrykket vært ca.{' '}
          <strong>{t(alt)} tonn</strong> – {Math.round((1 - alt / c.tonnes) * 100)} % lavere.
        </p>
      )}
      <p className="fineprint">
        Avtrykket er finansierte utslipp (scope 1 og 2) per million kroner investert, slik fond rapporterer det etter EUs regler for
        bærekraftsinformasjon. Tallene er eksempelverdier i denne versjonen. Pensjonskontoer beregnes ut fra dagens aksjeandel.
      </p>
    </Card>
  );
}

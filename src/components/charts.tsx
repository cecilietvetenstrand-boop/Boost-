import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { kr, krShort, pct } from '../lib/format';

/** Fast farge per kilde – fargen følger kilden, aldri rekkefølgen */
export const SOURCE_COLOR: Record<string, string> = {
  folketrygd: 'var(--series-1)',
  afp: 'var(--series-2)',
  offentligTp: 'var(--series-3)',
  epk: 'var(--series-4)',
  epks: 'var(--series-5)',
  savings: 'var(--series-6)',
};

const axis = { stroke: 'var(--text-muted)', fontSize: 12 };

/** Stablet stolpe: lønn i dag mot pensjon, delt opp per kilde */
export function IncomeComparison({ salary, sources, target }: {
  salary: number;
  sources: { key: string; label: string; yearly: number }[];
  target: number;
}) {
  const total = sources.reduce((s, x) => s + x.yearly, 0);
  const max = Math.max(salary, total, target) || 1;
  return (
    <div className="income-compare">
      <div className="ic-row">
        <span className="ic-label">Lønn i dag</span>
        <div className="ic-track">
          <div className="ic-seg ic-salary" style={{ width: `${(salary / max) * 100}%` }} title={kr(salary)} />
          <div className="ic-target" style={{ left: `${(target / max) * 100}%` }} title={`Mål: ${kr(target)}`} />
        </div>
        <span className="ic-value">{kr(salary / 12)}/mnd</span>
      </div>
      <div className="ic-row">
        <span className="ic-label">Pensjon</span>
        <div className="ic-track">
          {sources.map((s) => (
            <div
              key={s.key}
              className="ic-seg"
              style={{ width: `${(s.yearly / max) * 100}%`, background: SOURCE_COLOR[s.key] }}
              title={`${s.label}: ${kr(s.yearly / 12)}/mnd`}
            />
          ))}
          <div className="ic-target" style={{ left: `${(target / max) * 100}%` }} />
        </div>
        <span className="ic-value">{kr(total / 12)}/mnd</span>
      </div>
      <ul className="legend">
        {sources.map((s) => (
          <li key={s.key}>
            <span className="swatch" style={{ background: SOURCE_COLOR[s.key] }} />
            {s.label} <span className="muted">{kr(s.yearly / 12)}/mnd · {pct(s.yearly / (total || 1))}</span>
          </li>
        ))}
        <li>
          <span className="swatch swatch-target" />
          Mål ({pct(target / (salary || 1))} av lønn) <span className="muted">{kr(target / 12)}/mnd</span>
        </li>
      </ul>
    </div>
  );
}

function ChartTooltip({ active, payload, label, labelPrefix = 'Alder' }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tip">
      <div className="chart-tip-title">
        {labelPrefix} {label}
      </div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="chart-tip-row">
          <span className="swatch" style={{ background: p.color }} />
          <span>{p.name}</span>
          <strong>{kr(p.value)}</strong>
        </div>
      ))}
    </div>
  );
}

/** Pensjon per år for ulike uttaksaldre */
export function WithdrawalAgeChart({ data, selected, salary }: {
  data: { age: number; total: number; lifelong: number }[];
  selected: number;
  salary: number;
}) {
  const rows = data.map((d) => ({ age: d.age, total: d.total / 12, lifelong: d.lifelong / 12 }));
  return (
    <div className="chart" role="img" aria-label="Månedlig pensjon for ulike uttaksaldre">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={rows} barGap={2} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--grid)" />
          <XAxis dataKey="age" tick={axis} tickLine={false} axisLine={{ stroke: 'var(--grid)' }} />
          <YAxis tick={axis} tickFormatter={krShort} tickLine={false} axisLine={false} width={48} />
          <Tooltip content={<ChartTooltip labelPrefix="Uttak ved" />} cursor={{ fill: 'var(--hover)' }} />
          <ReferenceLine y={salary / 12} stroke="var(--text-muted)" strokeDasharray="4 4" label={{ value: 'Lønn i dag', fill: 'var(--text-secondary)', fontSize: 12, position: 'insideTopRight' }} />
          <Bar dataKey="total" name="Pensjon de første årene" fill="var(--series-1)" radius={[4, 4, 0, 0]} maxBarSize={22}
            shape={(props: any) => <rect {...props} opacity={props.payload.age === selected ? 1 : 0.45} rx={3} />} />
          <Bar dataKey="lifelong" name="Livsvarig pensjon" fill="var(--series-2)" radius={[4, 4, 0, 0]} maxBarSize={22}
            shape={(props: any) => <rect {...props} opacity={props.payload.age === selected ? 1 : 0.45} rx={3} />} />
        </BarChart>
      </ResponsiveContainer>
      <ul className="legend">
        <li><span className="swatch" style={{ background: 'var(--series-1)' }} />Pensjon de første årene, inkl. tjenestepensjon (per mnd)</li>
        <li><span className="swatch" style={{ background: 'var(--series-2)' }} />Livsvarig pensjon etter at tjenestepensjon og sparing er utbetalt (per mnd)</li>
      </ul>
    </div>
  );
}

/** Utvikling av sparekapital frem mot uttak */
export function GrowthChart({ series }: { series: { key: string; name: string; color: string; path: { age: number; value: number }[] }[] }) {
  const ages = Array.from(new Set(series.flatMap((s) => s.path.map((p) => p.age)))).sort((a, b) => a - b);
  const rows = ages.map((age) => {
    const row: Record<string, number> = { age };
    for (const s of series) row[s.key] = s.path.find((p) => p.age === age)?.value ?? NaN;
    return row;
  });
  if (!rows.length) return null;
  return (
    <div className="chart" role="img" aria-label="Utvikling i sparekapital">
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--grid)" />
          <XAxis dataKey="age" tick={axis} tickLine={false} axisLine={{ stroke: 'var(--grid)' }} />
          <YAxis tick={axis} tickFormatter={krShort} tickLine={false} axisLine={false} width={48} />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--text-muted)', strokeDasharray: '3 3' }} />
          {series.map((s) => (
            <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
      {series.length > 1 && (
        <ul className="legend">
          {series.map((s) => (
            <li key={s.key}><span className="swatch" style={{ background: s.color }} />{s.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

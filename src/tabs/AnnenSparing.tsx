import { useState } from 'react';
import { useStore } from '../state/store';
import { Badge, Callout, Card, NumberField, Select, Stat, TextField, Toggle } from '../components/ui';
import { kr, uid } from '../lib/format';
import { projectSavings } from '../lib/calc';
import { AgreementControls } from '../components/AgreementControls';
import type { SavingsAccount, SavingsType } from '../lib/types';
import type { TabId } from '../lib/nudges';

const TYPES: { value: SavingsType; label: string }[] = [
  { value: 'IPS', label: 'IPS – individuell pensjonssparing' },
  { value: 'ASK', label: 'Aksjesparekonto (ASK)' },
  { value: 'Fond', label: 'Fondskonto' },
  { value: 'VPS', label: 'VPS-konto (aksjer)' },
  { value: 'Aksjer', label: 'Aksjer' },
  { value: 'Sparekonto', label: 'Sparekonto' },
  { value: 'BSU', label: 'BSU' },
  { value: 'Annet', label: 'Annet' },
];

export function AnnenSparing({ go }: { go: (t: TabId) => void }) {
  const { state, summary: s, dispatch } = useStore();
  const p = state.profile;
  const all = state.savings;
  const included = all.filter((x) => x.includeInPension);
  const totalBalance = all.reduce((a, x) => a + x.balance, 0);
  const includedPayout = s.bySource.filter((x) => x.key === 'savings' || x.key === 'ips').reduce((a, x) => a + x.yearly, 0);
  const update = (acc: SavingsAccount) => dispatch({ type: 'upsertSavings', account: acc });

  return (
    <div className="stack">
      <Card title="Annen sparing" subtitle="Velg selv hva som skal regnes med i pensjonen">
        <div className="stats">
          <Stat label="Samlet saldo" value={kr(totalBalance)} />
          <Stat label="Med i pensjonsberegningen" value={`${included.length} av ${all.length}`} />
          <Stat label="Gir i pensjon" value={`${kr(includedPayout / 12)}/mnd`} hint="IPS til 80 år, frie midler til 90 år" />
        </div>
        <Callout>
          Sparing som ikke er bundet (ASK, fond, sparekonto) kan brukes til andre ting – bolig, bil eller buffer. Ta den bare med i
          pensjonsberegningen hvis du faktisk planlegger å bruke den som pensjon.
        </Callout>
      </Card>

      {all.length === 0 && (
        <Card>
          <p>Du har ikke registrert annen sparing ennå.</p>
          <div className="row">
            <button className="btn" onClick={() => go('koblinger')}>Hent fra banken</button>
            <button className="btn btn-ghost" onClick={() => go('spar')}>Start ny sparing</button>
          </div>
        </Card>
      )}

      <div className="accounts">
        {all.map((acc) => {
          const proj = projectSavings(p, acc);
          return (
            <article key={acc.id} className={`account card ${acc.includeInPension ? '' : 'account-muted'}`}>
              <div className="account-head">
                <div>
                  <h3>{acc.name}</h3>
                  <p className="muted">
                    {acc.type} · {acc.provider} · {acc.stockShare} % aksjer
                  </p>
                </div>
                <div className="row">
                  {acc.fund && <Badge tone="info">{acc.fund}</Badge>}
                  {acc.source === 'eksempel' ? <Badge>Eksempel</Badge> : acc.source !== 'manuell' && acc.source !== 'app' && <Badge>Koblet</Badge>}
                </div>
              </div>
              <div className="grid3">
                <NumberField label="Saldo" value={acc.balance} suffix="kr" step={1000} onChange={(v) => update({ ...acc, balance: v })} />
                <NumberField label="Sparer per måned" value={acc.monthly} suffix="kr" step={100} onChange={(v) => update({ ...acc, monthly: v })} />
                <NumberField
                  label="Aksjeandel"
                  value={acc.stockShare}
                  suffix="%"
                  step={10}
                  min={0}
                  max={100}
                  onChange={(v) => update({ ...acc, stockShare: Math.max(0, Math.min(100, v)) })}
                />
              </div>
              <div className="account-foot">
                <Toggle
                  checked={acc.includeInPension}
                  onChange={(v) => update({ ...acc, includeInPension: v })}
                  label="Ta med i pensjonsberegningen"
                />
                <span className="muted">
                  {kr(proj.balanceAtWithdrawal)} ved {p.withdrawalAge} år ≈ {kr(proj.yearlyPayout / 12)}/mnd
                </span>
              </div>
              <AgreementControls acc={acc} />
              <div className="row">
                {(acc.source === 'manuell' || acc.source === 'app' || acc.source === 'eksempel') && (
                  <button className="btn btn-ghost btn-small" onClick={() => dispatch({ type: 'removeSavings', id: acc.id })}>Slett</button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <AddSavings />
    </div>
  );
}

function AddSavings() {
  const { dispatch } = useStore();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ name: '', type: 'ASK' as SavingsType, provider: '', balance: 0, monthly: 0, stockShare: 100 });
  if (!open) return <button className="btn btn-ghost" onClick={() => setOpen(true)}>+ Legg til sparing manuelt</button>;
  const save = () => {
    dispatch({
      type: 'upsertSavings',
      account: {
        id: uid(),
        ...draft,
        name: draft.name || TYPES.find((t) => t.value === draft.type)!.label,
        provider: draft.provider || 'Ukjent',
        fee: 0.3,
        includeInPension: draft.type === 'IPS',
        source: 'manuell',
      },
    });
    setOpen(false);
  };
  return (
    <Card title="Ny sparing">
      <div className="grid2">
        <TextField label="Navn" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} placeholder="F.eks. Pensjonsfond" />
        <Select label="Type" value={draft.type} options={TYPES} onChange={(v) => setDraft({ ...draft, type: v, stockShare: v === 'Sparekonto' || v === 'BSU' ? 0 : 100 })} />
        <TextField label="Bank / leverandør" value={draft.provider} onChange={(v) => setDraft({ ...draft, provider: v })} />
        <NumberField label="Saldo" value={draft.balance} suffix="kr" step={1000} onChange={(v) => setDraft({ ...draft, balance: v })} />
        <NumberField label="Sparer per måned" value={draft.monthly} suffix="kr" step={100} onChange={(v) => setDraft({ ...draft, monthly: v })} />
        <NumberField label="Aksjeandel" value={draft.stockShare} suffix="%" step={10} onChange={(v) => setDraft({ ...draft, stockShare: v })} />
      </div>
      <div className="row">
        <button className="btn" onClick={save}>Lagre</button>
        <button className="btn btn-ghost" onClick={() => setOpen(false)}>Avbryt</button>
      </div>
    </Card>
  );
}

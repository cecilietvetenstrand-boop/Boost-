import { useMemo, useState } from 'react';
import { useStore } from '../state/store';
import { Badge, NumberField } from './ui';
import { kr } from '../lib/format';
import { calcSummary } from '../lib/calc';
import { IPS_MAX_YEARLY } from '../lib/constants';
import { requestSavingsAgreement } from '../integrations/connectors';
import type { SavingsAccount } from '../lib/types';

/** Leverandører der spareavtaler kan opprettes og endres fra appen */
export const MANAGED_PROVIDERS = ['Boost Bank', 'Boost'];

const STATUS_LABEL = { aktiv: 'Aktiv', pause: 'På pause', stoppet: 'Stoppet' } as const;
const STATUS_TONE = { aktiv: 'good', pause: 'warn', stoppet: 'neutral' } as const;

/** Styring av en spareavtale: øk eller endre beløp, sett på pause, stopp eller start igjen */
export function AgreementControls({ acc }: { acc: SavingsAccount }) {
  const { state, summary, dispatch } = useStore();
  const [mode, setMode] = useState<'none' | 'endre' | 'stopp'>('none');
  const [amount, setAmount] = useState(acc.monthly + 500);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const agreement = acc.agreement;

  const ipsCap = IPS_MAX_YEARLY / 12;
  const capped = acc.type === 'IPS' ? Math.min(amount, ipsCap) : amount;

  const preview = useMemo(
    () =>
      calcSummary({
        ...state,
        savings: state.savings.map((s) =>
          s.id === acc.id ? { ...s, monthly: capped, agreement: s.agreement && { ...s.agreement, status: 'aktiv' as const } } : s,
        ),
      }),
    [state, acc.id, capped],
  );

  if (!agreement) return null;

  // Spareavtaler kan bare endres fra appen hos Boost og Boost
  if (!MANAGED_PROVIDERS.includes(acc.provider)) {
    return (
      <div className="agreement">
        <div className="agreement-head">
          <span>
            Spareavtale: <strong>{kr(acc.monthly)}/mnd</strong> den {agreement.dayOfMonth}. hver måned
          </span>
          <Badge tone={STATUS_TONE[agreement.status]}>{STATUS_LABEL[agreement.status]}</Badge>
        </div>
        <p className="fineprint" style={{ margin: 0 }}>
          Avtalen er hos {acc.provider}. Endre, sett på pause eller stopp den i {acc.provider} sin app eller nettbank.
        </p>
      </div>
    );
  }

  const update = (patch: Partial<SavingsAccount>, text: string) => {
    dispatch({ type: 'upsertSavings', account: { ...acc, ...patch } });
    setMessage(text);
    setMode('none');
  };

  const confirmAmount = async () => {
    setBusy(true);
    await requestSavingsAgreement(acc.provider, capped);
    setBusy(false);
    update(
      { monthly: capped, agreement: { ...agreement, status: 'aktiv' } },
      `Spareavtalen er endret til ${kr(capped)}/mnd. Endringen gjelder fra neste trekk.`,
    );
  };

  const diff = acc.includeInPension ? (preview.totalYearly - summary.totalYearly) / 12 : 0;

  return (
    <div className="agreement">
      <div className="agreement-head">
        <span>
          Spareavtale: <strong>{kr(acc.monthly)}/mnd</strong> den {agreement.dayOfMonth}. hver måned
        </span>
        <Badge tone={STATUS_TONE[agreement.status]}>{STATUS_LABEL[agreement.status]}</Badge>
      </div>

      {message && <p className="agreement-msg">{message}</p>}

      {mode === 'endre' && (
        <div className="agreement-panel">
          <div className="chips">
            {[250, 500, 1000, 2000].map((v) => (
              <button key={v} className={`chip ${amount === acc.monthly + v ? 'chip-on' : ''}`} onClick={() => setAmount(acc.monthly + v)}>
                + {kr(v)}
              </button>
            ))}
          </div>
          <NumberField label="Nytt månedlig beløp" value={amount} onChange={setAmount} suffix="kr" step={100} min={100} />
          {acc.type === 'IPS' && amount > ipsCap && (
            <p className="fineprint">IPS har et tak på {kr(IPS_MAX_YEARLY)} i året. Beløpet settes til {kr(ipsCap)}/mnd.</p>
          )}
          {acc.includeInPension && diff !== 0 && (
            <p>
              Det gir ca. <strong className={diff > 0 ? 'pos' : 'neg'}>{diff > 0 ? '+' : ''}{kr(diff)}/mnd</strong> i pensjon.
            </p>
          )}
          <div className="row">
            <button className="btn btn-primary btn-small" disabled={busy || capped <= 0 || capped === acc.monthly} onClick={confirmAmount}>
              {busy ? 'Endrer…' : `Endre til ${kr(capped)}/mnd`}
            </button>
            <button className="btn btn-ghost btn-small" onClick={() => setMode('none')}>Avbryt</button>
          </div>
        </div>
      )}

      {mode === 'stopp' && (
        <div className="agreement-panel">
          <p>Vil du stoppe spareavtalen? Pengene du har spart blir stående på kontoen. Du kan starte en ny avtale når du vil.</p>
          <div className="row">
            <button className="btn btn-primary btn-small" onClick={() => update({ agreement: { ...agreement, status: 'stoppet' } }, 'Spareavtalen er stoppet.')}>
              Ja, stopp avtalen
            </button>
            <button className="btn btn-ghost btn-small" onClick={() => setMode('none')}>Avbryt</button>
          </div>
        </div>
      )}

      {mode === 'none' && (
        <div className="row">
          {agreement.status === 'aktiv' && (
            <>
              <button className="btn btn-small" onClick={() => { setAmount(acc.monthly + 500); setMode('endre'); setMessage(null); }}>
                Øk sparingen
              </button>
              <button className="btn btn-ghost btn-small" onClick={() => { setAmount(acc.monthly); setMode('endre'); setMessage(null); }}>
                Endre beløp
              </button>
              <button className="btn btn-ghost btn-small" onClick={() => update({ agreement: { ...agreement, status: 'pause' } }, 'Spareavtalen er satt på pause. Ingen trekk før du gjenopptar den.')}>
                Sett på pause
              </button>
            </>
          )}
          {agreement.status === 'pause' && (
            <button className="btn btn-small" onClick={() => update({ agreement: { ...agreement, status: 'aktiv' } }, 'Spareavtalen er i gang igjen.')}>
              Gjenoppta
            </button>
          )}
          {agreement.status === 'stoppet' ? (
            <button className="btn btn-small" onClick={() => update({ agreement: { ...agreement, status: 'aktiv' } }, `Spareavtalen er startet igjen med ${kr(acc.monthly)}/mnd.`)}>
              Start igjen
            </button>
          ) : (
            <button className="btn btn-ghost btn-small" onClick={() => { setMode('stopp'); setMessage(null); }}>
              Stopp
            </button>
          )}
        </div>
      )}
    </div>
  );
}

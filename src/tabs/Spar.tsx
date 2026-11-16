import { useMemo, useState } from 'react';
import { useStore } from '../state/store';
import { Badge, Callout, Card, NumberField, Select, Slider, Stat, Toggle } from '../components/ui';
import { kr, pct, uid } from '../lib/format';
import { calcSummary, expectedReturn, feeSplit, lifecycleShare } from '../lib/calc';
import { LIFECYCLE_END_AGE, LIFECYCLE_END_SHARE, LIFECYCLE_START_AGE, LIFECYCLE_START_SHARE } from '../lib/constants';
import { CONNECTORS, requestSavingsAgreement, requestStockShareChange } from '../integrations/connectors';
import { IPS_MAX_YEARLY, TAX_RATE_ORDINARY_INCOME } from '../lib/constants';
import type { InvestmentProfile, PensionAccount, SavingsType } from '../lib/types';

const PRODUCTS: { value: SavingsType; label: string; info: string }[] = [
  { value: 'IPS', label: 'IPS – pensjonssparing med skattefradrag', info: `Maks ${kr(IPS_MAX_YEARLY)} i året. 22 % skattefradrag. Bundet til 62 år.` },
  { value: 'ASK', label: 'Aksjesparekonto (ASK)', info: 'Fleksibelt – du kan ta ut pengene når du vil. Skatt først når gevinsten tas ut.' },
  { value: 'Fond', label: 'Fondskonto', info: 'Spar i fond, f.eks. globale indeksfond med lave kostnader.' },
];

export function Spar() {
  return (
    <div className="stack">
      <NyttSparing />
      <Aksjeandel />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Start egen sparing (spareavtale)
// ---------------------------------------------------------------------------

function NyttSparing() {
  const { state, summary: s, dispatch } = useStore();
  const p = state.profile;
  const needed = Number.isFinite(s.target.monthlyNeeded) ? Math.ceil(s.target.monthlyNeeded / 100) * 100 : 0;

  const banks = useMemo(() => {
    const connected = new Set(state.connections.map((c) => c.connectorId));
    return CONNECTORS.filter((c) => c.canCreateAgreement).sort(
      (a, b) => Number(connected.has(b.id)) - Number(connected.has(a.id)),
    );
  }, [state.connections]);

  const [product, setProduct] = useState<SavingsType>('IPS');
  const [providerId, setProviderId] = useState(banks[0]?.id ?? '');
  const [monthly, setMonthly] = useState(needed > 0 ? Math.min(needed, 1250) : 1000);
  const [stockShare, setStockShare] = useState(s.yearsToWithdrawal > 10 ? 100 : 50);
  const [day, setDay] = useState(25);
  const [include, setInclude] = useState(true);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const ipsCapMonthly = IPS_MAX_YEARLY / 12;
  const effectiveMonthly = product === 'IPS' ? Math.min(monthly, ipsCapMonthly) : monthly;

  const preview = useMemo(
    () =>
      calcSummary({
        ...state,
        savings: [
          ...state.savings,
          {
            id: 'preview',
            name: 'preview',
            type: product,
            provider: '',
            balance: 0,
            monthly: effectiveMonthly,
            stockShare,
            fee: 0.3,
            includeInPension: true,
            source: 'app',
          },
        ],
      }),
    [state, product, effectiveMonthly, stockShare],
  );

  const provider = banks.find((b) => b.id === providerId);
  const confirm = async () => {
    if (!provider) return;
    setBusy(true);
    const res = await requestSavingsAgreement(provider.name, effectiveMonthly);
    dispatch({
      type: 'upsertSavings',
      account: {
        id: uid(),
        name: `${product === 'IPS' ? 'IPS' : product === 'ASK' ? 'Aksjesparekonto' : 'Fondssparing'} – ${provider.name}`,
        type: product,
        provider: provider.name,
        balance: 0,
        monthly: effectiveMonthly,
        stockShare,
        fee: 0.3,
        includeInPension: include,
        agreement: { startDate: new Date().toISOString(), dayOfMonth: day, status: 'aktiv' },
        source: 'app',
      },
    });
    setBusy(false);
    setDone(res.reference);
  };

  return (
    <Card title="Start egen sparing" subtitle="Opprett en fast spareavtale – det enkleste grepet for mer pensjon">
      {done && (
        <Callout tone="good">
          Spareavtalen er opprettet (ref. {done}). Du finner den under «Annen sparing».{' '}
          <button className="link" onClick={() => setDone(null)}>Lag en til</button>
        </Callout>
      )}
      <div className="grid2">
        <Select label="Hva vil du spare i?" value={product} onChange={setProduct} options={PRODUCTS} help={PRODUCTS.find((x) => x.value === product)?.info} />
        <Select
          label="Hos hvem?"
          value={providerId}
          onChange={setProviderId}
          options={banks.map((b) => ({
            value: b.id,
            label: `${b.name}${state.connections.some((c) => c.connectorId === b.id) ? ' (koblet til)' : ''}`,
          }))}
        />
      </div>

      <NumberField label="Beløp per måned" value={monthly} onChange={setMonthly} suffix="kr" step={100} min={100} />
      <div className="chips">
        {needed > 0 && (
          <button className={`chip ${monthly === needed ? 'chip-on' : ''}`} onClick={() => setMonthly(needed)}>
            {kr(needed)} – nå {p.targetPercent} %-målet
          </button>
        )}
        {[500, 1000, 1250, 2000, 5000].map((v) => (
          <button key={v} className={`chip ${monthly === v ? 'chip-on' : ''}`} onClick={() => setMonthly(v)}>
            {kr(v)}
          </button>
        ))}
      </div>
      {product === 'IPS' && monthly > ipsCapMonthly && (
        <Callout tone="warn">
          IPS har et tak på {kr(IPS_MAX_YEARLY)} i året ({kr(ipsCapMonthly)}/mnd). Resten bør spares i f.eks. ASK – opprett gjerne to avtaler.
        </Callout>
      )}

      <Slider label="Aksjeandel" value={stockShare} min={0} max={100} step={10} onChange={setStockShare} format={(v) => `${v} %`} />
      <div className="grid2">
        <NumberField label="Trekkdato (dag i måneden)" value={day} min={1} max={28} onChange={(v) => setDay(Math.max(1, Math.min(28, v)))} />
        <div className="field">
          <span className="field-label">Pensjonsberegning</span>
          <Toggle checked={include} onChange={setInclude} label="Ta med i pensjonsberegningen" />
        </div>
      </div>

      <div className="stats preview">
        <Stat label="Pensjon i dag" value={`${kr(s.totalYearly / 12)}/mnd`} hint={pct(s.replacementRate) + ' av lønn'} />
        <Stat
          label="Med ny sparing"
          value={`${kr(preview.totalYearly / 12)}/mnd`}
          hint={pct(preview.replacementRate) + ' av lønn'}
          tone="good"
        />
        <Stat label="Sparekapital ved uttak" value={kr(preview.savings.find((x) => x.id === 'preview')?.balanceAtWithdrawal ?? 0)} />
        {product === 'IPS' && <Stat label="Skattefradrag" value={`${kr(effectiveMonthly * 12 * TAX_RATE_ORDINARY_INCOME)}/år`} tone="good" />}
      </div>

      <button className="btn btn-primary" disabled={busy || !provider || effectiveMonthly <= 0} onClick={confirm}>
        {busy ? 'Oppretter avtale…' : `Opprett spareavtale på ${kr(effectiveMonthly)}/mnd`}
      </button>
      <p className="fineprint">Du signerer avtalen med BankID hos {provider?.name ?? 'banken'}. Du kan endre eller stoppe den når som helst.</p>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Endre aksjeandel
// ---------------------------------------------------------------------------

function Aksjeandel() {
  const { state, summary: s } = useStore();
  const accounts = state.pensionAccounts.filter((a) => a.kind !== 'Offentlig TP');

  return (
    <Card title="Endre aksjeandel på pensjonen" subtitle="Mer aksjer gir høyere forventet pensjon, men større svingninger underveis">
      <Callout>
        <strong>Is i magen:</strong> med 100 % aksjer kan verdien falle 30–40 % i et dårlig år. Historisk har markedet hentet seg inn igjen,
        men bare for dem som ble sittende. Har du mer enn 10–15 år igjen, er høy aksjeandel vanligvis et godt valg.
      </Callout>
      {accounts.length === 0 ? (
        <p className="muted">Koble til pensjonsleverandøren din eller Norsk Pensjon for å se og endre aksjeandelen på kontoene dine.</p>
      ) : (
        <div className="accounts">
          {accounts.map((a) => (
            <StockShareEditor key={a.id} account={a} currentTotal={s.totalYearly} />
          ))}
        </div>
      )}
    </Card>
  );
}

function StockShareEditor({ account, currentTotal }: { account: PensionAccount; currentTotal: number }) {
  const { state, dispatch } = useStore();
  const [profile, setProfile] = useState<InvestmentProfile>(account.profile);
  const [share, setShare] = useState(account.stockShare);
  const [busy, setBusy] = useState(false);
  const [ref, setRef] = useState<string | null>(null);
  const age = new Date().getFullYear() - state.profile.birthYear;
  const changed = profile !== account.profile || share !== account.stockShare;

  const preview = useMemo(
    () =>
      calcSummary({
        ...state,
        pensionAccounts: state.pensionAccounts.map((a) => (a.id === account.id ? { ...a, profile, stockShare: share } : a)),
      }),
    [state, account.id, profile, share],
  );
  const diff = (preview.totalYearly - currentTotal) / 12;
  const effShare = profile === 'livsfase' ? lifecycleShare(age) : share;
  const connector = CONNECTORS.find((c) => c.id === account.source);

  const save = async () => {
    setBusy(true);
    if (connector?.canChangeStockShare) {
      const res = await requestStockShareChange(account.id, share, profile);
      setRef(res.reference);
    }
    dispatch({ type: 'upsertPension', account: { ...account, profile, stockShare: share } });
    setBusy(false);
  };

  return (
    <article className="account">
      <div className="account-head">
        <div>
          <h3>{account.kind} · {account.provider}</h3>
          <p className="muted">Saldo {kr(account.balance)} · i dag {Math.round(effShare)} % aksjer</p>
        </div>
        {ref && <Badge tone="good">Sendt · {ref}</Badge>}
      </div>
      <div className="segmented" role="radiogroup" aria-label="Investeringsprofil">
        <button role="radio" aria-checked={profile === 'livsfase'} className={profile === 'livsfase' ? 'on' : ''} onClick={() => setProfile('livsfase')}>
          Livsfase (automatisk)
        </button>
        <button role="radio" aria-checked={profile === 'fast'} className={profile === 'fast' ? 'on' : ''} onClick={() => setProfile('fast')}>
          Fast aksjeandel
        </button>
      </div>
      {profile === 'fast' ? (
        <Slider label="Aksjeandel" value={share} min={0} max={100} step={10} onChange={setShare} format={(v) => `${v} %`} />
      ) : (
        <p className="muted">
          {LIFECYCLE_START_SHARE} % aksjer til {LIFECYCLE_START_AGE} år, deretter gradvis nedtrapping over {LIFECYCLE_END_AGE - LIFECYCLE_START_AGE} år til {LIFECYCLE_END_SHARE} % ved {LIFECYCLE_END_AGE} år. Du har {Math.round(effShare)} % aksjer nå.
        </p>
      )}
      <p>
        Forventet avkastning nå: <strong>{pct(expectedReturn(effShare, feeSplit(state.profile, account).currentFee), 1)}</strong> per år etter dine kostnader og inflasjon.
        {changed && (
          <>
            {' '}Endringen gir <strong className={diff >= 0 ? 'pos' : 'neg'}>{diff >= 0 ? '+' : ''}{kr(diff)}/mnd</strong> i pensjon.
          </>
        )}
      </p>
      {changed && (
        <div className="row">
          <button className="btn btn-primary btn-small" disabled={busy} onClick={save}>
            {busy ? 'Sender…' : connector?.canChangeStockShare ? `Send endring til ${account.provider}` : 'Lagre i beregningen'}
          </button>
          <button className="btn btn-ghost btn-small" onClick={() => { setProfile(account.profile); setShare(account.stockShare); }}>Angre</button>
        </div>
      )}
    </article>
  );
}

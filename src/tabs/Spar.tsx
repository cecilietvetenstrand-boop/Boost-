import { useMemo, useState } from 'react';
import { useStore } from '../state/store';
import { Badge, Callout, Card, NumberField, Slider, Stat, Toggle } from '../components/ui';
import { kr, pct, uid } from '../lib/format';
import { activeMonthly, calcSummary, canChangeStockShare, expectedReturn, feeSplit, lifecycleShare } from '../lib/calc';
import { AgreementControls } from '../components/AgreementControls';
import { LIFECYCLE_END_AGE, LIFECYCLE_END_SHARE, LIFECYCLE_START_AGE, LIFECYCLE_START_SHARE } from '../lib/constants';
import { CONNECTORS, requestSavingsAgreement, requestStockShareChange } from '../integrations/connectors';
import { IPS_MAX_YEARLY, TAX_RATE_ORDINARY_INCOME } from '../lib/constants';
import { FUNDS, FUND_CATEGORIES } from '../lib/funds';
import type { InvestmentProfile, PensionAccount, SavingsType } from '../lib/types';

const PRODUCTS: { value: SavingsType; label: string; info: string }[] = [
  { value: 'Fond', label: 'Fondskonto', info: 'Spar fast i ett eller flere fond. Du kan ta ut pengene når du vil.' },
  { value: 'IPS', label: 'IPS', info: `Pensjonssparing med 22 % skattefradrag. Maks ${kr(IPS_MAX_YEARLY)} i året, bundet til 62 år.` },
];

export function Spar() {
  return (
    <div className="stack">
      <DineAvtaler />
      <NyttSparing />
      <Aksjeandel />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dine spareavtaler: øk, endre, pause eller stopp
// ---------------------------------------------------------------------------

function DineAvtaler() {
  const { state } = useStore();
  const list = state.savings.filter((x) => x.agreement);
  if (!list.length) return null;
  const total = list.reduce((a, x) => a + activeMonthly(x), 0);
  return (
    <Card title="Dine spareavtaler" subtitle={`Du sparer ${kr(total)} i måneden`}>
      <div className="accounts">
        {list.map((acc) => (
          <article key={acc.id} className="account">
            <div className="account-head">
              <div>
                <h3>{acc.name}</h3>
                <p className="muted">
                  {acc.provider} · {acc.fund ?? `${acc.stockShare} % aksjer`} · saldo {kr(acc.balance)}
                </p>
              </div>
            </div>
            <AgreementControls acc={acc} />
          </article>
        ))}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Start egen sparing (spareavtale)
// ---------------------------------------------------------------------------

function NyttSparing() {
  const { state, summary: s, dispatch } = useStore();
  const p = state.profile;
  const needed = Number.isFinite(s.target.monthlyNeeded) ? Math.ceil(s.target.monthlyNeeded / 100) * 100 : 0;

  const [product, setProduct] = useState<SavingsType>('Fond');
  const [fundName, setFundName] = useState(FUNDS[0].name);
  const [monthly, setMonthly] = useState(needed > 0 ? Math.min(needed, 1250) : 1000);
  const [ipsShare, setIpsShare] = useState(s.yearsToWithdrawal > 10 ? 100 : 50);
  const fund = FUNDS.find((f) => f.name === fundName) ?? FUNDS[0];
  const usesFund = product !== 'IPS';
  const stockShare = usesFund ? fund.stockShare : ipsShare;
  const fee = usesFund ? fund.assumedFee : 0.3;
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
            fee,
            includeInPension: true,
            source: 'app',
          },
        ],
      }),
    [state, product, effectiveMonthly, stockShare, fee],
  );

  // Spareavtaler kan bare opprettes i Boosts egne produkter: fondskonto og IPS
  const provider = CONNECTORS.find((c) => c.id === 'boost-liv');
  const confirm = async () => {
    if (!provider) return;
    setBusy(true);
    const res = await requestSavingsAgreement(provider.name, effectiveMonthly);
    dispatch({
      type: 'upsertSavings',
      account: {
        id: uid(),
        name: product === 'IPS' ? `IPS – ${provider.name}` : `Fondskonto – ${fund.name}`,
        type: product,
        provider: provider.name,
        balance: 0,
        monthly: effectiveMonthly,
        stockShare,
        fee,
        fund: usesFund ? fund.name : undefined,
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
          Spareavtalen er opprettet (ref. {done}). Du finner den under «Dine spareavtaler» øverst på siden.{' '}
          <button className="link" onClick={() => setDone(null)}>Lag en til</button>
        </Callout>
      )}
      <span className="field-label">Hva vil du spare i?</span>
      <div className="product-cards" role="radiogroup" aria-label="Spareprodukt">
        {PRODUCTS.map((x) => (
          <button key={x.value} role="radio" aria-checked={product === x.value} className={`product-card ${product === x.value ? 'on' : ''}`} onClick={() => setProduct(x.value)}>
            <strong>{x.label}</strong>
            <span className="muted">{x.info}</span>
          </button>
        ))}
      </div>
      {usesFund && (
        <>
          <span className="field-label">Velg fond</span>
          <div className="fund-list" role="radiogroup" aria-label="Fond">
            {FUND_CATEGORIES.map((cat) => (
              <div key={cat} className="fund-group">
                <span className="fund-cat">{cat}</span>
                {FUNDS.filter((f) => f.category === cat).map((f) => (
                  <button key={f.name} role="radio" aria-checked={fundName === f.name} className={`fund ${fundName === f.name ? 'on' : ''}`} onClick={() => setFundName(f.name)}>
                    <span>
                      <strong>{f.name}</strong>
                      <br />
                      <span className="muted">{f.info}</span>
                    </span>
                    <span className="muted">{f.stockShare} % aksjer</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
          <p className="fineprint">
            Fondene er eksempler med oppdiktede navn. Se fondets faktiske kostnad og risiko i fondslisten før du velger. Beregningen bruker et anslag på {fund.assumedFee.toLocaleString('nb-NO')} % i
            årlig kostnad for dette fondet.
          </p>
        </>
      )}
      <p className="provider-line">
        Spareavtalen opprettes hos <strong>{provider?.name}</strong>
        {' '}– fondskonto og IPS er Boosts egne produkter. Aksjesparekonto og VPS i Boost Bank kommer senere.
      </p>

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
          IPS har et tak på {kr(IPS_MAX_YEARLY)} i året ({kr(ipsCapMonthly)}/mnd). Resten kan spares i fondskonto – opprett gjerne to avtaler.
        </Callout>
      )}

      {!usesFund && <Slider label="Aksjeandel i IPS" value={ipsShare} min={0} max={100} step={10} onChange={setIpsShare} format={(v) => `${v} %`} />}
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
  const accounts = state.pensionAccounts.filter((a) => canChangeStockShare(a));
  const others = state.pensionAccounts.filter((a) => a.kind !== 'Offentlig TP' && !canChangeStockShare(a));

  return (
    <Card title="Endre aksjeandel på pensjonen" subtitle="Mer aksjer gir høyere forventet pensjon, men større svingninger underveis">
      <Callout>
        <strong>Is i magen:</strong> med 100 % aksjer kan verdien falle 30–40 % i et dårlig år. Historisk har markedet hentet seg inn igjen,
        men bare for dem som ble sittende. Har du mer enn 10–15 år igjen, er høy aksjeandel vanligvis et godt valg.
      </Callout>
      {accounts.length === 0 ? (
        <p className="muted">Du har ingen pensjonskontoer hos Boost ennå. Aksjeandelen kan bare endres her for kontoer hos Boost.</p>
      ) : (
        <div className="accounts">
          {accounts.map((a) => (
            <StockShareEditor key={a.id} account={a} currentTotal={s.totalYearly} />
          ))}
        </div>
      )}
      {others.length > 0 && (
        <div className="ins-group">
          <h3 className="ins-group-title">Hos andre selskaper</h3>
          <div className="ins-list">
            {others.map((a) => (
              <article key={a.id} className="ins-row">
                <div className="ins-main">
                  <strong>{a.kind} · {a.provider}</strong>
                  <span className="muted">
                    {a.profile === 'livsfase' ? 'Livsfaseprofil' : `${a.stockShare} % aksjer`} · saldo {kr(a.balance)}. Aksjeandelen endres hos {a.provider}, eller ved å flytte
                    pensjonen til Boost.
                  </span>
                </div>
              </article>
            ))}
          </div>
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

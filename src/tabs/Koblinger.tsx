import { useState } from 'react';
import { useStore } from '../state/store';
import { Badge, Callout, Card } from '../components/ui';
import { CONNECTORS, type Connector, type ConnectorCategory } from '../integrations/connectors';

const GROUPS: { key: ConnectorCategory; title: string; subtitle: string }[] = [
  { key: 'samlet', title: 'Samlet oversikt', subtitle: 'Én innlogging – henter pensjon fra alle leverandører' },
  { key: 'offentlig', title: 'Folketrygden', subtitle: 'Alderspensjon fra NAV' },
  { key: 'leverandor', title: 'Pensjonsleverandører', subtitle: 'Tjenestepensjon fra arbeidsgiver – også tidligere arbeidsgivere' },
  { key: 'bank', title: 'Banker og fondsplattformer', subtitle: 'Sparekontoer, fond og aksjesparekonto (PSD2)' },
];

export function Koblinger() {
  const { state } = useStore();
  return (
    <div className="stack">
      <Callout>
        <strong>Demo-modus:</strong> koblingene returnerer testdata. I produksjon logger du inn med BankID/ID-porten, og vi henter data
        med ditt samtykke. Du kan når som helst koble fra – da slettes dataene fra appen.
      </Callout>
      {GROUPS.map((g) => (
        <Card key={g.key} title={g.title} subtitle={g.subtitle}>
          <div className="connectors">
            {CONNECTORS.filter((c) => c.category === g.key).map((c) => (
              <ConnectorRow key={c.id} connector={c} connection={state.connections.find((x) => x.connectorId === c.id)} />
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

function ConnectorRow({ connector: c, connection }: { connector: Connector; connection?: { lastSync: string } }) {
  const { state, dispatch } = useStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [asking, setAsking] = useState(false);

  const sync = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await c.fetch(state.profile);
      dispatch({ type: 'import', connectorId: c.id, result });
      setAsking(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Noe gikk galt');
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="connector">
      <div className="connector-main">
        <div className="connector-logo" aria-hidden>{c.name.slice(0, 2).toUpperCase()}</div>
        <div>
          <h3>
            {c.name} {connection && <Badge tone="good">Tilkoblet</Badge>}
          </h3>
          <p className="muted">{c.description}</p>
          <p className="connector-provides">
            {c.provides.map((x) => (
              <span key={x} className="tag">{x}</span>
            ))}
          </p>
          {connection && (
            <p className="fineprint">Sist oppdatert {new Date(connection.lastSync).toLocaleString('nb-NO')}</p>
          )}
          {error && <p className="neg">{error}</p>}
        </div>
      </div>
      <div className="connector-actions">
        {connection ? (
          <>
            <button className="btn btn-small" disabled={busy} onClick={sync}>{busy ? 'Henter…' : 'Oppdater'}</button>
            <button className="btn btn-ghost btn-small" onClick={() => dispatch({ type: 'disconnect', connectorId: c.id })}>Koble fra</button>
          </>
        ) : asking ? (
          <div className="consent">
            <label className="checkbox">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              Jeg samtykker til at Boost henter pensjons- og sparedata fra {c.name}.
            </label>
            <div className="row">
              <button className="btn btn-primary btn-small" disabled={!consent || busy} onClick={sync}>
                {busy ? 'Logger inn…' : `Logg inn med ${c.auth}`}
              </button>
              <button className="btn btn-ghost btn-small" onClick={() => setAsking(false)}>Avbryt</button>
            </div>
          </div>
        ) : (
          <button className="btn btn-small" onClick={() => setAsking(true)}>Koble til</button>
        )}
      </div>
    </article>
  );
}

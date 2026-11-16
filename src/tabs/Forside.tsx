import { useEffect } from 'react';
import { ArrowRight, ChartLine, Landmark, PiggyBank, ShieldCheck, Sparkles, Wallet } from 'lucide-react';
import { useStore } from '../state/store';
import { SOURCE_COLOR } from '../components/charts';
import { kr, pct } from '../lib/format';
import type { TabId } from '../lib/nudges';

/** Fjordlandskap i blåtoner – tegnet som enkle lag, så det skalerer skarpt og laster uten bilder */
function Fjord() {
  return (
    <svg className="fjord" viewBox="0 0 1440 640" preserveAspectRatio="xMidYMax slice" aria-hidden>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0a1f8f" />
          <stop offset="0.45" stopColor="#1546ff" />
          <stop offset="0.8" stopColor="#3ea6ff" />
          <stop offset="1" stopColor="#8fdcff" />
        </linearGradient>
        <radialGradient id="glow" cx="0.72" cy="0.42" r="0.35">
          <stop offset="0" stopColor="#d9f6ff" stopOpacity="0.9" />
          <stop offset="0.4" stopColor="#7fd3ff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#3ea6ff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b8dff" />
          <stop offset="0.5" stopColor="#0b2ab8" />
          <stop offset="1" stopColor="#1546ff" />
        </linearGradient>
        <linearGradient id="far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9fd8ff" />
          <stop offset="1" stopColor="#4f9dff" />
        </linearGradient>
        <linearGradient id="mid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b78ff" />
          <stop offset="1" stopColor="#1a46e0" />
        </linearGradient>
        <linearGradient id="near" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1435c4" />
          <stop offset="1" stopColor="#0a1f8f" />
        </linearGradient>
      </defs>
      <rect width="1440" height="640" fill="url(#sky)" />
      <rect width="1440" height="640" fill="url(#glow)" className="fjord-glow" />
      {/* fjerne fjell */}
      <path d="M0 420 L120 330 L210 372 L330 250 L430 340 L520 300 L640 380 L760 270 L860 330 L980 240 L1100 350 L1220 290 L1340 360 L1440 320 L1440 470 L0 470 Z" fill="url(#far)" opacity="0.85" />
      {/* snø */}
      <path d="M330 250 L362 290 L345 286 L330 300 L314 284 L300 288 Z M980 240 L1012 276 L995 274 L980 288 L966 272 L950 276 Z" fill="#eaf8ff" opacity="0.9" />
      {/* midtre fjell */}
      <path d="M0 470 L90 400 L190 440 L300 360 L420 455 L560 470 L880 470 L1000 380 L1110 430 L1230 350 L1340 420 L1440 390 L1440 500 L0 500 Z" fill="url(#mid)" />
      {/* nære fjellsider */}
      <path d="M0 500 L0 300 L70 330 L150 410 L260 470 L380 500 Z" fill="url(#near)" />
      <path d="M1440 500 L1440 260 L1360 300 L1270 380 L1160 450 L1040 500 Z" fill="url(#near)" />
      {/* vann */}
      <rect y="500" width="1440" height="140" fill="url(#water)" />
      <g className="fjord-ripples" stroke="#bfe9ff" strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round">
        <line x1="560" y1="530" x2="720" y2="530" />
        <line x1="760" y1="548" x2="980" y2="548" />
        <line x1="480" y1="566" x2="600" y2="566" />
        <line x1="900" y1="584" x2="1060" y2="584" />
        <line x1="640" y1="602" x2="840" y2="602" />
      </g>
    </svg>
  );
}

const FEATURES = [
  { icon: ChartLine, title: 'Velg når du går av', text: 'Dra uttaksalderen fra 62 til 75 år og se pensjonen per måned.', tab: 'pensjon' as TabId },
  { icon: Landmark, title: 'NAV og arbeidsgiver', text: 'Folketrygden, EPK, EPK-S og AFP samlet, slik som i Norsk Pensjon.', tab: 'pensjon' as TabId },
  { icon: Wallet, title: 'All sparing samlet', text: 'IPS, aksjesparekonto, fond, VPS og sparekonto – du velger hva som teller.', tab: 'sparing' as TabId },
  { icon: PiggyBank, title: 'Spar smartere', text: 'Se hva du må spare for å få 80 % av lønnen, og start en spareavtale.', tab: 'spar' as TabId },
];

export function Forside({ go }: { go: (t: TabId) => void }) {
  const { state, summary: s } = useStore();
  const p = state.profile;
  // Blå bakgrunn også ved overscroll på mobil
  useEffect(() => {
    document.body.classList.add('on-landing');
    return () => document.body.classList.remove('on-landing');
  }, []);
  const total = s.totalYearly || 1;

  return (
    <div className="landing">
      <section className="landing-hero">
        <Fjord />
        <div className="landing-inner">
          <header className="landing-top">
            <span className="landing-brand">
              <span className="logo" aria-hidden>B</span> Boost
            </span>
            <button className="landing-link" onClick={() => go('oversikt')}>
              Åpne appen
            </button>
          </header>

          <div className="landing-grid">
            <div className="landing-copy">
              <p className="landing-eyebrow">Pensjon og sparing</p>
              <h1>Hvor mye får du å leve av som pensjonist?</h1>
              <p className="landing-lead">
                Samle pensjonen fra NAV, arbeidsgiveren og din egen sparing på ett sted. Se hva det betyr å gå av ved 62, 67 eller 70 – og hva du kan gjøre i dag.
              </p>
              <div className="landing-ctas">
                <button className="landing-cta" onClick={() => go('oversikt')}>
                  Se pensjonen min <ArrowRight size={18} aria-hidden />
                </button>
                <button className="landing-cta-ghost" onClick={() => go('laer')}>
                  Lær om pensjon
                </button>
              </div>
            </div>

            <aside className="landing-card" aria-label="Eksempel på pensjon">
              <p className="landing-card-label">
                {state.isExample ? 'Eksempel' : 'Din pensjon'} · uttak ved {p.withdrawalAge} år
              </p>
              <p className="landing-card-num">
                {kr(s.totalYearly / 12)}
                <span>/mnd</span>
              </p>
              <p className="landing-card-sub">{pct(s.replacementRate)} av dagens lønn, før skatt</p>
              <div className="landing-bar" role="img" aria-label="Fordeling per kilde">
                {s.bySource.map((x) => (
                  <span key={x.key} style={{ width: `${(x.yearly / total) * 100}%`, background: SOURCE_COLOR[x.key] }} />
                ))}
              </div>
              <ul className="landing-legend">
                {s.bySource.map((x) => (
                  <li key={x.key}>
                    <span className="swatch" style={{ background: SOURCE_COLOR[x.key] }} />
                    <span>{x.label}</span>
                    <strong>{kr(x.yearly / 12)}</strong>
                  </li>
                ))}
              </ul>
              {s.target.shortfallYearly > 0 && (
                <p className="landing-card-tip">
                  <Sparkles size={16} aria-hidden /> Spar {kr(s.target.monthlyNeeded)}/mnd for å nå {p.targetPercent} % av lønnen
                </p>
              )}
            </aside>
          </div>
        </div>
      </section>

      <section className="landing-features">
        {FEATURES.map((f) => (
          <button key={f.title} className="landing-feature" onClick={() => go(f.tab)}>
            <span className="landing-feature-icon">
              <f.icon size={20} aria-hidden />
            </span>
            <strong>{f.title}</strong>
            <span className="muted">{f.text}</span>
          </button>
        ))}
      </section>

      <section className="landing-trust">
        <ShieldCheck size={20} aria-hidden />
        <p>
          Dataene dine lagres bare på din enhet. Koble til Norsk Pensjon, NAV og banken med BankID når du vil ha ekte tall.
          {state.isExample && ' Tallene du ser nå er et oppdiktet eksempel.'}
        </p>
      </section>
    </div>
  );
}

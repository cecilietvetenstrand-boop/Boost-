import { useEffect, useState } from 'react';
import { StoreProvider, useStore } from './state/store';
import { Oversikt } from './tabs/Oversikt';
import { Pensjon } from './tabs/Pensjon';
import { AnnenSparing } from './tabs/AnnenSparing';
import { Spar } from './tabs/Spar';
import { Koblinger } from './tabs/Koblinger';
import { Laer } from './tabs/Laer';
import { Profil } from './tabs/Profil';
import type { TabId } from './lib/nudges';
import { kr } from './lib/format';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'oversikt', label: 'Oversikt', icon: '◎' },
  { id: 'pensjon', label: 'Pensjonen min', icon: '▤' },
  { id: 'sparing', label: 'Annen sparing', icon: '◈' },
  { id: 'spar', label: 'Spar', icon: '＋' },
  { id: 'koblinger', label: 'Koblinger', icon: '⇄' },
  { id: 'laer', label: 'Lær mer', icon: '✎' },
  { id: 'profil', label: 'Profil', icon: '☺' },
];

function Shell() {
  const { state, summary } = useStore();
  const initial = (location.hash.slice(1) as TabId) || 'oversikt';
  const [tab, setTab] = useState<TabId>(TABS.some((t) => t.id === initial) ? initial : 'oversikt');
  const go = (t: TabId) => {
    setTab(t);
    history.replaceState(null, '', `#${t}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  useEffect(() => {
    const onHash = () => {
      const h = location.hash.slice(1) as TabId;
      if (TABS.some((t) => t.id === h)) setTab(h);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden>B</span>
          <div>
            <strong>Boost</strong>
            <span className="muted">{state.profile.name ? `Hei, ${state.profile.name}` : 'Din pensjon'}</span>
          </div>
        </div>
        <div className="topbar-total" title="Forventet pensjon per måned">
          <span className="muted">Pensjon</span>
          <strong>{kr(summary.totalYearly / 12)}/mnd</strong>
        </div>
      </header>
      <nav className="tabs" aria-label="Faner">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} aria-current={tab === t.id ? 'page' : undefined} onClick={() => go(t.id)}>
            <span className="tab-icon" aria-hidden>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
      <main className="content">
        {tab === 'oversikt' && <Oversikt go={go} />}
        {tab === 'pensjon' && <Pensjon go={go} />}
        {tab === 'sparing' && <AnnenSparing go={go} />}
        {tab === 'spar' && <Spar />}
        {tab === 'koblinger' && <Koblinger />}
        {tab === 'laer' && <Laer />}
        {tab === 'profil' && <Profil />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}

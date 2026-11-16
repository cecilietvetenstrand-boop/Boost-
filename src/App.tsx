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
import { BookOpen, ChartLine, LayoutDashboard, Link2, PiggyBank, PlusCircle, UserRound } from 'lucide-react';

const TABS: { id: TabId; label: string; icon: typeof BookOpen }[] = [
  { id: 'oversikt', label: 'Oversikt', icon: LayoutDashboard },
  { id: 'pensjon', label: 'Pensjon', icon: ChartLine },
  { id: 'sparing', label: 'Sparing', icon: PiggyBank },
  { id: 'spar', label: 'Spar', icon: PlusCircle },
  { id: 'koblinger', label: 'Koblinger', icon: Link2 },
  { id: 'laer', label: 'Lær', icon: BookOpen },
  { id: 'profil', label: 'Profil', icon: UserRound },
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
            <t.icon className="tab-icon" size={18} aria-hidden />
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
        {tab === 'laer' && <Laer go={go} />}
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

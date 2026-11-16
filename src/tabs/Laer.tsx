import { useState, type ComponentType, type ReactNode } from 'react';
import {
  Anchor,
  ArrowRight,
  Brain,
  Briefcase,
  ChartPie,
  Gauge,
  HandCoins,
  Landmark,
  ListChecks,
  PiggyBank,
  Receipt,
  Repeat,
  Scale,
  Sprout,
  Target,
  Users,
  Wallet,
} from 'lucide-react';
import { Slider } from '../components/ui';
import { kr } from '../lib/format';
import type { TabId } from '../lib/nudges';

type Icon = ComponentType<{ size?: number; 'aria-hidden'?: boolean }>;

interface Article {
  id: string;
  icon: Icon;
  title: string;
  tag: 'Pensjon' | 'Sparing' | 'Skatt' | 'Psykologi';
  lead: string;
  body: ReactNode;
}

/** Fremtidig verdi av månedlig sparing med årlig avkastning r */
function fv(monthly: number, years: number, r: number) {
  const rm = Math.pow(1 + r, 1 / 12) - 1;
  const n = years * 12;
  return rm === 0 ? monthly * n : (monthly * (Math.pow(1 + rm, n) - 1)) / rm;
}

const Dots = ({ items }: { items: ReactNode[] }) => (
  <ul className="dot-list">
    {items.map((x, i) => (
      <li key={i}>
        <span>{x}</span>
      </li>
    ))}
  </ul>
);

const Steps = ({ items }: { items: [string, string][] }) => (
  <ol className="num-list">
    {items.map(([title, text]) => (
      <li key={title}>
        <span>
          <strong>{title}.</strong> {text}
        </span>
      </li>
    ))}
  </ol>
);

const Note = ({ children }: { children: ReactNode }) => <div className="note-box">{children}</div>;

// ---------------------------------------------------------------------------
// Kalkulatorer
// ---------------------------------------------------------------------------

const SCENARIOS = [
  { label: 'Mest aksjer', rate: 0.065, note: 'ca. 6,5 % i året' },
  { label: 'Halvt aksjer', rate: 0.045, note: 'ca. 4,5 % i året' },
  { label: 'Sparekonto', rate: 0.03, note: 'ca. 3 % i året' },
];

function GrowthCalculator() {
  const [monthly, setMonthly] = useState(2000);
  const [years, setYears] = useState(25);
  const paid = monthly * 12 * years;
  return (
    <section className="card">
      <h2>Se hva sparingen kan bli</h2>
      <div className="calc-grid">
        <Slider label="Sparer per måned" value={monthly} min={500} max={10000} step={500} onChange={setMonthly} format={kr} />
        <Slider label="I antall år" value={years} min={5} max={40} onChange={setYears} format={(v) => `${v} år`} />
      </div>
      <div className="calc-results">
        {SCENARIOS.map((s, i) => (
          <div key={s.label} className={`calc-result ${i === 0 ? 'first' : ''}`}>
            <div className="lbl">
              {s.label} · {s.note}
            </div>
            <div className="big">{kr(fv(monthly, years, s.rate))}</div>
          </div>
        ))}
      </div>
      <p className="fineprint">
        Du har satt inn {kr(paid)} selv. Resten er avkastning på avkastningen – rentes rente. Tallene er antatt avkastning før skatt og
        prisvekst, ikke en garanti.
      </p>
    </section>
  );
}

function FeeCalculator() {
  const monthly = 2000;
  const years = 30;
  const gross = 0.06;
  const cheap = fv(monthly, years, gross - 0.002);
  const expensive = fv(monthly, years, gross - 0.015);
  return (
    <>
      <p>
        Sparer du {kr(monthly)} i måneden i {years} år med samme avkastning før kostnader (6 %), blir forskjellen stor:
      </p>
      <div className="calc-results">
        <div className="calc-result first">
          <div className="lbl">Indeksfond · 0,2 % i året</div>
          <div className="big">{kr(cheap)}</div>
        </div>
        <div className="calc-result">
          <div className="lbl">Aktivt fond · 1,5 % i året</div>
          <div className="big">{kr(expensive)}</div>
        </div>
      </div>
      <Note>
        Det er <strong>{kr(cheap - expensive)}</strong> mer til deg – bare ved å velge et billigere fond.
      </Note>
    </>
  );
}

// ---------------------------------------------------------------------------
// Artikler
// ---------------------------------------------------------------------------

const ARTICLES: Article[] = [
  {
    id: 'nudging',
    icon: Brain,
    tag: 'Psykologi',
    title: 'Nudging – lur deg selv til å spare',
    lead: 'Små dytt som gjør det riktige valget til det enkleste.',
    body: (
      <>
        <p>
          Vi utsetter gjerne ting vi vet er lurt. Nudging handler om å rigge hverdagen slik at du sparer uten å måtte bestemme deg på
          nytt hver måned. Begrepet ble kjent gjennom atferdsøkonomene Richard Thaler og Cass Sunstein.
        </p>
        <Dots
          items={[
            <><strong>Betal deg selv først.</strong> Legg spareavtalen på lønningsdagen – ikke spar det som er igjen på slutten av måneden.</>,
            <><strong>Øk når lønna øker.</strong> Gå opp 200–500 kr i måneden ved hvert lønnsoppgjør. Du merker det knapt.</>,
            <><strong>Gi sparingen et navn.</strong> «Pensjon som 62-åring» motiverer mer enn «Sparekonto 2».</>,
            <><strong>Gjør uttak litt tungvint.</strong> Hold langsiktig sparing på en konto du ikke ser hver dag.</>,
            <><strong>Rund opp kjøp.</strong> La banken runde opp kortkjøp og sette mellomlegget i fond.</>,
          ]}
        />
        <Note>
          Standardvalg er sterke – de fleste beholder det som er valgt for dem. Sørg for at standardvalgene dine (fast sparing, aksjeandel i
          pensjonen) er valg du faktisk ønsker. Appen gir deg dytt under «Forslag til deg» – alltid basert på dine egne tall.
        </Note>
      </>
    ),
  },
  {
    id: 'is-i-magen',
    icon: Anchor,
    tag: 'Psykologi',
    title: 'Is i magen når markedet faller',
    lead: 'Fall i aksjemarkedet er normalt – å selge i panikk er dyrt.',
    body: (
      <>
        <p>
          Aksjemarkedet faller med jevne mellomrom, av og til kraftig. Under finanskrisen i 2008 falt verdens aksjemarkeder rundt 40–50 %, og
          under koronakrisen i 2020 rundt 30 % på noen uker. Brede, globale markeder har likevel hentet seg inn igjen over tid. De som tapte
          mest, var ofte de som solgte på bunnen.
        </p>
        <Dots
          items={[
            <><strong>Tenk i tiår, ikke dager.</strong> Penger du trenger om mer enn 10 år, tåler svingninger.</>,
            <><strong>Fortsett spareavtalen.</strong> Når kursene er lave, får du flere andeler for de samme kronene.</>,
            <><strong>Sjekk sjeldnere.</strong> Jo oftere du ser på saldoen, jo mer ser du av svingningene.</>,
            <><strong>Ha en buffer.</strong> 2–3 månedslønner på sparekonto gjør at du slipper å selge fond når noe uventet skjer.</>,
            <><strong>Bestem deg på forhånd.</strong> Hva gjør du hvis markedet faller 20 %? Som regel er svaret: ingenting.</>,
          ]}
        />
      </>
    ),
  },
  {
    id: 'spre',
    icon: ChartPie,
    tag: 'Sparing',
    title: 'Spre investeringene',
    lead: 'Ikke legg alle eggene i én kurv.',
    body: (
      <>
        <p>
          Ett selskap kan gå konkurs, men det er svært lite sannsynlig at tusenvis av selskaper i hele verden gjør det samtidig. Spredning gir
          deg markedets avkastning med mindre risiko.
        </p>
        <Dots
          items={[
            <><strong>Globale indeksfond</strong> er en enkel grunnmur – ett fond gir deg tusenvis av selskaper i mange land.</>,
            <><strong>Spre over tid</strong> med fast månedlig sparing i stedet for å prøve å treffe riktig tidspunkt.</>,
            <><strong>Ikke for mye i én aksje</strong> – heller ikke i arbeidsgiveren din. Går det dårlig, kan du miste både jobb og sparepenger.</>,
            <><strong>Se helheten.</strong> Pensjon, ASK, fond og sparekonto er én portefølje.</>,
            <><strong>Juster risikoen med alderen.</strong> Litt mindre aksjer de siste årene før du trenger pengene.</>,
          ]}
        />
      </>
    ),
  },
  {
    id: 'epk',
    icon: Gauge,
    tag: 'Pensjon',
    title: 'EPK – sjekk aksjeandelen din',
    lead: 'Egen pensjonskonto er kanskje din største sparekonto.',
    body: (
      <>
        <p>
          All innskuddspensjon fra arbeidsgivere samles i <strong>egen pensjonskonto (EPK)</strong>. Arbeidsgiveren setter inn pengene, men{' '}
          <strong>du</strong> bestemmer hvor mye som skal stå i aksjer. Mange har aldri sjekket det.
        </p>
        <Steps
          items={[
            ['Finn leverandøren', 'Logg inn på norskpensjon.no med BankID og se hvem som forvalter pensjonen din – eller koble til i appen.'],
            ['Logg inn hos leverandøren', 'Se etter «spareprofil» eller «investeringsvalg».'],
            ['Velg aksjeandel', 'Vanlige valg er 100, 80, 50 eller 20 % aksjer, eller en livsfaseprofil som trapper ned automatisk mot pensjon.'],
            ['Sjekk kostnadene', 'Arbeidsgiver betaler forvaltningen av pensjonen fra nåværende jobb. Pensjon fra tidligere jobber betaler du selv for – til samme pris som arbeidsgiver har avtalt.'],
            ['Vurder EPK-S', 'Du kan velge leverandør selv. Da betaler du forvaltningen, men får kompensasjon fra arbeidsgiver tilsvarende standardprisen.'],
          ]}
        />
        <Note>
          Tommelfingerregel: er det mer enn 15 år til du skal ta ut pensjon, velger mange høy aksjeandel. En livsfaseprofil passer deg som
          ikke vil følge med selv. Valget er ditt, og det kan endres når som helst – også under «Spar» i appen.
        </Note>
      </>
    ),
  },
  {
    id: 'epk-s',
    icon: Repeat,
    tag: 'Pensjon',
    title: 'EPK-S – egen pensjonskonto selvvalgt',
    lead: 'Velg selv hvor pensjonen fra arbeidsgiveren skal forvaltes – med samme skattefordeler som EPK.',
    body: (
      <>
        <p>
          Med <strong>EPK-S</strong> velger du selv hvilken leverandør som skal forvalte den egne pensjonskontoen din, i stedet for
          leverandøren arbeidsgiveren har valgt. Innskuddene fra arbeidsgiveren går da til kontoen du har valgt.
        </p>
        <h4>Samme skattefordeler som EPK</h4>
        <Dots
          items={[
            'Innskuddene fra arbeidsgiver skattlegges ikke som lønn når de settes inn.',
            'Pensjonskapitalen er fritatt for formuesskatt, og avkastningen skattlegges ikke underveis.',
            'Utbetalingen skattlegges som pensjon, og pengene er bundet til du tar ut pensjon.',
          ]}
        />
        <h4>Hvem betaler kostnadene?</h4>
        <table className="table">
          <thead>
            <tr>
              <th />
              <th>EPK (arbeidsgivers leverandør)</th>
              <th>EPK-S (selvvalgt)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Forvaltning – pensjon fra nåværende jobb</td>
              <td>Arbeidsgiver betaler</td>
              <td>Du betaler, men får kompensasjon tilsvarende arbeidsgivers standardpris</td>
            </tr>
            <tr>
              <td>Forvaltning – pensjon fra tidligere jobber</td>
              <td>Du betaler, til samme pris som arbeidsgiver har avtalt</td>
              <td>Du betaler selv</td>
            </tr>
            <tr>
              <td>Administrasjonskostnader</td>
              <td>Arbeidsgiver betaler</td>
              <td>Du betaler selv</td>
            </tr>
          </tbody>
        </table>
        <Note>
          <strong>Slik virker kompensasjonen:</strong> Velger du forvaltning som er dyrere enn arbeidsgivers standardforvaltning, betaler du
          forskjellen selv. Er den billigere, blir overskuddet igjen på pensjonskontoen din.
        </Note>
        <h4>Når kan EPK-S lønne seg?</h4>
        <Dots
          items={[
            'Når du finner forvaltning som er billigere enn arbeidsgivers standardpris – da går overskuddet inn på kontoen din.',
            'Når du vil ha et annet fondsutvalg eller en annen aksjeandel enn arbeidsgivers leverandør tilbyr.',
            'Når du vil ha pensjonen samlet hos samme bank som resten av sparingen.',
          ]}
        />
        <p>
          Husk å regne med administrasjonskostnadene du må betale selv. Under «Pensjonen min» kan du trykke «Endre kostnader» på
          pensjonskontoen og se hva EPK-S ville gitt deg.
        </p>
      </>
    ),
  },
  {
    id: 'eget-innskudd',
    icon: HandCoins,
    tag: 'Skatt',
    title: 'Eget innskudd i pensjonskontoen',
    lead: 'Spar ekstra i EPK/EPK-S via lønna og få 22 % igjen på skatten.',
    body: (
      <>
        <p>
          Har arbeidsgiveren innskuddspensjon, kan du selv spare inntil <strong>5 % av lønnen</strong> (opp til 12 G) i pensjonskontoen – men
          ikke mer enn arbeidsgiveren sparer for deg. Beløpet trekkes fra lønnen og gir fradrag i alminnelig inntekt.
        </p>
        <Note>
          <strong>Eksempel:</strong> Lønn 600 000 kr, arbeidsgiver sparer 5 %. Du sparer 5 % selv = 30 000 kr i året. Du får 6 600 kr i
          skattefradrag, så det koster deg egentlig 23 400 kr.
        </Note>
        <p>Pengene er bundet til uttak av pensjon. Spør arbeidsgiveren eller leverandøren hvordan du melder deg på.</p>
      </>
    ),
  },
  {
    id: 'kostnader',
    icon: Receipt,
    tag: 'Sparing',
    title: 'Kostnader – det du betaler, får du aldri igjen',
    lead: 'Små prosenter blir store beløp over tid.',
    body: <FeeCalculator />,
  },
  {
    id: 'kontoer',
    icon: Wallet,
    tag: 'Skatt',
    title: 'ASK, IPS og BSU',
    lead: 'Riktig konto til riktig formål.',
    body: (
      <>
        <Dots
          items={[
            <><strong>Aksjesparekonto (ASK):</strong> Bytt fond og aksjer uten å skatte underveis. Skatt betales først når du tar ut gevinst – det du har satt inn, kan tas ut skattefritt.</>,
            <><strong>Individuell pensjonssparing (IPS):</strong> Inntil 15 000 kr i året med 22 % skattefradrag. Låst til du fyller 62, utbetales over minst 10 år og til minst 80 år.</>,
            <><strong>BSU:</strong> Er du under 34 og skal kjøpe bolig, gir BSU skattefradrag hvert år – ofte den beste risikofrie avkastningen du kan få.</>,
          ]}
        />
        <Note>Beløpsgrenser og satser endres. Sjekk gjeldende regler hos Skatteetaten før du bestemmer deg.</Note>
      </>
    ),
  },
  {
    id: 'spareavtale',
    icon: PiggyBank,
    tag: 'Sparing',
    title: 'Spareavtale',
    lead: 'Et fast beløp som trekkes automatisk hver måned.',
    body: (
      <>
        <Dots
          items={[
            <><strong>Automatisk:</strong> Legg trekket rett etter lønningsdagen.</>,
            <><strong>Jevn innkjøpspris:</strong> Du kjøper hver måned – billig når markedet er nede, dyrere når det er oppe. Du slipper å treffe riktig tidspunkt.</>,
            <><strong>Start smått:</strong> 500 kr i måneden er mye bedre enn ingenting.</>,
            <><strong>Fleksibelt:</strong> Du kan endre, pause eller stoppe avtalen når du vil.</>,
          ]}
        />
        <Note>Under «Spar» kan du opprette en spareavtale og se med en gang hvor mye mer pensjon den gir.</Note>
      </>
    ),
  },
  {
    id: 'folketrygden',
    icon: Landmark,
    tag: 'Pensjon',
    title: 'Folketrygden',
    lead: 'Grunnmuren i pensjonen din – og hva du kan påvirke.',
    body: (
      <>
        <Dots
          items={[
            <>Hvert år du jobber, tjener du opp <strong>18,1 %</strong> av inntekten din i pensjon fra folketrygden, opp til et tak på 7,1 G.</>,
            <>Du kan ta ut pensjon fra <strong>62 til 75 år</strong>. Jo senere du starter, jo høyere blir den årlige pensjonen, fordi den skal vare i færre år.</>,
            <>Du kan <strong>jobbe og ta ut pensjon samtidig</strong> uten at pensjonen fra NAV blir avkortet.</>,
            <>Beholdningen deles på et <strong>delingstall</strong> basert på forventet levealder for årskullet ditt (levealdersjustering).</>,
            <>Lav eller ingen opptjening gir rett til <strong>garantipensjon</strong> fra 67 år.</>,
            <>Også foreldrepenger, dagpenger, førstegangstjeneste og omsorg for små barn gir opptjening.</>,
          ]}
        />
        <Note>På «Pensjonen min» kan du dra i uttaksalderen og se forskjellen selv.</Note>
      </>
    ),
  },
  {
    id: 'tjenestepensjon',
    icon: Briefcase,
    tag: 'Pensjon',
    title: 'Tjenestepensjon',
    lead: 'Pensjonen arbeidsgiveren sparer for deg – i tillegg til lønnen.',
    body: (
      <>
        <p>
          Alle arbeidsgivere i privat sektor må spare minst <strong>2 % av lønnen</strong> til pensjon (obligatorisk tjenestepensjon), fra
          første krone og første arbeidsdag. Mange sparer mer – opptil 7 % av lønn opp til 12 G, pluss inntil 18,1 % ekstra for lønn mellom
          7,1 og 12 G.
        </p>
        <Dots
          items={[
            <><strong>Innskuddspensjon</strong> – vanligst i privat sektor. Utbetales minst 10 år og til minst 80 år.</>,
            <><strong>Ytelsespensjon</strong> – arbeidsgiver lover en pensjon av en viss størrelse. Mindre vanlig i dag.</>,
            <><strong>Offentlig tjenestepensjon</strong> (KLP, Statens pensjonskasse m.fl.) – livsvarig påslag for deg født 1963 eller senere.</>,
            <><strong>Bytter du jobb</strong>, blir pensjonen med deg. Gamle fripoliser og pensjonskapitalbevis kan ofte flyttes for lavere kostnader.</>,
          ]}
        />
        <Note>Spør om pensjonsordningen når du forhandler lønn. Ett prosentpoeng mer pensjonssparing er mye verdt over tid.</Note>
      </>
    ),
  },
  {
    id: 'afp',
    icon: Scale,
    tag: 'Pensjon',
    title: 'AFP – avtalefestet pensjon',
    lead: 'Et livsvarig tillegg hvis du jobber i en bedrift med AFP-avtale.',
    body: (
      <Dots
        items={[
          'AFP finnes i hele offentlig sektor og i mange private bedrifter med tariffavtale.',
          'Du må normalt ha jobbet i en AFP-bedrift i mange av årene før du fyller 62, og være ansatt der når du tar ut AFP.',
          'Bytter du til en bedrift uten AFP rett før pensjon, kan du miste hele AFP-en – sjekk før du bytter jobb!',
          'AFP-ordningen i privat sektor er under endring. Sjekk vilkårene hos Fellesordningen for AFP eller tillitsvalgt.',
        ]}
      />
    ),
  },
  {
    id: '80',
    icon: Target,
    tag: 'Pensjon',
    title: 'Hvorfor 80 % av lønnen?',
    lead: 'En tommelfingerregel for hvor mye pensjon du trenger.',
    body: (
      <p>
        Som pensjonist har mange lavere utgifter: boliglånet er ofte nedbetalt, du sparer ikke lenger til pensjon, og du har ikke
        jobbreiser. Pensjon skattlegges også litt lavere enn lønn. Derfor regnes 70–80 % av lønnen før skatt ofte som nok til å
        opprettholde levestandarden. Du kan endre målet under «Profil».
      </p>
    ),
  },
  {
    id: 'deltid',
    icon: Users,
    tag: 'Pensjon',
    title: 'Deltid, permisjon og pensjon',
    lead: 'Perioder med lav inntekt gir lavere pensjon resten av livet.',
    body: (
      <p>
        Jobber du deltid, får du lavere opptjening både i folketrygden og tjenestepensjonen. Omsorg for barn under 6 år gir en viss
        opptjening i folketrygden, men ikke i tjenestepensjonen. Er dere to, kan det være lurt å snakke om hvordan dere fordeler deltid og
        sparing – slik at ingen taper på det.
      </p>
    ),
  },
];

const TAGS = ['Alle', 'Pensjon', 'Sparing', 'Skatt', 'Psykologi'] as const;

export function Laer({ go }: { go: (t: TabId) => void }) {
  const [tag, setTag] = useState<(typeof TAGS)[number]>('Alle');
  const [q, setQ] = useState('');
  const list = ARTICLES.filter(
    (a) => (tag === 'Alle' || a.tag === tag) && (q === '' || (a.title + a.lead).toLowerCase().includes(q.toLowerCase())),
  );
  return (
    <div className="stack">
      <header className="page-head">
        <h1>Lær</h1>
        <p>Korte, ærlige råd om hvordan du får mer ut av pengene dine – uten å bli finansekspert.</p>
      </header>

      <section className="card">
        <div className="learn-steps">
          {[
            ['Spar automatisk', 'Fast trekk på lønningsdagen slår gode intensjoner.'],
            ['Spre pengene', 'Mange selskaper, mange land, lave kostnader.'],
            ['Sitt stille', 'Lang tidshorisont tåler at markedet faller innimellom.'],
          ].map(([title, text], i) => (
            <div key={title} className="learn-step">
              <span className="step-n">{i + 1}</span>
              <div>
                <strong>{title}</strong>
                <p className="muted" style={{ margin: 0 }}>{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <GrowthCalculator />

      <h2>Råd og fakta</h2>
      <input className="search" placeholder="Søk, f.eks. «AFP», «EPK-S» eller «skatt»" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="chips">
        {TAGS.map((t) => (
          <button key={t} className={`chip ${tag === t ? 'chip-on' : ''}`} onClick={() => setTag(t)}>
            {t}
          </button>
        ))}
      </div>
      <div className="articles">
        {list.map((a) => (
          <details key={a.id} className="article card">
            <summary>
              <span className="icon-chip">
                <a.icon size={20} aria-hidden />
              </span>
              <div>
                <h3>{a.title}</h3>
                <p className="muted">{a.lead}</p>
              </div>
            </summary>
            <div className="article-body">{a.body}</div>
          </details>
        ))}
        {list.length === 0 && <p className="muted">Ingen treff.</p>}
      </div>

      <section className="card">
        <div className="card-head">
          <div>
            <h2>
              <ListChecks size={20} aria-hidden style={{ verticalAlign: '-3px', marginRight: 6 }} />
              Kom i gang i dag
            </h2>
            <p className="muted">Fem minutter nå er verdt mer enn en perfekt plan senere.</p>
          </div>
        </div>
        <ol className="num-list">
          <li><span>Sett opp en fast månedlig sparing i et globalt indeksfond – selv 500 kr er en god start.</span></li>
          <li><span>Sjekk aksjeandelen og kostnadene i EPK-en din, og vurder EPK-S.</span></li>
          <li><span>Bruk eget innskudd i pensjonskontoen eller IPS for skattefradraget.</span></li>
          <li><span>Bygg en buffer på sparekonto før du tar mer risiko.</span></li>
          <li><span>Sjekk om du har AFP før du bytter jobb etter fylte 50.</span></li>
          <li><span>Se over sparingen én gang i året – ikke hver dag.</span></li>
        </ol>
        <button className="btn btn-primary" onClick={() => go('spar')}>
          Start sparing <ArrowRight size={16} aria-hidden style={{ verticalAlign: '-3px' }} />
        </button>
      </section>

      <p className="fineprint">
        <Sprout size={14} aria-hidden style={{ verticalAlign: '-2px' }} /> Generell informasjon, ikke personlig finansiell rådgivning.
        Historisk avkastning er ingen garanti for fremtidig avkastning. Regler og satser kan endres – sjekk nav.no og leverandøren din.
      </p>
    </div>
  );
}

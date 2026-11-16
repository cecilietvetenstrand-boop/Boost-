import { useState, type ReactNode } from 'react';

interface Article {
  id: string;
  title: string;
  tag: 'Pensjon' | 'Sparing' | 'Psykologi' | 'Skatt';
  lead: string;
  body: ReactNode;
}

const ARTICLES: Article[] = [
  {
    id: 'pilarer',
    title: 'Slik er pensjonen bygget opp',
    tag: 'Pensjon',
    lead: 'Pensjonen din kommer fra tre kilder: folketrygden, arbeidsgiveren og deg selv.',
    body: (
      <>
        <ol>
          <li><strong>Folketrygden (NAV)</strong> – alderspensjon alle får, basert på inntekten du har hatt gjennom livet.</li>
          <li><strong>Tjenestepensjon og AFP</strong> – pensjon arbeidsgiveren sparer for deg, pluss eventuell avtalefestet pensjon.</li>
          <li><strong>Egen sparing</strong> – EPK-S, IPS, fond, aksjer og annen sparing du gjør selv.</li>
        </ol>
        <p>
          For de fleste utgjør folketrygden den største delen. Men folketrygden alene gir sjelden mer enn rundt halvparten av lønnen,
          og for deg med høy lønn enda mindre – fordi opptjeningen stopper ved 7,1 G.
        </p>
      </>
    ),
  },
  {
    id: 'folketrygden',
    title: 'Folketrygden',
    tag: 'Pensjon',
    lead: 'Statens alderspensjon. Livsvarig, og regulert hvert år.',
    body: (
      <>
        <p>
          Hvert år legges 18,1 % av inntekten din opp til 7,1 G inn i en <strong>pensjonsbeholdning</strong>. Du tjener opp pensjon fra du er
          13 til du er 75 år. Også foreldrepenger, dagpenger, førstegangstjeneste og omsorg for små barn gir opptjening.
        </p>
        <p>
          Når du tar ut pensjon, deles beholdningen på et <strong>delingstall</strong> som gjenspeiler forventet levealder for ditt årskull.
          Det kalles levealdersjustering: lever vi lenger, må vi jobbe litt lenger for å få samme årlige pensjon.
        </p>
        <ul>
          <li><strong>Fleksibelt uttak</strong> fra 62 til 75 år. Jo senere du starter, jo mer får du hvert år.</li>
          <li>For å ta ut før 67 må opptjeningen din være høy nok til at du får minst garantipensjon ved 67.</li>
          <li>Du kan jobbe ved siden av pensjonen uten at den blir avkortet.</li>
          <li><strong>Garantipensjon</strong> sikrer en minstepensjon for dem med lav eller ingen opptjening.</li>
          <li>Aldersgrensene skal gradvis heves for yngre årskull i takt med økt levealder.</li>
        </ul>
        <p>Du finner din egen pensjonsbeholdning og kan gjøre beregninger på nav.no.</p>
      </>
    ),
  },
  {
    id: 'tjenestepensjon',
    title: 'Tjenestepensjon',
    tag: 'Pensjon',
    lead: 'Pensjonen arbeidsgiveren sparer for deg – i tillegg til lønnen.',
    body: (
      <>
        <p>
          Alle arbeidsgivere i privat sektor må spare minst <strong>2 % av lønnen</strong> til pensjon for de ansatte (obligatorisk
          tjenestepensjon, OTP). Det spares fra første krone og første arbeidsdag. Mange arbeidsgivere sparer mer – opptil 7 % av lønn opp
          til 12 G, pluss inntil 18,1 % ekstra for lønn mellom 7,1 og 12 G.
        </p>
        <h4>Ulike typer ordninger</h4>
        <ul>
          <li><strong>Innskuddspensjon</strong> – vanligst i privat sektor. Arbeidsgiver setter inn et beløp, og du bærer selv
            investeringsrisikoen. Utbetales normalt fra uttak til du er minst 80 år (minst 10 år).</li>
          <li><strong>Ytelsespensjon</strong> – arbeidsgiver lover en pensjon av en viss størrelse. Mindre vanlig i dag.</li>
          <li><strong>Offentlig tjenestepensjon</strong> (KLP, Statens pensjonskasse m.fl.) – for deg født 1963 eller senere: livsvarig
            påslag på 5,7 % av lønn opp til 12 G (+18,1 % mellom 7,1 og 12 G).</li>
        </ul>
        <h4>Når du bytter jobb</h4>
        <p>
          Pensjonen du har tjent opp, blir med deg. Innskuddspensjon samles automatisk i <strong>egen pensjonskonto (EPK)</strong>. Gamle
          fripoliser og pensjonskapitalbevis kan du ofte flytte selv – det kan gi lavere kostnader.
        </p>
        <p><strong>Tips:</strong> Spør om pensjonsordningen når du forhandler lønn. 1 prosentpoeng ekstra pensjonssparing er mye verdt over tid.</p>
      </>
    ),
  },
  {
    id: 'epk',
    title: 'EPK – egen pensjonskonto',
    tag: 'Pensjon',
    lead: 'Én konto for all innskuddspensjon – du bestemmer selv over leverandør og aksjeandel.',
    body: (
      <>
        <p>
          Med egen pensjonskonto samles pensjonen fra nåværende og tidligere arbeidsgivere på ett sted. Du kan velge å flytte kontoen til
          en annen leverandør, og du kan selv velge hvordan pengene skal investeres.
        </p>
        <ul>
          <li><strong>Livsfaseprofil</strong> (standardvalget hos de fleste): høy aksjeandel mens du er ung, gradvis lavere nær pensjon.</li>
          <li><strong>Fast aksjeandel</strong>: du velger selv, f.eks. 100 %, 80 % eller 50 % aksjer.</li>
        </ul>
        <p>Sjekk kostnadene. Forskjellen mellom 0,2 % og 0,8 % i årlig kostnad kan utgjøre over 10 % av pensjonskapitalen over et arbeidsliv.</p>
      </>
    ),
  },
  {
    id: 'epks',
    title: 'EPK-S – egen sparing med skattefordel',
    tag: 'Skatt',
    lead: 'Spar ekstra selv i pensjonskontoen fra arbeidsgiveren, og få 22 % igjen på skatten.',
    body: (
      <>
        <p>
          Har du innskuddspensjon, kan du selv spare inntil <strong>5 % av lønnen</strong> (opp til 12 G) i egen pensjonskonto – men ikke
          mer enn arbeidsgiveren sparer for deg. Beløpet trekkes fra lønnen og gir fradrag i alminnelig inntekt.
        </p>
        <div className="example">
          <strong>Eksempel:</strong> Lønn 600 000 kr, arbeidsgiver sparer 5 %. Du sparer 5 % selv = 30 000 kr i året. Du får 6 600 kr i
          skattefradrag, så spareinnsatsen koster deg egentlig bare 23 400 kr.
        </div>
        <ul>
          <li>Pengene er bundet til du tar ut pensjon, og utbetales som innskuddspensjonen.</li>
          <li>Utbetalingen skattlegges som pensjonsinntekt.</li>
          <li>Ordningen må tilbys via arbeidsgiver/leverandør – spør HR om du kan melde deg på.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'afp',
    title: 'AFP – avtalefestet pensjon',
    tag: 'Pensjon',
    lead: 'Et livsvarig tillegg hvis du jobber i en bedrift med AFP-avtale.',
    body: (
      <>
        <p>
          AFP finnes i hele offentlig sektor og i mange private bedrifter med tariffavtale. I privat sektor er AFP et livsvarig påslag
          til alderspensjonen som kan tas ut fra 62 år.
        </p>
        <ul>
          <li>Du må normalt ha jobbet i en AFP-bedrift i mange av årene før du fyller 62, og være ansatt der når du tar ut AFP.</li>
          <li>Bytter du til en bedrift uten AFP rett før pensjon, kan du miste hele AFP-en – sjekk før du bytter jobb!</li>
          <li>For deg født 1963 eller senere i offentlig sektor er AFP også et livsvarig påslag.</li>
          <li>AFP-ordningen i privat sektor er under endring. Sjekk vilkårene hos Fellesordningen for AFP eller tillitsvalgt.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'ips',
    title: 'IPS – individuell pensjonssparing',
    tag: 'Skatt',
    lead: 'Spar inntil 15 000 kr i året med 22 % skattefradrag.',
    body: (
      <>
        <p>
          IPS er pensjonssparing du gjør helt på egen hånd, uavhengig av arbeidsgiver. Du får fradrag i alminnelig inntekt, altså
          inntil 3 300 kr lavere skatt i året.
        </p>
        <ul>
          <li>Pengene er bundet til du er 62 år, og utbetales over minst 10 år og minst til du er 80.</li>
          <li>Utbetalingen skattlegges som pensjon. Kapitalen er unntatt formuesskatt underveis.</li>
          <li>Passer best for deg som har råd til å binde pengene og vil ha en skatterabatt.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'ask',
    title: 'Aksjesparekonto og fond',
    tag: 'Sparing',
    lead: 'Fleksibel langsiktig sparing – du kan ta ut pengene når du vil.',
    body: (
      <>
        <p>
          På en aksjesparekonto (ASK) kan du kjøpe og selge aksjer og aksjefond uten å skatte av gevinsten før du tar den ut. Det du har
          satt inn, kan du alltid ta ut skattefritt.
        </p>
        <p>
          For pensjonssparing er <strong>globale indeksfond</strong> med lave kostnader et godt utgangspunkt: bred spredning på tusenvis av
          selskaper, og lav pris.
        </p>
      </>
    ),
  },
  {
    id: 'spareavtale',
    title: 'Spareavtale – betal deg selv først',
    tag: 'Sparing',
    lead: 'Et fast beløp som trekkes automatisk hver måned. Det enkleste og mest effektive sparegrepet.',
    body: (
      <>
        <ul>
          <li><strong>Automatisk:</strong> Legg trekket rett etter lønningsdagen, så sparer du før du rekker å bruke pengene.</li>
          <li><strong>Jevn innkjøpspris:</strong> Du kjøper fond hver måned – billig når markedet er nede, dyrere når det er oppe. Over tid
            jevner det seg ut, og du slipper å «treffe» riktig tidspunkt.</li>
          <li><strong>Start smått:</strong> 500 kr i måneden er bedre enn ingenting. Øk beløpet hver gang du får lønnsøkning.</li>
          <li><strong>Fleksibelt:</strong> Du kan endre, pause eller stoppe avtalen når du vil.</li>
        </ul>
        <div className="example">
          <strong>Rentes rente:</strong> 1 000 kr i måneden i 30 år med 5 % årlig avkastning blir ca. 800 000 kr – selv om du bare har satt
          inn 360 000 kr.
        </div>
      </>
    ),
  },
  {
    id: 'aksjeandel',
    title: 'Aksjeandel og risiko',
    tag: 'Sparing',
    lead: 'Hvor mye aksjer du bør ha, avhenger mest av hvor lenge det er til du trenger pengene.',
    body: (
      <>
        <p>
          Aksjer har historisk gitt klart høyere avkastning enn renter over tid, men svinger mye mer. Med lang tidshorisont rekker
          markedet normalt å hente seg inn etter fall.
        </p>
        <table className="table">
          <thead><tr><th>Tid til pensjon</th><th>Vanlig aksjeandel</th></tr></thead>
          <tbody>
            <tr><td>Over 15 år</td><td>80–100 %</td></tr>
            <tr><td>5–15 år</td><td>50–80 %</td></tr>
            <tr><td>Under 5 år</td><td>20–50 %</td></tr>
          </tbody>
        </table>
        <p>En livsfaseprofil gjør denne nedtrappingen automatisk for deg.</p>
      </>
    ),
  },
  {
    id: 'is-i-magen',
    title: 'Is i magen',
    tag: 'Psykologi',
    lead: 'Den viktigste egenskapen for en langsiktig sparer: å sitte stille når markedet faller.',
    body: (
      <>
        <p>
          Børsen vil falle – mange ganger – i løpet av spareperioden din. Under finanskrisen i 2008 falt verdens aksjemarkeder rundt 40–50
          %, og under koronakrisen i 2020 falt de rundt 30 % på noen uker. I begge tilfeller hentet markedet seg inn igjen.
        </p>
        <ul>
          <li><strong>Ikke selg i panikk.</strong> Den som selger etter et fall, gjør tapet permanent og går ofte glipp av oppgangen.</li>
          <li><strong>Fortsett spareavtalen.</strong> Når kursene er lave, får du mer for pengene.</li>
          <li><strong>Ikke sjekk saldoen hver dag.</strong> Jo oftere du ser, jo oftere ser du tap – og jo mer fristes du til å gjøre noe.</li>
          <li><strong>Ha en buffer.</strong> Penger du trenger de neste årene, hører hjemme på sparekonto – ikke i aksjer.</li>
        </ul>
        <p>Pensjonssparing er et maraton. Det som teller, er hvor mye du har den dagen du går av – ikke hva saldoen var i et dårlig år.</p>
      </>
    ),
  },
  {
    id: 'nudging',
    title: 'Nudging – små dytt, store forskjeller',
    tag: 'Psykologi',
    lead: 'Hvorfor vi utsetter sparing – og hvordan smarte standardvalg hjelper oss.',
    body: (
      <>
        <p>
          Nudging (dulting) betyr å utforme valg slik at det blir lettere å gjøre det vi egentlig ønsker. Begrepet ble kjent gjennom
          atferdsøkonomene Richard Thaler og Cass Sunstein. Forskningen viser at folk sparer langt mer når sparing er standardvalget.
        </p>
        <h4>Typiske feller</h4>
        <ul>
          <li><strong>Utsettelse:</strong> «Jeg begynner neste år» – men neste år kommer aldri.</li>
          <li><strong>Nåtidsskjevhet:</strong> Vi verdsetter penger i dag mye høyere enn penger om 30 år.</li>
          <li><strong>Treghet:</strong> Vi beholder det som er valgt for oss, også når det ikke passer.</li>
        </ul>
        <h4>Dytt du kan gi deg selv</h4>
        <ul>
          <li>Gjør sparingen automatisk med spareavtale.</li>
          <li>Øk sparingen samtidig med lønnsøkningen («spar mer i morgen»), så merker du det ikke.</li>
          <li>Se for deg deg selv som pensjonist – det gjør det lettere å prioritere fremtiden.</li>
          <li>Sett et konkret mål, f.eks. 80 % av dagens lønn.</li>
        </ul>
        <p>Appen bruker dytt som «Forslag til deg» på oversikten – alltid basert på dine egne tall, og du bestemmer selv.</p>
      </>
    ),
  },
  {
    id: '80',
    title: 'Hvorfor 80 % av lønnen?',
    tag: 'Pensjon',
    lead: 'En tommelfingerregel for hvor mye pensjon du trenger for å beholde levestandarden.',
    body: (
      <>
        <p>
          Som pensjonist har mange lavere utgifter: boliglånet er ofte nedbetalt, du sparer ikke lenger til pensjon, og du har ikke
          jobbreiser. Pensjon skattlegges også litt lavere enn lønn. Derfor regnes 70–80 % av lønnen før skatt ofte som nok til å
          opprettholde levestandarden.
        </p>
        <p>Har du fortsatt lån, eller ønsker du å reise mye de første årene, kan du trenge mer. Du kan endre målet under «Profil».</p>
      </>
    ),
  },
  {
    id: 'kostnader',
    title: 'Kostnader betyr mye',
    tag: 'Sparing',
    lead: 'Små prosenter blir store beløp over tid.',
    body: (
      <p>
        Sparer du 2 000 kr i måneden i 30 år, kan forskjellen mellom en årlig kostnad på 0,2 % og 1,5 % bli flere hundre tusen kroner.
        Sammenlign forvaltningshonorar på pensjonskontoen og fondene dine – og vurder indeksfond.
      </p>
    ),
  },
  {
    id: 'skatt',
    title: 'Skatt på pensjon',
    tag: 'Skatt',
    lead: 'Pensjon skattlegges litt annerledes enn lønn.',
    body: (
      <ul>
        <li>Alderspensjon, AFP, tjenestepensjon, EPK-S og IPS skattlegges som pensjonsinntekt.</li>
        <li>Trygdeavgiften er lavere på pensjon enn på lønn, og det gis et eget skattefradrag for lave pensjoner.</li>
        <li>Tallene i appen er før skatt, slik at de kan sammenlignes med bruttolønnen din.</li>
      </ul>
    ),
  },
  {
    id: 'deltid',
    title: 'Deltid, permisjon og pensjon',
    tag: 'Pensjon',
    lead: 'Perioder med lav inntekt gir lavere pensjon resten av livet.',
    body: (
      <>
        <p>
          Jobber du deltid, får du lavere opptjening både i folketrygden og tjenestepensjonen. Mange kvinner får derfor betydelig lavere
          pensjon enn menn. Omsorg for barn under 6 år gir en viss opptjening i folketrygden, men ikke i tjenestepensjonen.
        </p>
        <p>Er dere to, kan det være lurt å snakke om hvordan dere fordeler deltid og sparing – slik at ingen taper på det.</p>
      </>
    ),
  },
  {
    id: 'sjekkliste',
    title: 'Sjekkliste: 7 grep for bedre pensjon',
    tag: 'Sparing',
    lead: 'Gjør dette én gang i året.',
    body: (
      <ol>
        <li>Koble til Norsk Pensjon og NAV for å se alt du har.</li>
        <li>Sjekk at aksjeandelen passer med hvor lenge det er til pensjon.</li>
        <li>Samle gamle fripoliser og pensjonskapitalbevis og sjekk kostnadene.</li>
        <li>Benytt EPK-S hvis arbeidsgiveren din tilbyr det.</li>
        <li>Vurder IPS for skattefradraget.</li>
        <li>Sett opp en spareavtale – og øk den ved lønnsøkning.</li>
        <li>Sjekk om du har AFP før du bytter jobb etter fylte 50.</li>
      </ol>
    ),
  },
];

const TAGS = ['Alle', 'Pensjon', 'Sparing', 'Skatt', 'Psykologi'] as const;

export function Laer() {
  const [tag, setTag] = useState<(typeof TAGS)[number]>('Alle');
  const [q, setQ] = useState('');
  const list = ARTICLES.filter(
    (a) => (tag === 'Alle' || a.tag === tag) && (q === '' || (a.title + a.lead).toLowerCase().includes(q.toLowerCase())),
  );
  return (
    <div className="stack">
      <section className="card">
        <h2>Lær om pensjon og sparing</h2>
        <p className="muted">Kort og enkelt om det du trenger å vite.</p>
        <input className="search" placeholder="Søk, f.eks. «AFP» eller «skatt»" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="chips">
          {TAGS.map((t) => (
            <button key={t} className={`chip ${tag === t ? 'chip-on' : ''}`} onClick={() => setTag(t)}>{t}</button>
          ))}
        </div>
      </section>
      <div className="articles">
        {list.map((a) => (
          <details key={a.id} className="article card">
            <summary>
              <span className="tag">{a.tag}</span>
              <h3>{a.title}</h3>
              <p className="muted">{a.lead}</p>
            </summary>
            <div className="article-body">{a.body}</div>
          </details>
        ))}
        {list.length === 0 && <p className="muted">Ingen treff.</p>}
      </div>
      <p className="fineprint">Informasjonen er generell og ikke personlig finansiell rådgivning. Regler og satser kan endres – sjekk nav.no og leverandøren din.</p>
    </div>
  );
}

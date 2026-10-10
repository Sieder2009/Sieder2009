// Erzeugt dist/stats.svg: Contributions, Streaks und Aktivität der letzten 12 Monate.
// Läuft im Workflow .github/workflows/snake.yml – ohne npm-Pakete, nur mit Node.

import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
const MONTHS_LONG = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sep.', 'Okt.', 'Nov.', 'Dez.'];

const YEARS_QUERY = `query($login: String!) {
  user(login: $login) {
    createdAt
    contributionsCollection { contributionYears }
  }
}`;

const CALENDAR_QUERY = `query($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    contributionsCollection(from: $from, to: $to) {
      contributionCalendar {
        weeks { contributionDays { date contributionCount } }
      }
    }
  }
}`;

async function gql(query, variables) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `bearer ${process.env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'profil-statistik',
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`GitHub-API antwortet mit HTTP ${res.status}`);
  const json = await res.json();
  // GraphQL meldet Fehler trotz HTTP 200 – deshalb extra prüfen
  if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join('; '));
  if (!json.data?.user) throw new Error(`Benutzer "${variables.login}" nicht gefunden`);
  return json.data.user;
}

// Alle Daten sind UTC-Tage im Format JJJJ-MM-TT, so wie GitHub sie liefert
const isoDay = (date) => date.toISOString().slice(0, 10);
const addDays = (iso, n) => isoDay(new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86400000));
const parts = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m, d };
};
const pad = (n) => String(n).padStart(2, '0');
const fmtNumber = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const fmtDate = (iso) => {
  const { y, m, d } = parts(iso);
  return `${pad(d)}.${pad(m)}.${y}`;
};
const fmtDay = (iso) => {
  const { m, d } = parts(iso);
  return `${d}. ${MONTHS_LONG[m - 1]}`;
};

function fmtRange(start, end) {
  const a = parts(start);
  const b = parts(end);
  if (start === end) return `${fmtDay(start)} ${a.y}`;
  if (a.y === b.y && a.m === b.m) return `${a.d}.–${b.d}. ${MONTHS_LONG[b.m - 1]} ${b.y}`;
  if (a.y === b.y) return `${pad(a.d)}.${pad(a.m)}. – ${fmtDate(end)}`;
  const short = (p) => `${pad(p.d)}.${pad(p.m)}.${String(p.y).slice(2)}`;
  return `${short(a)} – ${short(b)}`;
}

export function summarize(counts, today, createdAt) {
  const first = [...counts.keys()].filter((d) => d <= today).sort()[0] ?? today;
  const days = [];
  for (let date = first; date <= today; date = addDays(date, 1)) {
    days.push({ date, count: counts.get(date) ?? 0 });
  }

  let total = 0;
  let run = 0;
  let runStart = null;
  let longest = { len: 0, start: null, end: null };
  for (const { date, count } of days) {
    total += count;
    if (count > 0) {
      if (run === 0) runStart = date;
      run += 1;
      if (run > longest.len) longest = { len: run, start: runStart, end: date };
    } else {
      run = 0;
    }
  }

  // Ein Tag ohne Commit bricht die Streak erst, wenn er vorbei ist
  let i = days.length - 1;
  if (days[i]?.count === 0) i -= 1;
  const current = { len: 0, start: null };
  while (i >= 0 && days[i].count > 0) {
    current.len += 1;
    current.start = days[i].date;
    i -= 1;
  }

  const year = today.slice(0, 4);
  const thisYear = days.filter((d) => d.date.startsWith(year)).reduce((sum, d) => sum + d.count, 0);

  const { y, m } = parts(today);
  const months = [];
  for (let k = 11; k >= 0; k -= 1) {
    const date = new Date(Date.UTC(y, m - 1 - k, 1));
    months.push({ key: isoDay(date).slice(0, 7), label: MONTHS[date.getUTCMonth()], count: 0 });
  }
  const byMonth = new Map(months.map((mo) => [mo.key, mo]));
  for (const { date, count } of days) {
    const mo = byMonth.get(date.slice(0, 7));
    if (mo) mo.count += count;
  }

  return { total, thisYear, year, since: createdAt.slice(0, 10), longest, current, months, today };
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export function render(s) {
  const since = parts(s.since);
  const tage = (n) => (n === 1 ? 'Tag' : 'Tage');
  const tiles = [
    { label: 'Contributions', value: fmtNumber(s.total), sub: `seit ${MONTHS_LONG[since.m - 1]} ${since.y}`, color: '#40c4ff' },
    { label: 'Dieses Jahr', value: fmtNumber(s.thisYear), sub: `Contributions ${s.year}`, color: '#c3e88d' },
    {
      label: 'Längste Streak',
      value: s.longest.len,
      unit: tage(s.longest.len),
      sub: s.longest.len ? fmtRange(s.longest.start, s.longest.end) : 'kommt noch',
      color: '#ffcb6b',
    },
    {
      label: 'Aktuelle Streak',
      value: s.current.len,
      unit: tage(s.current.len),
      sub: s.current.len ? `seit ${fmtDay(s.current.start)}` : 'bereit für Tag 1',
      color: '#c792ea',
    },
  ];

  const tileW = 242;
  const tileH = 150;
  const tileY = 100;
  const tilesSvg = tiles
    .map((t, i) => {
      const x = 80 + i * (tileW + 24);
      const unit = t.unit ? `<tspan font-size="22" fill="#c8d1f0" dx="10">${t.unit}</tspan>` : '';
      return `  <g class="in" style="animation-delay:${(0.15 + i * 0.12).toFixed(2)}s">
    <rect x="${x}" y="${tileY}" width="${tileW}" height="${tileH}" rx="12" fill="#1a2340" stroke="#26314f" stroke-width="1.5"/>
    <rect x="${x + 14}" y="${tileY + 22}" width="4" height="${tileH - 44}" rx="2" fill="${t.color}"/>
    <text x="${x + 32}" y="${tileY + 42}" class="s" font-size="19" fill="#aab4d4">${esc(t.label)}</text>
    <text x="${x + 32}" y="${tileY + 98}" class="m" fill="${t.color}"><tspan font-size="48" font-weight="700">${esc(t.value)}</tspan>${unit}</text>
    <text x="${x + 32}" y="${tileY + 128}" class="m" font-size="15" fill="#7d8bb0">${esc(t.sub)}</text>
  </g>`;
    })
    .join('\n');

  const chartX = 80;
  const chartW = 1040;
  const baseY = 500;
  const maxH = 150;
  const slot = chartW / 12;
  const barW = 46;
  const max = Math.max(1, ...s.months.map((mo) => mo.count));
  const barsSvg = s.months
    .map((mo, i) => {
      const cx = chartX + slot * i + slot / 2;
      const h = mo.count ? Math.max(6, Math.round((mo.count / max) * maxH)) : 4;
      const now = i === s.months.length - 1;
      const delay = 0.6 + i * 0.07;
      const fill = mo.count ? (now ? 'url(#barNow)' : 'url(#bar)') : '#26314f';
      const value = mo.count
        ? `\n  <text class="in m" style="animation-delay:${(delay + 0.5).toFixed(2)}s" x="${cx.toFixed(1)}" y="${baseY - h - 12}" font-size="17" fill="#e6ebff" text-anchor="middle">${mo.count}</text>`
        : '';
      return `  <rect class="bar" style="animation-delay:${delay.toFixed(2)}s" x="${(cx - barW / 2).toFixed(1)}" y="${baseY - h}" width="${barW}" height="${h}" rx="6" fill="${fill}"/>${value}
  <text x="${cx.toFixed(1)}" y="${baseY + 32}" class="m" font-size="17" fill="${now ? '#ffcb6b' : '#7d8bb0'}" text-anchor="middle"${now ? ' font-weight="700"' : ''}>${mo.label}</text>`;
    })
    .join('\n');

  const desc = `${s.total} Contributions seit ${fmtDate(s.since)}, ${s.thisYear} davon ${s.year}. `
    + `Längste Streak: ${s.longest.len} ${tage(s.longest.len)}, aktuelle Streak: ${s.current.len} ${tage(s.current.len)}.`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600" width="1200" height="600" role="img" aria-labelledby="t d">
  <title id="t">GitHub-Statistik</title>
  <desc id="d">${esc(desc)}</desc>
  <style>
    .m{font-family:'JetBrains Mono','Fira Code','Cascadia Code',Consolas,'Courier New',monospace}
    .s{font-family:'Segoe UI',Helvetica,Arial,sans-serif}
    .in{opacity:0;animation:in .6s ease-out forwards}
    .bar{transform-box:fill-box;transform-origin:50% 100%;transform:scaleY(0);animation:grow .9s cubic-bezier(.2,.8,.2,1) forwards}
    .live{animation:pulse 1.6s ease-in-out infinite}
    @keyframes in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes grow{to{transform:scaleY(1)}}
    @keyframes pulse{50%{opacity:.25}}
    @media (prefers-reduced-motion:reduce){.in,.bar,.live{animation:none;opacity:1;transform:none}}
  </style>
  <defs>
    <linearGradient id="bar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#40c4ff"/><stop offset="1" stop-color="#1a6194"/></linearGradient>
    <linearGradient id="barNow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffcb6b"/><stop offset="1" stop-color="#c7892b"/></linearGradient>
  </defs>
  <rect x="40" y="20" width="1120" height="560" rx="16" fill="#141b2d" stroke="#26314f" stroke-width="2"/>
  <path d="M56 20h1088a16 16 0 0 1 16 16v34H40V36a16 16 0 0 1 16-16z" fill="#1a2340"/>
  <circle cx="72" cy="45" r="7" fill="#ff5f56"/><circle cx="96" cy="45" r="7" fill="#ffbd2e"/><circle cx="120" cy="45" r="7" fill="#27c93f"/>
  <rect x="150" y="28" width="210" height="42" rx="8" fill="#141b2d"/>
  <circle cx="170" cy="49" r="6" fill="#40c4ff"/>
  <text x="186" y="56" class="m" font-size="18" fill="#c8d1f0">statistik.dart</text>
  <text x="1112" y="52" class="m" font-size="16" fill="#7d8bb0" text-anchor="end">aktualisiert ${fmtDate(s.today)}</text>
  <circle class="live" cx="1130" cy="46" r="6" fill="#c3e88d"/>
${tilesSvg}
  <text x="${chartX}" y="300" class="m" font-size="18" fill="#7d8bb0">// Aktivität der letzten 12 Monate</text>
  <text x="${chartX + chartW}" y="300" class="m" font-size="15" fill="#4a5578" text-anchor="end">Contributions pro Monat</text>
  <line x1="${chartX}" x2="${chartX + chartW}" y1="${baseY - maxH}" y2="${baseY - maxH}" stroke="#222b47" stroke-dasharray="4 8"/>
  <line x1="${chartX}" x2="${chartX + chartW}" y1="${baseY - maxH / 2}" y2="${baseY - maxH / 2}" stroke="#222b47" stroke-dasharray="4 8"/>
  <line x1="${chartX}" x2="${chartX + chartW}" y1="${baseY + 1}" y2="${baseY + 1}" stroke="#26314f" stroke-width="2"/>
${barsSvg}
</svg>
`;

  if (/NaN|undefined/.test(svg)) throw new Error('Statistik enthält ungültige Werte');
  return svg;
}

async function main() {
  const login = process.env.GITHUB_LOGIN;
  if (!process.env.GITHUB_TOKEN || !login) throw new Error('GITHUB_TOKEN und GITHUB_LOGIN müssen gesetzt sein');

  const user = await gql(YEARS_QUERY, { login });
  const counts = new Map();
  for (const year of user.contributionsCollection.contributionYears) {
    const { contributionsCollection } = await gql(CALENDAR_QUERY, {
      login,
      from: `${year}-01-01T00:00:00Z`,
      to: `${year}-12-31T23:59:59Z`,
    });
    for (const week of contributionsCollection.contributionCalendar.weeks) {
      for (const day of week.contributionDays) counts.set(day.date, day.contributionCount);
    }
  }

  const svg = render(summarize(counts, isoDay(new Date()), user.createdAt));
  // Erst ganz am Ende schreiben, damit ein Fehler nie die Reserve-Karte überschreibt
  mkdirSync('dist', { recursive: true });
  writeFileSync('dist/stats.svg', svg);
  console.log(`dist/stats.svg geschrieben (${counts.size} Tage ausgewertet)`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(`Statistik fehlgeschlagen: ${err.message}`);
    process.exit(1);
  });
}

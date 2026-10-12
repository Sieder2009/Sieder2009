// Erzeugt die Statistik-Kacheln in dist/: Kennzahlen und Contributions pro Monat, jeweils hell und dunkel.
// Läuft im Workflow .github/workflows/snake.yml – ohne npm-Pakete, nur mit Node.

import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { SANS, THEMES, esc, frame } from './theme.mjs';

const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
const MONTHS_LONG = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sep.', 'Okt.', 'Nov.', 'Dez.'];

export const FILES = ['stats-kpis-dark', 'stats-kpis-light', 'stats-months-dark', 'stats-months-light'];

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
const tage = (n) => (n === 1 ? 'Tag' : 'Tage');

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

const W = 416;
const H = 176;

function tile(t, title, desc, style, body) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="t d">
  <title id="t">${esc(title)}</title>
  <desc id="d">${esc(desc)}</desc>
  <style>text{font-family:${SANS}}${style}</style>
  ${frame(W, H, t)}
${body}
</svg>
`;
  if (/NaN|undefined/.test(svg)) throw new Error('Statistik enthält ungültige Werte');
  return svg;
}

export function renderKpis(s, t) {
  const since = parts(s.since);
  const minis = [
    { label: 'Dieses Jahr', value: fmtNumber(s.thisYear) },
    { label: 'Längste Streak', value: fmtNumber(s.longest.len), unit: tage(s.longest.len) },
    { label: 'Aktuelle Streak', value: fmtNumber(s.current.len), unit: tage(s.current.len) },
  ];
  const minisSvg = minis
    .map((k, i) => {
      const x = 26 + i * 124;
      const unit = k.unit ? `<tspan font-size="13" font-weight="400" fill="${t.muted}" dx="5">${k.unit}</tspan>` : '';
      return `  <text x="${x}" y="126" font-size="12.5" fill="${t.muted}">${esc(k.label)}</text>
  <text x="${x}" y="152" font-size="20" font-weight="600" fill="${t.text}">${esc(k.value)}${unit}</text>`;
    })
    .join('\n');

  const desc = `${s.total} Contributions seit ${fmtDate(s.since)}, ${s.thisYear} davon ${s.year}. `
    + `Längste Streak: ${s.longest.len} ${tage(s.longest.len)}, aktuelle Streak: ${s.current.len} ${tage(s.current.len)}.`;

  return tile(t, 'GitHub-Statistik', desc, '', `  <text x="26" y="40" font-size="13" fill="${t.muted}">Contributions seit ${MONTHS_LONG[since.m - 1]} ${since.y}</text>
  <text x="24" y="90" font-size="48" font-weight="600" letter-spacing="-1" fill="${t.text}">${fmtNumber(s.total)}</text>
  <line x1="26" x2="${W - 26}" y1="104.5" y2="104.5" stroke="${t.grid}"/>
${minisSvg}`);
}

// Balken mit 4px runder Oberkante und gerader Kante an der Grundlinie
function barPath(x, top, w, base) {
  const r = Math.min(4, (base - top) / 2, w / 2);
  return `M${x} ${base}V${top + r}a${r} ${r} 0 0 1 ${r} ${-r}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}V${base}Z`;
}

export function renderMonths(s, t) {
  const left = 26;
  const width = W - 2 * left;
  const base = 140;
  const maxH = 66;
  const slot = width / s.months.length;
  const barW = 16;
  const max = Math.max(1, ...s.months.map((mo) => mo.count));

  const marks = s.months
    .map((mo, i) => {
      const cx = left + slot * i + slot / 2;
      const now = i === s.months.length - 1;
      const delay = (0.1 + i * 0.05).toFixed(2);
      const label = `  <text x="${cx.toFixed(1)}" y="160" font-size="11.5" text-anchor="middle" fill="${now ? t.text : t.muted}"${now ? ' font-weight="600"' : ''}>${mo.label}</text>`;
      if (!mo.count) return label;
      const top = base - Math.max(3, Math.round((mo.count / max) * maxH));
      return `  <path class="bar" style="animation-delay:${delay}s" d="${barPath(+(cx - barW / 2).toFixed(1), top, barW, base)}" fill="${t.bar}"/>
  <text class="val" style="animation-delay:${(+delay + 0.45).toFixed(2)}s" x="${cx.toFixed(1)}" y="${top - 6}" font-size="11.5" text-anchor="middle" fill="${t.muted}">${fmtNumber(mo.count)}</text>
${label}`;
    })
    .join('\n');

  const style = `.bar{transform-box:fill-box;transform-origin:50% 100%;animation:grow .8s cubic-bezier(.2,.8,.2,1) backwards}
    .val{animation:fade .4s ease-out backwards}
    @keyframes grow{from{transform:scaleY(0)}}
    @keyframes fade{from{opacity:0}}
    @media (prefers-reduced-motion:reduce){.bar,.val{animation:none}}`;
  const desc = `Contributions pro Monat: ${s.months
    .map((mo) => `${MONTHS_LONG[Number(mo.key.slice(5)) - 1]} ${mo.key.slice(0, 4)}: ${mo.count}`)
    .join(', ')}.`;

  return tile(t, 'Contributions pro Monat', desc, style, `  <text x="26" y="40" font-size="13" fill="${t.muted}">Contributions pro Monat</text>
  <line x1="${left}" x2="${W - left}" y1="${base + 0.5}" y2="${base + 0.5}" stroke="${t.grid}"/>
${marks}`);
}

export function render(s) {
  return {
    'stats-kpis-dark': renderKpis(s, THEMES.dark),
    'stats-kpis-light': renderKpis(s, THEMES.light),
    'stats-months-dark': renderMonths(s, THEMES.dark),
    'stats-months-light': renderMonths(s, THEMES.light),
  };
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

  const files = render(summarize(counts, isoDay(new Date()), user.createdAt));
  // Erst ganz am Ende schreiben, damit ein Fehler nie die Reserve-Kacheln überschreibt
  mkdirSync('dist', { recursive: true });
  for (const name of FILES) writeFileSync(`dist/${name}.svg`, files[name]);
  console.log(`${FILES.length} Statistik-Kacheln geschrieben (${counts.size} Tage ausgewertet)`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(`Statistik fehlgeschlagen: ${err.message}`);
    process.exit(1);
  });
}

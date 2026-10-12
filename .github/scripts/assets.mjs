// Erzeugt den Header und die Projektkarten in assets/ – jeweils hell und dunkel.
// Nach einer Änderung hier einfach ausführen:  node .github/scripts/assets.mjs

import { mkdirSync, writeFileSync } from 'node:fs';
import { COLORS, INSET, MONO, SANS, THEMES, esc, frame } from './theme.mjs';

// Icons von Lucide (lucide.dev, ISC-Lizenz), 24×24
const ICONS = {
  mountain: '<path d="m8 3l4 8l5-5l5 15H2z"/><path d="M4.14 15.08q3.93-2.355 7.86.42c2.74 1.94 5.49 2 8.23.19"/>',
  chart: '<path d="M3 3v16a2 2 0 0 0 2 2h16m-3-4V9m-5 8V5M8 17v-3"/>',
  blocks: '<path d="M10 22V7a1 1 0 0 0-1-1H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5a1 1 0 0 0-1-1H2"/><rect width="8" height="8" x="14" y="2" rx="1"/>',
  cube: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7l8.7 5l8.7-5M12 22V12"/>',
  arrow: '<path d="M7 7h10v10M7 17L17 7"/>',
};

const PROJECTS = [
  {
    file: 'ironpeak',
    name: 'Ironpeak Fitness',
    repo: 'Sieder2009/GymTracker',
    text: 'Trainingsplaner & Krafttracker – 100 % lokal',
    lang: ['Dart · Flutter', '#00b4ab'],
    meta: 'Android · iOS · Windows · macOS',
    icon: ICONS.mountain,
  },
  {
    file: 'gymstats',
    name: 'GYM STATS',
    repo: 'Sieder2009/Siederhub',
    text: 'Trainings-Archiv & Fortschritt in Zahlen',
    lang: ['HTML · CSS · JavaScript', '#e34c26'],
    meta: 'Web',
    icon: ICONS.chart,
  },
  {
    file: 'blockblast',
    name: 'BlockBlast',
    repo: 'Sieder2009/BlockBlast',
    text: 'Block-Puzzle mit Drag & Drop und Rekord',
    lang: ['Dart · Flutter', '#00b4ab'],
    meta: 'Android · Web · Windows',
    icon: ICONS.blocks,
  },
  {
    file: 'minecraft',
    name: 'Minecraft-Portfolio',
    repo: 'Sieder2009/mc',
    text: 'Welt, Skin, Bauwerke & Modrinth-Projekte',
    lang: ['JavaScript', '#f1e05a'],
    meta: 'Web',
    icon: ICONS.cube,
  },
];

const icon = (paths, x, y, size, color, width = 2) =>
  `<g transform="translate(${x} ${y}) scale(${size / 24})" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round">${paths}</g>`;

function card(p, t) {
  const W = 416;
  const H = 176;
  const color = COLORS[p.file];
  const glow = `
  <rect x="${INSET}" y="${INSET}" width="${W - 2 * INSET}" height="${H - 2 * INSET}" rx="12" fill="url(#glow)"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="t">
  <title id="t">${esc(`${p.name} – ${p.text}`)}</title>
  <style>text{font-family:${SANS}}.mono{font-family:${MONO}}</style>
  <defs>
    <radialGradient id="glow" cx="${W - INSET}" cy="${INSET}" r="300" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${color}" stop-opacity="${t.cardGlow}"/>
      <stop offset="1" stop-color="${color}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  ${frame(W, H, t, glow)}
  <rect x="26" y="26" width="44" height="44" rx="11" fill="${color}"/>
  ${icon(p.icon, 36, 36, 24, '#ffffff')}
  <text x="84" y="45" font-size="18" font-weight="600" fill="${t.text}">${esc(p.name)}</text>
  <text x="84" y="65" class="mono" font-size="12.5" fill="${t.muted}">${esc(p.repo)}</text>
  ${icon(ICONS.arrow, 370, 28, 18, t.muted)}
  <text x="26" y="108" font-size="15" fill="${t.text2}">${esc(p.text)}</text>
  <circle cx="31" cy="145" r="5" fill="${p.lang[1]}"/>
  <text x="42" y="150" font-size="13" fill="${t.muted}">${esc(p.lang[0])}</text>
  <text x="390" y="150" font-size="13" fill="${t.muted}" text-anchor="end">${esc(p.meta)}</text>
</svg>
`;
}

// App-Icons der Projekte, die rechts im Header schweben
const TILES = [
  { file: 'ironpeak', x: 594, y: 48, size: 70, rotate: -8, delay: 0 },
  { file: 'gymstats', x: 694, y: 90, size: 58, rotate: 7, delay: 1.3 },
  { file: 'blockblast', x: 616, y: 148, size: 52, rotate: 11, delay: 2.2 },
  { file: 'minecraft', x: 764, y: 152, size: 46, rotate: -6, delay: 3.1 },
];

function tile({ file, x, y, size, rotate, delay }) {
  const glyph = size * 0.54;
  const offset = (size - glyph) / 2;
  const r = (size * 0.26).toFixed(1);
  const paths = PROJECTS.find((p) => p.file === file).icon;
  return `<g class="float" style="animation-delay:-${delay}s">
      <g transform="translate(${x} ${y}) rotate(${rotate} ${size / 2} ${size / 2})" filter="url(#shadow)">
        <rect width="${size}" height="${size}" rx="${r}" fill="${COLORS[file]}"/>
        <rect x=".5" y=".5" width="${size - 1}" height="${size - 1}" rx="${r}" fill="none" stroke="#fff" stroke-opacity=".22"/>
        ${icon(paths, offset, offset, glyph, '#ffffff')}
      </g>
    </g>`;
}

function header(t) {
  const W = 846;
  const H = 250;
  const X = 11; // seitlicher Rand: so bündig wie die Kartenreihen darunter
  const blobs = [
    { color: COLORS.ironpeak, cx: 700, cy: 40, r: 250, cls: 'a' },
    { color: COLORS.minecraft, cx: 820, cy: 230, r: 210, cls: 'b' },
    { color: COLORS.blockblast, cx: 545, cy: 260, r: 220, cls: 'c' },
  ];
  const gradients = blobs
    .map((b, i) => `<radialGradient id="g${i}">
      <stop offset="0" stop-color="${b.color}" stop-opacity="${t.glow}"/>
      <stop offset=".45" stop-color="${b.color}" stop-opacity="${(t.glow * 0.45).toFixed(3)}"/>
      <stop offset="1" stop-color="${b.color}" stop-opacity="0"/>
    </radialGradient>`)
    .join('\n    ');
  const circles = blobs
    .map((b, i) => `<circle class="${b.cls}" cx="${b.cx}" cy="${b.cy}" r="${b.r}" fill="url(#g${i})"/>`)
    .join('\n    ');

  // Der Text in der Pille hat eine feste Breite (textLength), damit er auch mit breiteren Schriften hineinpasst
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="t">
  <title id="t">Sieder – Flutter- &amp; Web-Entwickler. Aktuell: Ironpeak Fitness</title>
  <style>
    text{font-family:${SANS}}
    .a{animation:a 17s ease-in-out infinite}
    .b{animation:b 21s ease-in-out infinite}
    .c{animation:c 25s ease-in-out infinite}
    .float{animation:float 6s ease-in-out infinite}
    .ping{transform-box:fill-box;transform-origin:center;animation:ping 2.4s cubic-bezier(0,0,.2,1) infinite}
    @keyframes a{50%{transform:translate(-40px,26px)}}
    @keyframes b{50%{transform:translate(-56px,-18px)}}
    @keyframes c{50%{transform:translate(48px,-28px)}}
    @keyframes float{50%{transform:translateY(-7px)}}
    @keyframes ping{0%{transform:scale(1);opacity:.7}80%,100%{transform:scale(2.8);opacity:0}}
    @media (prefers-reduced-motion:reduce){.a,.b,.c,.float,.ping{animation:none}.ping{opacity:0}}
  </style>
  <defs>
    <clipPath id="clip"><rect x="${X}" y="${INSET}" width="${W - 2 * X}" height="${H - 2 * INSET}" rx="16"/></clipPath>
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#000" flood-opacity="${t.shadow}"/>
    </filter>
    ${gradients}
    <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
      <circle cx="10" cy="10" r="1.1" fill="${t.text}" fill-opacity="${t.dots}"/>
    </pattern>
    <linearGradient id="fade" x1="0" x2="1">
      <stop offset=".3" stop-color="#fff" stop-opacity="0"/>
      <stop offset="1" stop-color="#fff"/>
    </linearGradient>
    <mask id="mask"><rect width="${W}" height="${H}" fill="url(#fade)"/></mask>
  </defs>
  <rect x="${X}" y="${INSET}" width="${W - 2 * X}" height="${H - 2 * INSET}" rx="16" fill="${t.canvas}"/>
  <g clip-path="url(#clip)">
    ${circles}
    <rect width="${W}" height="${H}" fill="url(#dots)" mask="url(#mask)"/>
    ${TILES.map(tile).join('\n    ')}
  </g>
  <rect x="${X + 0.5}" y="${INSET + 0.5}" width="${W - 2 * X - 1}" height="${H - 2 * INSET - 1}" rx="15.5" fill="none" stroke="${t.border}"/>
  <text x="55" y="99" font-size="64" font-weight="700" letter-spacing="-1.5" fill="${t.text}">Sieder</text>
  <text x="58" y="139" font-size="22" fill="${t.muted}">Flutter- &amp; Web-Entwickler</text>
  <rect x="58.5" y="165.5" width="213" height="31" rx="15.5" fill="${t.canvas}" fill-opacity=".6" stroke="${t.border}"/>
  <circle cx="77" cy="181" r="4.5" fill="${t.live}"/>
  <circle class="ping" cx="77" cy="181" r="4.5" fill="none" stroke="${t.live}" stroke-width="1.5"/>
  <text x="91" y="186" font-size="15" fill="${t.muted}" textLength="164" lengthAdjust="spacingAndGlyphs">Aktuell: <tspan fill="${t.text}" font-weight="600">Ironpeak Fitness</tspan></text>
</svg>
`;
}

const out = new URL('../../assets/', import.meta.url);
mkdirSync(out, { recursive: true });
for (const [mode, t] of Object.entries(THEMES)) {
  writeFileSync(new URL(`header-${mode}.svg`, out), header(t));
  for (const p of PROJECTS) writeFileSync(new URL(`${p.file}-${mode}.svg`, out), card(p, t));
}
console.log(`assets/ geschrieben: Header + ${PROJECTS.length} Karten, jeweils hell und dunkel`);

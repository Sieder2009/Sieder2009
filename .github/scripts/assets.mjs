// Erzeugt den Header, die Kilo-Karten und die Projektkarten in assets/ – jeweils hell und dunkel.
// Nach einer Änderung hier einfach ausführen:  node .github/scripts/assets.mjs

import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { COLORS, INSET, MONO, SANS, THEMES, esc, frame } from './theme.mjs';

// Icons von Lucide (lucide.dev, ISC-Lizenz, lucide-static 0.460.0), 24×24
const ICONS = {
  // Waagerecht gedreht und etwas kleiner, damit sie wie die Hantel im Kilo-App-Icon liegt
  dumbbell: '<g transform="translate(12 12) rotate(-45) scale(.86) translate(-12 -12)"><path d="M14.4 14.4 9.6 9.6"/><path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z"/><path d="m21.5 21.5-1.4-1.4"/><path d="M3.9 3.9 2.5 2.5"/><path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z"/></g>',
  moonStar: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9"/><path d="M20 3v4"/><path d="M22 5h-4"/>',
  zap: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
  blocks: '<path d="M10 22V7a1 1 0 0 0-1-1H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5a1 1 0 0 0-1-1H2"/><rect width="8" height="8" x="14" y="2" rx="1"/>',
  cube: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7l8.7 5l8.7-5M12 22V12"/>',
  arrow: '<path d="M7 7h10v10M7 17L17 7"/>',
  calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/>',
  trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
  list: '<path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
};

// Kilo bekommt eine größere Karte und eine mit Screenshots, alle anderen eine normale Karte
const KILO = {
  file: 'kilo',
  name: 'Kilo',
  repo: 'Sieder2009/GymTracker',
  text: 'Trainingsplaner & Krafttracker als native App',
  lang: ['Dart · Flutter', '#00b4ab'],
  meta: 'Android · iOS · Windows · macOS',
  icon: ICONS.dumbbell,
  features: [
    [ICONS.calendar, 'Trainingskalender, Tagesplan & Kreatin-Tracker'],
    [ICONS.trophy, 'Ränge, PRs, DOTS und 1RM-Rechner'],
    [ICONS.list, '546 Übungen mit Muskel-Diagrammen'],
    [ICONS.lock, 'Alle Daten bleiben auf dem Gerät, ohne Konto'],
  ],
  // Verkleinerte Screenshots aus dem GymTracker-Repo, liegen in assets/screens/
  screens: ['strength', 'training', 'exercises'],
};

const PROJECTS = [
  {
    file: 'aurora',
    name: 'Aurora Nights',
    repo: 'Sieder2009/SiggidyShader',
    text: 'Shader für Minecraft Java – Iris & OptiFine',
    lang: ['GLSL', '#5686a5'],
    meta: 'Minecraft 26.3',
    icon: ICONS.moonStar,
  },
  {
    file: 'hotbarx',
    name: 'HotbarX',
    repo: 'Sieder2009/HotbarX',
    text: 'Rot-schwarzes GUI-Resourcepack mit Blitzen',
    lang: ['Java · GLSL', '#b07219'],
    meta: 'Minecraft 26.3',
    icon: ICONS.zap,
  },
  {
    file: 'minecraft',
    name: 'Minecraft-Portfolio',
    repo: 'Sieder2009/mc',
    text: 'Meine Welt als 3D-Spaziergang im Browser',
    lang: ['React · three.js', '#f1e05a'],
    meta: 'Web',
    icon: ICONS.cube,
  },
  {
    file: 'blockblast',
    name: 'BlockBlast',
    repo: 'Sieder2009/BlockBlast',
    text: 'Block-Puzzle mit Drag & Drop und Rekord',
    lang: ['Dart · Flutter', '#00b4ab'],
    meta: 'Android · Windows',
    icon: ICONS.blocks,
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

// Die Handys stehen unten über den Rand hinaus und werden von der Karte abgeschnitten
const PHONES = [
  { x: 50, y: 60, w: 116, rotate: -6 },
  { x: 250, y: 60, w: 116, rotate: 6 },
  { x: 138, y: 30, w: 140, rotate: 0 },
];

// Kilo bekommt zwei Karten im selben 416er-Raster wie der Rest: am Desktop nebeneinander, am Handy untereinander
const KILO_H = 300;

function kiloCard(p, t) {
  const W = 416;
  const H = KILO_H;
  const color = COLORS[p.file];
  const glow = `
  <rect x="${INSET}" y="${INSET}" width="${W - 2 * INSET}" height="${H - 2 * INSET}" rx="12" fill="url(#glow)"/>`;
  const features = p.features
    .map(([paths, text], i) => {
      const y = 160 + i * 28;
      return `${icon(paths, 26, y - 13, 16, color)}
  <text x="52" y="${y}" font-size="14.5" fill="${t.text2}">${esc(text)}</text>`;
    })
    .join('\n  ');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="t">
  <title id="t">${esc(`${p.name} – ${p.text} für ${p.meta.replaceAll(' · ', ', ')}`)}</title>
  <style>text{font-family:${SANS}}.mono{font-family:${MONO}}</style>
  <defs>
    <radialGradient id="glow" cx="${W - INSET}" cy="${INSET}" r="360" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${color}" stop-opacity="${t.cardGlow}"/>
      <stop offset="1" stop-color="${color}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  ${frame(W, H, t, glow)}
  <rect x="26" y="26" width="50" height="50" rx="12.5" fill="${color}"/>
  ${icon(p.icon, 37, 37, 28, '#ffffff')}
  <text x="90" y="50" font-size="24" font-weight="700" letter-spacing="-.4" fill="${t.text}">${esc(p.name)}</text>
  <text x="90" y="70" class="mono" font-size="12.5" fill="${t.muted}">${esc(p.repo)}</text>
  ${icon(ICONS.arrow, 370, 28, 18, t.muted)}
  <text x="26" y="118" font-size="16" fill="${t.text}">${esc(p.text)}</text>
  ${features}
  <circle cx="31" cy="269" r="5" fill="${p.lang[1]}"/>
  <text x="42" y="274" font-size="13" fill="${t.muted}">${esc(p.lang[0])}</text>
  <text x="390" y="274" font-size="13" fill="${t.muted}" text-anchor="end">${esc(p.meta)}</text>
</svg>
`;
}

function kiloScreens(p, t) {
  const W = 416;
  const H = KILO_H;
  const color = COLORS[p.file];
  const screens = p.screens.map((name) =>
    readFileSync(new URL(`../../assets/screens/kilo-${name}.jpg`, import.meta.url)).toString('base64'));
  // Hinten links, hinten rechts, dann vorne in der Mitte – so liegt das mittlere Handy oben
  const order = [0, 2, 1];
  const phones = PHONES.map(({ x, y, w, rotate }, i) => {
    const h = Math.round(w / 0.45);
    const r = (w * 0.12).toFixed(1);
    return `<g transform="translate(${x} ${y}) rotate(${rotate} ${w / 2} ${h / 2})" filter="url(#shadow)">
      <clipPath id="s${i}"><rect width="${w}" height="${h}" rx="${r}"/></clipPath>
      <rect width="${w}" height="${h}" rx="${r}" fill="${t.card}"/>
      <image width="${w}" height="${h}" preserveAspectRatio="xMidYMin slice" clip-path="url(#s${i})" href="data:image/jpeg;base64,${screens[order[i]]}"/>
      <rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="${r}" fill="none" stroke="${t.border}"/>
    </g>`;
  }).join('\n    ');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="t">
  <title id="t">Screenshots von ${esc(p.name)}: Kraft, Training und Übungen</title>
  <defs>
    <clipPath id="card"><rect x="${INSET}" y="${INSET}" width="${W - 2 * INSET}" height="${H - 2 * INSET}" rx="12"/></clipPath>
    <radialGradient id="glow" cx="${W / 2}" cy="${H}" r="300" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${color}" stop-opacity="${(t.cardGlow * 2.2).toFixed(2)}"/>
      <stop offset="1" stop-color="${color}" stop-opacity="0"/>
    </radialGradient>
    <filter id="shadow" x="-30%" y="-20%" width="160%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#000" flood-opacity="${t.shadow}"/>
    </filter>
  </defs>
  <rect x="${INSET}" y="${INSET}" width="${W - 2 * INSET}" height="${H - 2 * INSET}" rx="12" fill="${t.card}"/>
  <g clip-path="url(#card)">
    <rect x="${INSET}" y="${INSET}" width="${W - 2 * INSET}" height="${H - 2 * INSET}" fill="url(#glow)"/>
    ${phones}
  </g>
  <rect x="${INSET + 0.5}" y="${INSET + 0.5}" width="${W - 2 * INSET - 1}" height="${H - 2 * INSET - 1}" rx="11.5" fill="none" stroke="${t.border}"/>
</svg>
`;
}

// App-Icons der Projekte, die rechts im Header schweben
const TILES = [
  { file: 'kilo', x: 594, y: 48, size: 70, rotate: -8, delay: 0 },
  { file: 'aurora', x: 694, y: 92, size: 56, rotate: 7, delay: 1.3 },
  { file: 'hotbarx', x: 774, y: 36, size: 46, rotate: 10, delay: 2.6 },
  { file: 'blockblast', x: 614, y: 150, size: 50, rotate: 11, delay: 2.2 },
  { file: 'minecraft', x: 768, y: 158, size: 44, rotate: -6, delay: 3.1 },
];

function tile({ file, x, y, size, rotate, delay }) {
  const glyph = size * 0.54;
  const offset = (size - glyph) / 2;
  const r = (size * 0.26).toFixed(1);
  const paths = [KILO, ...PROJECTS].find((p) => p.file === file).icon;
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
    { color: COLORS.kilo, cx: 700, cy: 40, r: 250, cls: 'a' },
    { color: COLORS.blockblast, cx: 820, cy: 230, r: 210, cls: 'b' },
    { color: COLORS.aurora, cx: 545, cy: 260, r: 220, cls: 'c' },
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
  <title id="t">Sieder – Flutter-Apps, Web &amp; Minecraft. Aktuell: Kilo</title>
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
  <text x="58" y="139" font-size="22" fill="${t.muted}">Flutter-Apps, Web &amp; Minecraft</text>
  <rect x="58.5" y="165.5" width="126" height="31" rx="15.5" fill="${t.canvas}" fill-opacity=".6" stroke="${t.border}"/>
  <circle cx="77" cy="181" r="4.5" fill="${t.live}"/>
  <circle class="ping" cx="77" cy="181" r="4.5" fill="none" stroke="${t.live}" stroke-width="1.5"/>
  <text x="91" y="186" font-size="15" fill="${t.muted}" textLength="77" lengthAdjust="spacingAndGlyphs">Aktuell: <tspan fill="${t.text}" font-weight="600">Kilo</tspan></text>
</svg>
`;
}

const out = new URL('../../assets/', import.meta.url);
mkdirSync(out, { recursive: true });
// Alte Grafiken wegräumen, damit keine verwaisten Karten liegen bleiben (die Screenshots bleiben)
for (const name of readdirSync(out)) if (name.endsWith('.svg')) rmSync(new URL(name, out));
for (const [mode, t] of Object.entries(THEMES)) {
  writeFileSync(new URL(`header-${mode}.svg`, out), header(t));
  writeFileSync(new URL(`${KILO.file}-${mode}.svg`, out), kiloCard(KILO, t));
  writeFileSync(new URL(`${KILO.file}-screens-${mode}.svg`, out), kiloScreens(KILO, t));
  for (const p of PROJECTS) writeFileSync(new URL(`${p.file}-${mode}.svg`, out), card(p, t));
}
console.log(`assets/ geschrieben: Header, 2 Kilo-Karten + ${PROJECTS.length} Karten, jeweils hell und dunkel`);

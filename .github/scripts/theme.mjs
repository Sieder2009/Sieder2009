// Farben und Schriften für alle Profil-Grafiken.
// Jede Grafik gibt es zweimal: passend zum hellen und zum dunklen GitHub-Theme.

// Dieselben Schriften wie GitHub selbst – Bilder können keine Webfonts laden
export const SANS = `-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans',Helvetica,Arial,sans-serif`;
export const MONO = `ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,'Liberation Mono',monospace`;

export const THEMES = {
  dark: {
    canvas: '#0d1117', // Seitenhintergrund von GitHub
    card: '#151b23',
    border: '#3d444d',
    text: '#f0f6fc',
    text2: '#c9d1d9',
    muted: '#9198a1',
    grid: '#2a313c',
    bar: '#1fa76a',
    live: '#38d08f',
    dots: 0.16, // Punktraster im Header
    glow: 0.62, // Farbflächen im Header
    shadow: 0.45, // Schatten der App-Icons im Header
    cardGlow: 0.16, // Farbschimmer in der Kartenecke
  },
  light: {
    canvas: '#ffffff',
    card: '#ffffff',
    border: '#d1d9e0',
    text: '#1f2328',
    text2: '#3d444d',
    muted: '#59636e',
    grid: '#e6eaef',
    bar: '#1a8456',
    live: '#1fa76a',
    dots: 0.13,
    glow: 0.36,
    shadow: 0.14,
    cardGlow: 0.1,
  },
};

// Die Farben der Projekte – so wie auf ihren Websites
export const COLORS = {
  ironpeak: '#1fa76a',
  gymstats: '#ff3d1f',
  blockblast: '#8b5cf6',
  minecraft: '#2f9bb8',
};

export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// Rahmen jeder Kachel: 6px Luft rundherum, damit nebeneinanderliegende Bilder Abstand haben
export const INSET = 6;

export function frame(w, h, t, extra = '') {
  const i = INSET;
  return `<rect x="${i}" y="${i}" width="${w - 2 * i}" height="${h - 2 * i}" rx="12" fill="${t.card}"/>${extra}
  <rect x="${i + 0.5}" y="${i + 0.5}" width="${w - 2 * i - 1}" height="${h - 2 * i - 1}" rx="11.5" fill="none" stroke="${t.border}"/>`;
}

/**
 * Renders the images chat apps and home screens show for prismy.lgtm.page:
 * public/og.png (1200x630, the link preview) and public/apple-touch-icon.png
 * (180x180, from public/favicon.svg, with transparent rounded corners).
 *
 *   pnpm og
 */
import { chromium } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const WIDTH = 1200;
const HEIGHT = 630;
const ROOT = path.resolve(import.meta.dirname, "../..");
const FONT = path.join(
  ROOT,
  "node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2",
);

// Palette: the dark tokens from src/index.css.
const C = {
  background: "#121219",
  foreground: "oklch(0.96 0.006 285)",
  card: "#1b1b25",
  mutedForeground: "oklch(0.72 0.02 285)",
  border: "oklch(1 0 0 / 10%)",
  accent: "#9085e9",
  muted: "#4b4b59",
  grid: "#2a2a36",
  c1: "#3987e5",
  c2: "#d95926",
  c3: "#199e70",
} as const;

const MARK = `<svg viewBox="0 0 64 64" fill="none">
  <path d="M32 12 L52 46 L12 46 Z" stroke="${C.accent}" stroke-width="4" stroke-linejoin="round"/>
  <path d="M6 32 H24" stroke="${C.foreground}" stroke-width="3.5" stroke-linecap="round" opacity="0.45"/>
  <path d="M40 30 L58 22" stroke="${C.c1}" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M41 35 L58 33" stroke="${C.c3}" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M40 40 L58 44" stroke="${C.c2}" stroke-width="3.5" stroke-linecap="round"/>
</svg>`;

/** Weekly opened (muted) and merged (accent) bars for the preview card. */
const WEEKS = [
  [5, 3],
  [7, 6],
  [4, 4],
  [9, 7],
  [6, 5],
  [10, 9],
  [8, 6],
  [11, 10],
  [7, 7],
  [12, 11],
];

function chart(): string {
  const w = 460;
  const h = 220;
  const max = 12;
  const band = w / WEEKS.length;
  const bars = WEEKS.map(([opened, merged], i) => {
    const x = i * band + band * 0.2;
    const bw = band * 0.26;
    const oh = (opened / max) * h;
    const mh = (merged / max) * h;
    return `
      <rect x="${x}" y="${h - oh}" width="${bw}" height="${oh}" rx="4" fill="${C.muted}"/>
      <rect x="${x + bw + 4}" y="${h - mh}" width="${bw}" height="${mh}" rx="4" fill="${C.accent}"/>`;
  }).join("");
  const grid = [0.25, 0.5, 0.75, 1]
    .map(
      (f) =>
        `<line x1="0" x2="${w}" y1="${h - f * h}" y2="${h - f * h}" stroke="${C.grid}"/>`,
    )
    .join("");
  return `<svg viewBox="0 -8 ${w} ${h + 8}" width="${w}" height="${h + 8}">${grid}${bars}<line x1="0" x2="${w}" y1="${h}" y2="${h}" stroke="${C.grid}"/></svg>`;
}

async function fontFace(): Promise<string> {
  const font = (await readFile(FONT)).toString("base64");
  return `@font-face { font-family: Geist; src: url(data:font/woff2;base64,${font}) format("woff2"); font-weight: 100 900; }`;
}

async function ogHtml(): Promise<string> {
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
  ${await fontFace()}
  * { margin: 0; box-sizing: border-box; }
  html, body { width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden; }
  body { background: ${C.background}; color: ${C.foreground}; font-family: Geist, system-ui, sans-serif; position: relative; }
  .glow { position: absolute; inset: 0; background:
    radial-gradient(ellipse 600px 400px at 15% 35%, oklch(0.72 0.15 285 / 0.16), transparent 70%),
    radial-gradient(ellipse 700px 500px at 85% 65%, oklch(0.3 0.06 285 / 0.5), transparent 70%); }
  header { position: absolute; left: 72px; top: 150px; width: 560px; }
  .mark { width: 120px; height: 120px; margin-bottom: 22px; }
  h1 { font-size: 104px; font-weight: 800; letter-spacing: -0.045em; line-height: 1; }
  p { margin-top: 18px; font-size: 32px; font-weight: 500; color: ${C.mutedForeground}; line-height: 1.25; }
  .card { position: absolute; right: 72px; top: 150px; width: 520px; padding: 26px 30px 30px;
    border-radius: 24px; background: ${C.card}; border: 2px solid ${C.border}; box-shadow: 0 30px 60px oklch(0 0 0 / 0.45); }
  .card .title { font-size: 22px; font-weight: 600; }
  .card .sub { margin-top: 4px; font-size: 16px; color: ${C.mutedForeground}; }
  .legend { display: flex; gap: 18px; margin-top: 14px; font-size: 14px; color: ${C.mutedForeground}; }
  .legend span { display: inline-flex; align-items: center; gap: 6px; }
  .legend i { display: inline-block; width: 10px; height: 10px; border-radius: 2px; }
  .chart { margin-top: 10px; }
</style></head>
<body>
  <div class="glow"></div>
  <header>
    <div class="mark">${MARK}</div>
    <h1>Prismy</h1>
    <p>Your impact through<br />GitHub pull requests.</p>
  </header>
  <div class="card">
    <div class="title">Throughput</div>
    <div class="sub">Pull requests opened and merged per week</div>
    <div class="legend"><span><i style="background:${C.muted}"></i>Opened</span><span><i style="background:${C.accent}"></i>Merged</span></div>
    <div class="chart">${chart()}</div>
  </div>
</body></html>`;
}

async function iconHtml(size: number): Promise<string> {
  const svg = await readFile(path.join(ROOT, "public/favicon.svg"), "utf8");
  return `<!doctype html><html><head><style>
    * { margin: 0; }
    html, body { width: ${size}px; height: ${size}px; overflow: hidden; background: transparent; }
    svg { display: block; width: ${size}px; height: ${size}px; }
  </style></head><body>${svg}</body></html>`;
}

async function render(
  file: string,
  html: string,
  width: number,
  height: number,
  { transparent = false } = {},
): Promise<void> {
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1,
  });
  await page.setContent(html);
  await page.evaluate(() => document.fonts.ready);
  const png = await page.screenshot({
    type: "png",
    omitBackground: transparent,
  });
  await writeFile(path.join(ROOT, file), png);
  console.log(`wrote ${file} (${png.byteLength} bytes)`);
  await page.close();
}

const browser = await chromium.launch();
try {
  await render("public/og.png", await ogHtml(), WIDTH, HEIGHT);
  await render("public/apple-touch-icon.png", await iconHtml(180), 180, 180, {
    transparent: true,
  });
} finally {
  await browser.close();
}

// Key faces and dial-strip pieces, drawn as SVG data URIs.
// Glyphs are Material Icons paths (Apache 2.0) on a 24x24 grid.
//
// Every face takes an optional `vfd`: the OpenXLR skin's colours when that
// skin draws its text in segments over unlit cells (one that sets
// Ox.Text.Ghost). Then keys and dial strips draw as a vacuum fluorescent
// display, as OpenXLR's own deck keys do. Without it they draw as below.

import { segmented, segmentText, segmentWidth, fittedSize } from "./segment-text.mjs";

export const ACCENT = "#fa2d48";
const BG = "#1c1c1e";
const INK = "#f2f2f7";
const MUTED = "#8e8e93";
const FONT = "Inter, 'Noto Sans', 'DejaVu Sans', sans-serif";

export const GLYPHS = {
  play: "M8 5v14l11-7z",
  pause: "M6 19h4V5H6v14zm8-14v14h4V5h-4z",
  next: "M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z",
  previous: "M6 6h2v12H6zm3.5 6l8.5 6V6z",
  shuffle: "M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z",
  repeat: "M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z",
  repeatOne: "M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z",
  heart: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
  heartOutline: "M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z",
  libraryAdd: "M14 10H3v2h11v-2zm0-4H3v2h11V6zm4 8v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM3 16h7v-2H3v2z",
  libraryAdded: "M14 10H2v2h12v-2zm0-4H2v2h12V6zM2 16h8v-2H2v2zm19.5-4.5L23 13l-6.99 7-4.51-4.5L13 14l3.01 3 5.49-5.5z",
  volumeUp: "M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z",
  volumeDown: "M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z",
  volumeOff: "M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z",
  note: "M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z",
  key: "M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z",
  power: "M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.58-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z",
};

export const escapeXml = (s) => String(s).replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]);

export const svgUri = (svg) => "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");

// Cuts text to roughly fit `maxWidth` px at `size` px, by an average glyph
// width; good enough for one-line labels without measuring fonts.
export function fit(text, size, maxWidth) {
  const s = String(text ?? "");
  const max = Math.max(1, Math.floor(maxWidth / (size * 0.56)));
  return s.length <= max ? s : s.slice(0, max - 1).trimEnd() + "…";
}

export function formatTime(seconds) {
  const s = Math.max(0, Math.floor(Number(seconds) || 0));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  const mm = h ? String(m).padStart(2, "0") : String(m);
  return (h ? `${h}:` : "") + `${mm}:${String(r).padStart(2, "0")}`;
}

const glyph = (name, x, y, size, color) =>
  `<path transform="translate(${x} ${y}) scale(${size / 24})" d="${GLYPHS[name]}" fill="${color}"/>`;

// A plain control key: one glyph, optionally lit, with an optional caption.
// `lines` are up to two short caption lines drawn under the glyph.
// `lamp` marks a key with an on/off state and `alert` one whose on state is a
// warning (mute); only the display style draws them.
export function keyFace({ icon, active = false, dim = false, lines = [], vfd = null, lamp = false, alert = false } = {}) {
  if (vfd) return vfdKeyFace(vfd, { icon, active, dim, lines, lamp, alert });
  const color = dim ? "#48484a" : active ? ACCENT : INK;
  const caption = lines.filter(Boolean).slice(0, 2);
  const size = caption.length ? 64 : 84;
  const gy = caption.length ? 18 : 30;
  let text = "";
  caption.forEach((line, i) => {
    const y = caption.length === 1 ? 118 : 106 + i * 22;
    text += `<text x="72" y="${y}" text-anchor="middle" font-family="${FONT}" font-size="19" font-weight="600" fill="${i === 0 && !dim ? INK : MUTED}">${escapeXml(fit(line, 19, 132))}</text>`;
  });
  return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" width="288" height="288" viewBox="0 0 144 144">` +
    `<rect width="144" height="144" fill="${BG}"/>` +
    glyph(icon, 72 - size / 2, gy, size, color) + text + `</svg>`);
}

// The now-playing key: album art filling the key, a scrim with title and
// artist, a progress line, and a pause badge while paused.
export function nowPlayingFace({ art, title, artist, progress = 0, playing = true, showText = true, dim = false, vfd = null } = {}) {
  if (vfd) return vfdNowPlayingFace(vfd, { art, title, artist, progress, playing, showText, dim });
  let body = art
    ? `<image href="${art}" x="0" y="0" width="144" height="144" preserveAspectRatio="xMidYMid slice"/>`
    : `<rect width="144" height="144" fill="#2c2c2e"/>` + glyph("note", 36, 24, 72, dim ? "#48484a" : MUTED);
  if (showText && title) {
    body += `<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.85"/></linearGradient></defs>` +
      `<rect y="70" width="144" height="74" fill="url(#s)"/>` +
      `<text x="8" y="${artist ? 112 : 128}" font-family="${FONT}" font-size="17" font-weight="700" fill="#fff">${escapeXml(fit(title, 17, 130))}</text>` +
      (artist ? `<text x="8" y="131" font-family="${FONT}" font-size="14" fill="#d1d1d6">${escapeXml(fit(artist, 14, 130))}</text>` : "");
  }
  if (title) {
    const w = Math.round(Math.max(0, Math.min(1, progress)) * 144);
    body += `<rect y="140" width="144" height="4" fill="#000" fill-opacity="0.5"/><rect y="140" width="${w}" height="4" fill="${ACCENT}"/>`;
  }
  if (title && !playing)
    body += `<circle cx="120" cy="24" r="17" fill="#000" fill-opacity="0.6"/>` + glyph("pause", 108, 12, 24, "#fff");
  if (dim) body += `<rect width="144" height="144" fill="#000" fill-opacity="0.55"/>`;
  return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" width="288" height="288" viewBox="0 0 144 144">${body}</svg>`);
}

// A small glyph for dial-strip pixmaps.
export function stripIcon(icon, color = INK) {
  return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"><path d="${GLYPHS[icon]}" fill="${color}"/></svg>`);
}

// ---------- display style (OpenXLR VFD skins) ----------

// Whether a skin's colours draw a display: its unlit segment cells are set.
export const isDisplay = (colours) => !!colours && segmented(colours["Ox.Text.Ghost"]);

// A colour scaled toward black, for the glass under a display's lettering.
export function darken(hex, amount) {
  const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return "#" + rgb.map((v) => Math.round(v * amount).toString(16).padStart(2, "0")).join("");
}

// The defs every display face shares: the halo lit lettering wears, the
// light it spills into the glass, and the glass's fine mesh and sheen, as on
// OpenXLR's display keys and the VFD Clock keys.
function vfdDefs(lit) {
  return `
        <filter id="halo" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.5"/></filter>
        <filter id="soft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2.5"/></filter>
        <radialGradient id="spill" cx="72" cy="84" r="80" gradientUnits="userSpaceOnUse">
          <stop stop-color="${lit}" stop-opacity="0.10"/><stop offset="1" stop-color="${lit}" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="sheen" x1="0" y1="0" x2="0" y2="72" gradientUnits="userSpaceOnUse">
          <stop stop-color="#ffdcbe" stop-opacity="0.06"/><stop offset="1" stop-color="#ffdcbe" stop-opacity="0"/>
        </linearGradient>
        <pattern id="mesh" width="1.5" height="1.5" patternUnits="userSpaceOnUse">
          <rect width="1.5" height="0.5" fill="#000" opacity="0.27"/><rect width="0.5" height="1.5" fill="#000" opacity="0.18"/>
        </pattern>`;
}

// Something lit on the display: a soft halo of its own colour under it.
const glowing = (inner, colour) =>
  `<g filter="url(#halo)" opacity="0.8" color="${colour}" fill="${colour}">${inner}</g><g color="${colour}" fill="${colour}">${inner}</g>`;

const shapeAt = (name, x, y, size) =>
  `<path transform="translate(${x} ${y}) scale(${size / 24})" d="${GLYPHS[name]}"/>`;

// The segment face has no accented letters; the base letter stands in.
const plain = (text) => String(text ?? "").normalize("NFD").replace(/\p{M}/gu, "");

// One line of segment lettering in `width` px: the text and the size to draw
// it at. It shrinks from `size` down to `min`, and below that it is cut and
// ends in an ellipsis.
export function segmentLine(text, size, width, min = size) {
  const s = plain(text);
  if (segmentWidth(s, size) <= width) return { text: s, size };
  if (segmentWidth(s, min) <= width) return { text: s, size: fittedSize(s, size, width) };
  const chars = Array.from(s);
  while (chars.length > 1 && segmentWidth(chars.join("").trimEnd() + "…", min) > width) chars.pop();
  return { text: chars.join("").trimEnd() + "…", size: min };
}

// The display's glass behind a key's contents, and its mesh and sheen over
// them. `over` goes on top of the glass, for a picture that keeps its colours.
function vfdKey(c, body, defs = "", over = "") {
  const lit = c["Ox.Text.Primary"];
  return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" width="288" height="288" viewBox="0 0 144 144">
      <defs>${vfdDefs(lit)}${defs}</defs>
      <rect width="144" height="144" fill="${darken(c["Ox.Text.Ghost"], 0.25)}"/>
      <rect width="144" height="144" fill="url(#spill)"/>
      <rect x="5" y="5" width="134" height="134" rx="16" fill="none" stroke="${darken(lit, 0.3)}" stroke-width="2"/>
      ${body}
      <rect width="144" height="144" fill="url(#mesh)"/>
      <rect width="144" height="144" fill="url(#sheen)"/>
      ${over}
    </svg>`);
}

// A control key as a vacuum fluorescent display: near-black glass with a thin
// frame, the glyph lit with a halo while on and dim while off, captions in
// OpenXLR's segment face over unlit cells, and a lamp segment in the corner
// of a key with an on/off state. A key without a state (next, volume up)
// keeps its glyph lit; one that cannot act now shows only unlit cells.
function vfdKeyFace(c, { icon, active, dim, lines, lamp, alert }) {
  const ghost = c["Ox.Text.Ghost"], lit = c["Ox.Text.Primary"], unlit = c["Ox.Text.Muted"];
  const accent = active && !dim ? c[alert ? "Ox.Led.Alert" : "Ox.Led.On"] : null;
  const caption = lines.filter(Boolean).slice(0, 2);
  const capY = caption.length ? 52 : 66;
  const size = caption.length ? 64 : 84;
  const shape = shapeAt(icon, 72 - size / 2, capY - size / 2, size);
  const face = accent ? glowing(shape, accent)
    : dim ? `<g fill="${ghost}">${shape}</g>`
    : lamp ? `<g fill="${unlit}">${shape}</g>`
    : glowing(shape, lit);
  const lampBar = `<rect x="110" y="18" width="16" height="6" rx="1"/>`;
  const lampSvg = !lamp ? "" : accent ? glowing(lampBar, accent) : `<g fill="${ghost}">${lampBar}</g>`;
  const labels = caption.map((line, i) => {
    const text = plain(line);
    const base = text.length > 11 ? 19 : text.length > 8 ? 22 : 26;
    const y = caption.length === 1 ? 126 : 106 + i * 24;
    return segmentText(text, 72, y - 2, fittedSize(text, base * 0.8, 120),
      { fill: dim ? unlit : lit, ghost, glow: dim ? null : "soft" });
  }).join("");
  return vfdKey(c, face + lampSvg + labels);
}

// A row of cells lit up to `fraction`, the display's progress bar.
function ladder(fraction, { cells, w, gap, x0, y, h, ghost, fill }) {
  const on = Math.round(Math.max(0, Math.min(1, fraction)) * cells);
  let litCells = "", dark = "";
  for (let i = 0; i < cells; i++) {
    const cell = `<rect x="${x0 + i * (w + gap)}" y="${y}" width="${w}" height="${h}"/>`;
    if (i < on) litCells += cell; else dark += cell;
  }
  return `<g fill="${ghost}">${dark}</g>` + (litCells ? glowing(litCells, fill) : "");
}

// The now-playing key as a display. The album cover shows as it is, in its
// own colours, on the display glass. Title and artist sit
// under it in segment lettering, then a ladder of cells for the position.
// While paused a lit pause glyph shows beside or over the picture.
function vfdNowPlayingFace(c, { art, title, artist, progress, playing, showText, dim }) {
  const ghost = c["Ox.Text.Ghost"], lit = c["Ox.Text.Primary"], unlit = c["Ox.Text.Muted"];
  if (!title) return vfdKey(c, `<g fill="${dim ? ghost : unlit}">${shapeAt("note", 36, 36, 72)}</g>`);
  const on = playing && !dim;
  const ink = dim ? unlit : on ? lit : unlit;
  const text = showText;
  const box = text ? { x: 42, y: 10, s: 60 } : { x: 20, y: 10, s: 104 };
  const rect = `x="${box.x}" y="${box.y}" width="${box.s}" height="${box.s}"`;
  let defs = `
        <pattern id="pixels" width="2" height="2" patternUnits="userSpaceOnUse">
          <rect width="2" height="0.5" fill="#000" opacity="0.55"/><rect width="0.5" height="2" fill="#000" opacity="0.55"/>
        </pattern>`;
  let body = `<rect ${rect} fill="${ghost}"/>`, over = "";
  if (art) {
    over = `<image ${rect} preserveAspectRatio="xMidYMid slice" href="${art}"/>`;
    if (dim) over += `<rect ${rect} fill="#000" fill-opacity="0.55"/>`;
  } else {
    const size = box.s * 0.7;
    const shape = shapeAt("note", box.x + (box.s - size) / 2, box.y + (box.s - size) / 2, size);
    body += (on ? glowing(shape, ink) : `<g fill="${ink}">${shape}</g>`) + `<rect ${rect} fill="url(#pixels)"/>`;
  }
  if (!playing && !dim) {
    // Beside the picture when the text leaves room, else in its corner.
    const at = text ? { x: 108, y: 14 } : { x: box.x + box.s - 26, y: box.y + 2 };
    const badge = (text ? "" : `<rect x="${at.x - 2}" y="${at.y - 2}" width="28" height="28" fill="${darken(ghost, 0.25)}"/>`) +
      glowing(shapeAt("pause", at.x, at.y, 24), lit);
    // Over the picture the badge has to sit above it too.
    if (art && !text) over += badge; else body += badge;
  }
  const textFill = dim ? unlit : lit, glow = dim ? null : "soft";
  let y = box.y + box.s;
  if (text) {
    const t = segmentLine(title, 18, 130, 12);
    body += segmentText(t.text, 72, y + 24, t.size, { fill: textFill, ghost, glow });
    if (artist) {
      const a = segmentLine(artist, 14, 130, 10);
      body += segmentText(a.text, 72, y + 43, a.size, { fill: textFill, ghost, glow });
    }
    y += 51;
  } else y += 8;
  body += ladder(progress, { cells: 24, w: 4, gap: 1, x0: 12.5, y, h: 5, ghost, fill: on ? c["Ox.Meter.Fill"] : unlit });
  return vfdKey(c, body, defs, over);
}

// The width of a display strip's title, and of its reading and ladder, as
// layouts/dial-display.json places them.
export const TITLE_W = 154;
export const DISPLAY_W = 168;

// A dial strip's glass and frame, the keys' display stretched to the strip.
export function vfdStrip(c) {
  const lit = c["Ox.Text.Primary"];
  return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" width="192" height="92" viewBox="0 0 192 92">
      <defs>${vfdDefs(lit)}</defs>
      <rect width="192" height="92" rx="12" fill="${darken(c["Ox.Text.Ghost"], 0.25)}"/>
      <rect width="192" height="92" rx="12" fill="url(#spill)"/>
      <rect x="1" y="1" width="190" height="90" rx="11" fill="none" stroke="${darken(lit, 0.3)}" stroke-width="2"/>
      <rect width="192" height="92" rx="12" fill="url(#mesh)"/>
    </svg>`);
}

// A dial strip's title in the segment face over unlit cells; a long one
// shrinks, then is cut, ending where the reading ends below it.
export function vfdTitle(c, text, dim = false) {
  const t = segmentLine(text, 13, TITLE_W - 12, 9);
  return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" width="${TITLE_W}" height="24" viewBox="0 0 ${TITLE_W} 24">` +
    segmentText(t.text, 0, 18, t.size, { fill: dim ? c["Ox.Text.Muted"] : c["Ox.Text.Primary"], ghost: c["Ox.Text.Ghost"], anchor: "start" }) +
    `</svg>`);
}

// The value as a display shows it: the reading in the segment face at the
// right, an optional note (the artist) at the left in what room is left, and
// under them a ladder of cells across the strip lit up to `fraction`. Lit
// while active, dim while not.
export function vfdDial(c, fraction, reading, active, note = "") {
  const ghost = c["Ox.Text.Ghost"], lit = active ? c["Ox.Text.Primary"] : c["Ox.Text.Muted"];
  const size = reading ? fittedSize(plain(reading), 22, DISPLAY_W - 4) : 22;
  let text = reading ? segmentText(plain(reading), DISPLAY_W - 2, 28, size, { fill: lit, ghost, anchor: "end", glow: active ? "soft" : null }) : "";
  if (note) {
    const room = DISPLAY_W - 4 - (reading ? segmentWidth(plain(reading), size) + 10 : 0);
    if (room >= 30) {
      const n = segmentLine(note, 12, room, 8);
      text += segmentText(n.text, 2, 28, n.size, { fill: c["Ox.Text.Muted"], ghost, anchor: "start" });
    }
  }
  const w = 3, gap = 2, cells = Math.floor((DISPLAY_W + gap) / (w + gap));
  const x0 = Math.floor((DISPLAY_W - (cells * (w + gap) - gap)) / 2);
  return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" width="${DISPLAY_W}" height="52" viewBox="0 0 ${DISPLAY_W} 52">
      <defs>${vfdDefs(lit)}</defs>${text}${ladder(fraction, { cells, w, gap, x0, y: 38, h: 8, ghost, fill: lit })}
    </svg>`);
}

// ---------- artwork ----------
const artCache = new Map(); // url -> data URI (last few tracks)

export function artworkUrl(url, size) {
  return url.replace("{w}", size).replace("{h}", size).replace("{f}", "jpg");
}

export async function fetchArtwork(url, size = 288) {
  if (!url) return null;
  if (url.startsWith("data:")) return url;
  const full = artworkUrl(url, size);
  if (artCache.has(full)) return artCache.get(full);
  const res = await fetch(full, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`artwork ${res.status}`);
  const type = (res.headers.get("content-type") ?? "image/jpeg").split(";")[0];
  if (!/^image\/(jpeg|png|webp)$/.test(type)) throw new Error(`artwork type ${type}`);
  const data = `data:${type};base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
  artCache.set(full, data);
  while (artCache.size > 12) artCache.delete(artCache.keys().next().value);
  return data;
}

// Key faces and dial-strip pieces, drawn as SVG data URIs.
// Glyphs are Material Icons paths (Apache 2.0) on a 24x24 grid.

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
export function keyFace({ icon, active = false, dim = false, lines = [] } = {}) {
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
export function nowPlayingFace({ art, title, artist, progress = 0, playing = true, showText = true, dim = false } = {}) {
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

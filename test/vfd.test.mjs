import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { keyFace, nowPlayingFace, isDisplay, darken, segmentLine, vfdDial, vfdTitle, ACCENT } from "../com.emaspa.cider.sdPlugin/render.mjs";
import { keyImage, dialFeedback, displayFeedback } from "../com.emaspa.cider.sdPlugin/faces.mjs";
import { SkinPalette, paletteFrom } from "../com.emaspa.cider.sdPlugin/skin-palette.mjs";
import { emptyState } from "../com.emaspa.cider.sdPlugin/cider.mjs";

const plugin = new URL("../com.emaspa.cider.sdPlugin/", import.meta.url);
const table = JSON.parse(fs.readFileSync(new URL("skin-palettes.json", plugin), "utf8"));
const decode = (uri) => Buffer.from(uri.split(",")[1], "base64").toString();
const amber = paletteFrom(table["vfd-amber"]);
const track = { id: "1", name: "Sunset Boulevard", artist: "The Night Drivers", album: "A", artworkUrl: "", durationMs: 245000 };
const playing = () => ({ ...emptyState(), online: true, auth: "ok", playing: true, track, time: { current: 83, duration: 245 }, volume: 0.45, shuffle: true });

test("only the VFD skins draw a display", () => {
  const displays = Object.keys(table).filter((id) => isDisplay(paletteFrom(table[id])));
  assert.deepEqual(displays.sort(), ["vfd-amber", "vfd-blue", "vfd-classic"]);
  assert.equal(isDisplay(null), false);
});

test("without a display Cider keeps its own colours", () => {
  const s = playing();
  for (const action of ["playpause", "shuffle", "nowplaying", "mute"]) {
    const c = { action, settings: {} };
    assert.equal(keyImage(c, s, {}, null), keyImage(c, s));
  }
  assert.match(decode(keyImage({ action: "playpause", settings: {} }, s)), new RegExp(`fill="${ACCENT}"`));
});

test("a display key is glass with the glyph lit and a lit lamp while on", () => {
  const svg = decode(keyFace({ icon: "shuffle", active: true, lines: ["On"], vfd: amber, lamp: true }));
  assert.match(svg, new RegExp(`fill="${darken(amber["Ox.Text.Ghost"], 0.25)}"`));
  assert.match(svg, /filter="url\(#halo\)"[^>]*fill="#ff9634"/);
  assert.match(svg, /<rect x="110" y="18"/);
  assert.match(svg, /url\(#mesh\)/);
  assert.doesNotMatch(svg, /<text/);
});

test("an off key is dim, a key without state stays lit, an unusable one is unlit cells", () => {
  const off = decode(keyFace({ icon: "shuffle", lines: ["Off"], vfd: amber, lamp: true }));
  assert.match(off, new RegExp(`<g fill="${amber["Ox.Text.Muted"]}"><path`));
  const next = decode(keyFace({ icon: "next", vfd: amber }));
  assert.match(next, /filter="url\(#halo\)"/);
  assert.doesNotMatch(next, /<rect x="110" y="18"/);
  const gone = decode(keyFace({ icon: "heart", dim: true, vfd: amber, lamp: true }));
  assert.match(gone, new RegExp(`<g fill="${amber["Ox.Text.Ghost"]}"><path`));
});

test("a mute is lit in the alert colour", () => {
  const svg = decode(keyFace({ icon: "volumeOff", active: true, lines: ["Muted"], vfd: amber, lamp: true, alert: true }));
  assert.match(svg, new RegExp(`fill="${amber["Ox.Led.Alert"]}"`));
});

test("segment lines shrink, then cut with an ellipsis, and lose accents", () => {
  assert.deepEqual(segmentLine("ABC", 13, 154, 9), { text: "ABC", size: 13 });
  const shrunk = segmentLine("Sunset Boulevard", 13, 142, 9);
  assert.equal(shrunk.text, "Sunset Boulevard");
  assert.ok(shrunk.size < 13 && shrunk.size >= 9);
  const cut = segmentLine("An Extraordinarily Long Song Title", 18, 130, 12);
  assert.ok(cut.text.endsWith("…"));
  assert.equal(cut.size, 12);
  assert.equal(segmentLine("Beyoncé", 13, 154).text, "Beyonce");
});

test("the now playing display keeps the original cover", () => {
  const art = "data:image/png;base64,AAAA";
  const on = decode(nowPlayingFace({ art, title: "Song", artist: "Band", progress: 0.5, playing: true, vfd: amber }));
  assert.doesNotMatch(on, /feColorMatrix|filter="url\(#tint\)"/);
  assert.match(on, /href="data:image\/png;base64,AAAA"/);
  assert.doesNotMatch(on, /<text/);
  const paused = decode(nowPlayingFace({ art, title: "Song", playing: false, vfd: amber }));
  assert.match(paused, /d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/);
});

test("display strips feed exactly the display layout's items", () => {
  const layout = JSON.parse(fs.readFileSync(new URL("layouts/dial-display.json", plugin), "utf8"));
  const keys = layout.items.map((i) => i.key).sort();
  assert.ok(layout.items.every((i) => i.type === "pixmap"), "no text item of OpenDeck's own");
  const states = [playing(), { ...playing(), volume: 0, playing: false }, { ...emptyState() }, { ...emptyState(), online: true, auth: "ok" }];
  for (const s of states) for (const action of ["dialvolume", "dialtrack"])
    assert.deepEqual(Object.keys(displayFeedback({ action }, s, amber)).sort(), keys);
});

test("the strip reading and ladder follow the value", () => {
  const half = decode(vfdDial(amber, 0.5, "50%", true));
  const lit = (half.split('filter="url(#halo)"')[1] ?? "").split("</g>")[0];
  assert.equal((lit.match(/<rect /g) ?? []).length, Math.round(0.5 * 34));
  assert.doesNotMatch(decode(vfdDial(amber, 0, "", false)), /url\(#halo\)/);
  assert.match(decode(vfdTitle(amber, "Volume")), new RegExp(`fill="${amber["Ox.Text.Primary"]}"`));
});

test("the dial strips in their own layouts are unchanged", () => {
  const fb = dialFeedback({ action: "dialvolume" }, playing());
  assert.deepEqual(Object.keys(fb), ["icon", "label", "value", "indicator"]);
  assert.equal(fb.value, "45%");
});

test("the skin palette follows OpenXLR's settings and the override", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "cider-skin-"));
  try {
    const env = { XDG_CONFIG_HOME: path.join(home, "config"), XDG_DATA_HOME: path.join(home, "data"), XDG_DATA_DIRS: path.join(home, "share") };
    const none = new SkinPalette(null, { env, home });
    assert.equal(isDisplay(none.colours), false, "without OpenXLR there is no display");
    none.close();
    fs.mkdirSync(path.join(env.XDG_CONFIG_HOME, "openxlr"), { recursive: true });
    fs.writeFileSync(path.join(env.XDG_CONFIG_HOME, "openxlr", "ui.json"), JSON.stringify({ skin: "vfd-blue" }));
    const saved = new SkinPalette(null, { env, home });
    assert.equal(saved.id, "vfd-blue");
    assert.equal(isDisplay(saved.colours), true);
    saved.close();
    const forced = new SkinPalette(null, { env: { ...env, OPENXLR_SKIN: "broadcast" }, home });
    assert.equal(isDisplay(forced.colours), false);
    forced.close();
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
});

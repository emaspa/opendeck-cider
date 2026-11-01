// Cider plugin for OpenDeck (Stream Deck SDK compatible).
// One WebSocket to the OpenDeck host, one Socket.IO feed from Cider. Cider
// pushes every playback change, so keys and dials redraw from that state.

import process from "node:process";
import { spawn } from "node:child_process";
import { CiderClient, AuthError } from "./cider.mjs";
import { keyFace, nowPlayingFace, stripIcon, fetchArtwork, formatTime, ACCENT } from "./render.mjs";

const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const port = arg("-port");
const pluginUUID = arg("-pluginUUID");
const registerEvent = arg("-registerEvent");

const PREFIX = "com.emaspa.cider.";
const HOLD_MS = 400;          // next/previous held this long start seeking
const HOLD_SEEK_EVERY = 250;  // ms between seek steps while held
const HOLD_SEEK_STEP = 5;     // seconds per step

// ---------- host connection ----------
const host = new WebSocket(`ws://127.0.0.1:${port}`);
const send = (msg) => { if (host.readyState === WebSocket.OPEN) host.send(JSON.stringify(msg)); };
const log = (message) => send({ event: "logMessage", payload: { message: `[cider] ${message}` } });

// context -> { action, controller, settings, last, lastFeedback, hold }
const contexts = new Map();
const inspectors = new Set(); // contexts whose property inspector is open
let globals = {};
let globalsLoaded = false;
let autoPairTried = false;
let lastLaunch = 0;

const cider = new CiderClient({ log });

host.onopen = () => {
  send({ event: registerEvent, uuid: pluginUUID });
  send({ event: "getGlobalSettings", context: pluginUUID });
  // Start anyway if the host never answers with global settings.
  setTimeout(() => { if (!globalsLoaded) { globalsLoaded = true; cider.start(); } }, 2000);
};
host.onclose = () => { cider.stop(); process.exit(0); };

host.onmessage = (e) => {
  let m;
  try { m = JSON.parse(e.data); } catch { return; }
  const { event, context, action, payload } = m;
  switch (event) {
    case "didReceiveGlobalSettings": {
      globals = payload?.settings ?? {};
      cider.setToken(globals.token ?? "");
      if (!globalsLoaded) { globalsLoaded = true; cider.start(); }
      publishStatus();
      break;
    }
    case "willAppear": {
      contexts.set(context, {
        action: action.slice(PREFIX.length),
        controller: payload?.controller ?? "Keypad",
        settings: payload?.settings ?? {},
        last: null, lastFeedback: {}, hold: null,
      });
      maybeAutoPair();
      wantArtwork();
      scheduleRender();
      break;
    }
    case "willDisappear": {
      const c = contexts.get(context);
      if (c) stopHold(c);
      contexts.delete(context);
      inspectors.delete(context);
      break;
    }
    case "didReceiveSettings": {
      const c = contexts.get(context);
      if (c) { c.settings = payload?.settings ?? {}; c.last = null; scheduleRender(); }
      break;
    }
    case "keyDown": keyDown(context); break;
    case "keyUp": keyUp(context); break;
    case "dialRotate": dialRotate(context, payload?.ticks ?? 0); break;
    case "dialDown": dialPress(context); break;
    case "touchTap": dialPress(context, !!payload?.hold); break;
    case "propertyInspectorDidAppear": inspectors.add(context); publishStatus(); break;
    case "propertyInspectorDidDisappear": inspectors.delete(context); break;
    case "sendToPlugin": fromInspector(context, payload ?? {}); break;
  }
};

function saveGlobals(patch) {
  globals = { ...globals, ...patch };
  send({ event: "setGlobalSettings", context: pluginUUID, payload: globals });
  publishStatus();
}

// ---------- pairing ----------
cider.on("token", (token) => saveGlobals({ token, pairDeclined: false }));
cider.on("authNeeded", ({ hadToken }) => {
  if (hadToken) { log("stored token rejected by Cider"); saveGlobals({ token: "" }); cider.setToken(""); }
  maybeAutoPair();
});

// Ask Cider for a token once per run, as soon as a Cider key is on a deck.
// After a denial it waits for an explicit press instead.
function maybeAutoPair() {
  if (autoPairTried || !contexts.size || globals.pairDeclined) return;
  if (!cider.state.online || cider.state.auth !== "needed") return;
  autoPairTried = true;
  pair();
}

async function pair(context) {
  try {
    await cider.pair();
    if (context) send({ event: "showOk", context });
  } catch (err) {
    log(`pairing: ${err.message}`);
    if (err.code === "AUTH_REQUEST_DENIED") saveGlobals({ pairDeclined: true });
    if (context) send({ event: "showAlert", context });
  }
}

function launchCider(context) {
  if (Date.now() - lastLaunch < 15000) return;
  lastLaunch = Date.now();
  const cmd = (globals.launchCommand || "cider").trim();
  try {
    const child = spawn(cmd, { shell: true, detached: true, stdio: "ignore" });
    child.on("error", () => send({ event: "showAlert", context }));
    child.unref();
    send({ event: "showOk", context });
  } catch {
    send({ event: "showAlert", context });
  }
}

// ---------- property inspector ----------
function statusPayload() {
  const s = cider.state;
  return { status: { online: s.online, auth: s.auth, message: s.authMessage, hasToken: !!globals.token, launchCommand: globals.launchCommand || "cider" } };
}
let lastStatus = "";
function publishStatus(force = false) {
  const payload = statusPayload();
  const json = JSON.stringify(payload);
  if (!force && json === lastStatus) return;
  lastStatus = json;
  for (const context of inspectors) send({ event: "sendToPropertyInspector", context, payload });
}

function fromInspector(context, p) {
  if (p.request === "status") { lastStatus = ""; publishStatus(); }
  else if (p.request === "pair") pair(context);
  else if (p.request === "forget") {
    saveGlobals({ token: "", pairDeclined: true });
    cider.setToken("");
    cider.state.auth = "needed";
    cider.changed();
  } else if (typeof p.launchCommand === "string") saveGlobals({ launchCommand: p.launchCommand });
}

// ---------- input ----------
const num = (v, fallback) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : fallback; };

function run(context, promise) {
  Promise.resolve(promise).catch((err) => {
    if (err instanceof AuthError) return; // keys already show "connect"
    log(err.message);
    send({ event: "showAlert", context });
  });
}

// Returns true when the press was used to start Cider or to pair.
function gate(context) {
  const s = cider.state;
  if (!s.online) { launchCider(context); return true; }
  if (s.auth === "pending") return true;
  if (s.auth === "needed" || s.auth === "denied") { pair(context); return true; }
  return false;
}

function keyDown(context) {
  const c = contexts.get(context);
  if (!c || gate(context)) return;
  const st = c.settings;
  switch (c.action) {
    case "playpause": run(context, cider.togglePlay()); break;
    case "next":
    case "previous": startHold(context, c); break;
    case "nowplaying": {
      const press = st.press ?? "toggle";
      if (press === "toggle") run(context, cider.togglePlay());
      else if (press === "next") run(context, cider.next());
      break;
    }
    case "shuffle": run(context, cider.toggleShuffle()); break;
    case "repeat": run(context, cider.cycleRepeat()); break;
    case "love": if (cider.state.track) run(context, cider.toggleFavorite()); else send({ event: "showAlert", context }); break;
    case "library": if (cider.state.track) run(context, cider.toggleLibrary()); else send({ event: "showAlert", context }); break;
    case "volumeup": run(context, cider.changeVolume(num(st.step, 5) / 100)); break;
    case "volumedown": run(context, cider.changeVolume(-num(st.step, 5) / 100)); break;
    case "mute": run(context, cider.toggleMute()); break;
  }
}

// next/previous: a tap skips, a hold scrubs through the track.
function startHold(context, c) {
  stopHold(c);
  const dir = c.action === "next" ? 1 : -1;
  c.hold = { seeking: false, timer: null };
  c.hold.timer = setTimeout(() => {
    if (!c.hold) return;
    c.hold.seeking = true;
    const step = () => run(context, cider.seekBy(dir * HOLD_SEEK_STEP));
    step();
    c.hold.timer = setInterval(step, HOLD_SEEK_EVERY);
  }, HOLD_MS);
}
function stopHold(c) {
  if (!c.hold) return null;
  clearTimeout(c.hold.timer);
  clearInterval(c.hold.timer);
  const h = c.hold;
  c.hold = null;
  return h;
}
function keyUp(context) {
  const c = contexts.get(context);
  if (!c) return;
  const h = stopHold(c);
  if (!h || h.seeking) return;
  run(context, c.action === "next" ? cider.next() : cider.previous());
}

function dialRotate(context, ticks) {
  const c = contexts.get(context);
  if (!c || !ticks || !cider.state.online || cider.state.auth !== "ok") return;
  if (c.action === "dialvolume") run(context, cider.changeVolume(ticks * num(c.settings.step, 2) / 100));
  else if (c.action === "dialtrack") {
    if ((c.settings.rotate ?? "seek") === "skip") {
      // One track per detent is too twitchy on fast spins; one per event.
      run(context, ticks > 0 ? cider.next() : cider.previous());
    } else run(context, cider.seekBy(ticks * num(c.settings.seekStep, 5)));
  }
}

function dialPress(context, long = false) {
  const c = contexts.get(context);
  if (!c || gate(context)) return;
  if (c.action === "dialvolume") run(context, cider.toggleMute());
  else if (c.action === "dialtrack") run(context, long ? cider.next() : cider.togglePlay());
}

// ---------- artwork ----------
let art = { url: "", data: null };
function wantArtwork() {
  const url = cider.state.track?.artworkUrl ?? "";
  if (url === art.url) return;
  art = { url, data: null };
  if (!url) return;
  const needs = [...contexts.values()].some((c) => c.action === "nowplaying" || c.action === "dialtrack");
  if (!needs) { art.url = ""; return; }
  Promise.all([fetchArtwork(url, 288), fetchArtwork(url, 96)]).then(([big, small]) => {
    if (art.url !== url) return;
    art.data = big; art.small = small;
    scheduleRender();
  }).catch((err) => log(`artwork: ${err.message}`));
}

// ---------- rendering ----------
cider.on("change", () => { wantArtwork(); publishStatus(); scheduleRender(); });

let renderQueued = false;
function scheduleRender() {
  if (renderQueued) return;
  renderQueued = true;
  setImmediate(() => { renderQueued = false; renderAll(); });
}

function renderAll() {
  for (const [context, c] of contexts) {
    if (c.controller === "Encoder") renderDial(context, c);
    else renderKey(context, c);
  }
}

// What a key shows when it cannot act: Cider off, or not paired yet.
function statusLines() {
  const s = cider.state;
  if (!s.online) return { icon: "power", lines: ["Cider", "not running"] };
  if (s.auth === "pending") return { icon: "key", lines: ["Approve", "in Cider"], active: true };
  if (s.auth === "needed" || s.auth === "denied") return { icon: "key", lines: ["Press to", "connect"] };
  return null;
}

function keyImage(c) {
  const s = cider.state;
  const status = statusLines();
  if (status) return keyFace({ icon: status.icon, active: status.active, lines: status.lines, dim: !status.active && !s.online });
  const st = c.settings;
  const vol = typeof s.volume === "number" ? `${Math.round(s.volume * 100)}%` : "";
  switch (c.action) {
    case "playpause": return keyFace({ icon: s.playing ? "pause" : "play", active: s.playing });
    case "next": return keyFace({ icon: "next" });
    case "previous": return keyFace({ icon: "previous" });
    case "shuffle": return keyFace({ icon: "shuffle", active: s.shuffle, lines: [s.shuffle ? "On" : "Off"] });
    case "repeat": return keyFace({
      icon: s.repeat === "one" ? "repeatOne" : "repeat", active: s.repeat !== "none",
      lines: [{ none: "Off", all: "All", one: "One" }[s.repeat]],
    });
    case "love": return keyFace({ icon: s.inFavorites ? "heart" : "heartOutline", active: s.inFavorites, dim: !s.track });
    case "library": return keyFace({ icon: s.inLibrary ? "libraryAdded" : "libraryAdd", active: s.inLibrary, dim: !s.track });
    case "volumeup": return keyFace({ icon: "volumeUp", lines: [vol] });
    case "volumedown": return keyFace({ icon: "volumeDown", lines: [vol] });
    case "mute": return keyFace({ icon: s.volume === 0 ? "volumeOff" : "volumeUp", active: s.volume === 0, lines: [s.volume === 0 ? "Muted" : vol] });
    case "nowplaying": {
      const t = s.track;
      const progress = t && s.time.duration ? Math.round((s.time.current / s.time.duration) * 48) / 48 : 0;
      return nowPlayingFace({
        art: t ? art.data : null, title: t?.name ?? "", artist: t?.artist ?? "",
        progress, playing: s.playing, showText: st.showText !== false,
      });
    }
  }
  return keyFace({ icon: "note" });
}

function renderKey(context, c) {
  const image = keyImage(c);
  if (image === c.last) return;
  c.last = image;
  send({ event: "setImage", context, payload: { image, target: 0 } });
}

function dialFeedback(c) {
  const s = cider.state;
  const status = statusLines();
  if (c.action === "dialvolume") {
    if (status) return {
      icon: stripIcon(status.icon, status.active ? ACCENT : "#8e8e93"),
      label: status.lines.join(" "), value: "",
      indicator: { value: 0, bar_fill_c: "#48484a" },
    };
    const muted = s.volume === 0;
    const pct = typeof s.volume === "number" ? Math.round(s.volume * 100) : 0;
    return {
      icon: stripIcon(muted ? "volumeOff" : "volumeUp", muted ? ACCENT : "#f2f2f7"),
      label: "Volume",
      value: muted ? "Muted" : `${pct}%`,
      indicator: { value: pct, bar_fill_c: muted ? "#48484a" : ACCENT },
    };
  }
  // dialtrack
  if (status) return {
    art: stripIcon(status.icon, status.active ? ACCENT : "#8e8e93"),
    track: status.lines[0], artist: status.lines[1], state: stripIcon("note", "#48484a"), time: "",
    progress: { value: 0 },
  };
  const t = s.track;
  if (!t) return {
    art: stripIcon("note", "#8e8e93"), track: "Nothing playing", artist: "", state: stripIcon("play", "#48484a"), time: "",
    progress: { value: 0 },
  };
  const pct = s.time.duration ? Math.round((s.time.current / s.time.duration) * 1000) / 10 : 0;
  return {
    art: art.small ?? stripIcon("note", "#8e8e93"),
    track: t.name, artist: t.artist,
    state: stripIcon(s.playing ? "play" : "pause", s.playing ? ACCENT : "#f2f2f7"),
    time: `${formatTime(s.time.current)} / ${formatTime(s.time.duration)}`,
    progress: { value: pct },
  };
}

function renderDial(context, c) {
  const fb = dialFeedback(c);
  const changed = {};
  for (const [k, v] of Object.entries(fb)) {
    const json = JSON.stringify(v);
    if (c.lastFeedback[k] !== json) { changed[k] = v; c.lastFeedback[k] = json; }
  }
  if (Object.keys(changed).length) send({ event: "setFeedback", context, payload: changed });
}

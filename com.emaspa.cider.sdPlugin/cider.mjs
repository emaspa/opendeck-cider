// Client for Cider's local RPC server (Cider 4, port 10767).
//
// Live state arrives on the Socket.IO channel "API:Playback", which Cider
// broadcasts to every client without a token. Controls and the initial
// snapshot go through the v2 REST API, which needs an app token unless the
// user turned "Require API tokens" off. A token is obtained by pairing:
// POST /api/v2/auth/request shows an approval dialog inside Cider and answers
// with the token once the user accepts.

import { EventEmitter } from "node:events";

export const SCOPES = ["playback", "library", "audio"];
const REPEAT_MODES = ["none", "one", "all"];
// Shown next to the request in Cider's approval dialog (512 chars max).
const APP_IMAGE = "data:image/svg+xml," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="5" fill="#fa2d48"/>' +
  '<path d="M12 5v8.55A3 3 0 1 0 14 16.4V8h3V5z" fill="#fff"/></svg>');

export class AuthError extends Error {}

export function emptyState() {
  return {
    online: false,     // Socket.IO connected, so Cider is running
    auth: "unknown",   // unknown | ok | needed | pending | denied
    authMessage: "",
    playing: false,
    track: null,       // { id, name, artist, album, artworkUrl, durationMs }
    inFavorites: false,
    inLibrary: false,
    time: { current: 0, duration: 0 },
    volume: null,      // 0..1
    repeat: "none",    // none | one | all
    shuffle: false,
  };
}

// Normalises Cider's track attributes (snapshot nowPlaying or the payload of
// nowPlayingItemDidChange) into the fields the keys draw.
export function trackFrom(attrs) {
  if (!attrs || typeof attrs !== "object" || !attrs.name) return null;
  return {
    id: attrs.playParams?.id ?? attrs.id ?? `${attrs.name}\u0000${attrs.artistName ?? ""}`,
    name: String(attrs.name),
    artist: String(attrs.artistName ?? ""),
    album: String(attrs.albumName ?? ""),
    artworkUrl: typeof attrs.artwork?.url === "string" ? attrs.artwork.url : "",
    durationMs: Number(attrs.durationInMillis) || 0,
  };
}

// Applies one {type, data} message from the API:Playback channel to a state
// object. Returns true when anything changed.
export function applyEvent(state, type, data) {
  const before = JSON.stringify(state);
  switch (type) {
    case "playbackStatus.nowPlayingItemDidChange": {
      state.track = trackFrom(data);
      if (data && typeof data === "object") {
        if (typeof data.inFavorites === "boolean") state.inFavorites = data.inFavorites;
        if (typeof data.inLibrary === "boolean") state.inLibrary = data.inLibrary;
        if (typeof data.shuffleMode === "number") state.shuffle = data.shuffleMode === 1;
        if (typeof data.repeatMode === "number") state.repeat = REPEAT_MODES[data.repeatMode] ?? "none";
        if (state.track) state.time = { current: 0, duration: state.track.durationMs / 1000 };
      }
      break;
    }
    case "playbackStatus.nowPlayingStatusDidChange":
      if (typeof data?.inFavorites === "boolean") state.inFavorites = data.inFavorites;
      if (typeof data?.inLibrary === "boolean") state.inLibrary = data.inLibrary;
      break;
    case "playbackStatus.playbackStateDidChange": {
      state.playing = data?.state === "playing";
      const t = trackFrom(data?.attributes);
      if (t && t.id !== state.track?.id) state.track = t;
      break;
    }
    case "playbackStatus.playbackTimeDidChange":
      if (typeof data?.currentPlaybackTime === "number")
        state.time = { current: data.currentPlaybackTime, duration: Number(data.currentPlaybackDuration) || state.time.duration };
      if (typeof data?.isPlaying === "boolean") state.playing = data.isPlaying;
      break;
    case "playerStatus.volumeDidChange":
      if (typeof data === "number") state.volume = data;
      break;
    case "playerStatus.repeatModeDidChange":
      if (typeof data === "number") state.repeat = REPEAT_MODES[data] ?? "none";
      break;
    case "playerStatus.shuffleModeDidChange":
      if (typeof data === "number") state.shuffle = data === 1;
      break;
    default:
      return false;
  }
  return JSON.stringify(state) !== before;
}

// Applies GET /api/v2/playback.
export function applySnapshot(state, snap) {
  state.playing = snap.state === "playing";
  state.track = trackFrom(snap.nowPlaying);
  state.inFavorites = !!snap.nowPlaying?.inFavorites;
  state.inLibrary = !!snap.nowPlaying?.inLibrary;
  state.time = { current: Number(snap.time?.currentTime) || 0, duration: Number(snap.time?.duration) || 0 };
  if (typeof snap.volume === "number") state.volume = snap.volume;
  state.repeat = REPEAT_MODES.includes(snap.repeatMode) ? snap.repeatMode : "none";
  state.shuffle = !!snap.shuffleMode;
}

export class CiderClient extends EventEmitter {
  constructor({ host = "127.0.0.1", port = 10767, token = "", log = () => {} } = {}) {
    super();
    this.host = host;
    this.port = port;
    this.token = token;
    this.log = log;
    this.state = emptyState();
    this.ws = null;
    this.reconnectDelay = 1000;
    this.reconnectTimer = null;
    this.watchdog = null;
    this.refreshTimer = null;
    this.lastVolume = 0.5; // restored by unmute
    this.stopped = false;
  }

  changed() { this.emit("change", this.state); }

  setToken(token) {
    if (token === this.token) return;
    this.token = token || "";
    if (this.state.online) this.refresh();
  }

  // ---------- Socket.IO (Engine.IO v4 over a raw WebSocket) ----------
  start() {
    this.stopped = false;
    this.connect();
  }

  stop() {
    this.stopped = true;
    clearTimeout(this.reconnectTimer);
    clearTimeout(this.watchdog);
    clearTimeout(this.refreshTimer);
    this.ws?.close();
  }

  connect() {
    const ws = new WebSocket(`ws://${this.host}:${this.port}/socket.io/?EIO=4&transport=websocket`);
    this.ws = ws;
    let pingWindow = 45000;
    const arm = () => {
      clearTimeout(this.watchdog);
      this.watchdog = setTimeout(() => ws.close(), pingWindow);
    };
    ws.onmessage = (e) => {
      if (this.ws !== ws) return;
      const msg = String(e.data);
      const kind = msg[0];
      if (kind === "0") {              // engine open: {sid, pingInterval, pingTimeout}
        try {
          const o = JSON.parse(msg.slice(1));
          pingWindow = (o.pingInterval ?? 25000) + (o.pingTimeout ?? 20000) + 1000;
        } catch {}
        arm();
        ws.send("40");                 // join the default namespace
      } else if (kind === "2") {       // ping
        ws.send("3");
        arm();
      } else if (msg.startsWith("40")) {
        this.reconnectDelay = 1000;
        this.state.online = true;
        this.changed();
        this.refresh();
      } else if (msg.startsWith("42")) {
        let packet;
        try { packet = JSON.parse(msg.slice(2)); } catch { return; }
        const [channel, payload] = packet;
        if (channel !== "API:Playback" || !payload) return;
        const hadTrack = this.state.track?.id;
        if (applyEvent(this.state, payload.type, payload.data)) {
          if (typeof this.state.volume === "number" && this.state.volume > 0) this.lastVolume = this.state.volume;
          this.changed();
        }
        // A new track's favourite flag is sometimes missing from the event.
        if (payload.type === "playbackStatus.nowPlayingItemDidChange" && this.state.track?.id !== hadTrack)
          this.refreshStatusSoon();
      }
    };
    ws.onclose = () => {
      if (this.ws !== ws) return;
      clearTimeout(this.watchdog);
      const wasOnline = this.state.online;
      this.state = { ...emptyState(), auth: this.state.auth, authMessage: this.state.authMessage };
      if (wasOnline) this.changed();
      if (this.stopped) return;
      this.reconnectTimer = setTimeout(() => this.connect(), this.reconnectDelay);
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 10000);
    };
    ws.onerror = () => {}; // onclose follows
  }

  // ---------- REST ----------
  async request(method, path, body, timeoutMs = 5000) {
    // Fastify rejects a JSON content type with an empty body, so GET and
    // DELETE go without one.
    const hasBody = method !== "GET" && method !== "DELETE";
    const headers = hasBody ? { "content-type": "application/json" } : {};
    if (this.token) headers.apptoken = this.token;
    let res;
    try {
      res = await fetch(`http://${this.host}:${this.port}/api/v2${path}`, {
        method, headers,
        body: hasBody ? JSON.stringify(body ?? {}) : undefined,
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err) {
      throw new Error(`Cider unreachable: ${err.message}`);
    }
    let json = null;
    try { json = await res.json(); } catch {}
    const code = typeof json?.error === "string" ? json.error : json?.error?.code;
    if (res.status === 403 && (code === "UNAUTHORIZED_APP_TOKEN" || code === "INSUFFICIENT_SCOPE")) {
      if (this.state.auth !== "pending" && this.state.auth !== "needed") {
        this.state.auth = "needed";
        this.state.authMessage = code === "INSUFFICIENT_SCOPE" ? "Token lacks a scope" : "";
        this.changed();
        this.emit("authNeeded", { hadToken: !!this.token });
      }
      throw new AuthError(code);
    }
    if (!res.ok) throw new Error(`${method} ${path}: ${res.status} ${code ?? ""}`.trim());
    if (this.state.auth !== "ok") {
      this.state.auth = "ok";
      this.state.authMessage = "";
      this.changed();
    }
    return json?.data;
  }

  async refresh() {
    clearTimeout(this.refreshTimer);
    if (!this.state.online) return;
    try {
      const snap = await this.request("GET", "/playback");
      if (snap) applySnapshot(this.state, snap);
      if (typeof this.state.volume === "number" && this.state.volume > 0) this.lastVolume = this.state.volume;
      this.changed();
    } catch (err) {
      if (err instanceof AuthError) return;
      // Cider's server comes up before its frontend can answer; try again.
      this.log(`snapshot failed: ${err.message}`);
      this.refreshTimer = setTimeout(() => this.refresh(), 3000);
    }
  }

  refreshStatusSoon(delayMs = 600) {
    clearTimeout(this.statusTimer);
    this.statusTimer = setTimeout(async () => {
      if (this.state.auth !== "ok" || !this.state.track) return;
      try {
        const s = await this.request("GET", "/library/now-playing/status");
        const fav = s?.rating === 1;
        const lib = !!s?.inLibrary;
        if (fav !== this.state.inFavorites || lib !== this.state.inLibrary) {
          this.state.inFavorites = fav;
          this.state.inLibrary = lib;
          this.changed();
        }
      } catch {}
    }, delayMs);
  }

  // ---------- pairing ----------
  // Resolves with the new token, or throws with a short reason. The dialog in
  // Cider times out after two minutes; three denials ban the source for 15.
  async pair(appName = "OpenDeck") {
    if (this.state.auth === "pending") throw new Error("Already waiting for approval");
    this.state.auth = "pending";
    this.state.authMessage = "";
    this.changed();
    let res, json = null;
    try {
      res = await fetch(`http://${this.host}:${this.port}/api/v2/auth/request`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ app_name: appName, app_image: APP_IMAGE, scopes: SCOPES }),
        signal: AbortSignal.timeout(130000),
      });
      try { json = await res.json(); } catch {}
    } catch (err) {
      this.state.auth = "needed";
      this.state.authMessage = "Cider unreachable";
      this.changed();
      throw new Error(this.state.authMessage);
    }
    const token = json?.data?.token;
    if (res.ok && token) {
      this.token = token;
      this.state.auth = "ok";
      this.changed();
      this.emit("token", token);
      this.refresh();
      return token;
    }
    const code = json?.error?.code ?? `HTTP_${res.status}`;
    const reasons = {
      AUTH_REQUEST_DENIED: ["denied", "Denied in Cider"],
      AUTH_REQUEST_TIMEOUT: ["needed", "No answer in Cider"],
      AUTH_REQUEST_BUSY: ["needed", "Another request is open in Cider"],
      AUTH_REQUEST_COOLDOWN: ["needed", "Wait a few seconds"],
      AUTH_REQUEST_BANNED: ["denied", "Too many denials, retry in 15 min"],
    };
    const [auth, message] = reasons[code] ?? ["needed", json?.error?.message ?? code];
    this.state.auth = auth;
    this.state.authMessage = message;
    this.changed();
    const err = new Error(message);
    err.code = code;
    throw err;
  }

  // ---------- controls ----------
  togglePlay() {
    this.state.playing = !this.state.playing; // optimistic, corrected by the next event
    this.changed();
    return this.request("POST", "/playback/toggle");
  }
  next() { return this.request("POST", "/playback/next"); }
  previous() { return this.request("POST", "/playback/previous", {}); }

  seekTo(seconds) {
    const duration = this.state.time.duration || Infinity;
    const position = Math.max(0, Math.min(seconds, duration - 1));
    this.state.time = { ...this.state.time, current: position };
    this.changed();
    return this.request("POST", "/playback/seek", { position });
  }
  seekBy(delta) { return this.seekTo(this.state.time.current + delta); }

  setVolume(volume) {
    const v = Math.round(Math.max(0, Math.min(1, volume)) * 100) / 100;
    if (v > 0) this.lastVolume = v;
    this.state.volume = v;
    this.changed();
    return this.request("PATCH", "/audio/volume", { volume: v });
  }
  changeVolume(delta) { return this.setVolume((this.state.volume ?? this.lastVolume) + delta); }
  toggleMute() {
    return this.setVolume(this.state.volume > 0 ? 0 : (this.lastVolume || 0.5));
  }

  toggleShuffle() {
    this.state.shuffle = !this.state.shuffle;
    this.changed();
    return this.request("POST", "/playback/shuffle/toggle");
  }
  // none -> all -> one -> none
  cycleRepeat() {
    const next = { none: "all", all: "one", one: "none" }[this.state.repeat] ?? "none";
    this.state.repeat = next;
    this.changed();
    return this.request("PUT", "/playback/repeat", { mode: next });
  }

  async toggleFavorite() {
    const loved = this.state.inFavorites;
    this.state.inFavorites = !loved;
    this.changed();
    try {
      if (loved) await this.request("DELETE", "/library/now-playing/rating");
      else await this.request("POST", "/library/now-playing/love");
    } finally {
      this.refreshStatusSoon();
    }
  }

  async toggleLibrary() {
    const added = this.state.inLibrary;
    this.state.inLibrary = !added;
    this.changed();
    try {
      if (added) await this.request("DELETE", "/library/now-playing");
      else await this.request("POST", "/library/now-playing/add");
    } finally {
      this.refreshStatusSoon(1200);
    }
  }
}

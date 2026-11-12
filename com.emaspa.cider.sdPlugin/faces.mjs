// What each key and dial strip shows for a playback state. `s` is the Cider
// state (cider.mjs), `art` the fetched artwork ({ data, small }), and `vfd`
// the OpenXLR skin's colours when that skin draws a display, else null.

import { keyFace, nowPlayingFace, stripIcon, formatTime, ACCENT, vfdStrip, vfdTitle, vfdDial } from "./render.mjs";

// What a key shows when it cannot act: Cider off, or not paired yet.
function statusLines(s) {
  if (!s.online) return { icon: "power", lines: ["Cider", "not running"] };
  if (s.auth === "pending") return { icon: "key", lines: ["Approve", "in Cider"], active: true };
  if (s.auth === "needed" || s.auth === "denied") return { icon: "key", lines: ["Press to", "connect"] };
  return null;
}

export function keyImage(c, s, art = {}, vfd = null) {
  const status = statusLines(s);
  if (status) return keyFace({ icon: status.icon, active: status.active, lines: status.lines, dim: !status.active && !s.online, vfd });
  const st = c.settings;
  const vol = typeof s.volume === "number" ? `${Math.round(s.volume * 100)}%` : "";
  switch (c.action) {
    case "playpause": return keyFace({ icon: s.playing ? "pause" : "play", active: s.playing, vfd, lamp: true });
    case "next": return keyFace({ icon: "next", vfd });
    case "previous": return keyFace({ icon: "previous", vfd });
    case "shuffle": return keyFace({ icon: "shuffle", active: s.shuffle, lines: [s.shuffle ? "On" : "Off"], vfd, lamp: true });
    case "repeat": return keyFace({
      icon: s.repeat === "one" ? "repeatOne" : "repeat", active: s.repeat !== "none",
      lines: [{ none: "Off", all: "All", one: "One" }[s.repeat]], vfd, lamp: true,
    });
    case "love": return keyFace({ icon: s.inFavorites ? "heart" : "heartOutline", active: s.inFavorites, dim: !s.track, vfd, lamp: true });
    case "library": return keyFace({ icon: s.inLibrary ? "libraryAdded" : "libraryAdd", active: s.inLibrary, dim: !s.track, vfd, lamp: true });
    case "volumeup": return keyFace({ icon: "volumeUp", lines: [vol], vfd });
    case "volumedown": return keyFace({ icon: "volumeDown", lines: [vol], vfd });
    case "mute": return keyFace({ icon: s.volume === 0 ? "volumeOff" : "volumeUp", active: s.volume === 0, lines: [s.volume === 0 ? "Muted" : vol], vfd, lamp: true, alert: true });
    case "nowplaying": {
      const t = s.track;
      const progress = t && s.time.duration ? Math.round((s.time.current / s.time.duration) * 48) / 48 : 0;
      return nowPlayingFace({
        art: t ? art.data : null, title: t?.name ?? "", artist: t?.artist ?? "",
        progress, playing: s.playing, showText: st.showText !== false, vfd,
      });
    }
  }
  return keyFace({ icon: "note", vfd });
}

// The dial strip in its own layout (layouts/volume.json, layouts/track.json).
export function dialFeedback(c, s, art = {}) {
  const status = statusLines(s);
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

// A display skin draws a dial's strip as a display, in layouts/dial-display.json:
// the glass of the keys, a segment title, and a ladder of cells across the
// strip lit up to the volume or the position, with the reading in segment
// lettering. The glass is part of every update, so a move between two display
// skins repaints it; unchanged items are not resent.
export function displayFeedback(c, s, vfd) {
  const status = statusLines(s);
  const lit = vfd["Ox.Text.Primary"], unlit = vfd["Ox.Text.Muted"];
  const backgroundDial = vfdStrip(vfd);
  if (status) return {
    backgroundDial,
    icon: stripIcon(status.icon, status.active ? vfd["Ox.Led.On"] : unlit),
    title: vfdTitle(vfd, c.action === "dialvolume" ? status.lines.join(" ") : status.lines[0], !status.active),
    dial: vfdDial(vfd, 0, "", false, c.action === "dialvolume" ? "" : status.lines[1]),
  };
  if (c.action === "dialvolume") {
    const muted = s.volume === 0;
    const pct = typeof s.volume === "number" ? Math.round(s.volume * 100) : 0;
    return {
      backgroundDial,
      icon: stripIcon(muted ? "volumeOff" : "volumeUp", muted ? vfd["Ox.Led.Alert"] : lit),
      title: vfdTitle(vfd, "Volume"),
      dial: vfdDial(vfd, pct / 100, muted ? "Muted" : `${pct}%`, !muted),
    };
  }
  const t = s.track;
  if (!t) return {
    backgroundDial,
    icon: stripIcon("note", unlit),
    title: vfdTitle(vfd, "Nothing playing", true),
    dial: vfdDial(vfd, 0, "", false),
  };
  // Lit while playing, dim while paused; the artist stands at the left of the time.
  return {
    backgroundDial,
    icon: stripIcon(s.playing ? "play" : "pause", s.playing ? lit : unlit),
    title: vfdTitle(vfd, t.name),
    dial: vfdDial(vfd, s.time.duration ? s.time.current / s.time.duration : 0, formatTime(s.time.current), s.playing, t.artist),
  };
}

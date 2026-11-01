# Cider for OpenDeck

An [OpenDeck](https://github.com/nekename/OpenDeck) plugin for [Cider](https://cider.sh), the Apple Music client. Keys and dials show live state: what's playing, play/pause, shuffle, repeat, love, library and volume.

## Actions

| Action | Key face | Press |
|---|---|---|
| Play / Pause | play or pause glyph, red while playing | toggle playback |
| Next Track | next glyph | skip; hold to fast-forward |
| Previous Track | previous glyph | previous; hold to rewind |
| Now Playing | album art, title, artist, progress line, pause badge | play/pause, next, or nothing (set in the inspector) |
| Shuffle | lit when on | toggle |
| Repeat | off / all / one | cycle off, all, one |
| Love | filled heart when loved | love, or clear the rating |
| Add to Library | check when in library | add, or remove |
| Volume Up / Down | current volume | step up or down (5% by default) |
| Mute | muted state | set volume to 0, or restore it |
| Volume Dial | volume bar on the strip | turn to adjust, push or tap to mute |
| Track Dial | artwork, title, artist, time, progress | turn to seek (or skip tracks), push or tap for play/pause, long tap for next |

While Cider is closed, every key shows "Cider not running", and a press starts Cider. The command it runs is `cider` by default. You can change it in the inspector, for example to `flatpak run sh.cider.genten`.

## Requirements

- Cider 4 with its RPC server on `127.0.0.1:10767` (the default).
- OpenDeck 2.x on Linux, with Node.js 22 or newer on the `PATH`. The plugin has no npm dependencies; it uses Node's built-in `fetch` and `WebSocket`.

## Install

```sh
./install.sh
```

The script copies `com.emaspa.cider.sdPlugin` into OpenDeck's plugin folder (native or Flatpak) and restarts OpenDeck when it runs as a systemd user unit. If OpenDeck runs some other way, restart it yourself.

## Connecting to Cider

Cider's API needs an app token. When you first put a Cider action on a deck, the plugin asks Cider for one, and Cider shows a dialog asking you to let OpenDeck control playback. Approve it and the keys start working. The plugin keeps the token in its global settings, so you only approve once.

If you deny the request or miss the dialog, the keys show "Press to connect". Press one, or use **Connect to Cider** in any Cider action's inspector, to ask again. After three denials Cider ignores requests for 15 minutes.

The token asks for the `playback`, `library` and `audio` scopes. You can revoke it from Cider's settings under Connectivity; the plugin notices and asks again. **Forget token** in the inspector drops it on the plugin side.

If you switched off "Require API tokens" in Cider, no pairing is needed.

## How it works

- Live state comes from Cider's Socket.IO channel `API:Playback`: track changes, play state, time, volume, repeat, shuffle, love and library flags. Cider broadcasts it to every local client without a token.
- Controls and the initial snapshot use the v2 REST API (`/api/v2/playback`, `/api/v2/audio/volume`, `/api/v2/library/now-playing/...`) with the `apptoken` header.
- Key faces are SVG. The plugin fetches album art from Apple's CDN and embeds it as a data URI.

## Development

```sh
npm test            # unit tests (node --test)
npm run build       # regenerate icons/ and manifest.json
./install.sh        # copy into OpenDeck and restart it
```

`tools/make-manifest.mjs` generates `manifest.json`, and the version comes from `package.json`. Plugin logs are in `~/.local/share/opendeck/logs/plugins/com.emaspa.cider.sdPlugin.log`.

Glyphs are Material Icons paths (Apache 2.0).

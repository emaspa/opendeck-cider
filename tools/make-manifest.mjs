// Writes manifest.json. Run: node tools/make-manifest.mjs
import { writeFileSync, readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url)));
const PREFIX = "com.emaspa.cider.";
const key = (id, name, tooltip, extra = {}) => ({
  Name: name, UUID: PREFIX + id, Icon: `icons/${id}`, Tooltip: tooltip,
  Controllers: ["Keypad"], SupportedInMultiActions: true,
  PropertyInspectorPath: "propertyInspector/settings.html",
  States: [{ Image: `icons/${id}` }], ...extra,
});
const dial = (id, name, tooltip, layout, triggers) => ({
  Name: name, UUID: PREFIX + id, Icon: `icons/${id}`, Tooltip: tooltip,
  Controllers: ["Encoder"], SupportedInMultiActions: false,
  PropertyInspectorPath: "propertyInspector/settings.html",
  States: [{ Image: `icons/${id}` }],
  Encoder: { layout: `layouts/${layout}.json`, TriggerDescription: triggers },
});

const manifest = {
  Name: "Cider",
  Description: "Control Cider, the Apple Music client: playback, now playing artwork, shuffle, repeat, love, library and volume, with live state on keys and dials.",
  Author: "Emanuele Sparvoli",
  Version: pkg.version,
  SDKVersion: 2,
  CodePath: "plugin.mjs",
  Icon: "icons/plugin",
  Category: "Cider",
  CategoryIcon: "icons/category",
  URL: "https://cider.sh",
  OS: [{ Platform: "linux" }],
  Actions: [
    key("playpause", "Play / Pause", "Toggle playback"),
    key("next", "Next Track", "Skip to the next track; hold to fast-forward"),
    key("previous", "Previous Track", "Go to the previous track; hold to rewind"),
    key("nowplaying", "Now Playing", "Album artwork with title, artist and progress", { UserTitleEnabled: false }),
    key("shuffle", "Shuffle", "Toggle shuffle"),
    key("repeat", "Repeat", "Cycle repeat: off, all, one"),
    key("love", "Love", "Love the current track, or remove the love"),
    key("library", "Add to Library", "Add the current track to your library, or remove it"),
    key("volumeup", "Volume Up", "Raise Cider's volume"),
    key("volumedown", "Volume Down", "Lower Cider's volume"),
    key("mute", "Mute", "Mute Cider, or restore the volume"),
    dial("dialvolume", "Volume Dial", "Cider volume on a dial", "volume",
      { Rotate: "Adjust volume", Push: "Mute / unmute", Touch: "Mute / unmute" }),
    dial("dialtrack", "Track Dial", "Now playing on the touch strip with seek or skip on the dial", "track",
      { Rotate: "Seek (or skip tracks)", Push: "Play / pause", Touch: "Play / pause", LongTouch: "Next track" }),
  ],
};
writeFileSync(new URL("../com.emaspa.cider.sdPlugin/manifest.json", import.meta.url), JSON.stringify(manifest, null, "\t") + "\n");
console.log("manifest written", manifest.Version);

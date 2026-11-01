// Writes the manifest icons (action list, category, plugin) from the glyphs
// the keys draw. Run: node tools/make-icons.mjs
import { writeFileSync } from "node:fs";
import { GLYPHS, ACCENT } from "../com.emaspa.cider.sdPlugin/render.mjs";

const dir = new URL("../com.emaspa.cider.sdPlugin/icons/", import.meta.url);
const plain = (g) => `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24"><path d="${GLYPHS[g]}" fill="#ffffff"/></svg>\n`;
const icons = {
  playpause: "play", next: "next", previous: "previous", nowplaying: "note",
  shuffle: "shuffle", repeat: "repeat", love: "heartOutline", library: "libraryAdd",
  volumeup: "volumeUp", volumedown: "volumeDown", mute: "volumeOff",
  dialvolume: "volumeUp", dialtrack: "note", category: "note",
};
for (const [name, g] of Object.entries(icons)) writeFileSync(new URL(`${name}.svg`, dir), plain(g));
writeFileSync(new URL("plugin.svg", dir),
  `<svg xmlns="http://www.w3.org/2000/svg" width="288" height="288" viewBox="0 0 24 24"><rect width="24" height="24" rx="5" fill="${ACCENT}"/>` +
  `<path transform="translate(3 3) scale(0.75)" d="${GLYPHS.note}" fill="#ffffff"/></svg>\n`);
console.log("icons written");

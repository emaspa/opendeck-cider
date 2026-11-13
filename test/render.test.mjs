import { test } from "node:test";
import assert from "node:assert/strict";
import { fit, formatTime, escapeXml, keyFace, nowPlayingFace, coverFace, trackInfoFace, wrap, artworkUrl } from "../com.emaspa.cider.sdPlugin/render.mjs";

const decode = (uri) => Buffer.from(uri.split(",")[1], "base64").toString();

test("formatTime", () => {
  assert.equal(formatTime(0), "0:00");
  assert.equal(formatTime(65.9), "1:05");
  assert.equal(formatTime(3725), "1:02:05");
  assert.equal(formatTime(undefined), "0:00");
});

test("fit shortens long text with an ellipsis", () => {
  assert.equal(fit("short", 17, 130), "short");
  const cut = fit("A very long song title that will not fit", 17, 130);
  assert.ok(cut.endsWith("…"));
  assert.ok(cut.length <= 13);
});

test("text is escaped in faces", () => {
  assert.equal(escapeXml(`<a & "b">`), "&lt;a &amp; &quot;b&quot;&gt;");
  const svg = decode(nowPlayingFace({ title: "R&B <Live>", artist: "AC/DC" }));
  assert.match(svg, /R&amp;B &lt;Live&gt;/);
});

test("key face draws caption lines and lit glyph", () => {
  const svg = decode(keyFace({ icon: "shuffle", active: true, lines: ["On"] }));
  assert.match(svg, /fill="#fa2d48"/);
  assert.match(svg, />On</);
});

test("paused now playing shows the pause badge", () => {
  assert.match(decode(nowPlayingFace({ title: "x", playing: false })), /<circle/);
  assert.doesNotMatch(decode(nowPlayingFace({ title: "x", playing: true })), /<circle/);
});

test("artwork url placeholders", () => {
  assert.equal(artworkUrl("https://a/{w}x{h}bb.{f}", 288), "https://a/288x288bb.jpg");
});

test("the cover key is the cover alone", () => {
  const svg = decode(coverFace({ art: "data:image/png;base64,AAAA" }));
  assert.match(svg, /<image href="data:image\/png;base64,AAAA" x="0" y="0" width="144" height="144"/);
  assert.doesNotMatch(svg, /<text|<rect|<path/);
  assert.match(decode(coverFace({})), /<path/);
});

test("titles wrap onto two lines, hyphenating a word too long for one", () => {
  assert.deepEqual(wrap("Hey Jude", 18, 130), ["Hey Jude"]);
  assert.deepEqual(wrap("Sunset Boulevard", 18, 130), ["Sunset", "Boulevard"]);
  const long = wrap("An Extraordinarily Long Song Title", 18, 130);
  assert.equal(long.length, 2);
  assert.ok(long[0].endsWith("-"));
  assert.ok(long[1].endsWith("…"));
});

test("the track info key shows the time played, the length and the progress", () => {
  const on = decode(trackInfoFace({ title: "Song", artist: "Band", current: 83, duration: 245, playing: true }));
  assert.match(on, />Song</);
  assert.match(on, />Band</);
  assert.match(on, />1:23</);
  assert.match(on, />4:05</);
  assert.match(on, /width="43" height="6" rx="3" fill="#fa2d48"/);
  const paused = decode(trackInfoFace({ title: "Song", current: 83, duration: 245, playing: false }));
  assert.match(paused, /d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/);
  assert.doesNotMatch(paused, /fill="#fa2d48"/);
});

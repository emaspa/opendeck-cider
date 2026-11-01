import { test } from "node:test";
import assert from "node:assert/strict";
import { fit, formatTime, escapeXml, keyFace, nowPlayingFace, artworkUrl } from "../com.emaspa.cider.sdPlugin/render.mjs";

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

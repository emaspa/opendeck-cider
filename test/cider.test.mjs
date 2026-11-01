import { test } from "node:test";
import assert from "node:assert/strict";
import { applyEvent, applySnapshot, emptyState, trackFrom } from "../com.emaspa.cider.sdPlugin/cider.mjs";

const attrs = {
  name: "Song", artistName: "Artist", albumName: "Album", durationInMillis: 200000,
  artwork: { url: "https://x/{w}x{h}bb.jpg" }, playParams: { id: "42" },
  inFavorites: true, inLibrary: false, shuffleMode: 1, repeatMode: 2,
};

test("track change sets track, flags, modes and resets time", () => {
  const s = emptyState();
  s.time = { current: 99, duration: 100 };
  assert.equal(applyEvent(s, "playbackStatus.nowPlayingItemDidChange", attrs), true);
  assert.deepEqual(s.track, { id: "42", name: "Song", artist: "Artist", album: "Album", artworkUrl: "https://x/{w}x{h}bb.jpg", durationMs: 200000 });
  assert.equal(s.inFavorites, true);
  assert.equal(s.shuffle, true);
  assert.equal(s.repeat, "all");
  assert.deepEqual(s.time, { current: 0, duration: 200 });
});

test("time, state, volume, repeat and shuffle events", () => {
  const s = emptyState();
  applyEvent(s, "playbackStatus.playbackTimeDidChange", { currentPlaybackTime: 12.5, currentPlaybackDuration: 200, isPlaying: true });
  assert.equal(s.playing, true);
  assert.equal(s.time.current, 12.5);
  applyEvent(s, "playbackStatus.playbackStateDidChange", { state: "paused", attributes: attrs });
  assert.equal(s.playing, false);
  assert.equal(s.track.name, "Song");
  applyEvent(s, "playerStatus.volumeDidChange", 0.3);
  applyEvent(s, "playerStatus.repeatModeDidChange", 1);
  applyEvent(s, "playerStatus.shuffleModeDidChange", 0);
  assert.equal(s.volume, 0.3);
  assert.equal(s.repeat, "one");
  assert.equal(s.shuffle, false);
});

test("unknown events and repeats report no change", () => {
  const s = emptyState();
  assert.equal(applyEvent(s, "queueStatus.queueChanged", { position: 1 }), false);
  applyEvent(s, "playerStatus.volumeDidChange", 0.5);
  assert.equal(applyEvent(s, "playerStatus.volumeDidChange", 0.5), false);
});

test("snapshot", () => {
  const s = emptyState();
  applySnapshot(s, {
    state: "playing", nowPlaying: { ...attrs, inFavorites: false, inLibrary: true },
    time: { currentTime: 30, duration: 200, remaining: 170 }, volume: 0.8, repeatMode: "one", shuffleMode: false,
  });
  assert.equal(s.playing, true);
  assert.equal(s.inLibrary, true);
  assert.equal(s.repeat, "one");
  assert.equal(s.volume, 0.8);
  assert.deepEqual(s.time, { current: 30, duration: 200 });
  applySnapshot(s, { state: "stopped", nowPlaying: null, time: {}, volume: 0.8, repeatMode: "none", shuffleMode: false });
  assert.equal(s.track, null);
  assert.equal(s.playing, false);
});

test("trackFrom ignores empty attributes", () => {
  assert.equal(trackFrom(null), null);
  assert.equal(trackFrom({}), null);
});

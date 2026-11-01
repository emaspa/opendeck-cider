"use strict";
// Property inspector shared by every Cider action: action options on top,
// the connection to Cider (pairing) below.

let ws = null, piUuid = null, context = null, settings = {};
const $ = (id) => document.getElementById(id);

function connectElgatoStreamDeckSocket(inPort, inUUID, inRegisterEvent, inInfo, inActionInfo) {
  piUuid = inUUID;
  const info = JSON.parse(inActionInfo);
  context = info.context;
  settings = info.payload?.settings ?? {};
  const action = String(info.action ?? "").split(".").pop();

  let any = false;
  for (const el of document.querySelectorAll(".section")) {
    const show = el.dataset.for.split(" ").includes(action);
    el.hidden = !show;
    if (!show) continue;
    any = true;
    for (const input of el.querySelectorAll("[data-setting]")) {
      const key = input.dataset.setting;
      if (input.type === "checkbox") input.checked = settings[key] !== false;
      else if (settings[key] !== undefined) input.value = settings[key];
      input.addEventListener("change", () => {
        if (input.type === "checkbox") settings[key] = input.checked;
        else if (input.type === "number") {
          if (input.value === "") delete settings[key]; else settings[key] = Number(input.value);
        } else settings[key] = input.value;
        send({ event: "setSettings", context: piUuid, payload: settings });
      });
    }
  }
  $("split").hidden = !any;

  ws = new WebSocket("ws://127.0.0.1:" + inPort);
  ws.onopen = () => {
    send({ event: inRegisterEvent, uuid: piUuid });
    toPlugin({ request: "status" });
  };
  ws.onmessage = (e) => {
    let m;
    try { m = JSON.parse(e.data); } catch { return; }
    if (m.event === "sendToPropertyInspector" && m.payload?.status) showStatus(m.payload.status);
  };
  $("pair").onclick = () => toPlugin({ request: "pair" });
  $("forget").onclick = () => toPlugin({ request: "forget" });
  $("launch").addEventListener("change", () => toPlugin({ launchCommand: $("launch").value.trim() }));
}

function send(msg) { if (ws?.readyState === 1) ws.send(JSON.stringify(msg)); }
function toPlugin(payload) { send({ event: "sendToPlugin", action: "", context, payload }); }

function showStatus(s) {
  const dot = $("dot"), text = $("statusText");
  let cls = "", msg = "", hint = "";
  if (!s.online) { cls = "off"; msg = "Not running"; hint = "Start Cider; the keys connect on their own."; }
  else if (s.auth === "ok") { cls = "ok"; msg = "Connected"; }
  else if (s.auth === "pending") { cls = "warn"; msg = "Waiting for approval in Cider"; hint = "Cider shows a dialog asking to let OpenDeck control playback."; }
  else if (s.auth === "unknown") { cls = "warn"; msg = "Connecting…"; }
  else { cls = "warn"; msg = s.message || "Not connected"; hint = "Press Connect, then approve the request in Cider."; }
  dot.className = cls;
  text.textContent = msg;
  $("hint").textContent = hint;
  $("pair").hidden = !s.online || s.auth === "ok" || s.auth === "pending" || s.auth === "unknown";
  $("forget").hidden = !s.hasToken;
  if (document.activeElement !== $("launch")) $("launch").value = s.launchCommand === "cider" ? "" : s.launchCommand;
}

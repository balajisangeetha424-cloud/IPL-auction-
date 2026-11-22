// IPL Auction Arena – room server. Relays game state, bids, chat and voice signalling.
const http = require("http"), fs = require("fs"), path = require("path");
const { WebSocketServer } = require("ws");
const PORT = process.env.PORT || 3000;
const page = path.join(__dirname, "index.html");
const srv = http.createServer((q, r) => {
  if (q.url === "/healthz") return r.end("ok");
  r.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" });
  r.end(fs.readFileSync(page));
});
const wss = new WebSocketServer({ server: srv });
const rooms = new Map();
const send = (w, m) => { if (w && w.readyState === 1) w.send(JSON.stringify(m)); };
const peerList = r => [...r.players.values()].map(p => ({ id: p.id, name: p.name, online: !!p.ws, voice: p.voice }));
const bc = (r, m, except) => { for (const p of r.players.values()) if (p.id !== except) send(p.ws, m); };
const newCode = () => {
  const c = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; let s;
  do { s = Array.from({ length: 5 }, () => c[Math.floor(Math.random() * c.length)]).join(""); } while (rooms.has(s));
  return s;
};

wss.on("connection", ws => {
  let room = null, me = null;
  ws.alive = true; ws.on("pong", () => (ws.alive = true));
  ws.on("message", raw => {
    let m; try { m = JSON.parse(raw); } catch { return; }
    if (m.t === "ping") return send(ws, { t: "pong", c: m.c, time: Date.now() });
    if (m.t === "join") {
      let r;
      if (m.create) { const c = newCode(); r = { code: c, players: new Map(), host: null, state: null, chat: [], touched: Date.now() }; rooms.set(c, r); }
      else { r = rooms.get(String(m.room || "").toUpperCase()); if (!r) return send(ws, { t: "error", msg: "Room not found. Check the code with your host." }); }
      const id = String(m.id || "").slice(0, 64); if (!id) return;
      let p = r.players.get(id);
      if (p && p.ws && p.ws !== ws) { const old = p.ws; p.ws = null; try { old.close(); } catch {} }
      if (!p) { p = { id, name: "", ws: null, voice: false }; r.players.set(id, p); }
      p.name = String(m.name || "Player").slice(0, 16); p.ws = ws; p.voice = false;
      room = r; me = p; r.touched = Date.now();
      const h = r.players.get(r.host);
      if (!h || !h.ws) r.host = id;
      send(ws, { t: "welcome", code: r.code, time: Date.now(), host: r.host, state: r.state, chat: r.chat, peers: peerList(r) });
      bc(r, { t: "peers", peers: peerList(r) }, id); bc(r, { t: "host", host: r.host }, id);
      return;
    }
    if (!room || !me) return;
    room.touched = Date.now();
    switch (m.t) {
      case "state": if (room.host === me.id) { room.state = m.s; bc(room, { t: "state", s: m.s }, me.id); } break;
      case "bid": case "claim": { const h = room.players.get(room.host); if (h && h.ws && h !== me) send(h.ws, { t: m.t, from: me.id, d: m.d }); break; }
      case "chat": {
        const text = String(m.text || "").trim().slice(0, 300); if (!text) break;
        const msg = { t: "chat", from: me.id, name: me.name, text, ts: Date.now() };
        room.chat.push(msg); room.chat = room.chat.slice(-80); bc(room, msg); break;
      }
      case "vjoin": me.voice = true; bc(room, { t: "peers", peers: peerList(room) }); bc(room, { t: "vjoined", id: me.id }, me.id); break;
      case "vleave": me.voice = false; bc(room, { t: "peers", peers: peerList(room) }); break;
      case "rtc": { const to = room.players.get(m.to); if (to) send(to.ws, { t: "rtc", from: me.id, d: m.d }); break; }
    }
  });
  ws.on("close", () => {
    if (!room || !me || me.ws !== ws) return;
    me.ws = null; me.voice = false; room.touched = Date.now();
    if (room.host === me.id) { const n = [...room.players.values()].find(p => p.ws); if (n) { room.host = n.id; bc(room, { t: "host", host: n.id }); } }
    bc(room, { t: "peers", peers: peerList(room) });
  });
});
setInterval(() => { wss.clients.forEach(w => { if (!w.alive) return w.terminate(); w.alive = false; try { w.ping(); } catch {} }); }, 20000);
setInterval(() => { for (const [c, r] of rooms) if (Date.now() - r.touched > 6 * 3600e3 && ![...r.players.values()].some(p => p.ws)) rooms.delete(c); }, 600000);
srv.listen(PORT, () => console.log("IPL Auction Arena on port " + PORT));

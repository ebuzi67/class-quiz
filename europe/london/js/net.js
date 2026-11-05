// 런던 탐방: 같이 걷기 (발명가 마을 village/js/net.js와 같은 방식)
// 한 기기가 "방 만들기"를 하면 방장이 되고, 다른 기기는 입장 코드(숫자 4개)로 방장에게 연결해요.
// 방장이 모든 사람의 위치(길 위의 거리 s)를 모아서 다시 나눠 줘요.
//   peer  : PeerJS(WebRTC). 가입 없이 기기끼리 바로 연결해요. 기본값.
//   local : 같은 브라우저의 다른 탭끼리(BroadcastChannel). 시험용이에요. 주소 뒤에 ?net=local
"use strict";

const Net = (() => {
  const PREFIX = "london-walk-";
  const TICK = 150;          // 방장이 위치를 모아 보내는 간격(ms)
  const TIMEOUT = 15000;     // 이만큼 소식이 없으면 나간 것으로 봐요
  const MAX = 6;             // 한 방에 들어올 수 있는 사람 수

  // ───────────── 전송: PeerJS ─────────────
  function wrapPeerConn(dc) {
    const conn = { id: dc.peer, send: (o) => { try { if (dc.open) dc.send(o); } catch (e) {} }, close: () => { try { dc.close(); } catch (e) {} }, onmessage: null, onclose: null, onopen: null };
    dc.on("data", (d) => conn.onmessage && conn.onmessage(d));
    dc.on("close", () => conn.onclose && conn.onclose());
    dc.on("error", () => conn.onclose && conn.onclose());
    dc.on("open", () => conn.onopen && conn.onopen());
    return conn;
  }

  const peerTransport = {
    host(code, h) {
      if (typeof Peer === "undefined") { h.onError("nolib"); return { close() {} }; }
      const peer = new Peer(PREFIX + code, { debug: 0 });
      peer.on("open", () => h.onReady());
      peer.on("connection", (dc) => { const c = wrapPeerConn(dc); dc.on("open", () => h.onConn(c)); });
      peer.on("error", (e) => h.onError(e.type || "error"));
      peer.on("disconnected", () => { try { peer.reconnect(); } catch (e) {} });
      return { close: () => peer.destroy() };
    },
    join(code, h) {
      if (typeof Peer === "undefined") { h.onError("nolib"); return { close() {} }; }
      const peer = new Peer({ debug: 0 });
      const timer = setTimeout(() => h.onError("timeout"), 12000);
      peer.on("open", () => {
        const conn = wrapPeerConn(peer.connect(PREFIX + code, { reliable: true, serialization: "json" }));
        conn.onopen = () => { clearTimeout(timer); h.onOpen(conn); };
      });
      peer.on("error", (e) => { clearTimeout(timer); h.onError(e.type || "error"); });
      return { close: () => { clearTimeout(timer); peer.destroy(); } };
    }
  };

  // ───────────── 전송: 같은 브라우저 탭끼리 (시험용) ─────────────
  const localTransport = {
    host(code, h) {
      const bc = new BroadcastChannel(PREFIX + code);
      const conns = new Map();
      bc.onmessage = (ev) => {
        const m = ev.data;
        if (m.to && m.to !== "host") return;
        if (m.t === "open") {
          const c = { id: m.from, send: (o) => bc.postMessage({ t: "d", to: m.from, d: o }), close: () => bc.postMessage({ t: "close", to: m.from }), onmessage: null, onclose: null };
          conns.set(m.from, c);
          bc.postMessage({ t: "opened", to: m.from });
          h.onConn(c);
        } else if (m.t === "d") { const c = conns.get(m.from); if (c && c.onmessage) c.onmessage(m.d); }
        else if (m.t === "close") { const c = conns.get(m.from); conns.delete(m.from); if (c && c.onclose) c.onclose(); }
      };
      setTimeout(() => h.onReady(), 50);
      return { close: () => { conns.forEach((c) => c.close()); bc.close(); } };
    },
    join(code, h) {
      const bc = new BroadcastChannel(PREFIX + code);
      const id = "L" + Math.random().toString(36).slice(2, 9);
      const conn = { id, send: (o) => bc.postMessage({ t: "d", from: id, to: "host", d: o }), close: () => { bc.postMessage({ t: "close", from: id, to: "host" }); bc.close(); }, onmessage: null, onclose: null };
      const timer = setTimeout(() => h.onError("peer-unavailable"), 3000);
      bc.onmessage = (ev) => {
        const m = ev.data;
        if (m.to !== id) return;
        if (m.t === "opened") { clearTimeout(timer); h.onOpen(conn); }
        else if (m.t === "d") conn.onmessage && conn.onmessage(m.d);
        else if (m.t === "close") conn.onclose && conn.onclose();
      };
      bc.postMessage({ t: "open", from: id, to: "host" });
      return { close: () => { clearTimeout(timer); conn.close(); } };
    }
  };

  const params = new URLSearchParams(location.search);
  const transport = params.get("net") === "local" ? localTransport : peerTransport;

  // ───────────── 방 ─────────────
  const ev = {};
  const on = (name, fn) => { ev[name] = fn; };
  const emit = (name, ...a) => { if (ev[name]) ev[name](...a); };

  let role = "solo";
  let myId = "me";
  let handle = null;
  let me = { s: 0, w: 0, n: 0 };           // 내 상태: 길 위의 거리, 걷는 중, 도장 수

  // 방장 쪽
  const players = new Map();               // id → {p: 프로필, s, w, n, last, conn}
  let tickTimer = null;

  function roster() { return [...players.entries()].map(([id, p]) => ({ id, p: p.p })); }
  function broadcast(o, except) { players.forEach((p) => { if (p.conn && p.conn !== except) p.conn.send(o); }); }
  function rosterChanged() { const r = roster(); broadcast({ t: "roster", r }); emit("roster", r.filter((e) => e.id !== myId)); }

  function hostOnConn(conn) {
    let cid = null;
    conn.onmessage = (m) => {
      if (!m || !m.t) return;
      if (m.t === "join") {
        cid = String(m.cid || conn.id).slice(0, 40);
        const old = players.get(cid);
        if (!old && players.size >= MAX) { conn.send({ t: "full" }); return; }
        if (old && old.conn && old.conn !== conn) old.conn.close();
        players.set(cid, Object.assign({ s: 0, w: 0, n: 0 }, m.st || {}, { p: m.p, last: Date.now(), conn }));
        conn.send({ t: "welcome", you: cid });
        rosterChanged();
        return;
      }
      const p = cid && players.get(cid);
      if (!p) return;
      p.last = Date.now();
      if (m.t === "pos") { p.s = +m.s || 0; p.w = m.w ? 1 : 0; p.n = +m.n || 0; }
      else if (m.t === "emote") { broadcast({ t: "emote", id: cid, e: m.e }, conn); emit("emote", cid, m.e); }
      else if (m.t === "event") { broadcast({ t: "event", id: cid, k: m.k, a: m.a }, conn); emit("event", cid, m.k, m.a); }
      else if (m.t === "profile") { p.p = m.p; rosterChanged(); }
    };
    conn.onclose = () => {
      if (cid && players.get(cid) && players.get(cid).conn === conn) { players.delete(cid); rosterChanged(); }
    };
  }

  function hostTick() {
    const now = Date.now();
    let gone = false;
    players.forEach((p, id) => { if (id !== "host" && now - p.last > TIMEOUT) { players.delete(id); if (p.conn) p.conn.close(); gone = true; } });
    if (gone) rosterChanged();
    const list = [];
    players.forEach((p, id) => list.push([id, Math.round(p.s * 10) / 10, p.w, p.n]));
    players.forEach((p, id) => { if (p.conn) p.conn.send({ t: "snap", p: list.filter((e) => e[0] !== id) }); });
    emit("snap", list.filter((e) => e[0] !== "host"));
  }

  function host(code, profile, cb) {
    leave();
    role = "host"; myId = "host";
    players.clear();
    players.set("host", Object.assign({ p: profile, last: Date.now(), conn: null }, me));
    let tries = 0;
    const start = () => {
      handle = transport.host(code, {
        onReady: () => { cb(null, code); rosterChanged(); },
        onConn: hostOnConn,
        onError: (type) => {
          // 지난번 코드가 아직 서버에 남아 있으면 조금 기다렸다가 다시, 그래도 안 되면 새 코드로
          if (type === "unavailable-id" && tries < 2) { tries++; handle.close(); setTimeout(start, 2500); return; }
          if (type === "unavailable-id") { handle.close(); code = newCode(); tries = 0; start(); return; }
          if (type === "peer-unavailable") return;
          cb(type);
        }
      });
    };
    start();
    tickTimer = setInterval(hostTick, TICK);
  }

  // 들어가는 쪽
  let conn = null;
  let sendTimer = null, lastSent = "", lastSentAt = 0;
  let joinArgs = null;
  let retryTimer = null;
  let cid = null;

  // 같은 기기는 다시 들어와도 같은 사람으로 봐요. 시험 모드에서는 탭마다 다른 사람이에요.
  function clientId() {
    if (cid) return cid;
    const st = transport === localTransport ? sessionStorage : localStorage;
    try { cid = st.getItem("london-cid"); } catch (e) {}
    if (!cid) { cid = "c" + Math.random().toString(36).slice(2, 10); try { st.setItem("london-cid", cid); } catch (e) {} }
    return cid;
  }

  function join(code, profile, cb) {
    leave();
    role = "join";
    joinArgs = { code, profile };
    let done = false;
    handle = transport.join(code, {
      onOpen: (c) => { if (done) return; done = true; attach(c); cb(null); },
      onError: (type) => { if (done) { lost(); return; } done = true; role = "solo"; cb(type); }
    });
  }

  function attach(c) {
    conn = c;
    conn.onmessage = clientOnMessage;
    conn.onclose = lost;
    conn.send({ t: "join", cid: clientId(), p: joinArgs.profile, st: me });
    clearInterval(sendTimer);
    sendTimer = setInterval(clientSend, TICK);
  }

  function clientOnMessage(m) {
    if (!m || !m.t) return;
    if (m.t === "welcome") { myId = m.you; emit("status", "ok"); }
    else if (m.t === "full") emit("status", "full");
    else if (m.t === "roster") emit("roster", m.r.filter((e) => e.id !== myId));
    else if (m.t === "snap") emit("snap", m.p);
    else if (m.t === "emote") emit("emote", m.id, m.e);
    else if (m.t === "event") emit("event", m.id, m.k, m.a);
  }

  function lost() {
    if (role !== "join") return;
    conn = null;
    emit("status", "lost");
    clearTimeout(retryTimer);
    retryTimer = setTimeout(reconnect, 3000);
  }

  function reconnect() {
    if (role !== "join" || !joinArgs) return;
    if (handle) handle.close();
    handle = transport.join(joinArgs.code, {
      onOpen: (c) => attach(c),
      onError: () => { clearTimeout(retryTimer); retryTimer = setTimeout(reconnect, 4000); }
    });
  }

  function clientSend() {
    if (!conn) return;
    const key = [Math.round(me.s * 10), me.w, me.n].join();
    const now = Date.now();
    if (key === lastSent && now - lastSentAt < 2000) return;
    lastSent = key; lastSentAt = now;
    conn.send({ t: "pos", s: Math.round(me.s * 10) / 10, w: me.w, n: me.n });
  }

  // ───────────── 게임에서 쓰는 것 ─────────────
  function updateMe(s, walking, stamps) {
    me = { s, w: walking ? 1 : 0, n: stamps };
    if (role === "host") { const p = players.get("host"); if (p) Object.assign(p, me, { last: Date.now() }); }
  }
  function emote(e) {
    if (role === "host") broadcast({ t: "emote", id: "host", e });
    else if (conn) conn.send({ t: "emote", e });
  }
  function event(k, a) {
    if (role === "host") broadcast({ t: "event", id: "host", k, a });
    else if (conn) conn.send({ t: "event", k, a });
  }
  function setProfile(p) {
    if (role === "host") { const h = players.get("host"); if (h) { h.p = p; rosterChanged(); } }
    else if (conn) { conn.send({ t: "profile", p }); if (joinArgs) joinArgs.profile = p; }
  }
  function newCode() { return String(1000 + Math.floor(Math.random() * 9000)); }
  function leave() {
    clearInterval(sendTimer); clearInterval(tickTimer); clearTimeout(retryTimer);
    if (handle) handle.close();
    handle = null; conn = null; role = "solo"; myId = "me"; joinArgs = null;
    players.clear();
  }

  return {
    on, host, join, updateMe, emote, event, setProfile, newCode, leave,
    get role() { return role; }, get myId() { return myId; }, get local() { return transport === localTransport; }
  };
})();

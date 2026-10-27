// 여러 명이 함께 놀기
// 선생님 기기가 "방장"이 되고, 학생 기기는 입장 코드(숫자 4개)로 방장에게 연결해요.
// 연결 방법(전송)은 바꿔 끼울 수 있어요.
//   peer  : PeerJS(WebRTC). 가입 없이 기기끼리 바로 연결해요. 기본값.
//   local : 같은 브라우저의 다른 탭끼리(BroadcastChannel). 시험용이에요. 주소 뒤에 ?net=local
// 나중에 Firebase를 쓰게 되면 같은 모양(host/join)으로 하나 더 만들면 돼요.
"use strict";

const Net = (() => {
  const PREFIX = "kkoma-village-";
  const TICK = 100;          // 방장이 위치를 모아 보내는 간격(ms)
  const TIMEOUT = 15000;     // 이만큼 소식이 없으면 나간 것으로 봐요

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
      let conn = null;
      const timer = setTimeout(() => h.onError("timeout"), 12000);
      peer.on("open", () => {
        const dc = peer.connect(PREFIX + code, { reliable: true, serialization: "json" });
        conn = wrapPeerConn(dc);
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
  const ev = {};                         // 게임이 받는 소식
  const on = (name, fn) => { ev[name] = fn; };
  const emit = (name, ...a) => { if (ev[name]) ev[name](...a); };

  let role = "solo";
  let myId = "me";
  let handle = null;
  let me = null;                         // 내 상태 {profile, scene, x, y, dir, moving}
  let frozen = false;

  // 방장(선생님) 쪽
  const players = new Map();             // id → {profile, scene, x, y, dir, moving, stamps, progress, last, conn}
  let tickTimer = null;

  function roster() { return [...players.entries()].map(([id, p]) => ({ id, profile: p.profile, stamps: p.stamps || {} })); }
  function broadcast(o, except) { players.forEach((p) => { if (p.conn && p.conn !== except) p.conn.send(o); }); }
  function rosterChanged() { const r = roster(); broadcast({ t: "roster", r }); emit("roster", r); emit("students", students()); }
  function students() { return [...players.entries()].filter(([id]) => id !== "host").map(([id, p]) => ({ id, profile: p.profile, scene: p.scene, stamps: p.stamps || {}, progress: p.progress || {} })); }

  function hostOnConn(conn) {
    let cid = null;
    conn.onmessage = (m) => {
      if (!m || !m.t) return;
      if (m.t === "join") {
        cid = String(m.cid || conn.id).slice(0, 40);
        const old = players.get(cid);
        if (old && old.conn && old.conn !== conn) old.conn.close();
        players.set(cid, Object.assign({ scene: "village", x: 0, y: 0, dir: "down", moving: false }, old || {}, m.state || {}, { profile: m.profile, stamps: m.stamps || (old && old.stamps) || {}, progress: m.progress || (old && old.progress) || {}, last: Date.now(), conn }));
        conn.send({ t: "welcome", you: cid, r: roster(), frozen });
        rosterChanged();
        return;
      }
      const p = cid && players.get(cid);
      if (!p) return;
      p.last = Date.now();
      if (m.t === "pos") { p.scene = m.s; p.x = m.x; p.y = m.y; p.dir = m.d; p.moving = m.m; if (m.s !== p.lastScene) { p.lastScene = m.s; emit("students", students()); } }
      else if (m.t === "emote") { broadcast({ t: "emote", id: cid, e: String(m.e).slice(0, 4) }); emit("emote", cid, m.e); }
      else if (m.t === "record") { p.stamps = m.stamps || {}; p.progress = m.progress || {}; rosterChanged(); }
      else if (m.t === "profile") { p.profile = m.profile; rosterChanged(); }
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
    players.forEach((p, id) => list.push([id, p.scene, Math.round(p.x), Math.round(p.y), p.dir, p.moving ? 1 : 0]));
    broadcast({ t: "snap", p: list });
    emit("snap", list.filter((e) => e[0] !== "host"));
  }

  function host(code, profile, stamps, cb) {
    role = "host"; myId = "host"; frozen = false;
    players.clear();
    players.set("host", { profile, stamps, scene: "village", x: 0, y: 0, dir: "down", moving: false, last: Date.now(), conn: null });
    let tries = 0;
    const start = () => {
      handle = transport.host(code, {
        onReady: () => { cb(null, code); rosterChanged(); },
        onConn: hostOnConn,
        onError: (type) => {
          if (type === "unavailable-id" && tries < 3) { tries++; handle.close(); setTimeout(start, 3000); return; }
          if (type === "unavailable-id") { handle.close(); code = newCode(); tries = 0; start(); return; }
          if (type === "peer-unavailable") return; // 학생 쪽 문제는 무시
          cb(type);
        }
      });
    };
    start();
    clearInterval(tickTimer);
    tickTimer = setInterval(hostTick, TICK);
  }

  // 학생 쪽
  let conn = null;
  let sendTimer = null, lastSent = "", lastSentAt = 0;
  let joinArgs = null;
  let retryTimer = null;
  let cid = null;

  // 같은 기기는 다시 들어와도 같은 사람으로 봐요. 시험 모드에서는 탭마다 다른 사람이에요.
  function clientId() {
    if (cid) return cid;
    const st = transport === localTransport ? sessionStorage : localStorage;
    try { cid = st.getItem("village-cid"); } catch (e) {}
    if (!cid) { cid = "s" + Math.random().toString(36).slice(2, 10); try { st.setItem("village-cid", cid); } catch (e) {} }
    return cid;
  }

  // 1단계: 코드가 맞는지 먼저 연결만 해 봐요
  function connect(code, cb) {
    role = "join";
    if (handle) handle.close();
    let done = false;
    handle = transport.join(code, {
      onOpen: (c) => { if (done) return; done = true; conn = c; joinArgs = { code }; cb(null); },
      onError: (type) => { if (done) { lost(); return; } done = true; cb(type); }
    });
  }

  // 2단계: 캐릭터를 다 꾸미면 들어가요
  // record: 이 기기의 도장과 활동 진행 {stamps, progress}
  function enter(profile, record, state) {
    joinArgs.profile = profile; joinArgs.record = record; me = state;
    if (!conn) return reconnect();
    conn.onmessage = clientOnMessage;
    conn.onclose = lost;
    conn.send({ t: "join", cid: clientId(), profile, stamps: record.stamps, progress: record.progress, state: { scene: state.scene, x: state.x, y: state.y, dir: state.dir } });
    clearInterval(sendTimer);
    sendTimer = setInterval(clientSend, TICK);
  }

  function clientOnMessage(m) {
    if (!m || !m.t) return;
    if (m.t === "welcome") { myId = m.you; emit("status", "ok"); emit("roster", m.r); if (m.frozen) emit("cmd", "freeze"); }
    else if (m.t === "roster") emit("roster", m.r);
    else if (m.t === "snap") emit("snap", m.p.filter((e) => e[0] !== myId));
    else if (m.t === "emote") { if (m.id !== myId) emit("emote", m.id, m.e); }
    else if (m.t === "cmd") emit("cmd", m.c, m.a);
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
      onOpen: (c) => { conn = c; enter(joinArgs.profile, joinArgs.record, me); },
      onError: () => { clearTimeout(retryTimer); retryTimer = setTimeout(reconnect, 4000); }
    });
  }

  function clientSend() {
    if (!conn || !me) return;
    const key = [me.scene, Math.round(me.x), Math.round(me.y), me.dir, me.moving].join();
    const now = Date.now();
    if (key === lastSent && now - lastSentAt < 2000) return;
    lastSent = key; lastSentAt = now;
    conn.send({ t: "pos", s: me.scene, x: Math.round(me.x), y: Math.round(me.y), d: me.dir, m: me.moving });
  }

  // ───────────── 게임에서 쓰는 것 ─────────────
  function updateMe(state) {
    me = state;
    if (role === "host") { const p = players.get("host"); if (p) Object.assign(p, { scene: state.scene, x: state.x, y: state.y, dir: state.dir, moving: state.moving, last: Date.now() }); }
  }
  function emote(e) {
    if (role === "host") broadcast({ t: "emote", id: "host", e });
    else if (conn) conn.send({ t: "emote", e });
  }
  function sendRecord(record) {
    if (role === "host") { const p = players.get("host"); if (p) p.stamps = record.stamps; }
    else if (conn) { conn.send({ t: "record", stamps: record.stamps, progress: record.progress }); if (joinArgs) joinArgs.record = record; }
  }
  function command(c, a) {
    if (role !== "host") return;
    if (c === "freeze") frozen = true;
    if (c === "unfreeze") frozen = false;
    broadcast({ t: "cmd", c, a });
  }
  function newCode() { return String(1000 + Math.floor(Math.random() * 9000)); }
  function leave() { clearInterval(sendTimer); clearInterval(tickTimer); clearTimeout(retryTimer); if (handle) handle.close(); handle = null; conn = null; role = "solo"; }

  return {
    on, host, connect, enter, updateMe, emote, sendRecord, command, newCode, leave,
    get role() { return role; }, get myId() { return myId; }, get local() { return transport === localTransport; }
  };
})();

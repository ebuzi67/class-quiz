// 기기끼리 연결하기
// 뽑기 기계(보드·TV)가 "방"을 열고, 휴대폰·태블릿 리모컨이 입장 코드(숫자 4개)로 들어와요.
//   peer  : PeerJS(WebRTC). 가입 없이 기기끼리 바로 연결해요. 기본값. 인터넷이 필요해요.
//   local : 같은 브라우저의 다른 탭끼리(BroadcastChannel). 시험용이에요. 주소 뒤에 ?net=local
"use strict";

const Net = (() => {
  const PREFIX = "class-quiz-gacha-";

  function wrap(dc) {
    const c = {
      send: (o) => { try { if (dc.open) dc.send(o); } catch (e) {} },
      close: () => { try { dc.close(); } catch (e) {} },
      onmessage: null, onclose: null
    };
    dc.on("data", (d) => c.onmessage && c.onmessage(d));
    dc.on("close", () => c.onclose && c.onclose());
    dc.on("error", () => c.onclose && c.onclose());
    return c;
  }

  const peerT = {
    host(code, h) {
      if (typeof Peer === "undefined") { h.onError("nolib"); return { close() {} }; }
      const peer = new Peer(PREFIX + code, { debug: 0 });
      peer.on("open", () => h.onReady());
      peer.on("connection", (dc) => dc.on("open", () => h.onConn(wrap(dc))));
      peer.on("error", (e) => h.onError(e.type || "error"));
      peer.on("disconnected", () => { try { peer.reconnect(); } catch (e) {} });
      return { close: () => peer.destroy() };
    },
    join(code, h) {
      if (typeof Peer === "undefined") { h.onError("nolib"); return { close() {} }; }
      const peer = new Peer({ debug: 0 });
      const timer = setTimeout(() => h.onError("timeout"), 12000);
      peer.on("open", () => {
        const dc = peer.connect(PREFIX + code, { reliable: true, serialization: "json" });
        const c = wrap(dc);
        dc.on("open", () => { clearTimeout(timer); h.onOpen(c); });
      });
      peer.on("error", (e) => { clearTimeout(timer); h.onError(e.type || "error"); });
      return { close: () => { clearTimeout(timer); peer.destroy(); } };
    }
  };

  const localT = {
    host(code, h) {
      const bc = new BroadcastChannel(PREFIX + code);
      const conns = new Map();
      bc.onmessage = (ev) => {
        const m = ev.data;
        if (m.to !== "host") return;
        if (m.t === "open") {
          const c = { send: (o) => bc.postMessage({ t: "d", to: m.from, d: o }), close: () => bc.postMessage({ t: "close", to: m.from }), onmessage: null, onclose: null };
          conns.set(m.from, c);
          bc.postMessage({ t: "opened", to: m.from });
          h.onConn(c);
        } else if (m.t === "d") { const c = conns.get(m.from); if (c && c.onmessage) c.onmessage(m.d); }
        else if (m.t === "close") { const c = conns.get(m.from); conns.delete(m.from); if (c && c.onclose) c.onclose(); }
      };
      setTimeout(() => h.onReady(), 30);
      return { close: () => { conns.forEach((c) => c.close()); bc.close(); } };
    },
    join(code, h) {
      const bc = new BroadcastChannel(PREFIX + code);
      const id = "L" + Math.random().toString(36).slice(2, 9);
      const c = { send: (o) => bc.postMessage({ t: "d", from: id, to: "host", d: o }), close: () => { bc.postMessage({ t: "close", from: id, to: "host" }); bc.close(); }, onmessage: null, onclose: null };
      const timer = setTimeout(() => h.onError("peer-unavailable"), 3000);
      bc.onmessage = (ev) => {
        const m = ev.data;
        if (m.to !== id) return;
        if (m.t === "opened") { clearTimeout(timer); h.onOpen(c); }
        else if (m.t === "d") c.onmessage && c.onmessage(m.d);
        else if (m.t === "close") c.onclose && c.onclose();
      };
      bc.postMessage({ t: "open", from: id, to: "host" });
      return { close: () => { clearTimeout(timer); c.close(); } };
    }
  };

  const T = new URLSearchParams(location.search).get("net") === "local" ? localT : peerT;

  // 방 열기(뽑기 기계). 코드가 이미 쓰이고 있으면 새 코드로 다시 열어요.
  // h: onReady(code), onCount(n), onMessage(msg, conn), onError(type)
  function host(code, h) {
    const conns = new Set();
    let handle = null, closed = false, retry = 0;
    function start() {
      handle = T.host(code, {
        onReady: () => { retry = 0; h.onReady(code); },
        onConn: (c) => {
          conns.add(c); h.onCount(conns.size);
          c.onmessage = (m) => { if (m && m.t) h.onMessage(m, c); };
          c.onclose = () => { if (conns.delete(c)) h.onCount(conns.size); };
        },
        onError: (type) => {
          if (closed) return;
          if (type === "unavailable-id") { handle.close(); code = String(1000 + Math.floor(Math.random() * 9000)); start(); return; }
          if (type === "peer-unavailable") return;   // 리모컨 하나가 사라진 것. 괜찮아요.
          h.onError(type);
          if (retry++ < 20) { handle.close(); setTimeout(() => { if (!closed) start(); }, 3000); }
        }
      });
    }
    start();
    return {
      broadcast: (o) => conns.forEach((c) => c.send(o)),
      close: () => { closed = true; handle && handle.close(); }
    };
  }

  // 방 들어가기(리모컨). 끊기면 알아서 다시 붙어요.
  // h: onOpen(), onMessage(msg), onClose(), onError(type)
  function join(code, h) {
    let handle = null, conn = null, closed = false, opened = false;
    function start() {
      handle = T.join(code, {
        onOpen: (c) => {
          conn = c; opened = true; h.onOpen();
          c.onmessage = (m) => m && h.onMessage(m);
          c.onclose = () => { conn = null; if (!closed) { h.onClose(); handle.close(); setTimeout(() => !closed && start(), 1500); } };
          c.send({ t: "hello" });
        },
        onError: (type) => {
          if (closed) return;
          handle.close();
          if (!opened) { closed = true; h.onError(type); return; }
          h.onClose(); setTimeout(() => !closed && start(), 2500);
        }
      });
    }
    start();
    return {
      send: (o) => conn && conn.send(o),
      close: () => { closed = true; handle && handle.close(); }
    };
  }

  return { host, join };
})();

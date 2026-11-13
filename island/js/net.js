// 몽글몽글 섬: 기기끼리 연결하기
// 섬 주인 기기가 "방장"이 되고, 손님 기기는 입장 코드(숫자 4개)로 주인에게 연결해요.
//   peer  : PeerJS(WebRTC). 가입 없이 기기끼리 바로 연결해요. 기본값.
//   local : 같은 브라우저의 다른 탭끼리(BroadcastChannel). 시험용이에요. 주소 뒤에 ?net=local
"use strict";

const Net = (() => {
  const PREFIX = "monggle-island-";

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
      if (typeof Peer === "undefined") { setTimeout(() => h.onError("nolib"), 0); return { close() {} }; }
      const peer = new Peer(PREFIX + code, { debug: 0 });
      peer.on("open", () => h.onReady());
      peer.on("connection", (dc) => { const c = wrapPeerConn(dc); dc.on("open", () => h.onConn(c)); });
      peer.on("error", (e) => h.onError(e.type || "error"));
      peer.on("disconnected", () => { try { peer.reconnect(); } catch (e) {} });
      return { close: () => peer.destroy() };
    },
    join(code, h) {
      if (typeof Peer === "undefined") { setTimeout(() => h.onError("nolib"), 0); return { close() {} }; }
      const peer = new Peer({ debug: 0 });
      const timer = setTimeout(() => h.onError("timeout"), 12000);
      peer.on("open", () => {
        const dc = peer.connect(PREFIX + code, { reliable: true, serialization: "json" });
        const conn = wrapPeerConn(dc);
        conn.onopen = () => { clearTimeout(timer); h.onOpen(conn); };
      });
      peer.on("error", (e) => { clearTimeout(timer); h.onError(e.type || "error"); });
      return { close: () => { clearTimeout(timer); peer.destroy(); } };
    }
  };

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
      return { close: () => { conns.forEach((c) => c.close()); setTimeout(() => bc.close(), 50); } };
    },
    join(code, h) {
      const bc = new BroadcastChannel(PREFIX + code);
      const id = "L" + Math.random().toString(36).slice(2, 9);
      let open = true;
      const conn = { id, send: (o) => { if (open) bc.postMessage({ t: "d", from: id, to: "host", d: o }); }, close: () => { if (!open) return; open = false; bc.postMessage({ t: "close", from: id, to: "host" }); bc.close(); }, onmessage: null, onclose: null };
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

  const local = new URLSearchParams(location.search).get("net") === "local";
  const transport = local ? localTransport : peerTransport;
  return {
    host: (code, h) => transport.host(code, h),
    join: (code, h) => transport.join(code, h),
    newCode: () => String(1000 + Math.floor(Math.random() * 9000)),
    local
  };
})();

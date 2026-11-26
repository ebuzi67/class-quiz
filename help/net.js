// 기기끼리 연결하기 (꼬마 발명가 마을·두근두근 가챠샵과 같은 방식)
// 선생님 화면이 "방"을 열고, 학생 기기는 입장 코드(숫자 4개)로 선생님 화면에 바로 연결해요.
//   peer  : PeerJS(WebRTC). 가입 없이 기기끼리 바로 연결해요. 기본값. 인터넷이 필요해요.
//   local : 같은 브라우저의 다른 탭끼리(BroadcastChannel). 시험용이에요. 주소 뒤에 ?net=local
// PeerJS는 lib/peerjs.min.js를 html에서 먼저 불러와요.

const PREFIX = "class-quiz-helpme-";

function wrapPeerConn(dc) {
  const conn = {
    send: (o) => { try { if (dc.open) dc.send(o); } catch { /* 끊긴 연결 */ } },
    close: () => { try { dc.close(); } catch { /* 이미 닫힘 */ } },
    onmessage: null, onclose: null, onopen: null,
  };
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
    peer.on("disconnected", () => { try { peer.reconnect(); } catch { /* 다음에 다시 */ } });
    return { close: () => peer.destroy() };
  },
  join(code, h) {
    if (typeof Peer === "undefined") { h.onError("nolib"); return { close() {} }; }
    const peer = new Peer({ debug: 0 });
    const timer = setTimeout(() => h.onError("timeout"), 12000);
    peer.on("open", () => {
      const dc = peer.connect(PREFIX + code, { reliable: true, serialization: "json" });
      const conn = wrapPeerConn(dc);
      conn.onopen = () => { clearTimeout(timer); h.onOpen(conn); };
    });
    peer.on("error", (e) => { clearTimeout(timer); h.onError(e.type || "error"); });
    return { close: () => { clearTimeout(timer); peer.destroy(); } };
  },
};

const localTransport = {
  host(code, h) {
    const bc = new BroadcastChannel(PREFIX + code);
    const conns = new Map();
    bc.onmessage = (ev) => {
      const m = ev.data;
      if (m.to && m.to !== "host") return;
      if (m.t === "open") {
        const c = { send: (o) => bc.postMessage({ t: "d", to: m.from, d: o }), close: () => bc.postMessage({ t: "close", to: m.from }), onmessage: null, onclose: null };
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
    const conn = { send: (o) => bc.postMessage({ t: "d", from: id, to: "host", d: o }), close: () => { bc.postMessage({ t: "close", from: id, to: "host" }); bc.close(); }, onmessage: null, onclose: null };
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
  },
};

export const isLocalNet = new URLSearchParams(location.search).get("net") === "local";
const transport = isLocalNet ? localTransport : peerTransport;

export function newCode() {
  return String(1000 + Math.floor(Math.random() * 9000));
}

// 선생님: 방 열기. 코드가 다른 곳에서 쓰이고 있으면 잠깐 기다렸다 다시 해 보고(새로 고침했을 때),
// 그래도 안 되면 새 코드로 열어요.
// h: onReady(code), onConn(conn), onError(type)
export function host(code, h) {
  let handle = null;
  let closed = false;
  let tries = 0;
  let retry = 0;
  const start = () => {
    handle = transport.host(code, {
      onReady: () => { tries = 0; retry = 0; h.onReady(code); },
      onConn: (c) => h.onConn(c),
      onError: (type) => {
        if (closed) return;
        if (type === "unavailable-id") {
          handle.close();
          if (tries++ < 3) { setTimeout(() => !closed && start(), 3000); return; }
          code = newCode(); tries = 0; start();
          return;
        }
        if (type === "peer-unavailable") return;  // 학생 기기 하나가 사라진 것. 괜찮아요.
        h.onError(type);
        if (retry++ < 30) { handle.close(); setTimeout(() => !closed && start(), 4000); }
      },
    });
  };
  start();
  return { close: () => { closed = true; handle && handle.close(); } };
}

// 학생: 방 들어가기. 끊기거나 선생님 화면이 아직 안 켜졌으면 알아서 계속 다시 해 봐요.
// h: onOpen(conn), onClose(), onError(type)  (onError 뒤에도 다시 시도해요)
export function join(code, h) {
  let handle = null;
  let closed = false;
  let timer = null;
  const again = (ms) => { clearTimeout(timer); timer = setTimeout(() => !closed && start(), ms); };
  const start = () => {
    handle?.close();
    handle = transport.join(code, {
      onOpen: (c) => {
        c.onclose = () => { if (closed) return; h.onClose(); again(2000); };
        h.onOpen(c);
      },
      onError: (type) => { if (closed) return; h.onError(type); again(4000); },
    });
  };
  start();
  return { close: () => { closed = true; clearTimeout(timer); handle && handle.close(); } };
}

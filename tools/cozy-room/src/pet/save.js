// 반려동물·도감 저장
// ─────────────────────────────────────────────────────────────
//  · 먼저 이 기기(localStorage)에 저장해요. 인터넷이 없어도 계속 놀 수 있어요.
//  · 서버를 쓰지 않아요. 다른 기기로 옮길 때는 "백업 코드"(PET1-로 시작하는 글자)를 복사해서 붙여 넣어요.
//  · 학생 이름 같은 개인 정보는 여기에 절대 넣지 않아요.
//  · 처음에 "저요! 저요! 도와주세요"에서 만든 반려동물 기능을 모모의 코딩 하루로 옮겨 왔어요.
//
//  저장 데이터 모양 (여러 마리로 늘릴 수 있게 pets를 목록으로 둬요)
//  {
//    v, code(이어하기 코드 = 학생 식별 ID), createdAt, updatedAt,
//    activePetId,                         // 지금 돌보는 반려동물
//    pets: { [id]: {
//      id, species, name, exp, love, adoptedAt(최초 선택 날짜),
//      acc(장식), decor: { bg, items: [{ id, x, z }] },
//      care: { [행동]: { day, n, total, last } },   // 돌봄 기록
//      log: [{ t, a }]                              // 최근 돌봄 기록 30개
//    } },
//    unlocked: [아이템 id],              // 보유 아이템
//    badges: { [배지 id]: 받은 시간 },
//    dex: { seen: { [동물 id]: 처음 본 시간 }, life: { rhino, stag, chafer } }
//  }
// ─────────────────────────────────────────────────────────────
import { safeStorage } from "./common.js";
import { GROWTH, growthOf } from "./data.js";

export const KEY = "cozy-room.pet.v1";
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function makeSaveCode() {
  const b = new Uint8Array(8);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => CHARS[x % CHARS.length]).join("");
}
export const prettyCode = (c) => `${c.slice(0, 4)}-${c.slice(4)}`;
export const cleanCode = (s) => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/[O]/g, "0").replace(/[I]/g, "1");

export function blank() {
  const now = Date.now();
  return {
    v: 1, code: makeSaveCode(), createdAt: now, updatedAt: now,
    activePetId: null, pets: {}, unlocked: [], badges: {}, dex: { seen: {}, life: {} },
  };
}

// 가져온 데이터가 이상하지 않은지 살펴보고 빠진 칸을 채워요
export function normalize(d) {
  if (!d || typeof d !== "object" || d.v !== 1 || typeof d.code !== "string") return null;
  const b = blank();
  const out = { ...b, ...d, dex: { seen: {}, life: {}, ...(d.dex || {}) } };
  out.pets = d.pets && typeof d.pets === "object" ? d.pets : {};
  out.unlocked = Array.isArray(d.unlocked) ? d.unlocked : [];
  out.badges = d.badges && typeof d.badges === "object" ? d.badges : {};
  return out;
}

export function load() {
  try { return normalize(JSON.parse(safeStorage.get(KEY, "null"))); } catch { return null; }
}
export function saveLocal(d) {
  safeStorage.set(KEY, JSON.stringify(d));
}

export function newPet(species, name, space) {
  const id = `p${Date.now().toString(36)}`;
  const decor = space === "nature"
    ? { bg: "bg-forest", items: [{ id: "log", x: -0.55, z: -0.55 }, { id: "bowl-jelly", x: 0.62, z: 0.35 }, { id: "plant-grass", x: 0.85, z: -0.65 }] }
    : { bg: "bg-cozy", items: [{ id: "cushion-blue", x: -0.6, z: -0.35 }, { id: "bowl-white", x: 0.65, z: 0.4 }, { id: "plant-pot", x: -0.92, z: -0.85 }, { id: "toy-ball", x: 0.55, z: -0.45 }] };
  return { id, species, name, exp: 0, love: 10, adoptedAt: Date.now(), acc: null, decor, care: {}, log: [] };
}

export const today = () => new Date().toLocaleDateString("sv-SE");  // 2026-11-27 모양
export function daysTogether(pet) {
  const start = new Date(pet.adoptedAt); start.setHours(0, 0, 0, 0);
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.round((now - start) / 86400000) + 1;
}
export function nextGrowth(exp) {
  const g = growthOf(exp);
  const next = GROWTH[g.stage] || null;
  return { g, next, pct: next ? (exp - g.exp) / (next.exp - g.exp) : 1 };
}

// 학급 공동 공간(나중에 만들 기능)에서 보여 줄 "공개 카드".
// 반려동물 모습만 담고, 학생 이름·이어하기 코드·도움 요청은 넣지 않아요.
export function publicCard(d) {
  const p = d.pets[d.activePetId];
  if (!p) return null;
  return { species: p.species, name: p.name, stage: growthOf(p.exp).stage, acc: p.acc, bg: p.decor.bg };
}

// ── 백업 코드 (다른 기기로 옮기기) ──
// 저장 데이터를 글자로 바꿔요. 돌봄 기록(log)은 빼서 짧게 만들어요.
const PREFIX = "PET1-";
export function exportCode(d) {
  const slim = { ...d, pets: Object.fromEntries(Object.entries(d.pets).map(([k, p]) => [k, { ...p, log: [] }])) };
  const bytes = new TextEncoder().encode(JSON.stringify(slim));
  let bin = "";
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return PREFIX + btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
// 잘못된 코드면 null
export function importCode(text) {
  try {
    const t = String(text || "").trim().replace(/\s+/g, "");
    if (!t.startsWith(PREFIX) || t.length > 60000) return null;
    const bin = atob(t.slice(PREFIX.length).replace(/-/g, "+").replace(/_/g, "/"));
    return normalize(JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)))));
  } catch {
    return null;
  }
}

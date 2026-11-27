// 반려동물·도감 저장
// ─────────────────────────────────────────────────────────────
//  · 먼저 이 기기(localStorage)에 저장해요. 인터넷이 없어도 계속 놀 수 있어요.
//  · "이어하기 코드"(8자리)로 다른 기기에서 이어서 키울 수 있어요.
//      - 방 번호 모드: 선생님 화면이 켜져 있을 때 선생님 기기에 맡겨 둬요.
//      - Firebase 모드: Firestore의 petSaves/{코드} 문서에 저장해요.
//  · 학생 이름, 도움 요청 내용은 여기에 절대 넣지 않아요.
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
import { safeStorage } from "../common.js";
import { GROWTH, growthOf } from "./data.js";

const KEY = "helpme.pet.v1";
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

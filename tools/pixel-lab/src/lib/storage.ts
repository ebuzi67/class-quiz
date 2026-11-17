// 브라우저 저장소(localStorage)에 작품과 진행 기록을 보관해요. 서버는 쓰지 않아요.
import { Grid, Program } from '../engine/types';

const PREFIX = 'pixel-magic-lab:';

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

/** 저장에 성공하면 true. 저장 공간이 없거나 막혀 있어도 앱이 멈추지 않아요. */
export function save(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/** 목록을 불러와요. 저장된 내용이 망가져 있어도 빈 목록으로 시작해서 앱이 멈추지 않아요. */
export function loadList<T>(key: string): T[] {
  const v = load<unknown>(key, []);
  return Array.isArray(v) ? (v.filter((x) => x && typeof x === 'object') as T[]) : [];
}

export function remove(key: string) {
  try { localStorage.removeItem(PREFIX + key); } catch { /* 괜찮아요 */ }
}

export interface Artwork {
  id: string;
  name: string;
  size: number;
  pixels: Grid;
  program: Program;
  /** 손으로 고친 칸이 있는지 */
  handEdited: boolean;
  updatedAt: number;
}

export interface Frame { id: string; pixels: Grid; program: Program; handEdited: boolean }

export interface Animation {
  id: string;
  name: string;
  size: number;
  fps: number;
  loop: boolean;
  frames: Frame[];
  updatedAt: number;
}

export interface MissionRecord { done: boolean; bonus: boolean; blocks: number }
export type Progress = Record<string, MissionRecord>;

export interface Settings { muted: boolean; teacher: boolean; seenGuide: boolean }
export const DEFAULT_SETTINGS: Settings = { muted: false, teacher: false, seenGuide: false };

export const newId = () => Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);

export const formatDate = (t: number) => {
  const d = new Date(t);
  const two = (n: number) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${two(d.getHours())}:${two(d.getMinutes())}`;
};

/** 받침이 있으면 a, 없으면 b를 골라요 (을/를, 이/가) */
export const josa = (word: string, a: string, b: string) => {
  const code = word.trim().charCodeAt(word.trim().length - 1);
  if (code < 0xac00 || code > 0xd7a3) return a + '(' + b + ')';
  return (code - 0xac00) % 28 ? a : b;
};

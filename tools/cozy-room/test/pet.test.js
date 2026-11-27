import { describe, it, expect } from 'vitest';
import { blank, newPet, exportCode, importCode } from '../src/pet/save.js';
import { SPECIES, GROWTH, growthOf, LIFECYCLES } from '../src/pet/data.js';
import { validateConfig } from '../src/engine/validate.js';
import { furniture } from '../src/config/furniture.js';
import { products } from '../src/config/products.js';
import { actions } from '../src/config/actions.js';

describe('반려동물', () => {
  it('강아지·고양이·곤충 6종씩 모두 18종이에요', () => {
    for (const cat of ['dog', 'cat', 'bug']) expect(SPECIES.filter((s) => s.cat === cat)).toHaveLength(6);
  });

  it('곤충 도감에는 한살이가 있어요', () => {
    for (const s of SPECIES.filter((x) => x.cat === 'bug')) {
      expect(LIFECYCLES[s.dex.lifecycle]?.stages.map((st) => st.stage)).toEqual(['egg', 'larva', 'pupa', 'adult']);
    }
  });

  it('게임 속 성장은 4단계예요', () => {
    expect(GROWTH.map((g) => g.name)).toEqual(['아기', '어린이', '성장', '성숙']);
    expect(growthOf(0).stage).toBe(1);
    expect(growthOf(9999).stage).toBe(4);
  });

  it('백업 코드로 옮겼다가 그대로 되살려요 (한글 이름 포함)', () => {
    const d = blank();
    const p = newPet('corgi', '콩이🐾', 'indoor');
    p.exp = 120;
    d.pets[p.id] = p;
    d.activePetId = p.id;
    d.dex.seen.poodle = 1;
    const code = exportCode(d);
    expect(code.startsWith('PET1-')).toBe(true);
    const back = importCode(code);
    expect(back.pets[p.id].name).toBe('콩이🐾');
    expect(back.pets[p.id].exp).toBe(120);
    expect(back.dex.seen.poodle).toBe(1);
    expect(importCode('아무말')).toBeNull();
    expect(importCode('PET1-!!!')).toBeNull();
  });

  it('반려동물에게 하는 모모의 행동은 설정 검사를 통과해요', () => {
    const r = validateConfig({ furniture, products, actions });
    expect(r.warnings).toEqual([]);
    expect(r.actions.filter((a) => a.target === 'pet').map((a) => a.id)).toEqual(['petPet', 'playPet', 'feedPet']);
  });
});

import { describe, it, expect } from 'vitest';
import { createRunner, StopRun, MAX_STEPS } from '../src/blocks/interpreter.js';

const fakeApi = (gauges = {}, extra = {}) => {
  const log = [];
  return {
    log,
    perform: async (a) => { log.push(a); },
    wait: async (s) => { log.push(`wait${s}`); },
    say: async (t) => { log.push(`say:${t}`); },
    face: async (e) => { log.push(`face:${e}`); },
    gauge: (k) => gauges[k] ?? 50,
    ...extra,
  };
};

describe('블록 실행기', () => {
  it('순서, 반복, 조건대로 실행해요', async () => {
    const api = fakeApi({ sleepy: 80 });
    const script = { body: [
      { id: '1', type: 'action', action: 'washFace' },
      { id: '2', type: 'repeat', times: 2, body: [{ id: '3', type: 'action', action: 'combHair' }] },
      { id: '4', type: 'if', cond: { gauge: 'sleepy', op: '>', value: 70 }, then: [{ id: '5', type: 'action', action: 'nap' }], else: [{ id: '6', type: 'action', action: 'read' }] },
      { id: '7', type: 'say', text: '끝!' },
    ] };
    await createRunner(api).run(script);
    expect(api.log).toEqual(['washFace', 'combHair', 'combHair', 'nap', 'say:끝!']);
    const api2 = fakeApi({ sleepy: 10 });
    await createRunner(api2).run({ body: [script.body[2]] });
    expect(api2.log).toEqual(['read']);
  });

  it('너무 많이 실행하면 멈춰요', async () => {
    const deep = { id: 'r1', type: 'repeat', times: 10, body: [{ id: 'r2', type: 'repeat', times: 10, body: [{ id: 'r3', type: 'repeat', times: 10, body: [{ id: 'w', type: 'wait', sec: 0.1 }] }] }] };
    const api = fakeApi();
    await expect(createRunner(api).run({ body: [deep] })).rejects.toBeInstanceOf(StopRun);
    expect(api.log.length).toBeLessThan(MAX_STEPS);
  });

  it('멈춤 신호를 받으면 바로 멈춰요', async () => {
    const ctrl = new AbortController();
    const api = fakeApi({}, { signal: ctrl.signal, perform: async () => ctrl.abort() });
    await expect(createRunner(api).run({ body: [{ id: 'a', type: 'action', action: 'x' }, { id: 'b', type: 'say', text: 'no' }] })).rejects.toBeInstanceOf(StopRun);
  });
});

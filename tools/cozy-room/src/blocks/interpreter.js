// 블록 실행기 — 블록을 하나씩 읽어서 캐릭터에게 시켜요.
// api 는 화면 쪽에서 넣어 줘요 (테스트에서는 가짜 api 를 넣어요).
//   api.perform(actionId) : 행동이 끝나면 끝나는 Promise
//   api.wait(sec), api.say(text), api.face(expr) : Promise
//   api.gauge(id) : 지금 상태 값
//   api.onBlock(id) : 지금 실행하는 블록 표시
//   api.beforeBlock() : (한 단계씩 실행일 때) 다음 단계를 누를 때까지 기다리는 Promise
//   api.signal : 멈춤 신호 (AbortSignal)

export class StopRun extends Error {
  constructor(message = '멈췄어요') { super(message); this.name = 'StopRun'; }
}

export const MAX_STEPS = 300;

export function createRunner(api) {
  let steps = 0;
  const check = () => {
    if (api.signal?.aborted) throw new StopRun();
    if (++steps > MAX_STEPS) throw new StopRun(`블록을 ${MAX_STEPS}번 넘게 실행해서 멈췄어요. 반복 횟수를 줄여 보세요.`);
  };
  const runList = async (list) => {
    for (const b of list || []) await runBlock(b);
  };
  const runBlock = async (b) => {
    check();
    api.onBlock?.(b.id);
    if (api.beforeBlock) await api.beforeBlock(b);
    if (api.signal?.aborted) throw new StopRun();
    switch (b.type) {
      case 'action': await api.perform(b.action); break;
      case 'repeat':
        for (let i = 0; i < b.times; i++) {
          api.onBlock?.(b.id);
          await runList(b.body);
          if (!b.body.length) check(); // 빈 반복도 셈해서 무한 반복을 막아요
        }
        break;
      case 'if': {
        const v = api.gauge(b.cond.gauge);
        const yes = b.cond.op === '>' ? v > b.cond.value : v < b.cond.value;
        await runList(yes ? b.then : b.else);
        break;
      }
      case 'wait': await api.wait(b.sec); break;
      case 'say': await api.say(b.text); break;
      case 'face': await api.face(b.expr); break;
    }
  };
  return {
    run: (script) => runList(script.body),
    get steps() { return steps; },
  };
}

import { useEffect, useRef, useState } from 'react';
import { Guard } from './components/Bench';
import { Icon, LOGO_ROWS, PixelArt, WIZARD_ROWS } from './components/Icon';
import { Modal, useUi } from './components/Ui';
import { MISSIONS, titleFor } from './engine/missions';
import { setMuted } from './lib/sound';
import { DEFAULT_SETTINGS, Progress, Settings, load, remove, save } from './lib/storage';
import { MissionMode } from './modes/MissionMode';
import { StudioMode } from './modes/StudioMode';
import { TheaterMode } from './modes/TheaterMode';

type Mode = 'mission' | 'studio' | 'theater';
const MODES: { id: Mode; name: string; sub: string; icon: string }[] = [
  { id: 'mission', name: '마법 따라 그리기', sub: '미션', icon: 'map' },
  { id: 'studio', name: '자유 픽셀 공방', sub: '창작', icon: 'paint' },
  { id: 'theater', name: '움직이는 픽셀 극장', sub: '애니메이션', icon: 'film' },
];

export function App() {
  const ui = useUi();
  const [mode, setMode] = useState<Mode>('mission');
  const [settings, setSettingsState] = useState<Settings>(() => ({ ...DEFAULT_SETTINGS, ...load<Partial<Settings>>('settings', {}) }));
  const [progress, setProgressState] = useState<Progress>(() => { const v = load<Progress>('progress', {}); return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; });
  const [help, setHelp] = useState(() => !settings.seenGuide);
  const [teacherBox, setTeacherBox] = useState(false);
  const [full, setFull] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const guardRef = useRef<Guard | null>(null);

  const setSettings = (s: Settings) => { setSettingsState(s); save('settings', s); };
  const setProgress = (p: Progress) => { setProgressState(p); save('progress', p); };
  setMuted(settings.muted);

  useEffect(() => {
    const onFull = () => setFull(!!document.fullscreenElement);
    const onLeave = (e: BeforeUnloadEvent) => { if (guardRef.current?.dirty) { e.preventDefault(); e.returnValue = ''; } };
    document.addEventListener('fullscreenchange', onFull);
    window.addEventListener('beforeunload', onLeave);
    return () => { document.removeEventListener('fullscreenchange', onFull); window.removeEventListener('beforeunload', onLeave); };
  }, []);

  const go = async (next: Mode) => {
    if (next === mode) return;
    const g = guardRef.current;
    if (g?.dirty) {
      const a = await ui.confirm({
        title: `저장하지 않은 ${g.what}이 있어요`, body: '다른 곳으로 가면 저장하지 않은 내용은 사라져요.',
        ok: '저장하지 않고 이동', extra: '저장하고 이동', cancel: '계속 만들기', icon: 'save',
      });
      if (a === 'cancel') return;
      if (a === 'extra' && !g.save()) return;
    }
    guardRef.current = null;
    setMode(next);
  };

  const toggleFull = () => {
    try {
      if (document.fullscreenElement) void document.exitFullscreen();
      else void document.documentElement.requestFullscreen?.().catch(() => ui.toast('이 브라우저에서는 전체 화면을 쓸 수 없어요.'));
    } catch { ui.toast('이 브라우저에서는 전체 화면을 쓸 수 없어요.'); }
  };

  const stars = MISSIONS.reduce((n, m) => n + (progress[m.id]?.done ? 1 : 0) + (progress[m.id]?.bonus ? 1 : 0), 0);
  const doneCount = MISSIONS.filter((m) => progress[m.id]?.done).length;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <PixelArt rows={LOGO_ROWS} size={38} className="logo" />
          <div>
            <h1>픽셀 마법사 연구소</h1>
            <p>작은 픽셀에 마법을 걸어봐!</p>
          </div>
        </div>
        <nav className="tabs" aria-label="모드 고르기">
          {MODES.map((m) => (
            <button key={m.id} className={'tab t-' + m.id + (mode === m.id ? ' on' : '')} onClick={() => go(m.id)} aria-current={mode === m.id ? 'page' : undefined}>
              <span className="tab-ico"><Icon name={m.icon} size={20} /></span>
              <span className="tab-text"><small>{m.sub}</small>{m.name}</span>
            </button>
          ))}
        </nav>
        <div className="top-right">
          <div className="rank" title={`미션 ${doneCount}/${MISSIONS.length} 완료`}>
            <span className="rank-star"><Icon name="star" size={18} />{stars}</span>
            <span className="rank-name">{titleFor(stars)}</span>
          </div>
          <button className="btn icon" onClick={() => setHelp(true)} aria-label="사용 방법" title="사용 방법"><Icon name="help" /></button>
          <button className="btn icon" onClick={() => setSettings({ ...settings, muted: !settings.muted })} aria-label={settings.muted ? '소리 켜기' : '소리 끄기'} title={settings.muted ? '소리 켜기' : '소리 끄기'} aria-pressed={settings.muted}>
            <Icon name={settings.muted ? 'mute' : 'sound'} />
          </button>
          <button className="btn icon" onClick={toggleFull} aria-label="전체 화면" title={full ? '전체 화면 끝내기' : '전체 화면'} aria-pressed={full}><Icon name="full" /></button>
          <button className={'btn icon' + (settings.teacher ? ' on' : '')} onClick={() => setTeacherBox(true)} aria-label="선생님 메뉴" title="선생님 메뉴"><Icon name="hat" /></button>
        </div>
      </header>

      <main className="main">
        {mode === 'mission' && <MissionMode key={resetKey} progress={progress} setProgress={setProgress} teacher={settings.teacher} onGoStudio={() => go('studio')} />}
        {mode === 'studio' && <StudioMode guardRef={guardRef} />}
        {mode === 'theater' && <TheaterMode guardRef={guardRef} />}
      </main>

      {help && (
        <Modal title="픽셀 마법사 연구소에 온 걸 환영해요!" icon="wand" wide onClose={() => { setHelp(false); if (!settings.seenGuide) setSettings({ ...settings, seenGuide: true }); }}>
          <div className="help">
            <PixelArt rows={WIZARD_ROWS} size={96} className="help-wiz" />
            <ol className="help-steps">
              <li><span className="hs g-move"><Icon name="book" size={22} /></span><div><b>① 블록 고르기</b>왼쪽 「블록 서랍」에서 블록을 누르면 「마법 주문서」에 차례대로 쌓여요.</div></li>
              <li><span className="hs g-paint"><Icon name="play" size={22} /></span><div><b>② 실행하기</b>「실행」을 누르면 마법 펜이 주문서를 위에서부터 읽으며 움직여요. 펜은 항상 왼쪽 위 (0, 0)에서 출발해요.</div></li>
              <li><span className="hs g-color"><Icon name="step" size={22} /></span><div><b>③ 살펴보고 고치기</b>「한 단계」로 블록을 하나씩 실행하면 어디가 틀렸는지 찾기 쉬워요. 블록을 누르면 옮기거나 지울 수 있어요.</div></li>
              <li><span className="hs g-repeat"><Icon name="repeat" size={22} /></span><div><b>④ 반복 블록</b>반복 블록의 「여기에 넣기」를 누른 다음 블록을 넣으면 반복 안으로 들어가요.</div></li>
            </ol>
          </div>
          <div className="help-modes">
            <span><Icon name="map" size={18} /><b>마법 따라 그리기</b> 목표 그림을 똑같이 그리는 미션</span>
            <span><Icon name="paint" size={18} /><b>자유 픽셀 공방</b> 나만의 작품을 만들고 저장</span>
            <span><Icon name="film" size={18} /><b>움직이는 픽셀 극장</b> 여러 장을 이어 애니메이션</span>
          </div>
          <div className="modal-actions"><button className="btn primary" autoFocus onClick={() => { setHelp(false); if (!settings.seenGuide) setSettings({ ...settings, seenGuide: true }); }}>시작하기</button></div>
        </Modal>
      )}

      {teacherBox && (
        <Modal title="선생님 메뉴" icon="hat" wide onClose={() => setTeacherBox(false)}>
          <button className={'tog big' + (settings.teacher ? ' on' : '')} onClick={() => setSettings({ ...settings, teacher: !settings.teacher })} aria-pressed={settings.teacher}>
            <i /><span><b>선생님 모드</b>모든 미션을 바로 열 수 있고, 미션 화면에 「정답 코드」 버튼이 나타나요.</span>
          </button>
          <h3 className="t-head">이 컴퓨터의 미션 결과 <span className="muted">완료 {doneCount}/{MISSIONS.length} · 별 {stars}개</span></h3>
          <div className="t-table">
            {MISSIONS.map((m) => {
              const r = progress[m.id];
              return (
                <div key={m.id} className={'t-row' + (r?.done ? ' done' : '')}>
                  <span className="t-no">{m.no}</span>
                  <span className="t-name">{m.title}<small>{m.skill}</small></span>
                  <span className={'lv lv-' + m.level}>{m.level}</span>
                  <span className="t-res">{r?.done ? <><Icon name="star" size={15} />{r.bonus && <Icon name="sparkle" size={14} />} 블록 {r.blocks}개</> : '아직'}</span>
                </div>
              );
            })}
          </div>
          <div className="modal-actions">
            <button
              className="btn danger"
              onClick={async () => {
                if ((await ui.confirm({ title: '미션 기록을 처음으로 되돌릴까요?', body: '받은 별과 미션마다 만들던 주문서가 지워져요. 저장한 작품과 애니메이션은 그대로 남아요.', ok: '되돌리기', cancel: '그만두기', icon: 'restart' })) !== 'ok') return;
                MISSIONS.forEach((m) => remove('draft:' + m.id));
                remove('mission:current');
                setProgress({}); setResetKey((k) => k + 1);
                ui.toast('미션 기록을 처음으로 되돌렸어요.');
              }}
            ><Icon name="restart" size={18} />미션 기록 지우기</button>
            <button className="btn primary" onClick={() => setTeacherBox(false)}>닫기</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

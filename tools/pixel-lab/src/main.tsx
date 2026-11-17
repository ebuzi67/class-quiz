import { Component, ReactNode, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { UiProvider } from './components/Ui';
import './styles.css';

// 혹시 화면에 문제가 생겨도 하얀 화면 대신 안내를 보여 줘요. 저장한 작품은 그대로 남아요.
class Safety extends Component<{ children: ReactNode }, { broken: boolean }> {
  state = { broken: false };
  static getDerivedStateFromError() { return { broken: true }; }
  render() {
    if (!this.state.broken) return this.props.children;
    return (
      <div className="crash">
        <h1>앗, 마법이 살짝 엉켰어요</h1>
        <p>아래 버튼을 누르면 다시 시작해요. 저장한 작품은 그대로 있어요.</p>
        <button className="btn primary big" onClick={() => location.reload()}>다시 시작하기</button>
      </div>
    );
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Safety>
      <UiProvider>
        <App />
      </UiProvider>
    </Safety>
  </StrictMode>,
);

// 설치(PWA)와 오프라인 사용을 위한 서비스 워커. 개발 중에는 켜지 않아요.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  addEventListener('load', () => { navigator.serviceWorker.register('./sw.js').catch(() => {}); });
}

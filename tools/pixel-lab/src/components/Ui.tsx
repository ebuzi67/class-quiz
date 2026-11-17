// 팝업(모달), 확인 창, 짧은 알림(토스트). 앱 어디서나 같은 모양으로 써요.
import { ReactNode, createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';

interface ConfirmOptions {
  title: string;
  body?: ReactNode;
  ok: string;
  cancel?: string;
  /** 세 번째 선택지 (예: 저장하고 이동) */
  extra?: string;
  icon?: string;
}
type Answer = 'ok' | 'cancel' | 'extra';

interface UiApi {
  confirm: (o: ConfirmOptions) => Promise<Answer>;
  toast: (msg: string) => void;
}
const Ctx = createContext<UiApi>({ confirm: async () => 'cancel', toast: () => {} });
export const useUi = () => useContext(Ctx);

export function Modal({ title, icon, onClose, children, wide, className }: {
  title?: string; icon?: string; onClose?: () => void; children: ReactNode; wide?: boolean; className?: string;
}) {
  useEffect(() => {
    if (!onClose) return;
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onClose]);
  return (
    <div className="modal-back" onPointerDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className={'modal' + (wide ? ' wide' : '') + (className ? ' ' + className : '')} role="dialog" aria-modal="true" aria-label={title}>
        {(title || onClose) && (
          <div className="modal-head">
            {icon && <span className="modal-ico"><Icon name={icon} size={22} /></span>}
            <h2>{title}</h2>
            {onClose && <button className="btn icon ghost" onClick={onClose} aria-label="닫기"><Icon name="close" /></button>}
          </div>
        )}
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export function UiProvider({ children }: { children: ReactNode }) {
  const [ask, setAsk] = useState<(ConfirmOptions & { resolve: (a: Answer) => void }) | null>(null);
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);
  const seq = useRef(0);

  const confirm = useCallback((o: ConfirmOptions) => new Promise<Answer>((resolve) => setAsk({ ...o, resolve })), []);
  const toast = useCallback((msg: string) => {
    const id = ++seq.current;
    setToasts((t) => [...t.slice(-2), { id, msg }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);
  const answer = (a: Answer) => { ask?.resolve(a); setAsk(null); };

  return (
    <Ctx.Provider value={{ confirm, toast }}>
      {children}
      {ask && (
        <Modal title={ask.title} icon={ask.icon ?? 'help'} onClose={() => answer('cancel')}>
          {ask.body && <div className="confirm-body">{ask.body}</div>}
          <div className="modal-actions">
            <button className="btn" onClick={() => answer('cancel')}>{ask.cancel ?? '아니요'}</button>
            {ask.extra && <button className="btn mint" onClick={() => answer('extra')}>{ask.extra}</button>}
            <button className="btn primary" onClick={() => answer('ok')} autoFocus>{ask.ok}</button>
          </div>
        </Modal>
      )}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => <div key={t.id} className="toast"><Icon name="sparkle" size={16} />{t.msg}</div>)}
      </div>
    </Ctx.Provider>
  );
}

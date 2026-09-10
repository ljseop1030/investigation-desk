import { useEffect, useRef, useState } from 'react';
import S from './strings.js';
import { useTypewriter } from './typewriter.js';

// 작업표시줄 왼쪽 시작 버튼. 위험한 항목은 두 번 눌러야 실행된다.
// 첫 번째 누름은 확인 문구를 찍고, 두 번째 누름이 실행이다.
export function StartMenu({ onRestart, onQuit }) {
  const [open, setOpen] = useState(false);
  const [armed, setArmed] = useState(null);   // null | 'restart' | 'quit'
  const box = useRef(null);

  const close = () => {
    setOpen(false);
    setArmed(null);
  };

  // Esc로 닫는다. 메뉴가 열린 채 잊히면 클릭이 먹통처럼 느껴진다.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const message =
    armed === 'restart' ? S.desktop.resetConfirm :
    armed === 'quit' ? S.desktop.quitConfirm : '';
  const typed = useTypewriter(message, !!armed);

  const arm = (kind, run) => () => {
    if (armed !== kind) return setArmed(kind);
    close();
    run();
  };

  return (
    <>
      {open && <div className="start-backdrop" onMouseDown={close} />}

      <div className="start-wrap" ref={box}>
        {open && (
          <div className="start-menu" role="menu">
            <button className="start-item px" disabled>
              {S.common.settings}
            </button>
            <button
              className={`start-item px${armed === 'restart' ? ' is-armed' : ''}`}
              onClick={arm('restart', onRestart)}
            >
              {S.common.newGame}
            </button>
            <button
              className={`start-item px${armed === 'quit' ? ' is-armed' : ''}`}
              onClick={arm('quit', onQuit)}
            >
              {S.common.quit}
            </button>

            {/* 메뉴 오른쪽에 띄운다. 안에 넣으면 메뉴가 위로 자라 항목이 밀리고,
                자리를 비워두면 안 눌렀을 때 아래가 텅 빈다. */}
            {armed && (
              <div className="start-confirm" aria-live="polite">
                {typed}
                <span className="caret" aria-hidden="true">_</span>
              </div>
            )}
          </div>
        )}

        <button
          className={`tb-item tb-start px${open ? ' is-active' : ''}`}
          onClick={() => (open ? close() : setOpen(true))}
          aria-expanded={open}
        >
          {S.desktop.start}
        </button>
      </div>
    </>
  );
}
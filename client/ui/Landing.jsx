import { useEffect, useState } from 'react';
import S from './strings.js';
import { useTypewriter } from './typewriter.js';

export function Landing({ terminal, name, setName, hasSave, onContinue, onNew }) {
  const [line, setLine] = useState(0);
  const [info, setInfo] = useState(false);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setLine((n) => (n + 1) % terminal.setupLines.length), 2600);
    return () => clearInterval(t);
  }, [terminal.setupLines.length]);

  // 이름 없이는 아무 데도 못 간다. 단말이 사용자를 특정하지 못한 상태다.
  const ready = name.trim().length > 0;

  // 이름을 고치면 확인 상태가 풀린다. 다른 마음을 먹은 것으로 친다.
  useEffect(() => setArmed(false), [name]);

  const warning = useTypewriter(S.desktop.resetConfirm, armed);

  // 지울 것이 없으면 그냥 시작한다. 있으면 한 번 더 누르게 한다.
  const newGame = () => {
    if (!hasSave) return onNew();
    if (!armed) return setArmed(true);
    onNew();
  };

  const item = (label, on, enabled = true, note) => (
    <button key={label} className="landing-item" onClick={enabled ? on : undefined} disabled={!enabled}>
      <span className="landing-caret">▸</span>
      <span>{label}</span>
      {note && <span className="landing-note">{note}</span>}
    </button>
  );

  return (
    <div className="landing on-dark">
      <div className="landing-box">
        {info ? (
          <>
            <div className="landing-logo" style={{ textAlign: 'left', marginBottom: 16 }}>
              Investigation Desk
            </div>
            <div className="landing-intro">
              {terminal.intro}
              {'\n\n'}
              {/* 앞은 세계관 고지, 뒤는 게임이 자기 자신에 대해 하는 말. 출처가 다르다. */}
              <span className="landing-footnote">
                {terminal.introFootnote} {S.meta.autosave}
              </span>
            </div>
            <button className="landing-back" onClick={() => setInfo(false)}>
              {S.common.back}
            </button>
          </>
        ) : (
          <>
            <div className="landing-logo">Investigation Desk</div>

            <div className="landing-avatar">
              <svg viewBox="0 0 32 32" width="32" height="32" shapeRendering="crispEdges" aria-hidden="true">
                <rect x="12" y="7" width="8" height="8" fill="#5F7280" />
                <rect x="13" y="8" width="6" height="6" fill="#1B2429" />
                <rect x="9" y="19" width="14" height="7" fill="#5F7280" />
                <rect x="10" y="20" width="12" height="6" fill="#1B2429" />
              </svg>
            </div>

            <input
              className="landing-name"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 12))}
              placeholder={S.landing.namePlaceholder}
            />

            <div className="landing-setup">{terminal.setupLines[line]}</div>

            <div className="landing-menu-wrap">
              <div className="landing-menu">
                {item(
                  S.landing.continue,
                  onContinue,
                  ready && hasSave,
                  hasSave ? null : S.landing.noSave
                )}
                {item(S.common.newGame, newGame, ready)}
                {item(S.landing.about, () => setInfo(true), ready)}
              </div>

              {/* 흐름에서 빼서 띄운다. 자리를 예약하면 안 눌렀을 때 아래가 텅 빈다. */}
              {armed && (
                <div className="landing-confirm" aria-live="polite">
                  {warning}
                  <span className="caret" aria-hidden="true">_</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
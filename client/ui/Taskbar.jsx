import { useEffect, useState } from 'react';
import S from './strings.js';

export function Taskbar({ wins, top, onFocus, onReset }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="taskbar px">
      {wins.length === 0 && <span className="tb-hint">{S.desktop.hint}</span>}

      {wins.map((w) => {
        const active = !w.min && top === w.id;
        return (
          <button
            key={w.id}
            onClick={() => onFocus(w.id)}
            className={`tb-item px${active ? ' is-active' : ''}${w.min ? ' is-min' : ''}`}
          >
            {w.title}
          </button>
        );
      })}

      {onReset && (
        <button
          className="tb-item tb-reset px"
          onClick={() => window.confirm(S.desktop.resetConfirm) && onReset()}
        >
          {S.common.newGame}
        </button>
      )}

      <div className="tb-clock px">
        {String(now.getHours()).padStart(2, '0')}:{String(now.getMinutes()).padStart(2, '0')}
      </div>
    </div>
  );
}
import { useEffect, useState } from 'react';
import S from './strings.js';
import { StartMenu } from './StartMenu.jsx';

export function Taskbar({ wins, top, onFocus, onRestart, onQuit }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="taskbar px">
      <StartMenu onRestart={onRestart} onQuit={onQuit} />

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

      <div className="tb-clock px">
        {String(now.getHours()).padStart(2, '0')}:{String(now.getMinutes()).padStart(2, '0')}
      </div>
    </div>
  );
}
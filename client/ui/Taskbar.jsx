import { useEffect, useState } from 'react';
import { C, SANS, MONO } from './style.js';
import S from './strings.js';

export function Taskbar({ wins, top, onFocus, onReset }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 38,
        background: '#0C1114',
        borderTop: '1px solid #263038',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: 6,
        zIndex: 5000,
      }}
    >
      {wins.length === 0 && (
        <span style={{ color: '#54636D', fontSize: 11.5 }}>{S.desktop.hint}</span>
      )}

      {wins.map((w) => (
        <button
          key={w.id}
          onClick={() => onFocus(w.id)}
          style={{
            background: !w.min && top === w.id ? C.bar : 'transparent',
            border: '1px solid #2E3A43',
            color: w.min ? '#6E7C86' : '#DCE3E8',
            fontSize: 11.5,
            padding: '5px 12px',
            cursor: 'pointer',
            fontFamily: SANS,
          }}
        >
          {w.title}
        </button>
      ))}

      {onReset && (
        <button
          onClick={() => window.confirm(S.desktop.resetConfirm) && onReset()}
          style={{
            marginLeft: 'auto',
            background: 'transparent',
            border: '1px solid #2E3A43',
            color: '#5E6D77',
            fontSize: 11,
            padding: '4px 10px',
            cursor: 'pointer',
            fontFamily: SANS,
          }}
        >
          {S.desktop.reset}
        </button>
      )}

      <div style={{ color: '#7C8B95', fontSize: 11.5, fontFamily: MONO, marginLeft: onReset ? 10 : 'auto' }}>
        {String(now.getHours()).padStart(2, '0')}:{String(now.getMinutes()).padStart(2, '0')}
      </div>
    </div>
  );
}
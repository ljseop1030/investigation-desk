import { useEffect, useState } from 'react';
import { MONO } from './style.js';
import S from './strings.js';

export function Boot({ boot, onDone }) {
  const [n, setN] = useState(0);
  const [fade, setFade] = useState(false);
  const { lines, alertFrom } = boot;

  useEffect(() => {
    if (n < lines.length) {
      const t = setTimeout(() => setN(n + 1), n === 0 ? 500 : 220 + Math.random() * 180);
      return () => clearTimeout(t);
    }
    const t1 = setTimeout(() => setFade(true), 800);
    const t2 = setTimeout(onDone, 1400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [n, lines.length, onDone]);

  return (
    <div
      onClick={onDone}
      style={{
        position: 'fixed',
        inset: 0,
        background: '#07090A',
        color: '#B9C6CD',
        fontFamily: MONO,
        fontSize: 12.5,
        lineHeight: 2,
        padding: '48px 40px',
        cursor: 'pointer',
        opacity: fade ? 0 : 1,
        transition: 'opacity .6s ease',
        zIndex: 99999,
      }}
    >
      {lines.slice(0, n).map((l, i) => (
        <div key={i} style={{ color: i >= alertFrom ? '#C98D74' : '#B9C6CD' }}>
          {l}
        </div>
      ))}
      {n >= lines.length && (
        <div style={{ marginTop: 26, color: '#6E7C85' }}>{S.boot.preparing}</div>
      )}
      <div style={{ position: 'absolute', bottom: 28, left: 40, color: '#3F4A51', fontSize: 11 }}>
        {S.boot.skip}
      </div>
    </div>
  );
}
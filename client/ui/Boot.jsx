import { useEffect, useState } from 'react';
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
    <div onClick={onDone} className={`boot on-dark${fade ? ' is-fading' : ''}`}>
      {lines.slice(0, n).map((l, i) => (
        <div key={i} className={i >= alertFrom ? 'boot-alert' : undefined}>
          {l}
        </div>
      ))}
      {n >= lines.length && <div className="boot-wait">{S.boot.preparing}</div>}
      <div className="boot-skip">{S.boot.skip}</div>
    </div>
  );
}

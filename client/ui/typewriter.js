import { useEffect, useState } from 'react';

// 확인 문구가 한 글자씩 찍힌다. window.confirm 대신 쓰는 이유는,
// 브라우저 대화상자가 이 화면에서 유일하게 진짜 운영체제의 물건이라서다.
// 단말 안에서 벌어지는 일은 단말 안에서 보여야 한다.

const STEP = 26;   // 글자당 (ms)

const reduced = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function useTypewriter(text, on) {
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!on || !text) return setN(0);
    if (reduced()) return setN(text.length);

    setN(0);
    let i = 0;
    const t = setInterval(() => {
      setN((i += 1));
      if (i >= text.length) clearInterval(t);
    }, STEP);
    return () => clearInterval(t);
  }, [text, on]);

  return text ? text.slice(0, n) : '';
}
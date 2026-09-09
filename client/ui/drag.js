// React 밖에서 돈다. mousedown에서 window에 걸고 mouseup에서 뗀다.
// onEnd(moved)의 moved는 3px 임계값. 아이콘을 살짝 밀기만 해도 열리는 걸 막는다.
export function startDrag(e, onMove, onEnd) {
  const p = e.touches ? e.touches[0] : e;
  const s = { x: p.clientX, y: p.clientY };
  let moved = false;

  const move = (ev) => {
    const q = ev.touches ? ev.touches[0] : ev;
    const dx = q.clientX - s.x;
    const dy = q.clientY - s.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
    onMove(dx, dy);
    if (ev.cancelable) ev.preventDefault();
  };

  const up = () => {
    window.removeEventListener('mousemove', move);
    window.removeEventListener('mouseup', up);
    window.removeEventListener('touchmove', move);
    window.removeEventListener('touchend', up);
    if (onEnd) onEnd(moved);
  };

  window.addEventListener('mousemove', move);
  window.addEventListener('mouseup', up);
  // passive: false여야 preventDefault가 먹는다
  window.addEventListener('touchmove', move, { passive: false });
  window.addEventListener('touchend', up);
}
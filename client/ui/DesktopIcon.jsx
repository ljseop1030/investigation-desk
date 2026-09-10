import { useRef } from 'react';
import { startDrag } from './drag.js';

export function DesktopIcon({ app, pos, selected, onSelect, onOpen, onMove }) {
  const last = useRef(0);

  const start = (e) => {
    onSelect();
    const b = { x: pos.x, y: pos.y };
    startDrag(
      e,
      (dx, dy) => onMove(Math.max(0, b.x + dx), Math.max(0, b.y + dy)),
      (moved) => {
        if (moved) return;   // 밀었으면 클릭이 아니다
        const t = Date.now();
        if (t - last.current < 450) onOpen();
        last.current = t;
      }
    );
  };

  return (
    <div
      onMouseDown={start}
      onTouchStart={start}
      onDoubleClick={onOpen}
      className={`icon${selected ? ' is-sel' : ''}`}
      style={{ left: pos.x, top: pos.y }}
    >
      <div className="icon-art">{app.icon}</div>
      <div className="icon-label">{app.label}</div>
    </div>
  );
}
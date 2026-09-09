import { useRef } from 'react';
import { SANS } from './tokens.js';
import { startDrag } from './useDrag.js';

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
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        width: 94,
        padding: '8px 4px 6px',
        background: selected ? 'rgba(90,130,160,.38)' : 'transparent',
        border: selected ? '1px dotted #9FB6C4' : '1px solid transparent',
        cursor: 'pointer',
        textAlign: 'center',
        userSelect: 'none',
        fontFamily: SANS,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>{app.icon}</div>
      <div
        style={{
          fontSize: 11.5,
          color: '#E2EAEF',
          lineHeight: 1.35,
          textShadow: '0 1px 3px rgba(0,0,0,.8)',
        }}
      >
        {app.label}
      </div>
    </div>
  );
}
import { SANS } from './style.js';
import { startDrag } from './drag.js';

export function PostIt({ note, z, onDrag, onFocus }) {
  const start = (e) => {
    onFocus();
    const b = { r: note.r, y: note.y };
    startDrag(e, (dx, dy) =>
      onDrag(Math.max(4, b.r - dx), Math.min(window.innerHeight - 80, Math.max(0, b.y + dy)))
    );
  };

  return (
    <div
      onMouseDown={start}
      onTouchStart={start}
      style={{
        position: 'absolute',
        right: note.r,
        top: note.y,
        width: 156,
        background: note.color,
        boxShadow: '0 3px 10px rgba(0,0,0,.38)',
        zIndex: z,
        fontFamily: SANS,
        userSelect: 'none',
      }}
    >
      <div
        style={{
          background: note.head,
          height: 22,
          display: 'flex',
          alignItems: 'center',
          padding: '0 8px',
          cursor: 'move',
          color: '#3A3A32',
          fontSize: 11,
        }}
      >
        <span>{note.title}</span>
        <span style={{ marginLeft: 'auto', color: '#5E5E52' }}>⋯</span>
      </div>
      <div
        style={{
          padding: '9px 11px 12px',
          fontSize: 12.5,
          lineHeight: 1.7,
          color: '#2E2E28',
          whiteSpace: 'pre-wrap',
        }}
      >
        {note.text}
      </div>
    </div>
  );
}
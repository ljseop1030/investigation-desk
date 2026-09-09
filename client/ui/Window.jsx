import { C, SANS, btnWin } from './style.js';
import { startDrag } from './drag.js';

// z는 부모가 배열로 들고 있는다. 창이 자기 z를 가지면 '맨 앞으로'를 계산할 수 없다.
export function Window({ win, focused, onFocus, onClose, onMin, onDrag, onResize, children }) {
  const startMove = (e) => {
    onFocus();
    const b = { x: win.x, y: win.y };
    startDrag(e, (dx, dy) => onDrag(Math.max(0, b.x + dx), Math.max(0, b.y + dy)));
  };

  const startResize = (e) => {
    e.stopPropagation();
    onFocus();
    const b = { w: win.w, h: win.h };
    startDrag(e, (dx, dy) => onResize(Math.max(360, b.w + dx), Math.max(240, b.h + dy)));
  };

  if (win.min) return null;

  return (
    <div
      onMouseDown={onFocus}
      style={{
        position: 'absolute',
        left: win.x,
        top: win.y,
        width: win.w,
        height: win.h,
        zIndex: win.z,
        background: C.chrome,
        border: `1px solid ${focused ? C.bar : C.chromeEdge}`,
        boxShadow: focused ? '0 12px 34px rgba(0,0,0,.45)' : '0 4px 14px rgba(0,0,0,.28)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: SANS,
      }}
    >
      <div
        onMouseDown={startMove}
        onTouchStart={startMove}
        style={{
          height: 30,
          background: focused ? C.bar : C.barDim,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          padding: '0 4px 0 10px',
          cursor: 'move',
          userSelect: 'none',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 12.5 }}>{win.title}</span>
        <div style={{ marginLeft: 'auto', display: 'flex' }}>
          {onMin && (
            <button onClick={onMin} style={btnWin}>
              —
            </button>
          )}
          <button onClick={onClose} style={{ ...btnWin, color: '#ffd9d0' }}>
            ✕
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', background: C.paper }}>
        {children}
      </div>

      <div
        onMouseDown={startResize}
        onTouchStart={startResize}
        style={{ position: 'absolute', right: 0, bottom: 0, width: 16, height: 16, cursor: 'nwse-resize' }}
      >
        <svg viewBox="0 0 16 16" width="16" height="16">
          <path d="M15 6L6 15M15 11l-4 4" stroke={C.chromeEdge} strokeWidth="1.4" />
        </svg>
      </div>
    </div>
  );
}
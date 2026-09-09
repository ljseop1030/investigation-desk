import { startDrag } from './drag.js';

// z는 부모가 배열로 들고 있는다. 창이 자기 z를 가지면 '맨 앞으로'를 계산할 수 없다.
// 크기는 width/height를 직접 바꾼다. transform: scale을 쓰면 픽셀 폰트가 흐려진다.
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
      className={`win${focused ? ' is-focused' : ''}`}
      style={{ left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.z }}
    >
      <div className="win-bar px" onMouseDown={startMove} onTouchStart={startMove}>
        <span className="win-title">{win.title}</span>
        <div className="win-buttons">
          {onMin && (
            <button className="win-btn px" onClick={onMin} aria-label="최소화">
              _
            </button>
          )}
          <button className="win-btn px" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </div>
      </div>

      <div className="win-body">{children}</div>

      <div className="win-grip" onMouseDown={startResize} onTouchStart={startResize}>
        <svg viewBox="0 0 16 16" width="16" height="16" shapeRendering="crispEdges" aria-hidden="true">
          <rect x="11" y="11" width="2" height="2" fill="#5C666F" />
          <rect x="8" y="11" width="2" height="2" fill="#5C666F" />
          <rect x="11" y="8" width="2" height="2" fill="#5C666F" />
          <rect x="5" y="11" width="2" height="2" fill="#8E979F" />
          <rect x="11" y="5" width="2" height="2" fill="#8E979F" />
          <rect x="8" y="8" width="2" height="2" fill="#8E979F" />
        </svg>
      </div>
    </div>
  );
}
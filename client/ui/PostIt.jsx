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
      className="postit"
      style={{ right: note.r, top: note.y, background: note.color, zIndex: z }}
    >
      <div className="postit-bar" style={{ background: note.head }}>
        <span>{note.title}</span>
      </div>
      <div className="postit-body">{note.text}</div>
    </div>
  );
}

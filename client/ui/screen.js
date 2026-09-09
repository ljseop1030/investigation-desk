import { useState } from 'react';

// 창 목록·아이콘 위치·포스트잇 좌표. 게임 진행이 아니라 화면 배치라 core에 두지 않는다.
// P4에서 저장할 때 여기 것을 한 번에 걷어간다.

const OFFSET = { x: 150, y: 50, step: 40, stepY: 34 };

const initIcons = (apps) =>
  Object.fromEntries(apps.map((a, i) => [a.id, { x: 16, y: 16 + i * 96 }]));

const initNotes = (notes) =>
  notes.map((n, i) => ({ ...n, r: n.pos.r, y: n.pos.y, z: 300 + i }));

export function useScreen({ apps, notes: noteDefs }) {
  const [wins, setWins] = useState([]);
  const [top, setTop] = useState(null);
  const [icons, setIcons] = useState(() => initIcons(apps));
  const [notes, setNotes] = useState(() => initNotes(noteDefs));
  const [noteTop, setNoteTop] = useState(300 + noteDefs.length);

  const maxZ = (ws) => (ws.length ? Math.max(...ws.map((w) => w.z)) : 0);

  const focus = (id) => {
    setTop(id);
    setWins((ws) => ws.map((w) => (w.id === id ? { ...w, z: maxZ(ws) + 1, min: false } : w)));
  };

  const open = (app) => {
    setWins((ws) => {
      if (ws.some((w) => w.id === app.id)) {
        return ws.map((w) => (w.id === app.id ? { ...w, z: maxZ(ws) + 1, min: false } : w));
      }
      const n = ws.length;
      return [
        ...ws,
        {
          id: app.id,
          title: app.title,
          x: OFFSET.x + n * OFFSET.step,
          y: OFFSET.y + n * OFFSET.stepY,
          w: app.w,
          h: app.h,
          z: maxZ(ws) + 1,
          min: false,
        },
      ];
    });
    setTop(app.id);
  };

  const patch = (id, next) => setWins((ws) => ws.map((w) => (w.id === id ? { ...w, ...next } : w)));

  return {
    wins,
    top,
    icons,
    notes,
    open,
    focus,
    close: (id) => setWins((ws) => ws.filter((w) => w.id !== id)),
    minimize: (id) => patch(id, { min: true }),
    move: (id, x, y) => patch(id, { x, y }),
    resize: (id, w, h) => patch(id, { w, h }),
    moveIcon: (id, x, y) => setIcons((p) => ({ ...p, [id]: { x, y } })),
    moveNote: (i, r, y) => setNotes((ns) => ns.map((n, j) => (j === i ? { ...n, r, y } : n))),
    raiseNote: (i) => {
      setNoteTop((t) => t + 1);
      setNotes((ns) => ns.map((n, j) => (j === i ? { ...n, z: noteTop + 1 } : n)));
    },
  };
}
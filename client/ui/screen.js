import { useState } from 'react';

// 창 목록·아이콘 위치·포스트잇 좌표. 게임 진행이 아니라 화면 배치라 core에 두지 않는다.
// P4에서 저장할 때 여기 것을 한 번에 걷어간다.

const OFFSET = { x: 150, y: 50, step: 40, stepY: 34 };

// 창은 언제나 포스트잇 위에 있다. 같은 z 대역에서 다투게 두면 순서가 뒤집힌다.
const WIN_Z = 1000;
const NOTE_Z = 10;

const initIcons = (apps) =>
  Object.fromEntries(apps.map((a, i) => [a.id, { x: 16, y: 16 + i * 96 }]));

// 포스트잇에 적힌 계정은 앱에서 가져온다. 콘텐츠에 두 번 적지 않기 위해서다.
const noteText = (app, memo) => {
  const lines = app ? [app.private?.user, app.private?.pw].filter(Boolean).join('\n') : '';
  return memo ? `${lines}\n\n${memo}` : lines;
};

// TODO(P4-save): 좌표를 배열 인덱스가 아니라 note.id로 들고 있을 것.
// 콘텐츠에서 순서가 바뀌면 좌표가 엉뚱한 쪽지에 붙는다.
const initNotes = (noteDefs, apps) =>
  noteDefs.map((n, i) => {
    const app = apps.find((a) => a.id === n.ref);
    return {
      ...n,
      title: n.title ?? app?.short ?? app?.label ?? n.ref,
      text: n.text ?? noteText(app, n.memo),
      r: n.pos.r,
      y: n.pos.y,
      z: NOTE_Z + i,
    };
  });

export function useScreen({ apps, notes: noteDefs }) {
  const [wins, setWins] = useState([]);
  const [top, setTop] = useState(null);
  const [icons, setIcons] = useState(() => initIcons(apps));
  const [notes, setNotes] = useState(() => initNotes(noteDefs, apps));
  const [noteTop, setNoteTop] = useState(NOTE_Z + noteDefs.length);

  const maxZ = (ws) => (ws.length ? Math.max(...ws.map((w) => w.z)) : WIN_Z);

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
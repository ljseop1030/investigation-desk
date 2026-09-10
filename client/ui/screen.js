import { useState } from 'react';

// 창 목록·아이콘 위치·포스트잇 좌표. 게임 진행이 아니라 화면 배치라 core에 두지 않는다.
// 저장은 하되 progress와 같은 레벨에 두지 않는다. P10에서 진행만 서버로 간다.

const OFFSET = { x: 150, y: 50, step: 40, stepY: 34 };

// 창은 언제나 포스트잇 위에 있다. 같은 z 대역에서 다투게 두면 순서가 뒤집힌다.
const WIN_Z = 1000;
const NOTE_Z = 10;

// 앱이 아닌 창(필수 공지 등). 부팅 때 알아서 다시 뜨므로 저장하지 않는다.
const isTransient = (id) => String(id).startsWith('__');

const initIcons = (apps) =>
  Object.fromEntries(apps.map((a, i) => [a.id, { x: 16, y: 16 + i * 96 }]));

// 포스트잇에 적힌 계정은 앱에서 가져온다. 콘텐츠에 두 번 적지 않기 위해서다.
const noteText = (app, memo) => {
  const lines = app ? [app.private?.user, app.private?.pw].filter(Boolean).join('\n') : '';
  return memo ? `${lines}\n\n${memo}` : lines;
};

// 좌표는 id로 붙인다. 배열 인덱스로 두면 콘텐츠에서 순서가 바뀐 날
// 좌표가 엉뚱한 쪽지에 붙는다.
const initNotes = (noteDefs, apps, savedNotes) =>
  noteDefs.map((n, i) => {
    const app = apps.find((a) => a.id === n.ref);
    const saved = savedNotes?.find((x) => x.id === n.id);
    return {
      ...n,
      title: n.title ?? app?.short ?? app?.label ?? n.ref,
      text: n.text ?? noteText(app, n.memo),
      r: saved?.r ?? n.pos.r,
      y: saved?.y ?? n.pos.y,
      z: saved?.z ?? NOTE_Z + i,
    };
  });

export function useScreen({ apps, notes: noteDefs, saved }) {
  const [wins, setWins] = useState(() => saved?.wins ?? []);
  const [top, setTop] = useState(() => saved?.top ?? null);
  const [icons, setIcons] = useState(() => ({ ...initIcons(apps), ...(saved?.icons ?? {}) }));
  const [notes, setNotes] = useState(() => initNotes(noteDefs, apps, saved?.notes));
  const [noteTop, setNoteTop] = useState(() => saved?.noteTop ?? NOTE_Z + noteDefs.length);

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
  const patchNote = (id, next) =>
    setNotes((ns) => ns.map((n) => (n.id === id ? { ...n, ...next } : n)));

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
    moveNote: (id, r, y) => patchNote(id, { r, y }),
    raiseNote: (id) => {
      setNoteTop((t) => t + 1);
      patchNote(id, { z: noteTop + 1 });
    },

    // 저장에 나가는 모양. 파생값(제목·본문)은 콘텐츠에서 다시 만든다.
    snapshot: () => ({
      wins: wins.filter((w) => !isTransient(w.id)),
      top: isTransient(top) ? null : top,
      icons,
      notes: notes.map(({ id, r, y, z }) => ({ id, r, y, z })),
      noteTop,
    }),
  };
}
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import S from './strings.js';

const Ctx = createContext(null);
export const useGame = () => useContext(Ctx);

// core 구독은 여기 한 군데. setState는 events.on 콜백 안에서만 부른다.
// 사용자 입력은 actions로 나가고 돌아오는 건 이벤트뿐이라 단방향이다.
export function GameProvider({ actions, view, events, content, children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const notify = useCallback((t) => {
    clearTimeout(timer.current);
    setToast(t);
    timer.current = setTimeout(() => setToast(null), t.kind === 'msg' ? 6000 : 4500);
  }, []);

  const dismissToast = useCallback(() => {
    clearTimeout(timer.current);
    setToast(null);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    const recordTitle = (id) => content.records.find((r) => r.id === id)?.title ?? id;
    const formTitle = (id) => content.forms.find((f) => f.id === id)?.title ?? id;
    const who = (cid) => {
      const c = content.characters.find((x) => x.id === cid);
      return c ? `${c.name} ${c.rank ?? ''}`.trim() : cid;
    };

    const off = [
      events.on('record:requested', () =>
        notify({ kind: 'sys', text: S.toast.requestReceived })),

      events.on('record:unlocked', ({ recordId }) =>
        notify({ kind: 'sys', text: S.toast.dbApproved(recordTitle(recordId)) })),

      events.on('record:registered', ({ recordId }) =>
        notify({ kind: 'sys', text: S.toast.dbRegistered(recordTitle(recordId)) })),

      events.on('form:graded', ({ formId, pass, bad }) =>
        notify({
          kind: 'sys',
          text: pass
            ? S.toast.formAccepted(formTitle(formId))
            : S.toast.formRejected(formTitle(formId), bad.length),
        })),

      // 말풍선 묶음의 마지막에만. 세 개 오면 세 번 뜬다.
      events.on('message', (m) => {
        if (m.me || !m.last) return;
        notify({ kind: 'msg', cid: m.cid, who: who(m.cid) });
      }),

      events.on('character:burned', () =>
        notify({ kind: 'sys', text: S.toast.contactNotFound })),
    ];

    return () => off.forEach((f) => f());
  }, [events, content, notify]);

  const value = useMemo(
    () => ({ actions, view, content, toast, notify, dismissToast }),
    [actions, view, content, toast, notify, dismissToast]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
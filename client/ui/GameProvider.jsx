import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { RECORD } from '../../core/view.js';
import { STATUS } from '../../shared/enums.js';
import S from './strings.js';

const Ctx = createContext(null);
export const useGame = () => useContext(Ctx);

// core 구독은 여기 한 군데. setState는 events.on 콜백 안에서만 부른다.
// 사용자 입력은 actions로 나가고 돌아오는 건 이벤트뿐이라 단방향이다.
export function GameProvider({ actions, view, events, content, children }) {
  const [toast, setToast] = useState(null);
  const [authed, setAuthed] = useState(() =>
    Object.fromEntries(content.apps.map((a) => [a.id, view.isAuthed(a.id)]))
  );
  const [recordStates, setRecordStates] = useState(() =>
    Object.fromEntries(content.records.map((r) => [r.id, view.recordState(r.id)]))
  );
  const [formStates, setFormStates] = useState(() =>
    Object.fromEntries(
      content.forms.map((f) => {
        const saved = view.form(f.id);
        return [
          f.id,
          saved ? { status: saved.status, marks: saved.marks } : { status: STATUS.DRAFT, marks: null },
        ];
      })
    )
  );
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
      events.on('record:requested', ({ recordId }) => {
        setRecordStates((s) => ({ ...s, [recordId]: RECORD.PENDING }));
        notify({ kind: 'sys', text: S.toast.requestReceived });
      }),

      events.on('record:unlocked', ({ recordId }) => {
        setRecordStates((s) => ({ ...s, [recordId]: RECORD.OPEN }));
        notify({ kind: 'sys', text: S.toast.dbApproved(recordTitle(recordId)) });
      }),

      events.on('record:registered', ({ recordId }) => {
        setRecordStates((s) => ({ ...s, [recordId]: RECORD.OPEN }));
        notify({ kind: 'sys', text: S.toast.dbRegistered(recordTitle(recordId)) });
      }),

      events.on('form:submitted', ({ formId }) =>
        setFormStates((s) => ({ ...s, [formId]: { status: STATUS.REVIEW, marks: null } }))),

      events.on('form:graded', ({ formId, pass, bad }) => {
        setFormStates((s) => ({ ...s, [formId]: { status: STATUS.DONE, marks: { pass, bad } } }));
        notify({
          kind: 'sys',
          text: pass
            ? S.toast.formAccepted(formTitle(formId))
            : S.toast.formRejected(formTitle(formId), bad.length),
        });
      }),

      // 말풍선 묶음의 마지막에만. 세 개 오면 세 번 뜬다.
      events.on('message', (m) => {
        if (m.me || !m.last) return;
        notify({ kind: 'msg', cid: m.cid, who: who(m.cid) });
      }),

      events.on('character:burned', () =>
        notify({ kind: 'sys', text: S.toast.contactNotFound })),

      events.on('app:authed', ({ appId }) =>
        setAuthed((a) => ({ ...a, [appId]: true }))),
    ];

    return () => off.forEach((f) => f());
  }, [events, content, notify]);

  const value = useMemo(
    () => ({ actions, view, content, authed, recordStates, formStates, toast, notify, dismissToast }),
    [actions, view, content, authed, recordStates, formStates, toast, notify, dismissToast]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
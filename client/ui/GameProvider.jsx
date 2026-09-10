import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { RECORD } from '../../core/view.js';
import { STATUS } from '../../shared/enums.js';
import { fmt } from './format.js';

const Ctx = createContext(null);
export const useGame = () => useContext(Ctx);

// core 구독은 여기 한 군데. setState는 events.on 콜백 안에서만 부른다.
// 사용자 입력은 actions로 나가고 돌아오는 건 이벤트뿐이라 단방향이다.
export function GameProvider({ actions, view, events, content, watching, children }) {
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
  const [chats, setChats] = useState(() => view.chats());
  const [typing, setTyping] = useState({});
  const [seenAt, setSeenAt] = useState({});
  const [outsider, setOutsider] = useState(() => view.outsider());
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
    const T = content.systems;

    const off = [
      events.on('record:requested', ({ recordId }) => {
        setRecordStates((s) => ({ ...s, [recordId]: RECORD.PENDING }));
        notify({ kind: 'sys', text: T.db.requestReceived });
      }),

      events.on('record:unlocked', ({ recordId }) => {
        setRecordStates((s) => ({ ...s, [recordId]: RECORD.OPEN }));
        notify({ kind: 'sys', text: fmt(T.db.approved, { title: recordTitle(recordId) }) });
      }),

      events.on('record:registered', ({ recordId }) => {
        setRecordStates((s) => ({ ...s, [recordId]: RECORD.OPEN }));
        notify({ kind: 'sys', text: fmt(T.db.registered, { title: recordTitle(recordId) }) });
      }),

      events.on('form:submitted', ({ formId }) =>
        setFormStates((s) => ({ ...s, [formId]: { status: STATUS.REVIEW, marks: null } }))),

      events.on('form:graded', ({ formId, pass, bad }) => {
        setFormStates((s) => ({ ...s, [formId]: { status: STATUS.DONE, marks: { pass, bad } } }));
        notify({
          kind: 'sys',
          text: pass
            ? fmt(T.form.accepted, { title: formTitle(formId) })
            : fmt(T.form.rejected, { title: formTitle(formId), n: bad.length }),
        });
      }),

      events.on('message', (m) => {
        setChats((c) => ({ ...c, [m.cid]: [...(c[m.cid] ?? []), { ...m }] }));
        if (m.me || !m.last) return;
        if (watching?.current === m.cid) return;   // 지금 보고 있는 대화면 조용히
        notify({ kind: 'msg', cid: m.cid, who: who(m.cid) });
      }),

      events.on('read', ({ cid }) =>
        setChats((c) => ({ ...c, [cid]: (c[cid] ?? []).map((m) => (m.me ? { ...m, read: true } : m)) }))),

      events.on('typing', ({ cid, on }) => setTyping((t) => ({ ...t, [cid]: on }))),

      events.on('chat:seen', ({ cid }) => setSeenAt((s) => ({ ...s, [cid]: Date.now() }))),

      events.on('character:appeared', () => setOutsider('live')),

      events.on('character:burned', () => {
        setOutsider('burned');
        notify({ kind: 'sys', text: T.msg.contactNotFound });
      }),

      events.on('app:authed', ({ appId }) =>
        setAuthed((a) => ({ ...a, [appId]: true }))),
    ];

    return () => off.forEach((f) => f());
  }, [events, content, notify, watching]);

  const value = useMemo(
    () => ({
      actions, view, content,
      authed, recordStates, formStates,
      chats, typing, seenAt, outsider,
      toast, notify, dismissToast,
    }),
    [actions, view, content, authed, recordStates, formStates, chats, typing, seenAt, outsider, toast, notify, dismissToast]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
import { useState } from 'react';
import { STATUS } from '../../shared/enums.js';
import { C, MONO, SANS, btnPrimary } from './style.js';
import S from './strings.js';
import { useGame } from './GameProvider.jsx';

export function Collector() {
  const { content, actions, formStates } = useGame();
  const forms = content.forms;

  const [open, setOpen] = useState(null);
  // 작성 중인 값은 UI가 들고 있는다. core는 제출 순간에만 받는다.
  // 새로고침하면 날아간다. 저장할지는 P4.
  const [draft, setDraft] = useState({});

  const caseLabel = (form) => {
    const c = content.cases.find((x) => x.id === form.case);
    return c ? `${c.no} · ${c.title}` : null;
  };

  const who = (cid) => {
    const c = content.characters.find((x) => x.id === cid);
    return c ? `${c.name} ${c.rank ?? ''}`.trim() : cid;
  };

  const form = forms.find((f) => f.id === open);
  if (!form) {
    return <FormList {...{ forms, formStates, draft, caseLabel, onOpen: setOpen }} />;
  }

  const st = formStates[form.id] ?? { status: STATUS.DRAFT, marks: null };
  const marks = st.marks ?? { pass: false, bad: [] };
  const locked = st.status === STATUS.REVIEW || (st.status === STATUS.DONE && marks.pass);
  const values = draft[form.id] ?? {};

  const setField = (fid, text) =>
    setDraft((d) => ({ ...d, [form.id]: { ...(d[form.id] ?? {}), [fid]: text } }));

  return (
    <div style={{ width: '100%', overflowY: 'auto', padding: '14px 22px 22px', fontSize: 13 }}>
      <button
        onClick={() => setOpen(null)}
        style={{
          background: 'transparent',
          border: 'none',
          color: C.bar,
          fontSize: 11.5,
          cursor: 'pointer',
          padding: '2px 0 8px',
          fontFamily: SANS,
        }}
      >
        {S.collector.backToList}
      </button>

      <div style={{ borderBottom: `2px solid ${C.bar}`, paddingBottom: 9, marginBottom: 6 }}>
        <div style={{ fontSize: 15 }}>{form.title}</div>
        {caseLabel(form) && (
          <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 3 }}>{caseLabel(form)}</div>
        )}
        <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 2 }}>
          {S.collector.requestedBy(who(form.requester), form.due)}
        </div>
      </div>

      <div style={{ fontSize: 11.5, color: C.hint, margin: '10px 0 18px', lineHeight: 1.7 }}>
        {form.guide}
      </div>

      {st.status === STATUS.REVIEW && (
        <div style={{ padding: 12, background: '#EDF1F4', border: `1px solid ${C.line}`, marginBottom: 16 }}>
          {S.collector.reviewBanner}
        </div>
      )}

      {st.status === STATUS.DONE && (
        <div
          style={{
            padding: 12,
            background: marks.pass ? '#E9F2EC' : '#F6EAE6',
            border: `1px solid ${marks.pass ? '#A8CBB6' : '#E0BCB0'}`,
            marginBottom: 16,
            lineHeight: 1.8,
          }}
        >
          <div style={{ color: marks.pass ? C.ok : C.alert, marginBottom: 4 }}>
            {marks.pass ? S.collector.acceptedTitle : S.collector.rejectedTitle(marks.bad.length)}
          </div>
          <div style={{ fontSize: 12, color: C.inkSoft }}>
            {marks.pass ? S.collector.acceptedBody : S.collector.rejectedBody}
          </div>
        </div>
      )}

      {form.fields.map((f, i) => {
        const bad = st.status === STATUS.DONE && marks.bad.includes(f.id);
        const good = st.status === STATUS.DONE && !bad;
        return (
          <div key={f.id} style={{ marginBottom: 15 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 11, color: C.hint, fontFamily: MONO, width: 20 }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span style={{ fontSize: 12.8 }}>{f.label}</span>
              {bad && <span style={{ fontSize: 11, color: C.alert }}>{S.collector.fieldBad}</span>}
              {good && <span style={{ fontSize: 11, color: C.ok }}>{S.collector.fieldOk}</span>}
            </div>
            <div style={{ fontSize: 11, color: C.hint, margin: '3px 0 5px 26px', lineHeight: 1.6 }}>
              {f.hint}
            </div>
            <input
              value={values[f.id] ?? ''}
              disabled={locked}
              onChange={(e) => setField(f.id, e.target.value)}
              style={{
                width: 'calc(100% - 26px)',
                marginLeft: 26,
                border: `1px solid ${bad ? C.alert : C.line}`,
                borderWidth: '0 0 1px 0',
                padding: '5px 2px',
                fontSize: 12.8,
                fontFamily: SANS,
                background: 'transparent',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        );
      })}

      <button
        onClick={() => actions.submitForm(form.id, values)}
        disabled={locked}
        style={{ ...btnPrimary, marginTop: 8, padding: '9px 26px', opacity: locked ? 0.4 : 1 }}
      >
        {st.status === STATUS.DONE && !marks.pass ? S.common.resubmit : S.common.submit}
      </button>
    </div>
  );
}

function FormList({ forms, formStates, draft, caseLabel, onOpen }) {
  const { content } = useGame();

  return (
    <div style={{ width: '100%', overflowY: 'auto', padding: '18px 20px', fontSize: 13 }}>
      <div style={{ borderBottom: `2px solid ${C.bar}`, paddingBottom: 9, marginBottom: 4 }}>
        <div style={{ fontSize: 15 }}>{S.collector.listTitle}</div>
        <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 3 }}>
          {S.collector.listSubtitle(content.TEAM)}
        </div>
      </div>

      <div style={{ fontSize: 11.5, color: C.hint, margin: '10px 0 16px', lineHeight: 1.7 }}>
        {S.collector.listGuide}
      </div>

      {forms.map((f) => {
        const st = formStates[f.id] ?? { status: STATUS.DRAFT, marks: null };
        const marks = st.marks ?? { pass: false, bad: [] };
        const done = st.status === STATUS.DONE && marks.pass;
        const filled = f.fields.filter((x) => (draft[f.id]?.[x.id] ?? '').trim()).length;

        const label =
          done ? S.collector.statusDone
          : st.status === STATUS.REVIEW ? S.collector.statusReview
          : st.status === STATUS.DONE ? S.collector.statusRejected(marks.bad.length)
          : S.collector.statusDraft(filled, f.fields.length);

        return (
          <button
            key={f.id}
            onClick={() => onOpen(f.id)}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              background: done ? '#EFF1F2' : '#fff',
              border: `1px solid ${C.line}`,
              borderLeft: `3px solid ${done ? '#9AA4AC' : st.status === STATUS.REVIEW ? '#8FA9BE' : C.bar}`,
              padding: '11px 13px',
              marginBottom: 8,
              cursor: 'pointer',
              fontFamily: SANS,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 13, color: done ? C.hint : C.ink }}>
                {done ? '✓ ' : ''}
                {f.title}
              </span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: done ? C.ok : C.inkSoft }}>
                {label}
              </span>
            </div>
            <div style={{ fontSize: 11, color: C.hint, marginTop: 4 }}>
              {[caseLabel(f), S.collector.deadline(f.due)].filter(Boolean).join(' · ')}
            </div>
          </button>
        );
      })}
    </div>
  );
}
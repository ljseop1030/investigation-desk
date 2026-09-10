import { useState } from 'react';
import { STATUS } from '../../shared/enums.js';
import S from './strings.js';
import { fmt } from './format.js';
import { useGame } from './GameProvider.jsx';

export function Collector() {
  const { content, actions, view, formStates } = useGame();
  const forms = content.forms;
  const T = content.systems.form;

  const [open, setOpen] = useState(null);
  // 화면은 UI가 들고 그린다. 같은 값을 core에도 넘겨 저장되게 한다.
  // 관공서 양식이 새로고침으로 날아가는 건 농담이 아니라 오류다.
  const [draft, setDraft] = useState(() =>
    Object.fromEntries(forms.map((f) => [f.id, view.form(f.id)?.draft ?? {}]))
  );

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

  const setField = (fid, text) => {
    const next = { ...values, [fid]: text };
    setDraft((d) => ({ ...d, [form.id]: next }));
    actions.saveDraft(form.id, next);
  };

  return (
    <div className="form-pane">
      <button className="link" style={{ marginBottom: 10 }} onClick={() => setOpen(null)}>
        {S.collector.backToList}
      </button>

      <div className="form-head">
        <div className="doc-title">{form.title}</div>
        {caseLabel(form) && <div className="form-meta">{caseLabel(form)}</div>}
        <div className="form-meta">{fmt(S.collector.requestedBy, { who: who(form.requester) })}</div>
      </div>

      <div className="form-guide">{form.guide}</div>

      {st.status === STATUS.REVIEW && <div className="banner">{T.reviewBanner}</div>}

      {st.status === STATUS.DONE && (
        <div className={`banner ${marks.pass ? 'is-ok' : 'is-bad'}`}>
          <div className={`banner-title ${marks.pass ? 'is-ok' : 'is-bad'}`}>
            {marks.pass ? T.acceptedTitle : fmt(T.rejectedTitle, { n: marks.bad.length })}
          </div>
          <div className="banner-body">{marks.pass ? T.acceptedBody : T.rejectedBody}</div>
        </div>
      )}

      {form.fields.map((f, i) => {
        const bad = st.status === STATUS.DONE && marks.bad.includes(f.id);
        const good = st.status === STATUS.DONE && !bad;
        return (
          <div key={f.id} className="field-row">
            <div className="field-head">
              <span className="field-no">{String(i + 1).padStart(2, '0')}</span>
              <span>{f.label}</span>
              {bad && <span className="field-mark is-bad">{T.fieldBad}</span>}
              {good && <span className="field-mark is-ok">{T.fieldOk}</span>}
            </div>
            <div className="field-hint">{f.hint}</div>
            <input
              className={`field-input${bad ? ' is-bad' : ''}`}
              value={values[f.id] ?? ''}
              disabled={locked}
              onChange={(e) => setField(f.id, e.target.value)}
            />
          </div>
        );
      })}

      <button
        className="btn btn-default"
        style={{ marginTop: 8 }}
        onClick={() => actions.submitForm(form.id, values)}
        disabled={locked}
      >
        {st.status === STATUS.DONE && !marks.pass ? S.common.resubmit : S.common.submit}
      </button>
    </div>
  );
}

function FormList({ forms, formStates, draft, caseLabel, onOpen }) {
  const { content } = useGame();
  const T = content.systems.form;

  return (
    <div className="form-pane">
      <div className="form-head">
        <div className="doc-title">{S.collector.listTitle}</div>
        <div className="form-meta">{fmt(T.listSubtitle, { team: content.TEAM })}</div>
      </div>

      <div className="form-guide">{T.listGuide}</div>

      {forms.map((f) => {
        const st = formStates[f.id] ?? { status: STATUS.DRAFT, marks: null };
        const marks = st.marks ?? { pass: false, bad: [] };
        const done = st.status === STATUS.DONE && marks.pass;
        const filled = f.fields.filter((x) => (draft[f.id]?.[x.id] ?? '').trim()).length;

        const label =
          done ? T.statusDone
          : st.status === STATUS.REVIEW ? T.statusReview
          : st.status === STATUS.DONE ? fmt(T.statusRejected, { n: marks.bad.length })
          : fmt(T.statusDraft, { filled, total: f.fields.length });

        return (
          <button
            key={f.id}
            onClick={() => onOpen(f.id)}
            className={`form-card${done ? ' is-done' : ''}`}
          >
            <div className="form-card-row">
              <span>{f.title}</span>
              <span className={`form-card-status${done ? ' is-ok' : ''}`}>{label}</span>
            </div>
            <div className="form-card-sub">{caseLabel(f)}</div>
          </button>
        );
      })}
    </div>
  );
}
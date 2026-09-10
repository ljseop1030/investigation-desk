import { useState } from 'react';
import { RECORD } from '../../core/view.js';
import S from './strings.js';
import { useGame } from './GameProvider.jsx';

// 미등록은 점 하나, 제한열람은 자물쇠. 이모지 대신 글자로 둔다.
const MARK = { [RECORD.MISSING]: '· ', [RECORD.LOCKED]: '● ', [RECORD.PENDING]: '● ' };

export function RecordsDb() {
  const { content, actions, view, recordStates } = useGame();
  const records = content.records;

  const [sel, setSel] = useState(records[0]?.id);
  const [why, setWhy] = useState('');

  const doc = records.find((r) => r.id === sel) ?? records[0];
  const st = recordStates[doc.id];
  const cats = [...new Set(records.map((r) => r.category))];

  const request = () => {
    if (why.trim().length < 5) return;
    actions.requestRecord(doc.id, why);
    setWhy('');
  };

  return (
    <div className="split">
      <div className="list-pane">
        <div className="list-head px">{S.db.allRecords}</div>

        {cats.map((cat) => (
          <div key={cat}>
            <div className="list-group px">{cat}</div>
            {records
              .filter((r) => r.category === cat)
              .map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    setSel(r.id);
                    setWhy('');
                  }}
                  className={
                    'list-item' +
                    (sel === r.id ? ' is-sel' : '') +
                    (recordStates[r.id] === RECORD.MISSING ? ' is-dim' : '')
                  }
                >
                  {MARK[recordStates[r.id]] ?? ''}
                  {r.title}
                </button>
              ))}
          </div>
        ))}
      </div>

      <div className="doc-pane">
        <div className="doc-title">{doc.title}</div>
        <div className="doc-meta">
          {doc.category} {S.db.categorySuffix}
        </div>

        {st === RECORD.MISSING && <div className="notice-box">{S.db.unregistered}</div>}

        {st === RECORD.OPEN && <pre className="doc-body-mono">{view.recordBody(doc.id)}</pre>}

        {st === RECORD.PENDING && <div className="notice-box">{S.db.pending}</div>}

        {st === RECORD.LOCKED && (
          <div className="gate-box">
            <div className="gate-reason">{doc.reason}</div>
            <textarea
              className="field"
              style={{ height: 56, resize: 'none' }}
              value={why}
              onChange={(e) => setWhy(e.target.value)}
              placeholder={S.db.reasonPlaceholder}
            />
            <button className="btn btn-default" style={{ marginTop: 8 }} onClick={request}>
              {S.db.requestButton}
            </button>
            <div className="gate-note">{S.db.logged}</div>
          </div>
        )}
      </div>
    </div>
  );
}
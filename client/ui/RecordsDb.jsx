import { useMemo, useState } from 'react';
import { RECORD } from '../../core/view.js';
import S from './strings.js';
import { useGame } from './GameProvider.jsx';

// 미등록은 점 하나, 제한열람은 자물쇠. 이모지 대신 글자로 둔다.
const MARK = { [RECORD.MISSING]: '· ', [RECORD.LOCKED]: '● ', [RECORD.PENDING]: '● ' };

export function RecordsDb() {
  const { content, actions, view, recordStates } = useGame();
  const T = content.systems.db;

  // 목록에 무엇이 뜨는지는 view가 정한다. 여기서 access를 보고 거르면
  // 카테고리 머리·선택 초기값·본문 세 군데가 각자 판단하게 된다.
  //
  // 첫 프레임에 한 번만 읽는다. HIDDEN은 access만 보고 갈리므로 진행에
  // 따라 목록에서 나타나거나 사라지는 자료는 없다. 그게 바뀌는 날에는
  // 이벤트로 받아야 하고, 그때는 이 주석이 먼저 걸린다.
  const records = useMemo(() => {
    const byId = new Map(content.records.map((r) => [r.id, r]));
    return view.visibleRecordIds().map((id) => byId.get(id));
  }, [content, view]);

  const [sel, setSel] = useState(records[0]?.id);
  const [why, setWhy] = useState('');

  const doc = records.find((r) => r.id === sel) ?? records[0];
  const st = doc ? recordStates[doc.id] : null;
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

      {doc && (
        <div className="doc-pane">
          <div className="doc-title">{doc.title}</div>
          <div className="doc-meta">
            {doc.category} {S.db.categorySuffix}
          </div>

          {st === RECORD.MISSING && <div className="notice-box">{T.unregistered}</div>}

          {st === RECORD.OPEN && <pre className="doc-body-mono">{view.recordBody(doc.id)}</pre>}

          {st === RECORD.PENDING && <div className="notice-box">{T.pending}</div>}

          {st === RECORD.LOCKED && (
            <div className="gate-box">
              <div className="gate-reason">{doc.reason}</div>
              <textarea
                className="field"
                style={{ height: 56, resize: 'none' }}
                value={why}
                onChange={(e) => setWhy(e.target.value)}
                placeholder={T.reasonPlaceholder}
              />
              <button className="btn btn-default" style={{ marginTop: 8 }} onClick={request}>
                {T.requestButton}
              </button>
              <div className="gate-note">{T.logged}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
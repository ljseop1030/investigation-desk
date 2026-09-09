import { useState } from 'react';
import { RECORD } from '../../core/view.js';
import { C, MONO, SANS, btnPrimary } from './style.js';
import S from './strings.js';
import { useGame } from './GameProvider.jsx';

const MARK = { [RECORD.MISSING]: '· ', [RECORD.LOCKED]: '🔒 ', [RECORD.PENDING]: '🔒 ' };

export function RecordsDb() {
  const { content, actions, recordStates } = useGame();
  const records = content.records;

  const [sel, setSel] = useState(records[0]?.id);
  const [why, setWhy] = useState('');

  const doc = records.find((r) => r.id === sel) ?? records[0];
  const st = recordStates[doc.id];
  const cats = [...new Set(records.map((r) => r.cat))];

  const request = () => {
    if (why.trim().length < 5) return;
    actions.requestRecord(doc.id, why);
    setWhy('');
  };

  return (
    <div style={{ display: 'flex', width: '100%', fontSize: 13 }}>
      <div style={{ width: 186, borderRight: `1px solid ${C.line}`, background: '#EDEFF1', overflowY: 'auto' }}>
        <div style={{ padding: '8px 10px', fontSize: 11, color: C.inkSoft, borderBottom: `1px solid ${C.line}` }}>
          {S.db.allRecords}
        </div>

        {cats.map((cat) => (
          <div key={cat}>
            <div style={{ padding: '8px 10px 4px', fontSize: 11, color: C.inkSoft }}>{cat}</div>
            {records
              .filter((r) => r.cat === cat)
              .map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    setSel(r.id);
                    setWhy('');
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '6px 10px 6px 16px',
                    border: 'none',
                    borderLeft: sel === r.id ? `3px solid ${C.bar}` : '3px solid transparent',
                    background: sel === r.id ? '#fff' : 'transparent',
                    color: recordStates[r.id] === RECORD.MISSING ? C.hint : C.ink,
                    fontSize: 12.5,
                    cursor: 'pointer',
                    fontFamily: SANS,
                  }}
                >
                  {MARK[recordStates[r.id]] ?? ''}
                  {r.title}
                </button>
              ))}
          </div>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        <div style={{ fontSize: 15, marginBottom: 2 }}>{doc.title}</div>
        <div style={{ fontSize: 11, color: C.inkSoft, marginBottom: 14 }}>
          {doc.cat} {S.db.categorySuffix}
        </div>

        {st === RECORD.MISSING && (
          <div
            style={{
              padding: 16,
              border: `1px dashed ${C.line}`,
              color: C.inkSoft,
              lineHeight: 1.9,
              whiteSpace: 'pre-wrap',
            }}
          >
            {S.db.unregistered}
          </div>
        )}

        {st === RECORD.OPEN && (
          <pre style={{ fontFamily: MONO, fontSize: 12, lineHeight: 1.9, whiteSpace: 'pre-wrap', margin: 0 }}>
            {doc.body}
          </pre>
        )}

        {st === RECORD.PENDING && (
          <div style={{ padding: 14, border: `1px dashed ${C.line}`, color: C.inkSoft }}>
            {S.db.pending}
          </div>
        )}

        {st === RECORD.LOCKED && (
          <div style={{ padding: 14, border: `1px solid ${C.line}`, background: '#fff' }}>
            <div style={{ color: C.alert, marginBottom: 10 }}>{doc.reason}</div>
            <textarea
              value={why}
              onChange={(e) => setWhy(e.target.value)}
              placeholder={S.db.reasonPlaceholder}
              style={{
                width: '100%',
                height: 56,
                border: `1px solid ${C.line}`,
                padding: 8,
                fontSize: 12.5,
                fontFamily: SANS,
                resize: 'none',
                boxSizing: 'border-box',
              }}
            />
            <button onClick={request} style={{ ...btnPrimary, marginTop: 8 }}>
              {S.db.requestButton}
            </button>
            <div style={{ fontSize: 10.5, color: C.inkSoft, marginTop: 8 }}>{S.db.logged}</div>
          </div>
        )}
      </div>
    </div>
  );
}
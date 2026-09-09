import { useState } from 'react';
import { C, SANS } from './style.js';
import S from './strings.js';
import { useGame } from './GameProvider.jsx';

export function Polnet() {
  const { content } = useGame();
  const docs = content.polnetDocs;

  const [sel, setSel] = useState(docs[0]?.id);
  const doc = docs.find((d) => d.id === sel) ?? docs[0];
  const cats = [...new Set(docs.map((d) => d.category))];

  return (
    <div style={{ display: 'flex', width: '100%', fontSize: 13 }}>
      <div style={{ width: 176, borderRight: `1px solid ${C.line}`, background: '#EDEFF1', overflowY: 'auto' }}>
        {cats.map((cat) => (
          <div key={cat}>
            <div style={{ padding: '8px 10px 4px', fontSize: 11, color: C.inkSoft }}>{cat}</div>
            {docs
              .filter((d) => d.category === cat)
              .map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSel(d.id)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '6px 10px 6px 16px',
                    border: 'none',
                    borderLeft: sel === d.id ? `3px solid ${C.bar}` : '3px solid transparent',
                    background: sel === d.id ? '#fff' : 'transparent',
                    color: C.ink,
                    fontSize: 12.5,
                    cursor: 'pointer',
                    fontFamily: SANS,
                  }}
                >
                  {d.title}
                </button>
              ))}
          </div>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        <div style={{ fontSize: 15, marginBottom: 2 }}>{doc.title}</div>
        <div style={{ fontSize: 11, color: C.inkSoft, marginBottom: 14 }}>
          {S.polnet.posted(content.TEAM)}
          {doc.date ? ` · ${doc.date}` : ''}
        </div>
        <pre style={{ fontFamily: SANS, fontSize: 12.8, lineHeight: 1.85, whiteSpace: 'pre-wrap', margin: 0 }}>
          {doc.body}
        </pre>
      </div>
    </div>
  );
}
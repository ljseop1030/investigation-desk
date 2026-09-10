import { useState } from 'react';
import S from './strings.js';
import { useGame } from './GameProvider.jsx';

export function Polnet() {
  const { content } = useGame();
  const docs = content.polnetDocs;

  const [sel, setSel] = useState(docs[0]?.id);
  const doc = docs.find((d) => d.id === sel) ?? docs[0];
  const cats = [...new Set(docs.map((d) => d.category))];

  return (
    <div className="split">
      <div className="list-pane">
        {cats.map((cat) => (
          <div key={cat}>
            <div className="list-group px">{cat}</div>
            {docs
              .filter((d) => d.category === cat)
              .map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSel(d.id)}
                  className={`list-item${sel === d.id ? ' is-sel' : ''}`}
                >
                  {d.title}
                </button>
              ))}
          </div>
        ))}
      </div>

      <div className="doc-pane">
        <div className="doc-title">{doc.title}</div>
        <div className="doc-meta">
          {S.polnet.posted(content.TEAM)}
          {doc.date ? ` · ${doc.date}` : ''}
        </div>
        <pre className="doc-body">{doc.body}</pre>
      </div>
    </div>
  );
}
import { useState } from 'react';
import S from './strings.js';
import { useGame } from './GameProvider.jsx';

export function DeviceNotice({ notice, onClose }) {
  const { notify } = useGame();
  const [skip, setSkip] = useState(false);

  return (
    <div className="notice">
      <div className="notice-body">
        <div className="doc-title">{notice.title}</div>
        <div className="doc-meta">{notice.from}</div>

        <p style={{ margin: '0 0 12px' }}>{notice.lead}</p>

        <ol className="notice-list">
          {notice.items.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ol>

        <div className="notice-contact">{notice.contact}</div>
      </div>

      <div className="notice-foot">
        <label className="notice-skip">
          <input type="checkbox" checked={skip} onChange={(e) => setSkip(e.target.checked)} />
          {S.notice.dontShowAgain}
        </label>
        <button
          className="btn btn-default"
          style={{ marginLeft: 'auto' }}
          onClick={() => {
            if (skip) notify({ kind: 'sys', text: S.toast.noticeAlwaysShown });
            onClose();
          }}
        >
          {S.common.confirm}
        </button>
      </div>
    </div>
  );
}
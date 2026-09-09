import { useState } from 'react';
import { C, btnPrimary } from './style.js';
import S from './strings.js';
import { useGame } from './GameProvider.jsx';

export function DeviceNotice({ notice, onClose }) {
  const { notify } = useGame();
  const [skip, setSkip] = useState(false);

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      <div
        style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', fontSize: 12.5, lineHeight: 1.95, color: C.ink }}
      >
        <div style={{ fontSize: 15, marginBottom: 4 }}>{notice.title}</div>
        <div
          style={{
            fontSize: 11,
            color: C.inkSoft,
            marginBottom: 16,
            borderBottom: `1px solid ${C.line}`,
            paddingBottom: 12,
          }}
        >
          {notice.from}
        </div>

        <p style={{ margin: '0 0 14px' }}>{notice.lead}</p>

        <ol style={{ margin: 0, paddingLeft: 18 }}>
          {notice.items.map((t, i) => (
            <li key={i} style={{ marginBottom: i === notice.items.length - 1 ? 0 : 10 }}>
              {t}
            </li>
          ))}
        </ol>

        <div
          style={{ marginTop: 18, paddingTop: 12, borderTop: `1px solid ${C.line}`, fontSize: 11.5, color: C.inkSoft }}
        >
          {notice.contact}
        </div>
      </div>

      <div
        style={{
          borderTop: `1px solid ${C.line}`,
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          background: '#F2F3F5',
        }}
      >
        <label style={{ fontSize: 11.5, color: C.inkSoft, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={skip}
            onChange={(e) => setSkip(e.target.checked)}
            style={{ marginRight: 6 }}
          />
          {S.notice.dontShowAgain}
        </label>
        <button
          onClick={() => {
            if (skip) notify({ kind: 'sys', text: S.toast.noticeAlwaysShown });
            onClose();
          }}
          style={{ ...btnPrimary, marginLeft: 'auto', padding: '7px 26px' }}
        >
          {S.common.confirm}
        </button>
      </div>
    </div>
  );
}
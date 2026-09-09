import { useState } from 'react';
import { C, SANS, btnPrimary, loginInp } from './tokens.js';
import S from './strings.js';

const MAX_TRIES = 5;

// 대조는 actions.authenticate가 한다. 여기는 입력받아 넘기고 결과만 보여준다.
export function LoginGate({ app, onSubmit }) {
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState('');
  const [tries, setTries] = useState(0);

  const go = () => {
    if (onSubmit(u.trim(), p)) return;
    const n = tries + 1;
    setTries(n);
    setErr(n >= 3 ? S.login.failedCount(n, MAX_TRIES) : S.login.failed);
  };

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#EDEFF1',
        fontFamily: SANS,
      }}
    >
      <div style={{ width: 282 }}>
        <div style={{ fontSize: 14.5, marginBottom: 3, color: C.ink }}>{app.title}</div>
        <div style={{ fontSize: 11, color: C.inkSoft, marginBottom: 16, lineHeight: 1.6 }}>
          {app.notice}
        </div>

        <input
          value={u}
          onChange={(e) => setU(e.target.value)}
          placeholder={S.login.idPlaceholder}
          onKeyDown={(e) => e.key === 'Enter' && go()}
          style={loginInp}
        />
        <input
          value={p}
          type="password"
          onChange={(e) => setP(e.target.value)}
          placeholder={S.login.pwPlaceholder}
          onKeyDown={(e) => e.key === 'Enter' && go()}
          style={{ ...loginInp, marginTop: 6 }}
        />

        {err && <div style={{ color: C.alert, fontSize: 11.5, marginTop: 8 }}>{err}</div>}

        <button onClick={go} style={{ ...btnPrimary, width: '100%', marginTop: 12, padding: '9px 0' }}>
          {S.common.login}
        </button>

        <div style={{ fontSize: 10.5, color: C.inkSoft, marginTop: 10, textAlign: 'center' }}>
          {S.login.helpdesk}
        </div>
      </div>
    </div>
  );
}
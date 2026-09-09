import { useState } from 'react';
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

  const onEnter = (e) => e.key === 'Enter' && go();

  return (
    <div className="login">
      <div className="login-box">
        <div className="login-title px">{app.title}</div>
        <div className="login-notice">{app.notice}</div>

        <input
          className="field"
          value={u}
          onChange={(e) => setU(e.target.value)}
          onKeyDown={onEnter}
          placeholder={S.login.idPlaceholder}
        />
        <input
          className="field"
          style={{ marginTop: 6 }}
          type="password"
          value={p}
          onChange={(e) => setP(e.target.value)}
          onKeyDown={onEnter}
          placeholder={S.login.pwPlaceholder}
        />

        {err && <div className="login-err">{err}</div>}

        <button className="btn btn-default btn-wide" style={{ marginTop: 12 }} onClick={go}>
          {S.common.login}
        </button>

        <div className="login-help">{S.login.helpdesk}</div>
      </div>
    </div>
  );
}
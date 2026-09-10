import { useState } from 'react';
import S from './strings.js';
import { fmt } from './format.js';
import { useGame } from './GameProvider.jsx';

const MAX_TRIES = 5;

// 대조는 actions.authenticate가 한다. 여기는 입력받아 넘기고 결과만 보여준다.
// 시스템명은 상자 밖 간판으로 둔다. 상자 안에 제목 막대를 세우면 창 제목 막대와
// 똑같이 생겨서, 층이 둘로 읽히지 않고 창이 겹쳐 그려진 것처럼 보인다.
export function LoginGate({ app, onSubmit }) {
  const { content } = useGame();
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState('');
  const [tries, setTries] = useState(0);

  const go = () => {
    if (onSubmit(u.trim(), p)) return;
    const n = tries + 1;
    setTries(n);
    setErr(n >= 3 ? fmt(S.login.failedCount, { n, max: MAX_TRIES }) : S.login.failed);
  };

  const onEnter = (e) => e.key === 'Enter' && go();

  return (
    <div className="login">
      <div className="login-brand">
        <div className="login-brand-name">{app.title}</div>
        {app.org && <div className="login-brand-org">{app.org}</div>}
      </div>

      <div className="login-box">
        <div className="login-inner">
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

          <div className="login-help">{content.terminal.accountContact}</div>
        </div>
      </div>
    </div>
  );
}
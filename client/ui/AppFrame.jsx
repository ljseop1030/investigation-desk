import { useGame } from './GameProvider.jsx';
import { LoginGate } from './LoginGate.jsx';
import { RecordsDb } from './RecordsDb.jsx';
import { Collector } from './Collector.jsx';

// 창 하나의 내용물. 인증 전이면 로그인 화면.
export function AppFrame({ app }) {
  const { authed, actions } = useGame();

  if (!authed[app.id]) {
    return <LoginGate app={app} onSubmit={(u, p) => actions.authenticate(app.id, u, p)} />;
  }

  if (app.id === 'db') return <RecordsDb />;
  if (app.id === 'form') return <Collector />;

  return <div style={{ padding: 20, fontSize: 13 }}>{app.title}</div>;
}
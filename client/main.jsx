// 임시. P3에서 재수정
import { createRoot } from 'react-dom/client';
import * as content from './content-loader.js';
import { createClock } from '../adapters/clock.js';
import { createScheduler } from '../core/scheduler.js';
import { createState } from '../core/state.js';
import { createView } from '../core/view.js';
import { createEvents } from '../core/events.js';
import { createActions } from '../core/actions.js';
import { createChatRules } from '../core/rules/chat.js';
import { createRecordRules } from '../core/rules/records.js';
import { createFormRules } from '../core/rules/forms.js';
import { createStoryRules } from '../core/rules/story.js';
import { GameProvider, useGame } from './ui/GameProvider.jsx';
import { Desktop } from './ui/Desktop.jsx';
import { LoginGate } from './ui/LoginGate.jsx';
import { Toast } from './ui/Toast.jsx';

const TEMPO = 10;   // 개발 중 배속

const clock = createClock();
const scheduler = createScheduler(clock);
const state = createState();
const view = createView({ state, content });
const events = createEvents();

const actions = createActions({
  content,
  state, scheduler, events, clock,
  rules: {
    chat: createChatRules({ tempo: TEMPO }),
    records: createRecordRules(content.records, { tempo: TEMPO }),
    forms: createFormRules({ tempo: TEMPO }),
    story: createStoryRules(content.story, content.characters),
  },
  // P5까지는 fallback 대사로 돈다
  ai: { reply: async () => { throw new Error('no ai yet'); } },
});

events.on('message', (m) => console.log(m.me ? '나:' : `${m.cid}:`, m.text));
setInterval(actions.tick, 1000);

// 콘솔에서 직접 쳐볼 수 있게
window.game = actions;
window.view = view;

// 창 하나의 내용물. 인증 전이면 로그인 화면.
// 5~8번에서 폴넷·DB·양식·메신저가 여기서 갈린다.
function AppFrame({ app }) {
  const { authed, actions } = useGame();

  if (!authed[app.id]) {
    return <LoginGate app={app} onSubmit={(u, p) => actions.authenticate(app.id, u, p)} />;
  }

  return <div style={{ padding: 20, fontSize: 13 }}>{app.title}</div>;
}

createRoot(document.getElementById('root')).render(
  <GameProvider actions={actions} view={view} events={events} content={content}>
    <Desktop
      apps={content.apps}
      notes={content.notes}
      status={{ ...content.terminal.boot, caseCount: content.cases.length }}
      renderApp={(app) => <AppFrame app={app} />}
    />
    <Toast />
  </GameProvider>
);
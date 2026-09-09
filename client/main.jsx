// 임시. P3에서 재수정
import { useState } from 'react';
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
import { createNoticeRules } from '../core/rules/notices.js';
import { GameProvider } from './ui/GameProvider.jsx';
import { Boot } from './ui/Boot.jsx';
import { Landing } from './ui/Landing.jsx';
import { Shell } from './ui/Shell.jsx';

const TEMPO = 10;   // 개발 중 배속

// 대화를 담는 앱. 토스트가 어느 창을 열어야 하는지 알아야 한다.
const CHAT_APP = 'msg';

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
    notices: createNoticeRules(content.notices, content.characters, { tempo: TEMPO }),
  },
  // P5까지는 fallback 대사로 돈다
  ai: { reply: async () => { throw new Error('no ai yet'); } },
});

events.on('message', (m) => console.log(m.me ? '나:' : `${m.cid}:`, m.text));
setInterval(actions.tick, 1000);

// 콘솔에서 직접 쳐볼 수 있게
window.game = actions;
window.view = view;

// 지금 보고 있는 대화. ref로 두는 이유는 창을 옮겨 다니는 잦은 변화가
// 구독을 다시 걸게 하지 않으려고.
const watching = { current: null };

// landing → boot → desk
function Game() {
  const [phase, setPhase] = useState('landing');
  const [name, setName] = useState('');

  if (phase === 'landing') {
    return (
      <Landing
        terminal={content.terminal}
        name={name}
        setName={setName}
        hasSave={false}
        onContinue={() => setPhase('boot')}
        onNew={() => setPhase('boot')}
      />
    );
  }

  if (phase === 'boot') {
    return <Boot boot={content.terminal.boot} onDone={() => setPhase('desk')} />;
  }

  return (
    <Shell
      apps={content.apps}
      notes={content.notes}
      status={{ ...content.terminal.boot, caseCount: content.cases.length, user: name }}
      terminal={content.terminal}
      chatAppId={CHAT_APP}
      watching={watching}
    />
  );
}

createRoot(document.getElementById('root')).render(
  <GameProvider actions={actions} view={view} events={events} content={content} watching={watching}>
    <Game />
  </GameProvider>
);
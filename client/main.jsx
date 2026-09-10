import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as content from './content-loader.js';
import { createClock } from '../adapters/clock.js';
import { createLocalStorage } from '../adapters/storage/local.js';
import { createAutosave } from './save.js';
import { createScheduler, restore } from '../core/scheduler.js';
import { createState, SAVE_VERSION } from '../core/state.js';
import { createView } from '../core/view.js';
import { createEvents } from '../core/events.js';
import { createActions } from '../core/actions.js';
import { createChatRules } from '../core/rules/chat.js';
import { createRecordRules } from '../core/rules/records.js';
import { createFormRules } from '../core/rules/forms.js';
import { createStoryRules } from '../core/rules/story.js';
import { createNoticeRules } from '../core/rules/notices.js';
import './ui/style.css';
import { GameProvider } from './ui/GameProvider.jsx';
import { Boot } from './ui/Boot.jsx';
import { Landing } from './ui/Landing.jsx';
import { Shell } from './ui/Shell.jsx';

const TEMPO = 10;   // 개발 중 배속

// 대화를 담는 앱. 토스트가 어느 창을 열어야 하는지 알아야 한다.
const CHAT_APP = 'msg';

const clock = createClock();
const storage = createLocalStorage();

const saved = storage.load();
const hasSave = saved?.v === SAVE_VERSION;

const state = createState(saved);
const scheduler = createScheduler(clock, restore(saved?.scheduler ?? [], clock.now()));

// AI 호출 중에 끊긴 대화. 내 말은 되찾아뒀고 답장만 다시 잡아준다.
state.interrupted().forEach((cid) => scheduler.add('reply', clock.now() + 2500, { cid }));
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

// 화면 배치를 걷어올 창구. Shell이 매 렌더마다 채운다.
const screenRef = { current: null };

const autosave = createAutosave({
  state, scheduler, storage,
  getScreen: () => screenRef.current?.() ?? {},
});

// 콘솔에서 직접 쳐볼 수 있게
window.game = actions;
window.view = view;
window.save = autosave;   // save.flush(true) / save.bytes()

// 저장을 지우고 처음부터. state와 scheduler가 모듈 최상단에서 한 번
// 만들어지는 구조라, 새로고침이 setter를 하나씩 되돌리는 것보다 확실하다.
// 버튼 위치와 방식은 나중에 바뀐다. 지우는 일은 여기 한 군데.
function wipe() {
  autosave.stop();
  storage.clear();
  location.reload();
}

// 지금 보고 있는 대화. ref로 두는 이유는 창을 옮겨 다니는 잦은 변화가
// 구독을 다시 걸게 하지 않으려고.
const watching = { current: null };

// landing → boot → desk
function Game() {
  const [phase, setPhase] = useState('landing');
  const [name, setName] = useState(saved?.player?.name ?? '');

  const enter = () => {
    state.setName(name);
    autosave.start();
    setPhase('boot');
  };

  if (phase === 'landing') {
    return (
      <Landing
        terminal={content.terminal}
        name={name}
        setName={setName}
        hasSave={hasSave}
        onContinue={enter}
        onNew={wipe}
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
      status={{ assetTag: content.terminal.boot.assetTag, user: name }}
      terminal={content.terminal}
      chatAppId={CHAT_APP}
      watching={watching}
      savedScreen={saved?.screen}
      screenRef={screenRef}
      onReset={wipe}
    />
  );
}

createRoot(document.getElementById('root')).render(
  <GameProvider actions={actions} view={view} events={events} content={content} watching={watching}>
    <Game />
  </GameProvider>
);
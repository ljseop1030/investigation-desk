import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as content from './content-loader.js';
import { createClock } from '../adapters/clock.js';
import { createLocalStorage } from '../adapters/storage/local.js';
import { createAutosave } from './save.js';
import { watchActivity } from './activity.js';
import { createScheduler } from '../core/scheduler.js';
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

// 기다림 배속. 아무것도 설정하지 않으면 실제 속도로 돈다.
// 개발 중에는 .env에 VITE_TEMPO=10을 넣는다. 기본값을 안전한 쪽에 두는 이유는,
// 소스에 배속을 박아두면 배포 전에 한 줄 고치는 걸 잊는 날 게임이 망가지기 때문.
const TEMPO = Number(import.meta.env.VITE_TEMPO) || 1;

// 대화를 담는 앱. 토스트가 어느 창을 열어야 하는지 알아야 하고,
// core는 여기에 로그인해야 알림·외부인 시계를 돌린다.
const CHAT_APP = 'msg';

const clock = createClock();
const storage = createLocalStorage();

// 게임 안에서 '처음부터'를 누르면 저장을 지우고 새로고침한다. 그러면 랜딩으로
// 떨어지는데, 부팅부터 다시 보고 싶다는 요청이었다. 세이브(localStorage)는
// 지워야 하고 이 표식은 남아야 해서 sessionStorage에 둔다. 탭을 닫으면 사라진다.
const RESUME_KEY = 'investigation-desk:resume';

const takeResume = () => {
  try {
    const v = sessionStorage.getItem(RESUME_KEY);
    if (v !== null) sessionStorage.removeItem(RESUME_KEY);
    return v;
  } catch {
    return null;   // 시크릿 모드 등. 표식이 없으면 랜딩으로 간다.
  }
};

const markResume = (name) => {
  try {
    sessionStorage.setItem(RESUME_KEY, name ?? '');
  } catch {
    /* 못 남기면 랜딩으로 떨어질 뿐이다 */
  }
};

const resumeName = takeResume();

const saved = storage.load();
const hasSave = saved?.v === SAVE_VERSION;

const state = createState(saved);
const scheduler = createScheduler(clock, saved?.scheduler ?? []);

const view = createView({ state, content });
const events = createEvents();

const actions = createActions({
  content,
  state, scheduler, events, clock,
  rules: {
    chat: createChatRules({ tempo: TEMPO }),
    records: createRecordRules(content.records, { tempo: TEMPO }),
    forms: createFormRules({ tempo: TEMPO }),
    story: createStoryRules(content.story, content.characters, { tempo: TEMPO }),
    notices: createNoticeRules(content.notices, content.characters, { tempo: TEMPO }),
  },
  // P5까지는 fallback 대사로 돈다
  ai: { reply: async () => { throw new Error('no ai yet'); } },
  chatApp: CHAT_APP,
});

events.on('message', (m) => console.log(m.me ? '나:' : `${m.cid}:`, m.text));

// 게임 안 시계는 바탕화면에 앉은 순간부터 흐른다. 랜딩과 부팅 화면에서는
// 아무것도 만기되지 않는다. 시작 화면에 10분을 앉아 있다 들어가도 밀린
// 답장이 한꺼번에 쏟아지지 않는 건 이 때문이다.
//
// 시작 신호는 셋이고 층이 다르다.
//   autosave.start()  이름이 정해질 때   저장
//   beginSession()    바탕화면 진입      게임 안 시계
//   chatOpen()        메신저 로그인      공지·외부인
let sessionBegun = false;

function beginSession() {
  if (sessionBegun) return;
  sessionBegun = true;

  // AI 호출 중에 끊긴 대화. 내 말은 되찾아뒀고 답장만 다시 걸어준다.
  // 지난 예약으로 넣어두면 catchUp이 다른 만기 예약과 같은 규칙으로 당긴다.
  // 여기서 직접 시각을 계산하면 CATCHUP.reply와 둘이 되어 한쪽만 고치게 된다.
  state.interrupted().forEach((cid) => scheduler.add('reply', 0, { cid }));

  // 자리를 비운 사이 만기된 예약을 지금부터 몇 초 뒤로 당긴다.
  scheduler.catchUp();

  // 자리를 비운 시간은 유휴가 아니다. 유휴 시계의 0점도 여기다.
  state.touch(clock.now());
}

// 유휴 판정의 기준. core가 모르는 조작(문서 읽기, 창 옮기기, 탭 복귀)까지 친다.
watchActivity(actions.markActive);

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

// 부팅부터 다시. state와 scheduler가 모듈 최상단에서 한 번 만들어지는
// 구조라, 새로고침이 setter를 하나씩 되돌리는 것보다 확실하다.
// 이름은 들고 간다. 같은 사람이 다시 앉는 것이지 다른 사람이 오는 게 아니다.
function restart(name) {
  autosave.stop();
  storage.clear();
  markResume(name ?? state.get().player.name);
  location.reload();
}

// 저장하고 시작 화면으로. 세이브를 남기므로 '이어서'가 살아 있다.
function quit() {
  autosave.flush(true);
  autosave.stop();
  location.reload();
}

// 이어서 들어오는 길. 랜딩을 거치지 않으므로 여기서 채비를 끝낸다.
if (resumeName !== null) {
  state.setName(resumeName);
  autosave.start();
}

// 지금 보고 있는 대화. ref로 두는 이유는 창을 옮겨 다니는 잦은 변화가
// 구독을 다시 걸게 하지 않으려고.
const watching = { current: null };

// landing → boot → desk
function Game() {
  const [phase, setPhase] = useState(resumeName === null ? 'landing' : 'boot');
  const [name, setName] = useState(resumeName ?? saved?.player?.name ?? '');

  // tick이 둘이면 말풍선이 두 번 도착한다. 정리를 붙여 이중 마운트에도
  // 하나만 남게 한다. beginSession은 플래그가 있어 두 번 돌지 않는다.
  useEffect(() => {
    if (phase !== 'desk') return;
    beginSession();
    const timer = setInterval(actions.tick, 1000);
    return () => clearInterval(timer);
  }, [phase]);

  const enter = () => {
    state.setName(name);
    autosave.start();
    setPhase('boot');
  };

  // 지울 것이 없으면 곧장 시작하고, 있으면 지우고 부팅부터 다시 시작한다.
  // 확인은 Landing이 받는다. 여기까지 왔으면 이미 두 번 누른 것이다.
  const startNew = () => (hasSave ? restart(name) : enter());

  if (phase === 'landing') {
    return (
      <Landing
        terminal={content.terminal}
        name={name}
        setName={setName}
        hasSave={hasSave}
        onContinue={enter}
        onNew={startNew}
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
      onRestart={() => restart(name)}
      onQuit={quit}
    />
  );
}

createRoot(document.getElementById('root')).render(
  <GameProvider actions={actions} view={view} events={events} content={content} watching={watching}>
    <Game />
  </GameProvider>
);
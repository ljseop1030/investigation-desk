// 진행(progress)과 화면(screen)을 같은 레벨에 두지 않는다.
// P10에서 진행만 서버로 간다. 창 위치는 그 대상이 아니다.

export const SAVE_VERSION = 1;

const empty = () => ({
  v: SAVE_VERSION,
  player: { name: '' },
  progress: {
    chats: {},        // { [cid]: [{ me, text, at, read }] }
    pending: {},      // { [cid]: ['아직 안 읽힌 내 말'] }
    working: {},      // { [cid]: bool }  LLM 호출 중
    turns: {},        // { [cid]: n }     대본 소비 인덱스
    authed: {},       // { polnet: true }
    seenAt: {},       // { [cid]: ts } 뱃지는 파생값
    requested: [],
    unlocked: [],
    delivered: [],
    forms: {},        // { [formId]: { values, draft, status, marks } }
    story: { outsider: 'hidden', provided: false },
    lastActAt: 0,
    noticesSent: [],  // 이미 도착한 공지 인덱스
  },
  scheduler: [],
  screen: {},         // 창·아이콘·포스트잇. UI가 알아서 채운다
});

// 로그 끝에 붙어 있는 내 말들. 답을 못 받은 채로 끊긴 것들이다.
const trailingMine = (log = []) => {
  const out = [];
  for (let i = log.length - 1; i >= 0 && log[i].me; i--) out.unshift(log[i].text);
  return out;
};

export function createState(saved) {
  // 버전이 다르면 이어 쓰지 않는다. 마이그레이션은 필요해질 때.
  const s = saved?.v === SAVE_VERSION ? structuredClone(saved) : empty();

  // AI를 부르는 도중에 창이 닫히면 working이 true인 채로 저장된다.
  // 그대로 두면 그 사람은 영영 입력 중이다. 게다가 pending은 호출 직전에
  // 비워지므로, 내가 보낸 말이 아무 데도 없이 사라진다. 로그에서 되찾는다.
  const interrupted = [];
  for (const [cid, on] of Object.entries(s.progress.working)) {
    if (!on) continue;
    s.progress.working[cid] = false;
    if (!(s.progress.pending[cid] ?? []).length) {
      const lost = trailingMine(s.progress.chats[cid]);
      if (lost.length) s.progress.pending[cid] = lost;
    }
    if ((s.progress.pending[cid] ?? []).length) interrupted.push(cid);
  }

  return {
    get: () => s,
    progress: () => s.progress,

    // 끊긴 대화. 부르는 쪽이 답장을 다시 잡아준다.
    interrupted: () => [...interrupted],

    setName(name) {
      s.player.name = name;
    },

    setScreen(screen) {
      s.screen = screen;
    },

    snapshot(pendingSchedule) {
      return { ...s, scheduler: pendingSchedule };
    },

    touch(now) {
      s.progress.lastActAt = now;
    },
  };
}
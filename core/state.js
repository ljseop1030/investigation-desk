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
    forms: {},        // { [formId]: { values, status, marks } }
    story: { outsider: 'hidden', provided: false },
    lastActAt: 0,
  },
  scheduler: [],
  screen: {},         // 창·아이콘·포스트잇. UI가 알아서 채운다
});

export function createState(saved) {
  // 버전이 다르면 이어 쓰지 않는다. 마이그레이션은 필요해질 때.
  const s = saved?.v === SAVE_VERSION ? structuredClone(saved) : empty();

  return {
    get: () => s,
    progress: () => s.progress,

    snapshot(pendingSchedule) {
      return { ...s, scheduler: pendingSchedule };
    },

    touch(now) {
      s.progress.lastActAt = now;
    },
  };
}
import { ACCESS } from '../shared/enums.js';

// access(콘텐츠)와 진행 상태를 합쳐야 나온다. UI 세 군데에서 각자 계산하지 않도록.
export const RECORD = {
  OPEN: 'open',
  LOCKED: 'locked',     // 조회 사유 신청 필요
  PENDING: 'pending',   // 승인 대기
  MISSING: 'missing',   // 담당자가 등록해야 보인다
};

// 진행 상태만 투영한다. 문서 본문은 UI가 content-loader에서 직접 읽는다.
export function createView({ state, content }) {
  const p = () => state.progress();
  const recordById = new Map(content.records.map((r) => [r.id, r]));
  const clone = (v) => structuredClone(v);

  const stateOf = (recordId) => {
    const r = recordById.get(recordId);
    if (!r) return null;
    if (r.access === ACCESS.OPEN) return RECORD.OPEN;
    if (r.access === ACCESS.UNREGISTERED) {
      return p().delivered.includes(recordId) ? RECORD.OPEN : RECORD.MISSING;
    }
    if (p().unlocked.includes(recordId)) return RECORD.OPEN;
    return p().requested.includes(recordId) ? RECORD.PENDING : RECORD.LOCKED;
  };

  return {
    player: () => clone(state.get().player),

    // 사본을 준다. 원본을 내주면 UI가 progress를 직접 밀 수 있다.
    chats: () => clone(p().chats),
    chat: (cid) => clone(p().chats[cid] ?? []),

    // UI가 뱃지를 셀 때 쓸 기준선. 이게 없으면 복원 직후 지난 대화가
    // 전부 미확인으로 잡힌다.
    seenAt: () => clone(p().seenAt),

    // 뱃지는 저장하지 않고 seenAt에서 센다.
    unread(cid) {
      const since = p().seenAt[cid] ?? 0;
      return (p().chats[cid] ?? []).filter((m) => !m.me && m.at > since).length;
    },

    isAuthed: (appId) => !!p().authed[appId],

    recordState: stateOf,

    // 열려 있을 때만 준다. UI가 private을 직접 들여다보지 않게.
    recordBody(recordId) {
      if (stateOf(recordId) !== RECORD.OPEN) return null;
      const r = recordById.get(recordId);
      return r.private?.body ?? r.body ?? null;
    },

    form: (formId) => clone(p().forms[formId] ?? null),
    outsider: () => p().story.outsider,
  };
}
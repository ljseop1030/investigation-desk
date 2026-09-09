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

  return {
    player: () => clone(state.get().player),

    // 사본을 준다. 원본을 내주면 UI가 progress를 직접 밀 수 있다.
    chats: () => clone(p().chats),
    chat: (cid) => clone(p().chats[cid] ?? []),

    // 뱃지는 저장하지 않고 seenAt에서 센다.
    unread(cid) {
      const since = p().seenAt[cid] ?? 0;
      return (p().chats[cid] ?? []).filter((m) => !m.me && m.at > since).length;
    },

    isAuthed: (appId) => !!p().authed[appId],

    recordState(recordId) {
      const r = recordById.get(recordId);
      if (!r) return null;
      if (r.access === ACCESS.OPEN) return RECORD.OPEN;
      if (r.access === ACCESS.UNREGISTERED) {
        return p().delivered.includes(recordId) ? RECORD.OPEN : RECORD.MISSING;
      }
      if (p().unlocked.includes(recordId)) return RECORD.OPEN;
      return p().requested.includes(recordId) ? RECORD.PENDING : RECORD.LOCKED;
    },

    form: (formId) => clone(p().forms[formId] ?? null),
    outsider: () => p().story.outsider,
  };
}
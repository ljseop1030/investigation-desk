import { ACCESS, DELIVERY } from '../../shared/enums.js';
import { createTiming } from './timing.js';

const APPROVAL = [45, 85]; // 조회 승인까지 (초)
const MIN_REASON = 5;      // 조회 사유 최소 글자수

// 어떻게 건네지는가는 access가 이미 말하고 있다. 콘텐츠에 delivery 같은
// 필드를 따로 두면 access와 어긋날 수 있고, 어긋나도 티가 안 난다.
// scope를 지운 이유가 그거였다.
const KIND = {
  [ACCESS.UNREGISTERED]: DELIVERY.REGISTER,
  [ACCESS.NONE]: DELIVERY.TELL,
};

export function createRecordRules(records, opts = {}) {
  const { pick, wait } = createTiming(opts);
  const byId = new Map(records.map((r) => [r.id, r]));

  return {
    canRequest(recordId, reason) {
      const record = byId.get(recordId);
      if (!record) return false;
      if (record.access !== ACCESS.RESTRICTED) return false;
      return (reason ?? '').trim().length >= MIN_REASON;
    },

    approvalAt(now) {
      return now + wait(pick(APPROVAL));
    },

    // LLM이 준 키를 그대로 믿지 않는다.
    // 실재하고, 그 사람 소관이고, 아직 안 준 것만 통과.
    //
    // 통과한 것에는 어떻게 건네지는지를 붙여 보낸다. 등록(DB에 올라간다)과
    // 구두(말풍선에 내용이 실려 온다)는 화면에서 벌어지는 일이 다른데,
    // 그걸 가르는 근거는 여기 있는 access뿐이다. 호출부가 다시 조회하게 두면
    // 판단이 두 군데가 된다.
    validDeliveries(keys, providerId, delivered = []) {
      return [...new Set(keys ?? [])]
        .map((k) => ({ id: k, record: byId.get(k) }))
        .filter(({ id, record }) => {
          if (!record) return false;
          if (!KIND[record.access]) return false;
          if (record.provider !== providerId) return false;
          return !delivered.includes(id);
        })
        .map(({ id, record }) => ({ id, kind: KIND[record.access] }));
    },
  };
}
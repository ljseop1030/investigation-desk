import { ACCESS } from '../../shared/enums.js';
import { createTiming } from './timing.js';

const APPROVAL = [45, 85]; // 조회 승인까지 (초)
const MIN_REASON = 5;      // 조회 사유 최소 글자수

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
    validDeliveries(keys, providerId, delivered = []) {
      return [...new Set(keys ?? [])].filter((k) => {
        const r = byId.get(k);
        if (!r) return false;
        if (r.access !== ACCESS.UNREGISTERED) return false;
        if (r.provider !== providerId) return false;
        return !delivered.includes(k);
      });
    },
  };
}
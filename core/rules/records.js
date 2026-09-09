// 자료 접근 규칙. 지연 값과 자료 목록은 콘텐츠가 갖는다.

import { ACCESS } from '../../shared/enums.js';

const APPROVAL = [45, 85]; // 조회 승인까지 (초)
const MIN_REASON = 5;      // 조회 사유 최소 글자수

export function createRecordRules({ tempo = 1, random = Math.random } = {}) {
  const ms = (sec) => (sec * 1000) / tempo;
  const pick = ([lo, hi]) => lo + random() * (hi - lo);

  return {
    canRequest(record, reason) {
      if (record.access !== ACCESS.RESTRICTED) return false;
      return (reason ?? '').trim().length >= MIN_REASON;
    },

    approvalAt(now) {
      return now + ms(pick(APPROVAL));
    },

    // LLM이 준 키를 그대로 믿지 않는다. 실재하고 아직 안 준 것만 통과.
    validDeliveries(keys, records, delivered = []) {
      const known = new Set(records.map((r) => r.id));
      return [...new Set(keys ?? [])].filter(
        (k) => known.has(k) && !delivered.includes(k)
      );
    },
  };
}
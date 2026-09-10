// 채점 규칙. 정답은 콘텐츠(form.fields[].private)가 갖는다.
// P5에서 이 파일은 서버에서 돈다. 클라이언트에는 private이 내려가지 않는다.

import { createTiming } from './timing.js';

const GRADING = [25, 45]; // 검토 소요 (초)

const norm = (s) => (s || '').replace(/[\s\-.,:;·()/|~]/g, '').toLowerCase();

export function createFormRules(opts = {}) {
  const { pick, wait } = createTiming(opts);

  return {
    reviewAt(now) {
      return now + wait(pick(GRADING));
    },

    grade(form, values = {}) {
      const bad = form.fields
        .filter((f) => {
          const answer = f.private;
          // 정답이 없는 필드는 채점하지 않는다.
          // 공개본(private 제거됨)으로 채점을 시도한 경우가 여기 걸린다.
          if (!answer?.keys) return false;

          const val = norm(values[f.id]);
          if (!val) return true;

          return ![answer.keys, ...(answer.alts || [])].some((set) =>
            set.every((k) => val.includes(norm(k)))
          );
        })
        .map((f) => f.id);

      return { pass: bad.length === 0, bad };
    },
  };
}
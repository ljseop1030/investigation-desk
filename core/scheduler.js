// 절대시각 큐. setTimeout을 쓰지 않는 이유는 창을 닫았다 열어도
// 예약된 답장이 이어져야 하기 때문. 지난 예약은 restore가 당긴다.

const CATCHUP = { read: 800, reply: 2500, push: 1500, unlock: 3000, grade: 3000 };
const PUSH_GAP = 1400;

export function createScheduler(clock, saved = []) {
  let items = [...saved];
  let seq = 0;

  return {
    add(kind, at, payload = {}) {
      const id = `${kind}:${++seq}`;
      items.push({ id, kind, at, ...payload });
      return id;
    },

    // 조건에 맞는 예약이 이미 있나
    has(pred) {
      return items.some(pred);
    },

    cancel(pred) {
      items = items.filter((e) => !pred(e));
    },

    // 만기된 것만 꺼내 돌려준다. 부수효과는 호출자가 처리한다.
    tick() {
      const now = clock.now();
      const due = items.filter((e) => e.at <= now).sort((a, b) => a.at - b.at);
      if (due.length) items = items.filter((e) => e.at > now);
      return due;
    },

    pending() {
      return [...items];
    },
  };
}

// 자리를 비운 사이 지나간 예약을 지금부터 몇 초 뒤로 당긴다.
// 말풍선은 한꺼번에 쏟아지지 않게 간격을 벌린다.
export function restore(saved, now) {
  let n = 0;
  return saved.map((e) => {
    if (e.at > now) return e;
    const base = CATCHUP[e.kind] ?? 1000;
    return { ...e, at: now + base + (e.kind === 'push' ? n++ * PUSH_GAP : 0) };
  });
}
import { TRAIT } from '../../shared/enums.js';
import { createTiming } from './timing.js';

const DEFAULT_INTERVAL = [100, 260];

export function createNoticeRules(notices, characters, opts = {}) {
  const { pick, wait } = createTiming(opts);
  const random = opts.random ?? Math.random;

  const sender = characters.find((c) => (c.traits ?? []).includes(TRAIT.BROADCAST)) ?? null;

  return {
    from: sender?.id ?? null,

    nextAt(now) {
      return now + wait(pick(sender?.broadcastInterval ?? DEFAULT_INTERVAL));
    },

    // 아직 안 보낸 것 중 하나. 다 보냈으면 null.
    // 셔플 순서를 저장하면 P4에서 그것도 직렬화해야 해서 인덱스만 쌓는다.
    pick(sent = []) {
      const left = notices.map((_, i) => i).filter((i) => !sent.includes(i));
      if (!left.length) return null;
      const i = left[Math.floor(random() * left.length)];
      return { index: i, text: notices[i] };
    },
  };
}
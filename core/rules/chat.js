// 지연 값은 콘텐츠(캐릭터 style)가 갖는다. 여기서는 계산만 한다.
// 배속을 어디에 거는지는 timing.js가 정한다.

import { createTiming } from './timing.js';

const CHAIN = [20, 60];        // 이어지는 답장 간격 (초)
const BUBBLE_GAP = [0.7, 2.2]; // 말풍선 사이 (초)
const LEAD = 6;                // tailGap 앞 '입력 중' 노출 (초)
const SEND_LAG = 0.3;          // 보내기 직전 찰나 (초)

export function createChatRules(opts = {}) {
  const { pick, wait, beat } = createTiming(opts);

  return {
    // 읽음과 답장은 따로 잰다.
    //
    // 답장이 이미 잡혀 있으면 그 시각은 건드리지 않는다. burst는 잡힌 때에
    // 모아서 답하고, 아니면 그 뒤에 이어 붙인다. 하지만 읽음은 매번 새로
    // 잡는다. 답장이 안 밀린다고 해서 '1'까지 멈춰 있으면, 상대가 내 말을
    // 아예 못 본 것처럼 보인다.
    //
    // 다만 읽음이 답장보다 늦을 수는 없다. 답을 받고 나서 '1'이 사라지는
    // 화면은 없다. 늦게 굴려진 읽음은 답장 시각으로 당긴다.
    schedule(style, now, pendingReplyAt = null) {
      const replyAt =
        pendingReplyAt === null
          ? null
          : style.burst
            ? pendingReplyAt
            : pendingReplyAt + wait(pick(CHAIN));

      const read = now + wait(pick(style.read));

      if (replyAt !== null) return { readAt: Math.min(read, replyAt), replyAt };

      const gap = style.burst ? wait(style.burstWait) : wait(pick(style.reply));
      return { readAt: read, replyAt: read + gap };
    },

    // tailGap은 기다림이라 배속에 눌리고, 말풍선 사이는 그대로다.
    bubbleTimes(style, texts, now) {
      let at = now + beat(SEND_LAG);
      return texts.map((text, i) => {
        if (i === 1 && style.tailGap) at += wait(style.tailGap);
        else if (i) at += beat(pick(BUBBLE_GAP));
        return { text, at, lead: i === 1 && style.tailGap ? wait(LEAD) : 0 };
      });
    },
  };
}
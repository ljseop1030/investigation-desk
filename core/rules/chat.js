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
    // 읽음을 먼저 정하고 거기서부터 답장을 잰다.
    // 따로 굴리면 답장이 읽음보다 앞설 수 있다.
    schedule(style, now, pendingReplyAt = null) {
        // 이미 답장이 잡혀 있으면 처음부터 다시 재지 않는다.
        // burst는 그 시각에 모아서 답하고, 아니면 그 뒤에 이어 붙인다.
        if (pendingReplyAt !== null) {
            return style.burst
            ? { readAt: null, replyAt: pendingReplyAt }
            : { readAt: null, replyAt: pendingReplyAt + wait(pick(CHAIN)) };
        }
        const readAt = now + wait(pick(style.read));
        const gap = style.burst ? wait(style.burstWait) : wait(pick(style.reply));
        return { readAt, replyAt: readAt + gap };
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
// 지연 값은 콘텐츠(캐릭터 style)가 갖는다. 여기서는 계산만 한다.
// tempo는 게임 설정이라 clock이 아니라 여기서 적용한다.

const CHAIN = [20, 60]; // 이어지는 답장 간격 (초)

export function createChatRules({ tempo = 1, random = Math.random } = {}) {
  const ms = (sec) => (sec * 1000) / tempo;
  const pick = ([lo, hi]) => lo + random() * (hi - lo);

  return {
    // 읽음을 먼저 정하고 거기서부터 답장을 잰다.
    // 따로 굴리면 답장이 읽음보다 앞설 수 있다.
    schedule(style, now, pendingReplyAt = null) {
      // 이미 답장이 잡혀 있고 모아 답하는 성격이 아니면 그 뒤에 붙인다.
      // 이미 폰을 든 상태이므로 처음부터 다시 재지 않는다.
      if (pendingReplyAt !== null && !style.burst) {
        return { readAt: null, replyAt: pendingReplyAt + ms(pick(CHAIN)) };
      }
      const readAt = now + ms(pick(style.read));
      const wait = style.burst ? ms(style.burstWait) : ms(pick(style.reply));
      return { readAt, replyAt: readAt + wait };
    },

    bubbleTimes(style, texts, now) {
      let at = now + 300;
      return texts.map((text, i) => {
        if (i === 1 && style.tailGap) at += ms(style.tailGap);
        else if (i) at += ms(pick([0.7, 2.2]));
        return { text, at, lead: i === 1 && style.tailGap ? ms(6) : 0 };
      });
    },
  };
}
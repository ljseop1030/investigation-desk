// 사람이 이 자리에 있는가.
//
// core는 자기를 통과하는 행동만 안다. 메시지를 보내고, 조회를 신청하고,
// 양식에 타자를 치는 것. 그런데 폴넷 문서를 읽는 것도, 창을 옮기는 것도,
// 대화창을 훑는 것도 '아무것도 안 하는' 게 아니다. core가 모를 뿐이다.
//
// 그래서 브라우저가 아는 것을 core에게 알려준다. 자리를 비운 시간도
// 유휴가 아니다. 탭이 다시 보이는 순간 시계를 되감는다.

const EVENTS = ['pointerdown', 'pointermove', 'keydown', 'wheel'];
const THROTTLE = 1000;   // 1초에 한 번이면 충분하다. 유휴 판정은 분 단위다

export function watchActivity(onActive, { throttleMs = THROTTLE } = {}) {
  let last = 0;

  const hit = () => {
    const now = Date.now();
    if (now - last < throttleMs) return;
    last = now;
    onActive();
  };

  // 돌아온 순간만 친다. 떠나는 순간에 치면 자리를 비운 시간이 유휴로 쌓인다.
  const onVisible = () => {
    if (document.visibilityState === 'visible') {
      last = 0;
      hit();
    }
  };

  EVENTS.forEach((e) => window.addEventListener(e, hit, { passive: true }));
  document.addEventListener('visibilitychange', onVisible);
  window.addEventListener('focus', onVisible);

  return () => {
    EVENTS.forEach((e) => window.removeEventListener(e, hit));
    document.removeEventListener('visibilitychange', onVisible);
    window.removeEventListener('focus', onVisible);
  };
}
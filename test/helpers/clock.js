// test/helpers/clock.js
// 테스트용 가짜 시계. 배포 번들에 들어가지 않는다.
// 진짜 시계(adapters/clock.js)와 같은 모양이지만 advance()가 더 있다.

export const fakeClock = (start = 0) => {
  let t = start;
  return {
    now: () => t,
    advance: (ms) => (t += ms),
  };
};
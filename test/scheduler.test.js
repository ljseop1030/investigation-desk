import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createScheduler } from '../core/scheduler.js';

const fakeClock = (start = 0) => {
  let t = start;
  return { now: () => t, advance: (ms) => (t += ms) };
};

test('만기 전에는 안 나온다', () => {
  const c = fakeClock(0);
  const s = createScheduler(c);
  s.add('reply', 720000, { cid: 'kang' });
  c.advance(719000);
  assert.equal(s.tick().length, 0);
  c.advance(2000);
  assert.equal(s.tick()[0].cid, 'kang');
});

test('한 번 꺼낸 예약은 다시 안 나온다', () => {
  const c = fakeClock(0);
  const s = createScheduler(c);
  s.add('unlock', 100, { recordId: 'v3' });
  c.advance(200);
  assert.equal(s.tick().length, 1);
  assert.equal(s.tick().length, 0);
});

test('같은 tick에 여럿 만기되면 시각 순', () => {
  const c = fakeClock(0);
  const s = createScheduler(c);
  s.add('push', 300, { text: 'B' });
  s.add('push', 100, { text: 'A' });
  c.advance(500);
  assert.deepEqual(s.tick().map((e) => e.text), ['A', 'B']);
});

test('복원: 지난 push만 간격이 벌어진다', () => {
  const c = fakeClock(10000);
  const s = createScheduler(c, [
    { kind: 'push', at: 1 },
    { kind: 'push', at: 2 },
    { kind: 'push', at: 99999 },
  ]);
  s.catchUp();
  const out = s.pending();
  assert.equal(out[0].at, 10000 + 1500);
  assert.equal(out[1].at, 10000 + 1500 + 1400);
  assert.equal(out[2].at, 99999);
});

test('답장 예약이 있으면 다시 잡지 않는다', () => {
  const c = fakeClock(0);
  const s = createScheduler(c);
  s.add('reply', 900000, { cid: 'kang' });
  const already = s.has((e) => e.kind === 'reply' && e.cid === 'kang');
  assert.equal(already, true);
});
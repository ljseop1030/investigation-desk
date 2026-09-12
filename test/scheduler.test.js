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

/* ---------- 복원 ---------- */

test('복원한 예약의 뒤 번호부터 발급한다', () => {
  const c = fakeClock(0);
  const s = createScheduler(c, [
    { id: 'read:3', kind: 'read', at: 500 },
    { id: 'push:7', kind: 'push', at: 900 },
  ]);
  const id = s.add('reply', 1000, { cid: 'kang' });
  assert.equal(id, 'reply:8');
  assert.equal(new Set(s.pending().map((e) => e.id)).size, 3);   // id가 겹치지 않는다
});

test('id 없는 예약이 섞여도 번호 매기기가 안 깨진다', () => {
  const c = fakeClock(0);
  const s = createScheduler(c, [{ kind: 'push', at: 100 }]);
  assert.equal(s.add('read', 200, {}), 'read:1');
});

test('끊긴 대화의 답장을 지난 예약으로 넣으면 catchUp이 민다', () => {
  const c = fakeClock(50000);
  const s = createScheduler(c);
  s.add('reply', 0, { cid: 'kang' });   // beginSession이 거는 모양
  s.catchUp();
  assert.equal(s.pending()[0].at, 50000 + 2500);
});

test('catchUp은 종류마다 다른 만큼 민다', () => {
  const c = fakeClock(1000);
  const s = createScheduler(c, [
    { kind: 'read', at: 1 },
    { kind: 'unlock', at: 2 },
    { kind: 'grade', at: 3 },
  ]);
  s.catchUp();
  assert.deepEqual(s.pending().map((e) => e.at), [1800, 4000, 4000]);
});

// read(800) < reply(2500)이라 순서가 지켜진다. 이 숫자를 만지는 사람이
// 깨뜨리면 여기서 걸린다. schedule()이 read <= reply를 보장하므로
// 답장만 만기되고 읽음은 미래인 조합은 애초에 생기지 않는다.
test('복원해도 읽음이 답장보다 먼저 온다', () => {
  const c = fakeClock(100000);
  const s = createScheduler(c, [
    { id: 'read:1', kind: 'read', at: 10, cid: 'kang' },
    { id: 'reply:2', kind: 'reply', at: 20, cid: 'kang' },
  ]);
  s.catchUp();
  const at = (k) => s.pending().find((e) => e.kind === k).at;
  assert.ok(at('read') < at('reply'), '읽음이 답장보다 먼저');
});
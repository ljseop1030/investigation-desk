import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createChatRules } from '../core/rules/chat.js';

const kang = { read: [480, 1200], reply: [120, 300], burst: true, burstWait: 180, tailGap: 0 };
const fixed = (v) => () => v;

test('답장은 언제나 읽음 뒤', () => {
  for (const r of [0, 0.3, 0.999]) {
    const c = createChatRules({ random: fixed(r) });
    const { readAt, replyAt } = c.schedule(kang, 0);
    assert.ok(replyAt > readAt, `r=${r}`);
  }
});

test('tempo가 지연을 줄인다', () => {
  const a = createChatRules({ tempo: 1, random: fixed(0) }).schedule(kang, 0);
  const b = createChatRules({ tempo: 10, random: fixed(0) }).schedule(kang, 0);
  assert.equal(a.readAt, 480000);
  assert.equal(b.readAt, 48000);
});

test('burst는 burstWait만큼만 기다린다', () => {
  const c = createChatRules({ random: fixed(0) });
  const { readAt, replyAt } = c.schedule(kang, 0);
  assert.equal(replyAt - readAt, 180000);
});

test('tailGap이 있으면 두 번째 말풍선만 벌어진다', () => {
  const kim = { ...kang, tailGap: 150 };
  const c = createChatRules({ random: fixed(0) });
  const b = c.bubbleTimes(kim, ['a', 'b', 'c'], 0);
  assert.equal(b[1].at - b[0].at, 150000);
  assert.equal(b[1].lead, 6000);
});

const kim = { read: [20, 60], reply: [20, 50], burst: false, burstWait: 0, tailGap: 150 };

test('burst 아니면 두 번째 답장이 첫 답장 뒤에 붙는다', () => {
  const c = createChatRules({ random: fixed(0) });
  const a = c.schedule(kim, 0);
  const b = c.schedule(kim, 5000, a.replyAt);
  assert.equal(b.replyAt, a.replyAt + 20000);
  assert.ok(b.replyAt > a.replyAt);
});

test('burst면 잡혀 있던 시각에 모아서 답한다', () => {
  const c = createChatRules({ random: fixed(0) });
  const a = c.schedule(kang, 0);
  const b = c.schedule(kang, 5000, a.replyAt);
  assert.equal(b.replyAt, a.replyAt);   // 밀리지 않는다
});

// 답장이 안 밀린다고 '1'까지 멈춰 있으면 상대가 내 말을 못 본 것처럼 보인다.
test('답장이 잡혀 있어도 읽음은 새로 잡힌다', () => {
  const c = createChatRules({ random: fixed(0) });

  const a = c.schedule(kim, 0);
  const b = c.schedule(kim, 5000, a.replyAt);
  assert.ok(b.readAt > 5000, '보낸 시각보다 뒤');
  assert.ok(b.readAt <= b.replyAt, '답장보다 앞');

  const x = c.schedule(kang, 0);
  const y = c.schedule(kang, 5000, x.replyAt);
  assert.ok(y.readAt > 5000);
  assert.ok(y.readAt <= y.replyAt);
});

// 강윤하는 읽기까지 8~20분이다. 답장이 코앞이면 읽음이 답장 뒤로 간다.
test('읽음이 답장보다 늦으면 답장 시각으로 당긴다', () => {
  const c = createChatRules({ random: fixed(0) });
  const b = c.schedule(kang, 0, 1000);
  assert.equal(b.replyAt, 1000);
  assert.equal(b.readAt, 1000);
});
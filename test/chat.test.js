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
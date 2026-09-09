import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEvents } from '../core/events.js';
import { createState, SAVE_VERSION } from '../core/state.js';

test('구독한 쪽만 받는다', () => {
  const e = createEvents();
  const got = [];
  e.on('message', (p) => got.push(p));
  e.emit('message', 'a');
  e.emit('other', 'b');
  assert.deepEqual(got, ['a']);
});

test('구독을 해제할 수 있다', () => {
  const e = createEvents();
  const got = [];
  const off = e.on('message', (p) => got.push(p));
  e.emit('message', 'a');
  off();
  e.emit('message', 'b');
  assert.deepEqual(got, ['a']);
});

test('구독자가 없어도 죽지 않는다', () => {
  createEvents().emit('nobody', 1);
});

test('저장본이 없으면 빈 상태', () => {
  const s = createState();
  assert.equal(s.get().v, SAVE_VERSION);
  assert.deepEqual(s.progress().unlocked, []);
});

test('버전이 다르면 이어 쓰지 않는다', () => {
  const s = createState({ v: 999, progress: { unlocked: ['1187-victim'] } });
  assert.deepEqual(s.progress().unlocked, []);
});

test('저장본을 복사해서 쓴다', () => {
  const saved = { ...createState().get() };
  saved.progress.unlocked.push('1187-victim');
  const s = createState(saved);
  s.progress().unlocked.push('1187-cctv');
  assert.equal(saved.progress.unlocked.length, 1);   // 원본 안 건드림
});

test('스냅샷에 예약이 실린다', () => {
  const s = createState();
  const snap = s.snapshot([{ kind: 'reply', at: 100 }]);
  assert.equal(snap.scheduler.length, 1);
});
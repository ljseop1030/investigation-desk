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

/* ---------- 복원 세탁 ----------
   AI를 부르는 도중에 창이 닫히면 working이 true인 채로 저장된다.
   그대로 두면 그 사람은 영영 입력 중이고, 게다가 pending은 호출 직전에
   비워지므로 내가 보낸 말이 아무 데도 없이 사라진다. */

// 저장본 한 판. 넘긴 것만 덮어쓴다.
const savedWith = (progress) => ({
  ...createState().get(),
  progress: { ...createState().progress(), ...progress },
});

test('세탁: 입력 중인 채로 저장돼도 풀린다', () => {
  const s = createState(savedWith({
    working: { kang: true },
    pending: { kang: ['자료 부탁드립니다'] },
  }));
  assert.equal(s.progress().working.kang, false);
});

test('세탁: pending이 비면 로그 끝에서 내 말을 되찾는다', () => {
  const s = createState(savedWith({
    working: { kang: true },
    pending: { kang: [] },
    chats: {
      kang: [
        { me: false, text: '네~' },
        { me: true, text: '원부 좀 주세요' },
        { me: true, text: '1187 건입니다' },
      ],
    },
  }));
  assert.deepEqual(s.progress().pending.kang, ['원부 좀 주세요', '1187 건입니다']);
  assert.deepEqual(s.interrupted(), ['kang']);
});

test('세탁: pending이 남아 있으면 로그에서 덮어쓰지 않는다', () => {
  const s = createState(savedWith({
    working: { kang: true },
    pending: { kang: ['아직 안 먹힌 말'] },
    chats: { kang: [{ me: true, text: '로그에 있는 말' }] },
  }));
  assert.deepEqual(s.progress().pending.kang, ['아직 안 먹힌 말']);
});

test('세탁: 되찾을 말이 없으면 끊긴 대화가 아니다', () => {
  const s = createState(savedWith({
    working: { kang: true },
    pending: { kang: [] },
    chats: { kang: [{ me: false, text: '이제 봤네요 ^^' }] },   // 끝이 상대 말
  }));
  assert.deepEqual(s.interrupted(), []);
});

test('세탁: working이 false면 건드리지 않는다', () => {
  const s = createState(savedWith({
    working: { kang: false },
    chats: { kang: [{ me: true, text: '이미 답을 받은 말' }] },
  }));
  assert.deepEqual(s.progress().pending.kang ?? [], []);
  assert.deepEqual(s.interrupted(), []);
});
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createActions } from '../core/actions.js';
import { createScheduler } from '../core/scheduler.js';
import { createState } from '../core/state.js';
import { createView } from '../core/view.js';
import { createEvents } from '../core/events.js';
import { createChatRules } from '../core/rules/chat.js';
import { createRecordRules } from '../core/rules/records.js';
import { createFormRules } from '../core/rules/forms.js';
import { createStoryRules } from '../core/rules/story.js';
import { createNoticeRules } from '../core/rules/notices.js';
import { ACCESS, TRAIT } from '../shared/enums.js';
import { fakeClock } from './helpers/clock.js';

const CONTENT = {
  characters: [
    {
      id: 'kang', name: '강윤하',
      style: { read: [480, 1200], reply: [120, 300], burst: true, burstWait: 180, bubbles: [2, 4], tailGap: 0 },
      private: { fallback: ['아이고 이제 봤네요 ^^'] },
    },
    {
      id: 'won', name: '원 화',
      style: { read: [180, 600], reply: [10, 30], burst: false, burstWait: 0, bubbles: [1, 1], tailGap: 0 },
      script: ['당신 업무는 제 관리관할이 아닙니다.', null],
      private: { fallback: ['.'] },
    },
    {
      id: 'baek', name: '백유림',
      style: { read: [4, 15], reply: [15, 45], burst: false, burstWait: 0, bubbles: [1, 3], tailGap: 0 },
      private: { fallback: ['아 넵! 확인해볼게요'] },
    },
    {
      id: 'bot', name: '경무기획계', traits: [TRAIT.BROADCAST],
      style: { read: [0, 0], reply: [0, 0], burst: false, burstWait: 0, bubbles: [1, 1], tailGap: 0 },
      private: { fallback: ['본 계정은 발신 전용입니다.'] },
    },
    {
      id: 'kim', name: '김주원',
      style: { read: [20, 20], reply: [20, 20], burst: false, burstWait: 0, bubbles: [2, 3], tailGap: 150 },
      private: { fallback: ['이런 것까지 나한테 물어봐요?'] },
    },
  ],
  records: [
    { id: '1187-victim', access: ACCESS.RESTRICTED },
    { id: '1187-forensic', access: ACCESS.UNREGISTERED, provider: 'yoo' },
  ],
  forms: [{ id: '1187-basic', fields: [{ id: 'location', private: { keys: ['강변로3길', '27'] } }] }],
  story: {
    outsiderAppears: { who: 'k', afterIdleSec: 115, lines: ['안녕하세요.'], lineGapSec: [1, 2] },
    leak: {
      burns: 'k', triggers: ['해커'],
      traceable: [{ form: '1187-basic', field: 'reporter' }],
      providedBy: 'kang', providedMarkers: ['02:47'],
      confront: {
        by: 'kang', delaySec: [26, 56], lineGapSec: [2, 4],
        byMessage: ['저기…'], byReport: ['보고서 봤어요~'],
      },
    },
  },
  apps: [
    { id: 'polnet', private: { user: 't-2211', pw: 'Pol!2211' } },
    { id: 'msg', private: { user: 't2211', pw: 'msg2211' } },
  ],
};

// idleSec 기본값을 크게 둬서 K가 끼어들지 않게 한다.
// 답장을 기다리는 것도 '아무것도 안 하는' 상태라, 그냥 두면 K가 나타나 말풍선이 섞인다.
// onboarding·notices는 픽스처에서 붙였다 뗀다. 늘 켜두면 다른 테스트의
// 말풍선에 섞인다.
const setup = ({ reply, idleSec = 999999, login = true, onboarding = null, notices = null } = {}) => {
  const content = {
    ...CONTENT,
    characters: CONTENT.characters.map((c) =>
      onboarding && c.id === 'baek' ? { ...c, onboarding } : c
    ),
    story: {
      ...CONTENT.story,
      outsiderAppears: { ...CONTENT.story.outsiderAppears, afterIdleSec: idleSec },
    },
  };

  const clock = fakeClock(0);
  const scheduler = createScheduler(clock);
  const state = createState();
  const view = createView({ state, content });
  const events = createEvents();
  const seen = [];
  const typing = [];
  events.on('message', (m) => seen.push(m));
  events.on('typing', (x) => typing.push(x));

  const actions = createActions({
    content, state, scheduler, events, clock,
    rules: {
      chat: createChatRules({ random: () => 0 }),
      records: createRecordRules(content.records, { random: () => 0 }),
      forms: createFormRules({ random: () => 0 }),
      story: createStoryRules(content.story, content.characters, { random: () => 0 }),
      notices: notices && createNoticeRules(notices, content.characters, { random: () => 0 }),
    },
    ai: { reply: reply ?? (async () => ({ messages: ['이거예요~', '확인해보세요 ^^'] })) },
    chatApp: 'msg',
  });

  // 메신저 로그인이 시작 신호다. 대부분의 테스트는 그 뒤를 본다.
  if (login) actions.authenticate('msg', 't2211', 'msg2211');

  // 1초씩 감으면서 tick을 돌린다. 실제 게임의 1초 tick과 같은 모양.
  const run = async (sec) => {
    for (let i = 0; i < sec; i++) { clock.advance(1000); actions.tick(); await null; }
  };
  return { actions, state, view, events, seen, typing, clock, scheduler, run };
};

// 배속을 건 판. 기다림만 줄고 말풍선 간격은 그대로여야 한다.
const fastSetup = () => {
  const clock = fakeClock(0);
  const scheduler = createScheduler(clock);
  const state = createState();
  const events = createEvents();
  const seen = [];
  events.on('message', (m) => seen.push(m));

  const actions = createActions({
    content: CONTENT, state, scheduler, events, clock,
    rules: {
      chat: createChatRules({ tempo: 10, random: () => 0 }),
      records: createRecordRules(CONTENT.records, { tempo: 10, random: () => 0 }),
      forms: createFormRules({ tempo: 10, random: () => 0 }),
      story: createStoryRules(
        { ...CONTENT.story, outsiderAppears: { ...CONTENT.story.outsiderAppears, afterIdleSec: 999999 } },
        CONTENT.characters,
        { tempo: 10, random: () => 0 }
      ),
    },
    ai: { reply: async () => ({ messages: ['이거예요~', '확인해보세요 ^^'] }) },
    chatApp: 'msg',
  });
  actions.authenticate('msg', 't2211', 'msg2211');

  const run = async (sec) => {
    for (let i = 0; i < sec; i++) { clock.advance(1000); actions.tick(); await null; }
  };
  return { fast: { actions, state, seen, run } };
};

const replies = (seen) => seen.filter((m) => !m.me);

test('보냄 → 읽음 → 답장 → 도착', async () => {
  const { actions, state, seen, run } = setup();

  actions.send('kang', '신고접수 원부 좀 보내주실 수 있을까요');
  assert.equal(seen.length, 1);
  assert.equal(state.progress().chats.kang[0].read, false);

  await run(479);
  assert.equal(state.progress().chats.kang[0].read, false, '아직 안 읽음');

  await run(2);
  assert.equal(state.progress().chats.kang[0].read, true, '480초에 읽음');

  await run(180);   // burstWait
  await run(5);     // 말풍선 도착

  assert.equal(replies(seen).length, 2);
  assert.equal(replies(seen)[0].text, '이거예요~');
  assert.equal(replies(seen)[1].last, true);
});

test('AI가 실패하면 fallback으로 답한다', async () => {
  const { actions, seen, run } = setup({ reply: async () => { throw new Error('down'); } });
  actions.send('kang', '자료 주세요');
  await run(700);
  assert.equal(replies(seen)[0].text, '아이고 이제 봤네요 ^^');
});

test('대본 캐릭터는 AI를 부르지 않는다', async () => {
  let called = 0;
  const { actions, seen, run } = setup({ reply: async () => { called++; return { messages: ['x'] }; } });
  actions.send('won', '자료 요청드립니다');
  await run(400);
  assert.equal(called, 0);
  assert.equal(replies(seen)[0].text, '당신 업무는 제 관리관할이 아닙니다.');
});

test('대본이 null이면 읽고 답하지 않는다', async () => {
  const { actions, seen, run } = setup();
  actions.send('won', '첫 번째');
  await run(400);
  actions.send('won', '두 번째');
  await run(400);
  assert.equal(replies(seen).length, 1);
});

test('답장 대기 중 또 보내도 답장이 밀리지 않는다', async () => {
  const { actions, scheduler, run } = setup();
  actions.send('kang', 'A');
  const first = scheduler.pending().find((e) => e.kind === 'reply').at;
  await run(60);
  actions.send('kang', 'B');
  const after = scheduler.pending().find((e) => e.kind === 'reply').at;
  assert.equal(after, first, 'burst는 모아서 한 번에 답한다');
});

// 답장이 안 밀리는 것과 '1'이 안 사라지는 것은 다른 얘기다.
// 단위 테스트는 schedule()의 반환값만 보느라 이걸 오래 놓치고 있었다.
test('답장을 기다리는 중에 또 보내도 읽음은 온다', async () => {
  const { actions, state, run } = setup();
  actions.send('kang', 'A');
  await run(60);
  actions.send('kang', 'B');

  await run(430);   // t=490. 읽음(480초)은 지났고 답장(660초)은 아직
  const mine = state.progress().chats.kang.filter((m) => m.me);
  assert.equal(mine.length, 2);
  assert.ok(mine.every((m) => m.read), '답장 전에 둘 다 읽음');
});

test('답장이 도착한 시점에 1이 남아 있지 않다', async () => {
  const { actions, state, seen, run } = setup();
  actions.send('kang', 'A');
  await run(600);   // 읽음은 지났고 답장은 아직. 여기서 보내면 읽음이 답장 뒤로 굴러간다
  actions.send('kang', 'B');

  await run(65);    // t=665. 답장 도착
  assert.ok(replies(seen).length > 0, '답장은 왔다');
  const mine = state.progress().chats.kang.filter((m) => m.me);
  assert.ok(mine.every((m) => m.read), '답장이 온 뒤에 1이 사라지는 화면은 없다');
});

test('읽음 예약은 대화당 하나만 잡힌다', async () => {
  const { actions, scheduler, run } = setup();
  actions.send('kang', 'A');
  await run(10);
  actions.send('kang', 'B');
  await run(10);
  actions.send('kang', 'C');

  const reads = scheduler.pending().filter((e) => e.kind === 'read' && e.cid === 'kang');
  assert.equal(reads.length, 1);
  assert.equal(reads[0].at, 480000, '가장 이른 시각이 남는다');
});

test('제한열람은 신청 후 승인되면 열린다', async () => {
  const { actions, state, run } = setup();
  assert.equal(actions.requestRecord('1187-victim', '1187 기초자료 정리표 작성'), true);
  await run(44);
  assert.deepEqual(state.progress().unlocked, []);
  await run(2);
  assert.deepEqual(state.progress().unlocked, ['1187-victim']);
});

test('사유가 짧으면 신청이 안 된다', () => {
  const { actions, state } = setup();
  assert.equal(actions.requestRecord('1187-victim', '확인'), false);
  assert.deepEqual(state.progress().requested, []);
});

test('provider가 아니면 자료를 등록할 수 없다', async () => {
  const { actions, state, run } = setup({
    reply: async () => ({ messages: ['DB에 등록했습니다.'], delivers: ['1187-forensic'] }),
  });
  actions.send('kang', '감식 자료 주세요');
  await run(700);
  // 1187-forensic은 yoo 소관이다. 강윤하가 준다고 해도 등록되지 않는다.
  assert.deepEqual(state.progress().delivered, []);
});

test('양식은 제출 후 검토를 거쳐 채점된다', async () => {
  const { actions, state, run } = setup();
  actions.submitForm('1187-basic', { location: '강변로3길 27' });
  assert.equal(state.progress().forms['1187-basic'].status, 'review');
  await run(26);
  const f = state.progress().forms['1187-basic'];
  assert.equal(f.status, 'done');
  assert.equal(f.marks.pass, true);
});

test('아무것도 안 하면 외부인이 온다', async () => {
  const { state, seen, run } = setup({ idleSec: 115 });
  await run(114);
  assert.equal(state.progress().story.outsider, 'hidden');
  await run(4);
  assert.equal(state.progress().story.outsider, 'live');
  assert.equal(seen.some((m) => m.cid === 'k'), true);
});

test('발설하면 외부인이 사라지고 담당조사관이 찾아온다', async () => {
  const { actions, state, seen, run } = setup({ idleSec: 115 });
  await run(120);
  actions.send('kang', '해커한테 받았어요');
  assert.equal(state.progress().story.outsider, 'burned');
  await run(30);
  assert.equal(seen.some((m) => m.text === '저기…'), true);
});

test('소각된 상대에게는 보낼 수 없다', async () => {
  const { actions, seen, run } = setup({ idleSec: 115 });
  await run(120);
  actions.send('kang', '해커한테 받았어요');
  const before = seen.length;
  actions.send('k', '아직 계세요?');
  assert.equal(seen.length, before);
});

/* ---------- 입력 중 ---------- */

test('응답을 기다리는 동안 입력 중', async () => {
  let release;
  const { actions, typing, run } = setup({
    reply: () => new Promise((r) => { release = () => r({ messages: ['조회 결과는 이겁니다'] }); }),
  });

  actions.send('kim', '차적 조회 부탁드립니다');
  await run(41);
  assert.deepEqual(typing.at(-1), { cid: 'kim', on: true });

  release();
  await run(2);
  assert.deepEqual(typing.at(-1), { cid: 'kim', on: false });
});

test('tailGap 말풍선 앞에도 입력 중', async () => {
  // 김주원: 첫 말풍선으로 튕기고 150초 뒤에 실제 답.
  const { actions, typing, run } = setup({
    reply: async () => ({ messages: ['이런 걸 왜 나한테', '조회 결과는 이겁니다'] }),
  });

  actions.send('kim', '차적 조회 부탁드립니다');
  await run(150);
  const base = typing.length;

  await run(34);
  assert.equal(typing.length, base, '아직 lead 구간 밖');

  await run(2);
  assert.deepEqual(typing.at(-1), { cid: 'kim', on: true });

  await run(8);
  assert.deepEqual(typing.at(-1), { cid: 'kim', on: false });
});

test('입력 중은 바뀔 때만 알린다', async () => {
  const { actions, typing, run } = setup({
    reply: async () => ({ messages: ['a', 'b'] }),
  });
  actions.send('kim', '조회 좀');
  await run(220);

  // 켜짐·꺼짐이 번갈아 나와야 한다. 같은 값이 연달으면 매초 쏘고 있는 것.
  typing.forEach((t, i) => {
    if (i) assert.notEqual(t.on, typing[i - 1].on, `${i}번째가 앞과 같다`);
  });
});

/* ---------- 로그인 ---------- */

test('비밀번호가 맞아야 로그인된다', () => {
  const { actions, state } = setup();
  assert.equal(actions.authenticate('polnet', 't-2211', '틀린값'), false);
  assert.equal(state.progress().authed.polnet, undefined);

  assert.equal(actions.authenticate('polnet', 't-2211', 'Pol!2211'), true);
  assert.equal(state.progress().authed.polnet, true);
});

test('없는 앱은 로그인되지 않는다', () => {
  const { actions, state } = setup({ login: false });
  assert.equal(actions.authenticate('없는앱', 'x', 'y'), false);
  assert.deepEqual(state.progress().authed, {});
});

const ONBOARDING = [
  '안녕하세요! 사무보조 인턴 지원해주셔서 감사합니다.',
  '앞으로 잘 부탁드려요!',
];

test('메신저에 로그인하면 사수가 먼저 말을 건다', async () => {
  const { actions, seen, run } = setup({ login: false, onboarding: ONBOARDING });

  await run(30);
  assert.equal(seen.length, 0, '로그인 전에는 아무 말도 없다');

  actions.authenticate('msg', 't2211', 'msg2211');
  await run(5);

  assert.deepEqual(replies(seen).map((m) => m.text), ONBOARDING);
  assert.equal(replies(seen).at(-1).last, true, '마지막 줄에만 토스트가 붙는다');
});

test('첫 인사는 한 번만 온다', async () => {
  const { actions, seen, run } = setup({ login: true, onboarding: ONBOARDING });
  await run(5);

  actions.authenticate('msg', 't2211', 'msg2211');
  await run(5);
  assert.equal(replies(seen).length, ONBOARDING.length);
});

test('메신저에 로그인하기 전에는 공지가 오지 않는다', async () => {
  const { actions, seen, run } = setup({ login: false, notices: ['[경무기획계] 회식 안내'] });

  await run(600);
  assert.equal(seen.length, 0, '로그인 전에는 공지도 쌓이지 않는다');

  actions.authenticate('msg', 't2211', 'msg2211');
  await run(101);
  assert.equal(seen.filter((m) => m.cid === 'bot').length, 1, '로그인 100초 뒤 첫 공지');
});

test('메신저에 로그인하기 전에는 외부인이 오지 않는다', async () => {
  const { actions, state, run } = setup({ idleSec: 115, login: false });

  await run(400);
  assert.equal(state.progress().story.outsider, 'hidden', '로그인 전에는 조용하다');

  actions.authenticate('msg', 't2211', 'msg2211');
  await run(400);
  assert.equal(state.progress().story.outsider, 'live', '로그인하면 그때부터 잰다');
});

/* ---------- 배속 ---------- */

test('배속은 기다림만 줄인다', async () => {
  // tempo 10에서 강윤하의 읽기 480초는 48초로 줄어야 하고,
  // K의 유휴 115초도 11.5초로 같이 줄어야 한다. 한쪽만 줄면 순서가 뒤집힌다.
  const { fast } = fastSetup();
  fast.actions.send('kang', '자료 주세요');
  await fast.run(47);
  assert.equal(fast.state.progress().chats.kang[0].read, false);
  await fast.run(2);
  assert.equal(fast.state.progress().chats.kang[0].read, true, '480초가 48초로');
});

test('말풍선 사이는 배속에 눌리지 않는다', async () => {
  const { fast } = fastSetup();
  fast.actions.send('kang', '자료 주세요');
  await fast.run(80);   // 읽기 48초 + burstWait 18초 + 여유

  const arrived = fast.seen.filter((m) => !m.me);
  assert.equal(arrived.length, 2);
  // 0.7초 간격이 배속에 눌렸다면 둘이 같은 tick에 떨어진다.
  assert.ok(arrived[1].at - arrived[0].at >= 700, '간격이 0.7초 이상 남아 있다');
});

/* ---------- 미확인 ---------- */

test('본 뒤에 온 것만 미확인으로 센다', async () => {
  const { actions, view, run } = setup();
  actions.send('kang', '자료 요청드립니다');
  await run(700);
  assert.equal(view.unread('kang'), 2, '내가 보낸 건 안 센다');

  actions.markSeen('kang');
  assert.equal(view.unread('kang'), 0);
});

test('markActive는 유휴 시계를 되감는다', async () => {
  // 메시지를 안 보내도 사람이 화면 앞에 있으면 외부인은 오지 않는다.
  const { actions, state, run } = setup({ idleSec: 115 });
  await run(110);
  actions.markActive();
  await run(110);
  assert.equal(state.progress().story.outsider, 'hidden', '조작이 있으면 안 온다');

  await run(10);
  assert.equal(state.progress().story.outsider, 'live', '멈추면 그때부터 다시 잰다');
});

test('markSeen은 유휴 시계를 되감지 않는다', async () => {
  // 창을 열어둔 채 메시지가 오면 UI가 markSeen을 자동으로 부른다.
  // 그때마다 lastActAt이 갱신되면 외부인이 영영 안 나타난다.
  const { actions, state, run } = setup({ idleSec: 115 });
  await run(110);
  actions.markSeen('kang');
  await run(8);
  assert.equal(state.progress().story.outsider, 'live');
});
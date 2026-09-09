import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createActions } from '../core/actions.js';
import { createScheduler } from '../core/scheduler.js';
import { createState } from '../core/state.js';
import { createEvents } from '../core/events.js';
import { createChatRules } from '../core/rules/chat.js';
import { createRecordRules } from '../core/rules/records.js';
import { createFormRules } from '../core/rules/forms.js';
import { createStoryRules } from '../core/rules/story.js';
import { ACCESS } from '../shared/enums.js';
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
};

// idleSec 기본값을 크게 둬서 K가 끼어들지 않게 한다.
// 답장을 기다리는 것도 '아무것도 안 하는' 상태라, 그냥 두면 K가 나타나 말풍선이 섞인다.
const setup = ({ reply, idleSec = 999999 } = {}) => {
  const content = {
    ...CONTENT,
    story: {
      ...CONTENT.story,
      outsiderAppears: { ...CONTENT.story.outsiderAppears, afterIdleSec: idleSec },
    },
  };

  const clock = fakeClock(0);
  const scheduler = createScheduler(clock);
  const state = createState();
  const events = createEvents();
  const seen = [];
  events.on('message', (m) => seen.push(m));

  const actions = createActions({
    content, state, scheduler, events, clock,
    rules: {
      chat: createChatRules({ random: () => 0 }),
      records: createRecordRules(content.records, { random: () => 0 }),
      forms: createFormRules({ random: () => 0 }),
      story: createStoryRules(content.story, content.characters, { random: () => 0 }),
    },
    ai: { reply: reply ?? (async () => ({ messages: ['이거예요~', '확인해보세요 ^^'] })) },
  });

  // 1초씩 감으면서 tick을 돌린다. 실제 게임의 1초 tick과 같은 모양.
  const run = async (sec) => {
    for (let i = 0; i < sec; i++) { clock.advance(1000); actions.tick(); await null; }
  };
  return { actions, state, events, seen, clock, scheduler, run };
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
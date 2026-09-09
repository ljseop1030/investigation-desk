import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStoryRules } from '../core/rules/story.js';

const STORY = {
  outsiderAppears: { who: 'k', afterIdleSec: 115, lines: ['a', 'b'], lineGapSec: [1.4, 3.2] },
  leak: {
    burns: 'k',
    triggers: ['해커', '외국인 친구'],
    traceable: [
      { form: '1187-basic', field: 'reporter' },
      { form: '1187-basic', field: 'plate' },
    ],
    providedBy: 'kang',
    providedMarkers: ['02:47', '서동철'],
    confront: {
      by: 'kang', delaySec: [26, 56], lineGapSec: [2.2, 4.8],
      byMessage: ['m1', 'm2'], byReport: ['r1', 'r2'],
    },
  },
};
const CHARS = [{ id: 'k', name: 'K' }, { id: 'kang', name: '강윤하' }];
const fixed = (v) => () => v;
const rules = (opts) => createStoryRules(STORY, CHARS, opts);

test('유휴 시간이 지나면 외부인이 온다', () => {
  const r = rules();
  assert.equal(r.outsiderDue(0, 114000), false);
  assert.equal(r.outsiderDue(0, 116000), true);
});

test('트리거 표현은 발설로 본다', () => {
  const r = rules();
  assert.equal(r.leaksInMessage('kang', '해커한테 받았어요'), true);
  assert.equal(r.leaksInMessage('kang', '외국인 친구가 줬어요'), true);
  assert.equal(r.leaksInMessage('kang', '폴넷에서 봤어요'), false);
});

test('이름은 낱말로 떨어져 있을 때만 잡는다', () => {
  const r = rules();
  assert.equal(r.leaksInMessage('kang', 'K가 줬어요'), true);
  assert.equal(r.leaksInMessage('kang', 'OK 알겠습니다'), false);
  assert.equal(r.leaksInMessage('kang', 'KTX 타고 갑니다'), false);
});

test('소각 대상 본인과의 대화는 판정하지 않는다', () => {
  const r = rules();
  assert.equal(r.leaksInMessage('k', 'K씨 해커예요?'), false);
});

test('제공자의 메시지에서만 수령을 인정한다', () => {
  const r = rules();
  assert.equal(r.marksProvided('kang', '접수시각 02:47이에요~'), true);
  assert.equal(r.marksProvided('kim', '접수시각 02:47입니다'), false);
  assert.equal(r.marksProvided('kang', '지금 밖이라서요ㅠ'), false);
});

test('받지 않고 채우면 들킨다', () => {
  const r = rules();
  assert.equal(r.leaksInReport('1187-basic', { reporter: '서동철 02:47' }, false), true);
  assert.equal(r.leaksInReport('1187-basic', { plate: '34가 12XX' }, false), true);
});

test('받았으면 채워도 안 들킨다', () => {
  const r = rules();
  assert.equal(r.leaksInReport('1187-basic', { reporter: '서동철 02:47' }, true), false);
});

test('추적 대상 아닌 항목은 무관', () => {
  const r = rules();
  assert.equal(r.leaksInReport('1187-basic', { location: '강변로3길 27' }, false), false);
  assert.equal(r.leaksInReport('1187-basic', { reporter: '   ' }, false), false);
  assert.equal(r.leaksInReport('1204-compare', { reporter: '서동철' }, false), false);
});

test('추궁 대사는 경로에 따라 다르다', () => {
  const r = rules({ random: fixed(0) });
  assert.deepEqual(r.confrontLines('message', 0).lines.map((l) => l.text), ['m1', 'm2']);
  assert.deepEqual(r.confrontLines('report', 0).lines.map((l) => l.text), ['r1', 'r2']);
});

test('추궁은 지연 후 시작하고 마지막 줄이 표시된다', () => {
  const r = rules({ random: fixed(0) });
  const { by, lines } = r.confrontLines('message', 1000);
  assert.equal(by, 'kang');
  assert.equal(lines[0].at, 1000 + 26000);
  assert.equal(lines[1].at, 1000 + 26000 + 2200);
  assert.equal(lines[1].last, true);
});
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStoryRules } from '../core/rules/story.js';

const STORY = {
  outsiderAppears: { who: 'k', afterIdleSec: 115, lines: ['a', 'b'], lineGapSec: [1.4, 3.2] },
  leak: {
    burns: 'k',
    triggers: ['해커', '외국인 친구'],
    traceable: [
      { form: '1187-basic', field: 'reporter', record: '1187-report-log' },
      { form: '1187-basic', field: 'plate', record: '1187-cctv-read' },
    ],
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

test('받지 않고 채우면 들킨다', () => {
  const r = rules();
  assert.equal(r.leaksInReport('1187-basic', { reporter: '서동철 02:47' }, []), true);
  assert.equal(r.leaksInReport('1187-basic', { plate: '34가 12XX' }, []), true);
});

test('틀리게 채우면 들키지 않는다', () => {
  const r = rules();
  assert.equal(
    r.leaksInReport('1187-basic', { reporter: 'ㅁㄴㅇㄹ' }, [], ['reporter']),
    false,
    '반려당한 칸은 받지 않았다는 증거다'
  );
  assert.equal(
    r.leaksInReport('1187-basic', { reporter: '서동철 02:47' }, [], ['plate']),
    true,
    '다른 칸이 틀린 것은 이 칸의 판정과 무관하다'
  );
  assert.equal(
    r.leaksInReport(
      '1187-basic',
      { reporter: '서동철 02:47', plate: 'ㅁㄴㅇㄹ' },
      [],
      ['plate']
    ),
    true,
    '한 칸이 틀려도 맞은 칸이 남아 있으면 들킨다'
  );
});

test('받은 자료는 채워도 안 들킨다', () => {
  const r = rules();
  assert.equal(
    r.leaksInReport('1187-basic', { reporter: '서동철 02:47' }, ['1187-report-log']),
    false
  );
});

test('받은 자료와 채운 칸이 다르면 들킨다', () => {
  const r = rules();
  assert.equal(
    r.leaksInReport('1187-basic', { plate: '34가 12XX' }, ['1187-report-log']),
    true,
    '원부는 받았지만 판독 결과는 안 받았다'
  );
  assert.equal(
    r.leaksInReport(
      '1187-basic',
      { reporter: '서동철 02:47', plate: '34가 12XX' },
      ['1187-report-log']
    ),
    true,
    '하나만 받고 둘을 채웠다'
  );
});

// 옛 전역 불리언 경로가 사라졌으므로 record 없는 항목은 판정할 근거가 없다.
// 조용히 넘기면 delivered.includes(undefined)가 false가 되어, 그 칸은 무엇을
// 적어도 발설로 읽힌다. 콘텐츠 한 줄이 억울한 소각을 만드는 모양이다.
test('traceable에 record가 없으면 만들 때 터진다', () => {
  const broken = {
    ...STORY,
    leak: { ...STORY.leak, traceable: [{ form: '1187-basic', field: 'legacy' }] },
  };
  assert.throws(() => createStoryRules(broken, CHARS), /traceable에 record 없음/);
});

test('추적 대상 아닌 항목은 무관', () => {
  const r = rules();
  assert.equal(r.leaksInReport('1187-basic', { location: '강변로3길 27' }, []), false);
  assert.equal(r.leaksInReport('1187-basic', { reporter: '   ' }, []), false);
  assert.equal(r.leaksInReport('1204-compare', { reporter: '서동철' }, []), false);
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
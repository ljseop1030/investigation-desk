import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFormRules } from '../core/rules/forms.js';

const fixed = (v) => () => v;

const FORM = {
  id: '1187-basic',
  fields: [
    {
      id: 'datetime',
      private: { keys: ['2024', '03', '09', '0241'], alts: [['2024', '3', '9', '241']] },
    },
    { id: 'location', private: { keys: ['강변로3길', '27'] } },
    { id: 'victim', private: { keys: ['정민호', '34'], alts: [['정민호']] } },
  ],
};

const rules = (opts) => createFormRules(opts);
const only = (id, value) => ({ [id]: value });

test('검토 시각에 tempo가 적용된다', () => {
  assert.equal(rules({ random: fixed(0) }).reviewAt(1000), 26000);
  assert.equal(rules({ tempo: 10, random: fixed(0) }).reviewAt(1000), 3500);
});

test('구두점과 공백은 무시된다', () => {
  const r = rules();
  const f = { fields: [FORM.fields[1]] };
  for (const v of ['강변로3길 27', '강변로3길27', '강변로3길-27', '강변로3길 27번지']) {
    assert.deepEqual(r.grade(f, only('location', v)).bad, [], v);
  }
});

test('날짜 표기 변형 — keys와 alts 양쪽으로 통과', () => {
  const r = rules();
  const f = { fields: [FORM.fields[0]] };
  // keys 경로: 03, 09 두 자리
  assert.equal(r.grade(f, only('datetime', '2024-03-09 02:41')).pass, true);
  // alts 경로: 3, 9 한 자리
  assert.equal(r.grade(f, only('datetime', '2024. 3. 9. 02:41')).pass, true);
});

test('연도가 틀리면 미비', () => {
  const r = rules();
  const f = { fields: [FORM.fields[0]] };
  assert.deepEqual(r.grade(f, only('datetime', '2023-03-09 02:41')).bad, ['datetime']);
});

test('공란은 미비', () => {
  const r = rules();
  assert.deepEqual(r.grade(FORM, {}).bad, ['datetime', 'location', 'victim']);
  assert.deepEqual(r.grade(FORM, { datetime: '   ' }).bad.includes('datetime'), true);
});

test('alts는 더 느슨한 답도 받는다', () => {
  const r = rules();
  const f = { fields: [FORM.fields[2]] };
  assert.equal(r.grade(f, only('victim', '정민호 남 34세')).pass, true);
  assert.equal(r.grade(f, only('victim', '정민호')).pass, true);   // alts
});

test('전부 맞으면 pass', () => {
  const r = rules();
  const res = r.grade(FORM, {
    datetime: '2024-03-09 02:41',
    location: '강변로3길 27',
    victim: '정민호 / 남 / 34세',
  });
  assert.deepEqual(res, { pass: true, bad: [] });
});

test('private이 없으면 채점하지 않는다 (공개본 방어)', () => {
  const r = rules();
  const 공개본 = { fields: [{ id: 'datetime' }] };
  assert.deepEqual(r.grade(공개본, {}), { pass: true, bad: [] });
});

test('알려진 한계: 순서·위치를 보지 않는다', () => {
  const r = rules();
  const f = { fields: [FORM.fields[0]] };
  // keys 조각이 어디든 있으면 통과한다. 순서가 뒤집혀도, 뒤에 숫자가 붙어도.
  // 엄격하게 하려면 keys를 정규식(^\D*...\D*$)으로 바꾸면 되지만,
  // alts를 얼마나 채워야 충분한지 로그를 봐야 안다. P6에서 판단.
  assert.equal(r.grade(f, only('datetime', '2024030902410000')).pass, true);
  assert.equal(r.grade(f, only('datetime', '0241 2024 03 09')).pass, true);
});
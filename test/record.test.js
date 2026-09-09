import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRecordRules } from '../core/rules/records.js';
import { ACCESS } from '../shared/enums.js';

const fixed = (v) => () => v;
const restricted = { id: '1187-victim', access: ACCESS.RESTRICTED };
const open = { id: '1187-cctv-list', access: ACCESS.OPEN };
const unregistered = { id: '1187-forensics', access: ACCESS.UNREGISTERED };
const all = [restricted, open, unregistered];

test('제한열람만 신청 대상', () => {
  const r = createRecordRules();
  assert.equal(r.canRequest(restricted, '1187 기초자료 정리표 작성'), true);
  assert.equal(r.canRequest(open, '1187 기초자료 정리표 작성'), false);
  assert.equal(r.canRequest(unregistered, '1187 기초자료 정리표 작성'), false);
});

test('사유가 짧으면 신청 안 된다', () => {
  const r = createRecordRules();
  assert.equal(r.canRequest(restricted, '확인'), false);
  assert.equal(r.canRequest(restricted, '     '), false);
  assert.equal(r.canRequest(restricted, ''), false);
  assert.equal(r.canRequest(restricted, undefined), false);
});

test('승인 시각에 tempo가 적용된다', () => {
  const now = 1000;
  assert.equal(createRecordRules({ random: fixed(0) }).approvalAt(now), now + 45000);
  assert.equal(createRecordRules({ tempo: 10, random: fixed(0) }).approvalAt(now), now + 4500);
});

test('없는 자료 키는 걸러진다', () => {
  const r = createRecordRules();
  assert.deepEqual(
    r.validDeliveries(['1187-forensics', '없는키', 'DROP TABLE'], all),
    ['1187-forensics']
  );
});

test('이미 준 자료는 다시 안 준다', () => {
  const r = createRecordRules();
  assert.deepEqual(r.validDeliveries(['1187-forensics'], all, ['1187-forensics']), []);
});

test('중복 키는 하나로', () => {
  const r = createRecordRules();
  assert.deepEqual(
    r.validDeliveries(['1187-forensics', '1187-forensics'], all),
    ['1187-forensics']
  );
});

test('delivers가 없어도 죽지 않는다', () => {
  const r = createRecordRules();
  assert.deepEqual(r.validDeliveries(undefined, all), []);
  assert.deepEqual(r.validDeliveries([], all), []);
});
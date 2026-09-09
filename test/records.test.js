import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRecordRules } from '../core/rules/records.js';
import { ACCESS } from '../shared/enums.js';

const fixed = (v) => () => v;

const RECORDS = [
  { id: '1187-victim',   access: ACCESS.RESTRICTED },
  { id: '1187-cctv',     access: ACCESS.OPEN },
  { id: '1187-forensic', access: ACCESS.UNREGISTERED, provider: 'yoo' },
  { id: '1187-photos',   access: ACCESS.UNREGISTERED, provider: 'yoo' },
  { id: '1187-vehicle',  access: ACCESS.UNREGISTERED, provider: 'kim' },
];

const rules = (opts) => createRecordRules(RECORDS, opts);
const find = (id) => RECORDS.find((r) => r.id === id);

test('제한열람만 신청 대상', () => {
  const r = rules();
  assert.equal(r.canRequest('1187-victim', '1187 기초자료 정리표 작성'), true);
  assert.equal(r.canRequest('1187-cctv', '1187 기초자료 정리표 작성'), false);
  assert.equal(r.canRequest('1187-forensic', '1187 기초자료 정리표 작성'), false);
  assert.equal(r.canRequest('없는키', '1187 기초자료 정리표 작성'), false);
});

test('사유가 짧으면 신청 안 된다', () => {
  const r = rules();
  assert.equal(r.canRequest('1187-victim', '확인'), false);
  assert.equal(r.canRequest('1187-victim', '     '), false);
  assert.equal(r.canRequest('1187-victim', undefined), false);
});

test('승인 시각에 tempo가 적용된다', () => {
  assert.equal(rules({ random: fixed(0) }).approvalAt(1000), 46000);
  assert.equal(rules({ tempo: 10, random: fixed(0) }).approvalAt(1000), 5500);
});

test('소관 자료는 등록된다', () => {
  assert.deepEqual(rules().validDeliveries(['1187-forensic'], 'yoo'), ['1187-forensic']);
});

test('남의 소관은 등록 못 한다', () => {
  assert.deepEqual(rules().validDeliveries(['1187-vehicle'], 'yoo'), []);
});

test('제한열람은 메신저로 우회할 수 없다', () => {
  assert.deepEqual(rules().validDeliveries(['1187-victim'], 'yoo'), []);
});

test('이미 열려 있는 자료는 등록 대상이 아니다', () => {
  assert.deepEqual(rules().validDeliveries(['1187-cctv'], 'yoo'), []);
});

test('없는 키와 이상한 값은 걸러진다', () => {
  assert.deepEqual(rules().validDeliveries(['없는키', 'DROP TABLE'], 'yoo'), []);
});

test('이미 준 자료는 다시 안 준다', () => {
  assert.deepEqual(
    rules().validDeliveries(['1187-forensic'], 'yoo', ['1187-forensic']),
    []
  );
});

test('중복 키는 하나로', () => {
  assert.deepEqual(
    rules().validDeliveries(['1187-forensic', '1187-forensic'], 'yoo'),
    ['1187-forensic']
  );
});

test('여러 건 요청은 소관인 것만', () => {
  assert.deepEqual(
    rules().validDeliveries(['1187-forensic', '1187-photos', '1187-vehicle'], 'yoo'),
    ['1187-forensic', '1187-photos']
  );
});

test('delivers가 없어도 죽지 않는다', () => {
  assert.deepEqual(rules().validDeliveries(undefined, 'yoo'), []);
  assert.deepEqual(rules().validDeliveries([], 'yoo'), []);
});
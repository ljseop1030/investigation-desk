import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRecordRules } from '../core/rules/records.js';
import { ACCESS } from '../shared/enums.js';

const fixed = (v) => () => v;

const RECORDS = [
  { id: '1187-victim',     access: ACCESS.RESTRICTED },
  { id: '1187-cctv',       access: ACCESS.OPEN },
  { id: '1187-forensic',   access: ACCESS.UNREGISTERED, provider: 'yoo' },
  { id: '1187-photos',     access: ACCESS.UNREGISTERED, provider: 'yoo' },
  { id: '1187-vehicle',    access: ACCESS.UNREGISTERED, provider: 'kim' },
  { id: '1187-report-log', access: ACCESS.NONE, provider: 'kang' },
  { id: '1204-print',      access: ACCESS.NONE, provider: 'kim' },
];

const rules = (opts) => createRecordRules(RECORDS, opts);

test('제한열람만 신청 대상', () => {
  const r = rules();
  assert.equal(r.canRequest('1187-victim', '1187 기초자료 정리표 작성'), true);
  assert.equal(r.canRequest('1187-cctv', '1187 기초자료 정리표 작성'), false);
  assert.equal(r.canRequest('1187-forensic', '1187 기초자료 정리표 작성'), false);
  assert.equal(r.canRequest('1187-report-log', '1187 기초자료 정리표 작성'), false);
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
  assert.deepEqual(rules().validDeliveries(['1187-forensic'], 'yoo'), [
    { id: '1187-forensic', kind: 'register' },
  ]);
});

test('말로만 주는 자료는 등록이 아니라 구두로 갈린다', () => {
  assert.deepEqual(rules().validDeliveries(['1187-report-log'], 'kang'), [
    { id: '1187-report-log', kind: 'tell' },
  ]);
});

test('같은 사람이 등록분과 구두분을 함께 줄 수 있다', () => {
  assert.deepEqual(rules().validDeliveries(['1187-vehicle', '1204-print'], 'kim'), [
    { id: '1187-vehicle', kind: 'register' },
    { id: '1204-print', kind: 'tell' },
  ]);
});

test('남의 소관은 등록 못 한다', () => {
  assert.deepEqual(rules().validDeliveries(['1187-vehicle'], 'yoo'), []);
});

test('말로만 주는 자료도 소관을 본다', () => {
  assert.deepEqual(rules().validDeliveries(['1187-report-log'], 'kim'), []);
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
  assert.deepEqual(
    rules().validDeliveries(['1187-report-log'], 'kang', ['1187-report-log']),
    [],
    '구두로 준 것도 두 번 오지 않는다'
  );
});

test('중복 키는 하나로', () => {
  assert.deepEqual(
    rules().validDeliveries(['1187-forensic', '1187-forensic'], 'yoo'),
    [{ id: '1187-forensic', kind: 'register' }]
  );
});

test('여러 건 요청은 소관인 것만', () => {
  assert.deepEqual(
    rules().validDeliveries(['1187-forensic', '1187-photos', '1187-vehicle'], 'yoo'),
    [
      { id: '1187-forensic', kind: 'register' },
      { id: '1187-photos', kind: 'register' },
    ]
  );
});

test('delivers가 없어도 죽지 않는다', () => {
  assert.deepEqual(rules().validDeliveries(undefined, 'yoo'), []);
  assert.deepEqual(rules().validDeliveries([], 'yoo'), []);
});
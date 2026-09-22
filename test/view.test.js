import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState } from '../core/state.js';
import { createView, RECORD } from '../core/view.js';
import { ACCESS } from '../shared/enums.js';

const CONTENT = {
  records: [
    { id: 'open-one', access: ACCESS.OPEN, body: '공개본' },
    { id: 'locked-one', access: ACCESS.RESTRICTED, private: { body: '비밀' } },
    { id: 'missing-one', access: ACCESS.UNREGISTERED, provider: 'yoo', private: { body: '감식결과' } },
    { id: 'held-one', access: ACCESS.NONE, provider: 'kang', private: { body: '접수시각 02:47' } },
  ],
};

const setup = () => {
  const state = createState();
  return { state, view: createView({ state, content: CONTENT }), p: state.progress() };
};

test('처음부터 열려 있는 자료', () => {
  const { view } = setup();
  assert.equal(view.recordState('open-one'), RECORD.OPEN);
  assert.equal(view.recordBody('open-one'), '공개본');
});

test('제한열람은 잠김 → 신청 → 열림', () => {
  const { view, p } = setup();
  assert.equal(view.recordState('locked-one'), RECORD.LOCKED);

  p.requested.push('locked-one');
  assert.equal(view.recordState('locked-one'), RECORD.PENDING);

  p.unlocked.push('locked-one');
  assert.equal(view.recordState('locked-one'), RECORD.OPEN);
});

test('미등록 자료는 담당자가 올려야 보인다', () => {
  const { view, p } = setup();
  assert.equal(view.recordState('missing-one'), RECORD.MISSING);

  p.delivered.push('missing-one');
  assert.equal(view.recordState('missing-one'), RECORD.OPEN);
});

test('DB에 올라올 일이 없는 자료는 숨는다', () => {
  const { view } = setup();
  assert.equal(view.recordState('held-one'), RECORD.HIDDEN);
});

test('구두로 받아도 DB에는 나타나지 않는다', () => {
  const { view, p } = setup();
  p.delivered.push('held-one');
  assert.equal(view.recordState('held-one'), RECORD.HIDDEN, '수령 기록은 남지만 등록된 것이 아니다');
  assert.equal(view.recordBody('held-one'), null);
});

test('목록에는 숨은 자료가 빠진다', () => {
  const { view, p } = setup();
  assert.deepEqual(view.visibleRecordIds(), ['open-one', 'locked-one', 'missing-one'], '콘텐츠 순서 그대로');

  p.delivered.push('held-one');
  assert.deepEqual(
    view.visibleRecordIds(),
    ['open-one', 'locked-one', 'missing-one'],
    '구두로 받아도 목록에 생기지 않는다'
  );
});

test('목록은 진행에 따라 늘거나 줄지 않는다', () => {
  const { view, p } = setup();
  const before = view.visibleRecordIds();

  p.requested.push('locked-one');
  p.unlocked.push('locked-one');
  p.delivered.push('missing-one');

  assert.deepEqual(view.visibleRecordIds(), before, '상태만 바뀌고 목록은 그대로다');
});

test('열리기 전에는 본문을 주지 않는다', () => {
  const { view, p } = setup();
  assert.equal(view.recordBody('locked-one'), null);

  p.requested.push('locked-one');
  assert.equal(view.recordBody('locked-one'), null, '신청만으로는 안 열린다');

  p.unlocked.push('locked-one');
  assert.equal(view.recordBody('locked-one'), '비밀');
});

test('미등록 자료도 등록 전에는 주지 않는다', () => {
  const { view, p } = setup();
  assert.equal(view.recordBody('missing-one'), null);

  p.delivered.push('missing-one');
  assert.equal(view.recordBody('missing-one'), '감식결과');
});

test('없는 자료는 null', () => {
  const { view } = setup();
  assert.equal(view.recordState('없는거'), null);
  assert.equal(view.recordBody('없는거'), null);
});

test('미확인은 본 시각 이후에 도착한 상대 말만 센다', () => {
  const { view, p } = setup();
  p.chats.kang = [
    { me: true, text: '요청드립니다', at: 100 },
    { me: false, text: '이거예요~', at: 200 },
    { me: false, text: '확인해보세요 ^^', at: 300 },
  ];
  assert.equal(view.unread('kang'), 2);

  p.seenAt.kang = 250;
  assert.equal(view.unread('kang'), 1);

  p.seenAt.kang = 300;
  assert.equal(view.unread('kang'), 0, '같은 시각은 본 것으로 친다');
});

test('대화가 없는 상대는 0', () => {
  const { view } = setup();
  assert.equal(view.unread('아무도아님'), 0);
  assert.deepEqual(view.chat('아무도아님'), []);
});

test('돌려준 것을 고쳐도 상태가 바뀌지 않는다', () => {
  const { view, p } = setup();
  p.chats.kang = [{ me: false, text: '원본', at: 1 }];

  const got = view.chat('kang');
  got.push({ me: false, text: '끼워넣기', at: 2 });
  got[0].text = '덮어쓰기';

  assert.equal(p.chats.kang.length, 1);
  assert.equal(p.chats.kang[0].text, '원본');
});

test('로그인 여부', () => {
  const { view, p } = setup();
  assert.equal(view.isAuthed('polnet'), false);
  p.authed.polnet = true;
  assert.equal(view.isAuthed('polnet'), true);
});

test('손대지 않은 양식은 null', () => {
  const { view, p } = setup();
  assert.equal(view.form('1187-basic'), null);

  p.forms['1187-basic'] = { values: { location: '강변로3길 27' }, status: 'review', marks: null };
  assert.equal(view.form('1187-basic').status, 'review');
});

test('외부인 상태', () => {
  const { view, p } = setup();
  assert.equal(view.outsider(), 'hidden');
  p.story.outsider = 'burned';
  assert.equal(view.outsider(), 'burned');
});
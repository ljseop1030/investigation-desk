import test from 'node:test';
import assert from 'node:assert/strict';
import { createAi, toHistory } from '../adapters/ai/index.js';

const ok = (body) => async () => ({ ok: true, status: 200, json: async () => body });

test('로그를 history로 바꾼다', () => {
  const history = toHistory([
    { me: true, text: '안녕하세요', at: 1, read: true },
    { me: false, text: '네', at: 2 },
  ]);
  assert.deepEqual(history, [
    { role: 'user', content: '안녕하세요' },
    { role: 'assistant', content: '네' },
  ]);
});

test('시각과 읽음은 국경을 넘지 않는다', () => {
  const [first] = toHistory([{ me: true, text: 'x', at: 99, read: false }]);
  assert.deepEqual(Object.keys(first), ['role', 'content']);
});

test('연속된 내 말을 합치지 않는다', () => {
  // 병합은 서버 몫이다. 프롬프트 조립과 같은 자리에 있어야 한 곳만 고친다.
  const history = toHistory([
    { me: true, text: '저기' },
    { me: true, text: '자료 좀' },
  ]);
  assert.equal(history.length, 2);
});

test('빈 말은 버린다', () => {
  assert.equal(toHistory([{ me: true, text: '' }, { me: true, text: 'x' }]).length, 1);
});

const capture = (body = { messages: ['네.'] }) => {
  const box = {};
  box.fetch = async (url, opts) => {
    box.url = url;
    box.body = JSON.parse(opts.body);
    return { ok: true, status: 200, json: async () => body };
  };
  return box;
};

test('전선에 나가는 것은 characterId·history·playerName 셋뿐', async () => {
  // style도 bubbles도 보내지 않는다. 서버가 characterId로 자기 콘텐츠에서
  // 꺼낸다. 클라이언트가 말해주는 것은 무엇도 신뢰하지 않는다.
  const box = capture();
  const ai = createAi({ fetch: box.fetch });
  await ai.reply('yoo', [{ me: true, text: '감식 자료 주세요' }], '김민수');

  assert.equal(box.url, '/api/chat');
  assert.deepEqual(Object.keys(box.body), ['characterId', 'history', 'playerName']);
  assert.equal(box.body.characterId, 'yoo');
});

test('플레이어 이름이 실린다', async () => {
  // 게임 상태가 아니라 플레이어가 시작 화면에서 방금 입력한 자기 데이터다.
  // P10 전까지 서버가 알 방법이 없어서 이것만 클라이언트가 말해준다.
  const box = capture();
  await createAi({ fetch: box.fetch }).reply('kang', [{ me: true, text: '안녕하세요' }], '김민수');
  assert.equal(box.body.playerName, '김민수');
});

test('이름을 안 받으면 빈 문자열로 보낸다', async () => {
  // 시작 화면에서 이름을 비워둘 수 있다. undefined가 나가면 JSON에서
  // 키째 사라지고, 서버의 typeof 검사가 다른 가지를 탄다.
  const box = capture();
  await createAi({ fetch: box.fetch }).reply('kang', []);
  assert.equal(box.body.playerName, '');
});

test('모자란 필드를 채워서 돌려준다', async () => {
  const ai = createAi({ fetch: ok({ messages: ['네.'] }) });
  assert.deepEqual(await ai.reply('yoo', []), {
    messages: ['네.'],
    delivers: [],
    ghost: false,
    leak: false,
  });
});

test('문자열이 아닌 말풍선은 버린다', async () => {
  const ai = createAi({ fetch: ok({ messages: ['네.', 42, null] }) });
  const out = await ai.reply('yoo', []);
  assert.deepEqual(out.messages, ['네.']);
});

test('말풍선 개수는 여기서 자르지 않는다', async () => {
  // 서버가 자르고 core가 style.bubbles로 또 자른다. 중간에서 또 보면 셋이 된다.
  const ai = createAi({ fetch: ok({ messages: ['1', '2', '3', '4', '5', '6'] }) });
  assert.equal((await ai.reply('kang', [])).messages.length, 6);
});

test('delivers를 여기서 검증하지 않는다', async () => {
  // core의 validDeliveries가 실재·소관·중복을 본다. 여기서 한 번 더 보면
  // 규칙이 두 군데가 되고 한쪽만 고치게 된다.
  const ai = createAi({ fetch: ok({ messages: ['등록했습니다.'], delivers: ['없는-키'] }) });
  assert.deepEqual((await ai.reply('yoo', [])).delivers, ['없는-키']);
});

test('ghost와 leak은 true일 때만 true', async () => {
  const ai = createAi({ fetch: ok({ messages: [], ghost: 'yes', leak: 1 }) });
  const out = await ai.reply('yoo', []);
  assert.equal(out.ghost, false);
  assert.equal(out.leak, false);
});

test('서버가 200이 아니면 던진다', async () => {
  const ai = createAi({ fetch: async () => ({ ok: false, status: 500 }) });
  await assert.rejects(() => ai.reply('yoo', []));
});

test('응답이 JSON이 아니면 던진다', async () => {
  const ai = createAi({
    fetch: async () => ({ ok: true, status: 200, json: async () => { throw new Error('not json'); } }),
  });
  await assert.rejects(() => ai.reply('yoo', []));
});

test('응답이 객체가 아니면 던진다', async () => {
  const ai = createAi({ fetch: ok('감식 자료를 등록했습니다') });
  await assert.rejects(() => ai.reply('yoo', []));
});

test('네트워크가 끊기면 던진다', async () => {
  // 던지는 것이 곧 fallback 신호다. 빈 messages를 돌려주면 침묵이 되어
  // 플레이어에게는 전혀 다른 일이 된다.
  const ai = createAi({ fetch: async () => { throw new Error('offline'); } });
  await assert.rejects(() => ai.reply('yoo', []));
});
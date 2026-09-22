// POST /api/chat
//
// 받는 것   { characterId, history, playerName }
// 하는 일   history 다듬기 → prompt.js로 시스템 프롬프트 조립 → 모델 호출
//           → 응답 검증 → 반환
//
// 클라이언트가 보내는 것은 신뢰하지 않는다. persona도 말풍선 범위도 여기서
// characterId로 꺼낸다. playerName만은 예외다 — 플레이어가 방금 입력한
// 자기 데이터이고, P10 전까지 서버가 알 방법이 없다.
//
// 실패하면 그냥 상태 코드를 뱉는다. 어댑터가 던지고 core가 캐릭터 fallback
// 대사로 답한다. 여기서 그럴듯한 대사를 지어내지 않는다 — 그 대사는 캐릭터의
// 것이지 서버의 것이 아니다.

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-3.6-flash';

// 말이 안 되는 응답에 대한 상한이다. 캐릭터별 정확한 개수는 core가
// style.bubbles로 자른다. 그 숫자가 사는 곳이 거기라서 여기로 가져오지 않는다.
const MAX_BUBBLES = 6;
const MAX_TURNS = 40;      // 보내는 이력 상한. 비용과 지연 때문
const MAX_CHARS = 2000;    // 말풍선 하나의 상한

// responseSchema로 JSON을 강제한다. 백틱이나 머리말을 걷어내는 방어 코드가
// 이것 하나로 사라진다.
const SCHEMA = {
  type: 'OBJECT',
  properties: {
    messages: { type: 'ARRAY', items: { type: 'STRING' } },
    delivers: { type: 'ARRAY', items: { type: 'STRING' } },
    ghost: { type: 'BOOLEAN' },
    leak: { type: 'BOOLEAN' },
  },
  required: ['messages', 'delivers', 'ghost', 'leak'],
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// 대화 첫머리에 캐릭터가 먼저 보내둔 말(백유림의 온보딩)은 이력이 아니라
// 배경이다. 이력으로 넘기면 모델이 "내가 방금 인사했으니 또 하지 말자"가
// 아니라 "인사를 주고받는 중"으로 읽는다.
//
// 연속된 같은 역할은 하나로 합친다. 메신저에서는 원래 나눠 치기 때문에
// 짧은 시간에 연달아 온 말은 한 덩어리로 읽어야 맞다.
export function shape(history) {
  // 기본 인자는 undefined에만 걸린다. 바깥에서 온 것이라 null도 온다.
  const clean = (history ?? [])
    .filter((m) => m && typeof m.content === 'string' && m.content.trim())
    .map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content.slice(0, MAX_CHARS),
    }));

  const merged = [];
  for (const m of clean) {
    const last = merged[merged.length - 1];
    if (last && last.role === m.role) last.content += '\n' + m.content;
    else merged.push({ ...m });
  }

  // 선두의 assistant 턴을 opening으로 걷어낸다
  let opening = '';
  while (merged.length && merged[0].role === 'assistant') {
    opening += (opening ? '\n' : '') + merged.shift().content;
  }

  return { opening, turns: merged.slice(-MAX_TURNS) };
}

// 모델이 서식 지시를 덜 지킬 때를 위한 최소한의 후처리.
// 문장을 다시 쓰지 않는다. 줄머리의 장식만 걷어낸다.
//
// 목록 머리표와 날짜를 가르는 것은 숫자의 크기가 아니라 뒤에 무엇이 오는가다.
// `2024. 3. 9.`도 `3. 13. 17:10`도 공문서 표준 표기이고 콘텐츠 전체가 이
// 모양이다. 강윤하 모드 B는 항목을 줄바꿈으로 나누라고 시키므로 줄머리에
// 날짜가 온다. 뒤에 숫자가 이어지면 머리표가 아니다.
const LEADER = /^\s*(?:[-*•‣▪]|\d{1,2}\.)\s+(?!\d)/;

export function strip(text) {
  return text
    .split('\n')
    .map((line) => line.replace(LEADER, '').replace(/\*\*/g, ''))
    .join('\n')
    .trim();
}

export function validate(raw) {
  const messages = (Array.isArray(raw?.messages) ? raw.messages : [])
    .filter((t) => typeof t === 'string')
    .map(strip)
    .filter(Boolean)
    .slice(0, MAX_BUBBLES);

  return {
    messages,
    // 실재·소관·중복은 core의 validDeliveries가 본다. 여기서 또 보면
    // 규칙이 두 군데가 되고 한쪽만 고치게 된다. 모양만 맞춘다.
    delivers: (Array.isArray(raw?.delivers) ? raw.delivers : []).filter(
      (k) => typeof k === 'string'
    ),
    ghost: raw?.ghost === true || messages.length === 0,
    leak: raw?.leak === true,
  };
}

// 콘텐츠를 못 읽는 것과 모르는 캐릭터는 원인도, 고치는 사람도 다르다.
// 502는 서브모듈·배포 문제이고 400은 클라이언트가 부르지 말았어야 할 것을
// 부른 것이다. 하나로 뭉치면 5c에서 둘 다 의심하며 시간을 쓴다.
//
// 로더를 인자로 받는 것은 테스트 때문이다. 여기서 직접 import 하면 콘텐츠가
// 있는 자리(로컬)와 없는 자리(CI)에서 결과가 갈려 테스트를 쓸 수가 없다.
export async function resolveSystem(load, { characterId, playerName, opening }) {
  let buildSystem;
  try {
    ({ buildSystem } = await load());
  } catch (e) {
    console.error('[chat] 콘텐츠를 읽지 못함', e?.message);
    return { status: 502, error: 'content missing' };
  }

  let system;
  try {
    system = buildSystem({ characterId, playerName, opening });
  } catch (e) {
    console.error('[chat] 프롬프트 조립 실패', characterId, e?.message);
    return { status: 400, error: 'unknown character' };
  }

  // persona가 빠진 캐릭터는 던지지 않고 빈 것을 돌려줄 수도 있다.
  // 그대로 보내면 모델이 아무 성격 없이 답하고, 화면에서는 페르소나가
  // 무너진 것처럼 보인다. personas/index.js가 손목록이라 실제로 생길 수 있다.
  if (typeof system !== 'string' || !system.trim()) {
    console.error('[chat] 시스템 프롬프트가 비었다', characterId);
    return { status: 400, error: 'unknown character' };
  }

  return { system };
}

export async function onRequestPost({ request, env }) {
  if (!env.GEMINI_API_KEY) return json({ error: 'no key' }, 500);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'bad json' }, 400);
  }

  const { characterId, history, playerName } = body ?? {};
  if (typeof characterId !== 'string') return json({ error: 'bad characterId' }, 400);

  const { opening, turns } = shape(history);
  if (!turns.length) return json({ error: 'empty history' }, 400);

  // 콘텐츠를 핸들러 안에서 부른다. 최상단에 두면 이 파일을 import 하는
  // 것만으로 content/가 필요해지고, CI는 콘텐츠 없이 도는 게 정상이다.
  // 정적 specifier라 번들에는 그대로 딸려 들어간다.
  const built = await resolveSystem(() => import('../../content/prompt.js'), {
    characterId,
    playerName: typeof playerName === 'string' ? playerName : '',
    opening,
  });
  if (built.error) return json({ error: built.error }, built.status);
  const system = built.system;

  const model = env.GEMINI_MODEL || DEFAULT_MODEL;
  const t0 = Date.now();

  let res;
  try {
    res = await fetch(`${ENDPOINT}/${model}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: turns.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: SCHEMA,
        },
      }),
    });
  } catch (e) {
    console.error('[chat] 모델에 닿지 못함', e?.message);
    return json({ error: 'upstream unreachable' }, 502);
  }

  // 어느 모델이 답했는지는 성공했을 때도 남겨야 한다. secret은 마스킹돼
  // 되읽히지 않고, 아래 '모델 거부'는 실패했을 때만 찍힌다. 그래서 배포본이
  // 무엇으로 도는지 확인할 길이 없었다. 200·429·503이 전부 이 한 줄을 지난다.
  console.log('[chat]', characterId, model, res.status, Date.now() - t0);

  // 왜 막혔는지는 구글이 본문에 적어 보낸다. 모델 id가 틀렸는지, 스키마를
  // 거부당했는지, 키가 문제인지가 여기서만 갈린다. 응답으로 흘리지 않고
  // 로그로만 남긴다 — 클라이언트는 fallback으로 도는 것만 알면 된다.
  if (!res.ok) {
    console.error('[chat] 모델 거부', res.status, model, (await res.text()).slice(0, 600));
    return json({ error: 'upstream', status: res.status }, 502);
  }

  let data;
  try {
    data = await res.json();
  } catch {
    console.error('[chat] 응답이 JSON이 아님');
    return json({ error: 'upstream shape' }, 502);
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== 'string') {
    // 안전필터에 걸리거나 토큰이 모자라면 parts 없이 finishReason만 온다
    console.error('[chat] 본문 없음', JSON.stringify(data).slice(0, 600));
    return json({ error: 'upstream shape' }, 502);
  }

  try {
    return json(validate(JSON.parse(text)));
  } catch {
    console.error('[chat] 모델이 JSON이 아닌 것을 뱉음', text.slice(0, 600));
    return json({ error: 'model json' }, 502);
  }
}
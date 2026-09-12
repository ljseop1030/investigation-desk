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
const DEFAULT_MODEL = 'gemini-2.5-flash';

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
// P6에서 실제 출력을 보고 조이거나 푼다.
export function strip(text) {
  return text
    .split('\n')
    .map((line) => line.replace(/^\s*(?:[-*•‣▪]|\d+\.)\s+/, '').replace(/\*\*/g, ''))
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
  let system;
  try {
    const { buildSystem } = await import('../../content/prompt.js');
    system = buildSystem({
      characterId,
      playerName: typeof playerName === 'string' ? playerName : '',
      opening,
    });
  } catch {
    // persona가 없는 캐릭터다. core가 갈라내야 하는데 여기까지 왔다.
    return json({ error: 'unknown character' }, 400);
  }

  const model = env.GEMINI_MODEL || DEFAULT_MODEL;

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
  } catch {
    return json({ error: 'upstream unreachable' }, 502);
  }

  if (!res.ok) return json({ error: 'upstream', status: res.status }, 502);

  let text;
  try {
    const data = await res.json();
    text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  } catch {
    return json({ error: 'upstream shape' }, 502);
  }
  if (typeof text !== 'string') return json({ error: 'upstream shape' }, 502);

  try {
    return json(validate(JSON.parse(text)));
  } catch {
    return json({ error: 'model json' }, 502);
  }
}
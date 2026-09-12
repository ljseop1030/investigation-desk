// core와 /api/chat 사이의 번역기. 여기서 하는 일은 셋뿐이다.
// 어휘 바꾸기, 국경 넘기기, 돌아온 것을 core가 아는 모양으로 만들기.
//
// 프롬프트 조립도 연속 메시지 병합도 여기서 하지 않는다. 둘 다 모델 출력을
// 바꾸는 손잡이이고, P6은 그 손잡이를 수십 번 돌리는 구간이다. 클라이언트에
// 두면 프롬프트를 만질 때마다 프론트를 다시 빌드하게 된다.
//
// 전선에 나가는 것은 characterId와 history 둘뿐이다. style도 bubbles도
// 보내지 않는다. 서버가 characterId로 자기 콘텐츠에서 꺼낸다. 클라이언트가
// 말해주는 것은 무엇도 신뢰하지 않는다는 성질이 계약 모양 하나로 지켜진다.

const ENDPOINT = '/api/chat';

// core의 로그는 { me, text, at, read }다. 시각도 읽음 표시도 서버가 알 필요가
// 없다. 국경을 넘는 것은 적을수록 좋다.
export function toHistory(log = []) {
  return log
    .filter((m) => typeof m?.text === 'string' && m.text.length)
    .map((m) => ({ role: m.me ? 'user' : 'assistant', content: m.text }));
}

// 서버가 준 것을 core가 아는 모양으로. 모자란 필드는 채우고, 남는 것은 버린다.
// 말풍선 개수 자르기와 delivers 검증은 여기서 하지 않는다 — 서버가 한 번,
// core가 validDeliveries로 또 한 번 본다. 중간에서 한 번 더 보면 세 군데가 된다.
function normalize(out) {
  if (!out || typeof out !== 'object') throw new Error('응답 모양이 아니다');
  return {
    messages: Array.isArray(out.messages) ? out.messages.filter((t) => typeof t === 'string') : [],
    delivers: Array.isArray(out.delivers) ? out.delivers : [],
    ghost: out.ghost === true,
    leak: out.leak === true,
  };
}

export function createAi({ fetch, endpoint = ENDPOINT } = {}) {
  return {
    // 던지면 core가 캐릭터 fallback 대사로 답한다. 빈 messages를 돌려주는 것과
    // 다르다 — 그쪽은 침묵(ghost)이다. 서버가 죽었을 때 아무 말도 없는 것과
    // "지금 밖이라서요ㅠ"가 오는 것은 플레이어에게 전혀 다른 일이다.
    async reply(characterId, log) {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId, history: toHistory(log) }),
      });
      if (!res.ok) throw new Error(`/api/chat ${res.status}`);
      return normalize(await res.json());
    },
  };
}
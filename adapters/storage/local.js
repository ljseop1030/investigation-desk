// 바이트 저장소. 게임이 무엇인지 모른다.
// P10에서 server.js가 같은 모양으로 옆에 선다.
//
// 실패는 전부 삼킨다. 시크릿 모드에서 localStorage는 그냥 던지고,
// 저장이 안 된다고 게임이 멈추는 것보다 조용히 안 되는 편이 낫다.

const KEY = 'investigation-desk:save';

export function createLocalStorage({ key = KEY, storage } = {}) {
  const store = storage ?? (typeof localStorage === 'undefined' ? null : localStorage);

  return {
    load() {
      try {
        const raw = store?.getItem(key);
        return raw ? JSON.parse(raw) : null;
      } catch {
        // 깨진 세이브. 버리고 새로 시작한다.
        return null;
      }
    },

    // 문자열을 받는다. 직렬화는 부르는 쪽이 한다.
    // 저장할지 말지 판단하려면 어차피 먼저 문자열로 만들어봐야 하기 때문.
    save(json) {
      try {
        store?.setItem(key, json);
        return { ok: true, bytes: json.length };
      } catch (e) {
        return { ok: false, error: e };
      }
    },

    clear() {
      try {
        store?.removeItem(key);
      } catch {
        /* 지우기 실패는 무시 */
      }
    },
  };
}
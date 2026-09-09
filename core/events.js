// UI가 상태를 직접 읽지 않고 여기로 받는다.
export function createEvents() {
  const map = new Map();
  return {
    on(type, fn) {
      if (!map.has(type)) map.set(type, new Set());
      map.get(type).add(fn);
      return () => map.get(type).delete(fn);   // 구독 해제
    },
    emit(type, payload) {
      map.get(type)?.forEach((fn) => fn(payload));
    },
  };
}
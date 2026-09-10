// 문구 안의 {name} 자리를 값으로 채운다.
//
// 문구를 화살표 함수로 두면 번역자가 손댈 수 없고 JSON으로도 못 나간다.
// 문자열은 문자열로 두고, 값 끼우기는 여기서만 한다. P9에서 파일을 통째로 넘긴다.
export const fmt = (template, params = {}) =>
  String(template).replace(/\{(\w+)\}/g, (m, k) => (k in params ? String(params[k]) : m));
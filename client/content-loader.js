// client/content-loader.js
// 콘텐츠를 모아 온다. content/는 프라이빗 서브모듈이라 이 저장소에 없다.
// 받아오려면 `git submodule update --init --recursive`.

const collect = (glob) => Object.values(glob).map((m) => m.default);
const collectFlat = (glob) => collect(glob).flat();

export const cases      = collect(import.meta.glob('../content/cases/*/case.js', { eager: true }));
export const polnetDocs = [
  ...collectFlat(import.meta.glob('../content/cases/*/polnet.js', { eager: true })),
  ...collectFlat(import.meta.glob('../content/cases/polnet.js', { eager: true })),
];
export const records    = collectFlat(import.meta.glob('../content/cases/*/records.js', { eager: true }));
export const forms      = collect(import.meta.glob('../content/cases/*/form.js', { eager: true }));
export const characters = collect(import.meta.glob('../content/characters/*.js', { eager: true }));

export { default as notices } from '../content/notices.js';
export { default as story }   from '../content/story.js';
export { default as apps }    from '../content/screen/apps.js';
export { default as notes }   from '../content/screen/notes.js';
export { default as systems } from '../content/screen/systems.js';
export * from '../content/screen/org.js';
export * as terminal from '../content/screen/terminal.js';

// 실패 모양이 둘이다.
//
// 위의 정적 import(notices·story·screen/*)는 파일이 없으면 빌드가 즉시 터진다.
// 반면 import.meta.glob은 대상이 없어도 빈 객체를 돌려주므로 빌드가 성공하고
// 화면만 빈다. 그러니 여기서 잡는 건 '서브모듈은 붙었는데 폴더 경로가 어긋난'
// 조용한 실패다. 사건 폴더 이름이 바뀌거나 한 층 깊어졌을 때가 그렇다.
//
// 이건 런타임 가드라 vite build는 여전히 성공한다. 빌드 전에 걸러내는 일은
// scripts/check-content.js가 맡는다. 여기는 마지막 그물이다.
const missing = Object.entries({ cases, polnetDocs, records, forms, characters })
  .filter(([, v]) => v.length === 0)
  .map(([name]) => name);

if (missing.length) {
  throw new Error(
    `콘텐츠를 찾지 못했습니다: ${missing.join(', ')}\n` +
    'content/ 서브모듈이 비었거나 폴더 구조가 바뀌었습니다.\n' +
    'git submodule update --init --recursive'
  );
}
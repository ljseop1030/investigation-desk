// client/content-loader.js
// 콘텐츠를 모아 온다. content/는 프라이빗 서브모듈이라 이 저장소에 없다.
// 받아오려면 `git submodule update --init --recursive`.

const collect = (glob) => Object.values(glob).map((m) => m.default);

// 사건 자료는 content/cases/index.js 손목록에서 받는다. 글로브로 다시 모으면
// 같은 목록이 둘이 된다 — 서버(prompt.js)는 글로브가 안 돌아 그 파일을 읽어야
// 하기 때문이다. 대가는 사건 추가가 「폴더 하나」에서 「폴더 하나 + 한 줄」이
// 되는 것이고, 실질 목록은 이미 셋이었다(글로브, CASE_FILES, personas/index.js).
//
// 내보내는 이름과 모양은 전과 같다. 부르는 쪽은 아무것도 바뀌지 않는다.
export { cases, polnetDocs, records, forms } from '../content/cases/index.js';

export const characters = collect(import.meta.glob('../content/characters/*.js', { eager: true }));

export { default as notices } from '../content/notices.js';
export { default as story }   from '../content/story.js';
export { default as apps }    from '../content/screen/apps.js';
export { default as notes }   from '../content/screen/notes.js';
export { default as systems } from '../content/screen/systems.js';
export * from '../content/screen/org.js';
export * as terminal from '../content/screen/terminal.js';

// 남은 조용한 실패는 characters 하나다.
//
// 정적 import는 파일이 없으면 빌드가 즉시 터진다. 사건 자료가 손목록으로
// 옮겨가면서 그쪽이 됐다 — 폴더 이름이 바뀌면 cases/index.js의 import가
// 먼저 터지고, 사건 하나를 빼먹으면 그 줄이 남아 역시 터진다.
//
// import.meta.glob만 대상이 없어도 빈 객체를 돌려주므로 빌드가 성공하고 화면만
// 빈다. 그래서 마지막 그물이 characters에만 남았다. 런타임 가드라 vite build는
// 여전히 성공하고, 빌드 전에 걸러내는 일은 scripts/check-content.js가 맡는다.
if (!characters.length) {
  throw new Error(
    '콘텐츠를 찾지 못했습니다: characters\n' +
    'content/ 서브모듈이 비었거나 폴더 구조가 바뀌었습니다.\n' +
    'git submodule update --init --recursive'
  );
}
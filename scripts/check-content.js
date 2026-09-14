// 빌드 전에 콘텐츠가 붙어 있는지 본다.
//
// content/는 프라이빗 서브모듈이라 체크아웃에서 빠지기 쉽다. 그런데
// import.meta.glob은 대상이 없어도 빈 객체를 돌려주므로, 빠진 채로도
// vite build가 성공하고 화면만 빈다. 그 조용한 실패를 여기서 빨간불로 만든다.
//
// P5부터 콘텐츠를 읽는 쪽이 둘이다. 클라이언트가 안 읽는 파일이 빠지면
// vite build가 성공하고 배포까지 통과한 뒤 /api/chat이 전부 502를 뱉는다.
// 화면에는 캐릭터 폴백이 나오므로 모델 혼잡과 구별되지 않는다. 그래서 이
// 스크립트가 보는 것은 더 이상 "로더가 읽는 것"이 아니라 "배포가 필요로
// 하는 것"이다.

import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'content';

// 브라우저가 읽는다. 정적 import라 없으면 빌드가 터지지만,
// 터지기 전에 이름을 알려주는 게 낫다.
const CLIENT_FILES = [
  'notices.js',
  'story.js',
  'screen/apps.js',
  'screen/notes.js',
  'screen/systems.js',
  'screen/org.js',
  'screen/terminal.js',
];

// functions/api/chat.js가 읽는다. 클라이언트에는 이것들을 가리키는 줄이 한
// 줄도 없고(그게 persona를 번들에서 막는 방법이다), 그래서 빠져도 빌드가
// 성공한다. 여기서 안 보면 아무 데서도 안 본다.
const SERVER_FILES = ['prompt.js', 'personas/index.js'];

// 사건 폴더마다 있어야 하는 것
const CASE_FILES = ['case.js', 'polnet.js', 'records.js', 'form.js'];

const problems = [];

const dirs = (p) => {
  try {
    return readdirSync(join(ROOT, p), { withFileTypes: true });
  } catch {
    return [];
  }
};

if (!existsSync(ROOT) || dirs('').length === 0) {
  problems.push(`${ROOT}/ 가 비었습니다. 서브모듈이 체크아웃되지 않았습니다.`);
} else {
  [...CLIENT_FILES, ...SERVER_FILES].forEach((f) => {
    if (!existsSync(join(ROOT, f))) problems.push(`없음: ${ROOT}/${f}`);
  });

  const cases = dirs('cases').filter((d) => d.isDirectory());
  if (!cases.length) {
    problems.push(`${ROOT}/cases/ 에 사건 폴더가 없습니다.`);
  } else {
    cases.forEach((c) => {
      CASE_FILES.forEach((f) => {
        if (!existsSync(join(ROOT, 'cases', c.name, f))) {
          problems.push(`없음: ${ROOT}/cases/${c.name}/${f}`);
        }
      });
    });
  }

  const chars = dirs('characters').filter((d) => d.isFile() && d.name.endsWith('.js'));
  if (!chars.length) problems.push(`${ROOT}/characters/ 에 캐릭터 파일이 없습니다.`);

  // index.js는 손목록이다. 그것만 있고 가리킬 대상이 없으면 persona가
  // 통째로 빠진 것이다. 이때 게임은 모든 캐릭터가 영영 폴백으로 돈다.
  const personas = dirs('personas').filter(
    (d) => d.isFile() && d.name.endsWith('.js') && d.name !== 'index.js'
  );
  if (!personas.length) problems.push(`${ROOT}/personas/ 에 persona 파일이 없습니다.`);
}

if (problems.length) {
  console.error('콘텐츠 확인 실패\n');
  problems.forEach((p) => console.error('  ' + p));
  console.error('\n  git submodule update --init --recursive');
  process.exit(1);
}

console.log('콘텐츠 확인 완료');
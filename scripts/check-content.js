// 빌드 전에 콘텐츠가 붙어 있는지 본다.
//
// content/는 프라이빗 서브모듈이라 체크아웃에서 빠지기 쉽다. 그런데
// import.meta.glob은 대상이 없어도 빈 객체를 돌려주므로, 빠진 채로도
// vite build가 성공하고 화면만 빈다. 그 조용한 실패를 여기서 빨간불로 만든다.
//
// client/content-loader.js가 읽는 것과 같은 목록을 본다. 한쪽을 고치면
// 다른 쪽도 고쳐야 한다.

import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'content';

// 정적 import 대상. 없으면 빌드가 터지지만, 터지기 전에 이름을 알려주는 게 낫다.
const FILES = [
  'notices.js',
  'story.js',
  'screen/apps.js',
  'screen/notes.js',
  'screen/systems.js',
  'screen/org.js',
  'screen/terminal.js',
];

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
  FILES.forEach((f) => {
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
}

if (problems.length) {
  console.error('콘텐츠 확인 실패\n');
  problems.forEach((p) => console.error('  ' + p));
  console.error('\n  git submodule update --init --recursive');
  process.exit(1);
}

console.log('콘텐츠 확인 완료');
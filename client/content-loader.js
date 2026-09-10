// client/content-loader.js
// 콘텐츠를 모아 온다. content/는 저장소에 없다(gitignore).

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
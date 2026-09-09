// 캐릭터 사이의 분기. 대사와 조건은 content/story.js가 갖는다.
// 여기서는 "지금 이 조건이 성립하는가"만 판정한다.

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// 이름은 낱말로 떨어져 있을 때만 잡는다. 'K'가 'OK'에 걸리면 안 된다.
// 뒤 경계에 한글을 넣으면 조사가 붙은 'K가'를 놓친다.
const namePattern = (name) =>
  `(^|[^A-Za-z0-9])${escape(name)}([^A-Za-z0-9]|$)`;

export function createStoryRules(story, characters, { random = Math.random } = {}) {
  const pick = ([lo, hi]) => lo + random() * (hi - lo);

  const burnId = story.leak.burns;
  const burnName = characters.find((c) => c.id === burnId)?.name ?? burnId;
  const leakRe = new RegExp(
    [namePattern(burnName), ...story.leak.triggers.map(escape)].join('|'),
    'i'
  );
  const providedRe = new RegExp(story.leak.providedMarkers.map(escape).join('|'), 'i');

  return {
    // 아무것도 안 하고 있으면 외부인이 먼저 말을 건다.
    outsiderDue(lastActAt, now) {
      return now - lastActAt > story.outsiderAppears.afterIdleSec * 1000;
    },

    // (1) 메신저에서 발설. 소각 대상 본인과의 대화는 판정하지 않는다.
    leaksInMessage(cid, text) {
      if (cid === burnId) return false;
      return leakRe.test(text);
    },

    // 제공자가 실제로 알려줬는지. 문자열 검사라 헐겁다. TODO(P5+)
    marksProvided(cid, text) {
      if (cid !== story.leak.providedBy) return false;
      return providedRe.test(text);
    },

    // (2) 양식에서 들킴. 정식 경로로만 얻는 항목을 받지 않고 채웠는가.
    leaksInReport(formId, values = {}, provided) {
      if (provided) return false;
      return story.leak.traceable.some(
        (t) => t.form === formId && (values[t.field] ?? '').trim() !== ''
      );
    },

    // 대사와 도착 간격은 콘텐츠에서 그대로 가져온다.
    outsiderLines(now) {
      return schedule(story.outsiderAppears.lines, now, story.outsiderAppears.lineGapSec, pick);
    },

    confrontLines(how, now) {
      const c = story.leak.confront;
      const lines = how === 'report' ? c.byReport : c.byMessage;
      const at = now + pick(c.delaySec) * 1000;
      return { by: c.by, lines: schedule(lines, at, c.lineGapSec, pick) };
    },
  };
}

function schedule(lines, start, gapSec, pick) {
  let at = start;
  return lines.map((text, i) => {
    if (i) at += pick(gapSec) * 1000;
    return { text, at, last: i === lines.length - 1 };
  });
}
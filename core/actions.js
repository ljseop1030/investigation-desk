import { TRAIT } from '../shared/enums.js';

export function createActions({ content, state, scheduler, events, rules, clock, ai }) {
  const { chat, records, forms, story } = rules;
  const charById = new Map(content.characters.map((c) => [c.id, c]));
  const formById = new Map(content.forms.map((f) => [f.id, f]));
  const p = () => state.progress();

  const has = (c, trait) => (c.traits || []).includes(trait);
  const log = (cid) => (p().chats[cid] ||= []);

  const arrive = (cid, text, at, extra = {}) =>
    scheduler.add('push', at, { cid, text, ...extra });

  /* ---------- 플레이어 행동 ---------- */

  function send(cid, text) {
    const c = charById.get(cid);
    if (!c || has(c, TRAIT.BROADCAST)) return;
    if (p().story.outsider === 'burned' && cid === content.story.leak.burns) return;

    const now = clock.now();
    state.touch(now);
    log(cid).push({ me: true, text, at: now, read: false });
    (p().pending[cid] ||= []).push(text);
    events.emit('message', { cid, me: true, text, at: now });

    if (story.leaksInMessage(cid, text)) burn('message');

    // 이미 답장이 잡혀 있으면 처음부터 다시 재지 않는다.
    const queued = scheduler.pending().find((e) => e.kind === 'reply' && e.cid === cid);
    const { readAt, replyAt } = chat.schedule(c.style, now, queued?.at ?? null);

    if (readAt !== null) scheduler.add('read', readAt, { cid });
    if (queued) scheduler.cancel((e) => e === queued);
    scheduler.add('reply', replyAt, { cid });
  }

  // 비밀번호가 포스트잇에 적혀 있다. 막는 게 아니라 대조를 한 군데 모으는 것.
  function authenticate(appId, id, pw) {
    const app = (content.apps ?? []).find((a) => a.id === appId);
    if (!app || app.private?.user !== id || app.private?.pw !== pw) return false;
    state.touch(clock.now());
    p().authed[appId] = true;
    events.emit('app:authed', { appId });
    return true;
  }

  // touch()를 부르지 않는다. UI가 자동으로 부르는 함수라
  // 유휴 시계가 되감기면 외부인이 영영 안 나타난다.
  function markSeen(cid) {
    p().seenAt[cid] = clock.now();
    events.emit('chat:seen', { cid });
  }

  function requestRecord(recordId, reason) {
    if (!records.canRequest(recordId, reason)) return false;
    const now = clock.now();
    state.touch(now);
    p().requested.push(recordId);
    scheduler.add('unlock', records.approvalAt(now), { recordId });
    events.emit('record:requested', { recordId });
    return true;
  }

  function submitForm(formId, values) {
    const now = clock.now();
    state.touch(now);
    p().forms[formId] = { values, status: 'review', marks: null };

    if (story.leaksInReport(formId, values, p().story.provided)) burn('report');

    scheduler.add('grade', forms.reviewAt(now), { formId });
    events.emit('form:submitted', { formId });
  }

  /* ---------- 이야기 분기 ---------- */

  function burn(how) {
    if (p().story.outsider !== 'live') return;
    const burnId = content.story.leak.burns;
    p().story.outsider = 'burned';
    scheduler.cancel((e) => e.cid === burnId);
    events.emit('character:burned', { cid: burnId });

    const { by, lines } = story.confrontLines(how, clock.now());
    // 추궁이 시작되면 그 대화에 걸려 있던 평범한 답장은 취소한다.
    scheduler.cancel((e) => e.kind === 'reply' && e.cid === by);
    p().pending[by] = [];
    lines.forEach((l) => arrive(by, l.text, l.at, { last: l.last }));
}

  function summonOutsider() {
    if (p().story.outsider !== 'hidden') return;
    const { who, lines } = content.story.outsiderAppears;
    p().story.outsider = 'live';
    events.emit('character:appeared', { cid: who });
    story.outsiderLines(clock.now()).forEach((l) =>
      arrive(who, l.text, l.at, { last: l.last })
    );
  }

  /* ---------- 만기 처리 ---------- */

  const handlers = {
    read(e) {
      log(e.cid).forEach((m) => { if (m.me) m.read = true; });
      events.emit('read', { cid: e.cid });
    },

    push(e) {
      log(e.cid).push({ me: false, text: e.text, at: e.at });
      if (story.marksProvided(e.cid, e.text)) p().story.provided = true;
      events.emit('message', { cid: e.cid, me: false, text: e.text, at: e.at, last: e.last });
    },

    unlock(e) {
      p().unlocked.push(e.recordId);
      events.emit('record:unlocked', { recordId: e.recordId });
    },

    grade(e) {
      const form = formById.get(e.formId);
      const entry = p().forms[e.formId];
      entry.marks = forms.grade(form, entry.values);
      entry.status = 'done';
      events.emit('form:graded', { formId: e.formId, ...entry.marks });
    },

    reply(e) { void replyTurn(e.cid); },
  };

  async function replyTurn(cid) {
    const c = charById.get(cid);
    const taken = p().pending[cid] ?? [];
    p().pending[cid] = [];
    if (!taken.length) return;

    // 대본이 있으면 AI를 부르지 않는다. 턴 순서대로 소비하고 null은 무응답.
    if (c.script) {
      const turn = p().turns[cid] ?? 0;
      p().turns[cid] = turn + 1;
      const line = c.script[turn];
      if (line) arrive(cid, line, clock.now() + 1000, { last: true });
      return;
    }

    p().working[cid] = true;

    let out;
    try {
      out = await ai.reply(cid, log(cid));
    } catch {
      const fb = c.private.fallback;
      out = { messages: [fb[Math.floor(Math.random() * fb.length)]] };
    }

    p().working[cid] = false;

    if (out.leak) burn('message');
    if (out.ghost || !out.messages?.length) return;

    const texts = out.messages.slice(0, c.style.bubbles[1]);
    const ok = records.validDeliveries(out.delivers, cid, p().delivered);

    chat.bubbleTimes(c.style, texts, clock.now()).forEach((b, i) =>
      arrive(cid, b.text, b.at, {
        lead: b.lead,
        last: i === texts.length - 1,
        delivers: i === texts.length - 1 ? ok : undefined,
      })
    );
  }

    /* ---------- 입력 중 ---------- */

  // 파생값이라 저장하지 않는다. tick마다 다시 센다.
  // 켜지는 경우는 둘. LLM 응답을 기다리는 중이거나(working),
  // 예약된 말풍선의 lead 구간에 들어왔거나. 뒤엣것이 김주원의 tailGap 연출이다.
  let typingOn = new Set();

  function syncTyping(now) {
    const want = new Set();
    for (const [cid, on] of Object.entries(p().working)) if (on) want.add(cid);
    for (const e of scheduler.pending()) {
      if (e.kind === 'push' && e.lead && now >= e.at - e.lead) want.add(e.cid);
    }

    // 바뀐 것만 알린다. 매초 같은 이벤트를 쏘면 UI가 매초 재렌더된다.
    for (const cid of typingOn) if (!want.has(cid)) events.emit('typing', { cid, on: false });
    for (const cid of want) if (!typingOn.has(cid)) events.emit('typing', { cid, on: true });
    typingOn = want;
  }

  function tick() {
    for (const e of scheduler.tick()) {
      if (e.delivers?.length) {
        p().delivered.push(...e.delivers);
        e.delivers.forEach((id) => events.emit('record:registered', { recordId: id }));
      }
      handlers[e.kind]?.(e);
    }
    const now = clock.now();
    if (story.outsiderDue(p().lastActAt, now)) summonOutsider();
    syncTyping(now);
  }

  return { send, authenticate, markSeen, requestRecord, submitForm, tick, summonOutsider };
}
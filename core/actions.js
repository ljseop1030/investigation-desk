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
    events.emit('typing', { cid, on: true });

    let out;
    try {
      out = await ai.reply(cid, log(cid));
    } catch {
      const fb = c.private.fallback;
      out = { messages: [fb[Math.floor(Math.random() * fb.length)]] };
    }

    p().working[cid] = false;
    events.emit('typing', { cid, on: false });

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

  function tick() {
    for (const e of scheduler.tick()) {
      if (e.delivers?.length) {
        p().delivered.push(...e.delivers);
        e.delivers.forEach((id) => events.emit('record:registered', { recordId: id }));
      }
      handlers[e.kind]?.(e);
    }
    if (story.outsiderDue(p().lastActAt, clock.now())) summonOutsider();
  }

  return { send, requestRecord, submitForm, tick, summonOutsider };
}
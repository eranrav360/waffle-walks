// Badge definitions, shared by the server and the history-replay script.

const isOhad = s => s.who === 'אהד' || s.who === 'אוהד';

const BADGES = [
  // Streaks (best-ever run of consecutive days)
  { key: 'streak3',  emoji: '🔥', name: 'הצתה',            desc: '3 ימים ברצף',        test: s => s.bestStreak >= 3 },
  { key: 'streak7',  emoji: '🔥', name: 'שבוע של אש',      desc: '7 ימים ברצף',        test: s => s.bestStreak >= 7 },
  { key: 'streak14', emoji: '🌋', name: 'שבועיים בוערים',  desc: '14 ימים ברצף',       test: s => s.bestStreak >= 14 },
  { key: 'streak30', emoji: '☄️', name: 'חודש של להבות',   desc: '30 ימים ברצף',       test: s => s.bestStreak >= 30 },
  // Volume
  { key: 'walks10',  emoji: '🐾', name: 'כוכב עולה',       desc: '10 טיולים',          test: s => s.total >= 10 },
  { key: 'walks50',  emoji: '🦮', name: 'מטייל מקצועי',    desc: '50 טיולים',          test: s => s.total >= 50 },
  { key: 'walks100', emoji: '💯', name: 'מאה!',            desc: '100 טיולים',         test: s => s.total >= 100 },
  { key: 'walks250', emoji: '👑', name: 'אגדה',            desc: '250 טיולים',         test: s => s.total >= 250 },
  // Time of day
  { key: 'earlybird', emoji: '🌅', name: 'ציפור בוקר',     desc: '10 טיולי בוקר',      test: s => s.morning >= 10 },
  // Retired when the "night" option was removed: kept for those who earned it, no longer awarded.
  { key: 'nightowl',  emoji: '🌙', name: 'ינשוף לילה',     desc: '10 טיולי לילה',      retired: true, test: s => s.night >= 10 },
  { key: 'fullday',   emoji: '🎯', name: 'יום מלא',        desc: 'המשפחה כיסתה בוקר, צהריים וערב', test: s => s.fullDay },
  // Duration & outcome
  { key: 'marathon',  emoji: '🏃', name: 'מרתוניסט',       desc: '10 טיולים של 10+ דקות', test: s => s.long >= 10 },
  { key: 'poop25',    emoji: '💩', name: 'סיירת קקי',      desc: '25 קקי',             test: s => s.poops >= 25 },
  { key: 'mission',   emoji: '🎉', name: 'משימה הושלמה',   desc: 'פיפי וקקי באותו טיול', test: s => s.missions >= 1 },
  { key: 'zero',      emoji: '🚫', name: 'גיבור האפס',     desc: '3 טיולים בלי כלום',  test: s => s.nothings >= 3 },
  // Situational
  { key: 'rescuer',   emoji: '🦸', name: 'המציל',          desc: 'פתחת יום אחרי יום שבו אף אחד לא טייל', test: s => s.rescuer },
  { key: 'comeback',  emoji: '🔄', name: 'קאמבק',          desc: 'חזרת אחרי שבוע או יותר', test: s => s.comeback },
  { key: 'yesterday', emoji: '📅', name: 'גיבור האתמול',   desc: 'דיווחת על טיול של אתמול', test: s => s.backdated },
  // Personal flavor
  { key: 'eleven',    emoji: '🌀', name: 'Eleven',         desc: '11 טיולים',          test: s => s.who === 'תהל' && s.total >= 11 },
  { key: 'douze',     emoji: '🎤', name: 'Douze Points',   desc: '12 טיולים',          test: s => isOhad(s) && s.total >= 12 },
];

// ── History replay ─────────────────────────────────────────────────────────────
// Used once to give already-earned badges their real dates (and to find event
// badges that happened before badges existed). Mirrors the live rules above.

const dayOf = d => new Date(d).toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' });

function addDays(dateStr, delta) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

const daysBetween = (a, b) => Math.round((new Date(b + 'T00:00:00Z') - new Date(a + 'T00:00:00Z')) / 86400000);

// walks: [{ who, when_time, pipi, kaki, nothing, duration, created_at }]
// Returns Map<who, Map<badgeKey, Date>> — when each badge was first earned.
// 'yesterday' can't be recovered: past walks don't record being backdated.
function badgeHistory(walks) {
  const sorted = [...walks].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const people = new Map();   // who -> running totals
  const perDay = new Map();   // day -> { whos:Set, whens:Set }
  const earned = new Map();   // who -> Map<key, Date>
  const firstDay = sorted.length ? dayOf(sorted[0].created_at) : null;

  for (const w of sorted) {
    const day = dayOf(w.created_at);
    if (!people.has(w.who)) {
      people.set(w.who, { who: w.who, total: 0, morning: 0, night: 0, poops: 0, nothings: 0, long: 0, missions: 0, bestStreak: 0, days: [] });
      earned.set(w.who, new Map());
    }
    const p = people.get(w.who);

    // Gap since this person's previous walk-day (for Comeback), before recording today.
    const prevWalkDay = p.days.length === 0 ? null
      : (p.days[p.days.length - 1] === day ? p.days[p.days.length - 2] ?? null : p.days[p.days.length - 1]);

    p.total++;
    if (w.when_time === 'בוקר') p.morning++;
    if (w.when_time === 'לילה') p.night++;
    if (w.kaki) p.poops++;
    if (w.nothing) p.nothings++;
    if ((w.duration || '').startsWith('10+')) p.long++;
    if (w.pipi && w.kaki) p.missions++;

    if (p.days[p.days.length - 1] !== day) {
      p.days.push(day);
      const have = new Set(p.days);
      let run = 0, cursor = day;
      while (have.has(cursor)) { run++; cursor = addDays(cursor, -1); }
      p.bestStreak = Math.max(p.bestStreak, run);
    }

    if (!perDay.has(day)) perDay.set(day, { whos: new Set(), whens: new Set() });
    const d = perDay.get(day);
    d.whos.add(w.who);
    d.whens.add(w.when_time);

    const prevDay = addDays(day, -1);
    const stats = {
      ...p,
      fullDay: ['בוקר', 'צהריים', 'ערב'].every(t => d.whens.has(t)),
      rescuer: firstDay < prevDay && !perDay.has(prevDay) && d.whos.size === 1,
      comeback: prevWalkDay !== null && daysBetween(prevWalkDay, day) >= 7,
      backdated: false,
    };

    const mine = earned.get(w.who);
    for (const b of BADGES) {
      if (!mine.has(b.key) && b.test(stats)) mine.set(b.key, new Date(w.created_at));
    }
  }
  return earned;
}

module.exports = { BADGES, isOhad, badgeHistory };

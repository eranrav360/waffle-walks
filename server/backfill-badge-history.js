// One-off: give already-earned badges their real dates and grant event badges
// (Full Day, Rescuer, Comeback) that happened before badges existed.
//
//   node backfill-badge-history.js --dry-run   # show what would change
//   node backfill-badge-history.js             # apply it
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { Pool } = require('pg');
const { BADGES, badgeHistory } = require('./badges');

const FAMILY = ['תהל', 'ערן', 'אורית', 'אהד', 'אוהד'];
const dryRun = process.argv.includes('--dry-run');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const names = Object.fromEntries(BADGES.map(b => [b.key, `${b.emoji} ${b.name}`]));
const fmt = d => new Date(d).toISOString().slice(0, 10);

(async () => {
  const { rows: walks } = await pool.query(
    'SELECT who, when_time, pipi, kaki, nothing, duration, created_at FROM walks ORDER BY created_at, id'
  );
  const { rows: existing } = await pool.query('SELECT who, badge_key, earned_at FROM badges');
  const have = new Map(existing.map(r => [`${r.who}|${r.badge_key}`, r.earned_at]));

  const now = new Date();
  const updates = [], inserts = [];
  for (const [who, badges] of badgeHistory(walks)) {
    if (!FAMILY.includes(who)) continue; // old rows can carry stray names (e.g. a nickname)
    for (const [key, when] of badges) {
      const date = when > now ? now : when; // a few walks are dated in the future; never show a future award date
      const id = `${who}|${key}`;
      if (!have.has(id)) inserts.push({ who, key, date });
      else if (fmt(have.get(id)) !== fmt(date)) updates.push({ who, key, date, was: have.get(id) });
    }
  }

  console.log(`\nDates to correct: ${updates.length}`);
  updates.forEach(u => console.log(`  ${u.who}  ${names[u.key]}  ${fmt(u.was)} -> ${fmt(u.date)}`));
  console.log(`\nBadges to newly grant (found in history): ${inserts.length}`);
  inserts.forEach(i => console.log(`  ${i.who}  ${names[i.key]}  ${fmt(i.date)}`));

  if (dryRun) {
    console.log('\nDry run: nothing written.');
  } else {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const u of updates) {
        await client.query('UPDATE badges SET earned_at = $3 WHERE who = $1 AND badge_key = $2', [u.who, u.key, u.date]);
      }
      for (const i of inserts) {
        await client.query(
          'INSERT INTO badges (who, badge_key, earned_at) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
          [i.who, i.key, i.date]
        );
      }
      await client.query('COMMIT');
      console.log('\nApplied.');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
  await pool.end();
})().catch(err => { console.error(err); process.exit(1); });

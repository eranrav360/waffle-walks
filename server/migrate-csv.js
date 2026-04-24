require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function parseDate(raw) {
  raw = raw.trim();

  // Extract date and optional time parts
  const spaceIdx = raw.indexOf(' ');
  const datePart = spaceIdx === -1 ? raw : raw.slice(0, spaceIdx);
  const timePart = spaceIdx === -1 ? '12:00:00' : raw.slice(spaceIdx + 1);

  const sep = datePart.includes('/') ? '/' : '.';
  const segments = datePart.split(sep).map(Number);
  const [a, b, c] = segments;

  let day, month, year;
  if (a > 12) {
    // DD/MM/YYYY
    [day, month, year] = [a, b, c];
  } else {
    // M/D/YYYY
    [month, day, year] = [a, b, c];
  }

  const [hh, mm, ss] = timePart.split(':').map(Number);
  // Parse as Jerusalem local time
  const iso = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}T${String(hh||0).padStart(2,'0')}:${String(mm||0).padStart(2,'0')}:${String(ss||0).padStart(2,'0')}+03:00`;
  return new Date(iso);
}

async function main() {
  const csvPath = path.join(__dirname, '..', 'WaffleWalks  - Sheet1.csv');
  const lines = fs.readFileSync(csvPath, 'utf8').split('\n');

  let inserted = 0, skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(',');
    const [rawDate, who, whenTime, pipiRaw, kakiRaw, nothingRaw, duration] = cols;

    if (!who || !who.trim()) {
      console.log(`Row ${i + 1}: skipped (empty who)`);
      skipped++;
      continue;
    }

    let createdAt;
    try {
      createdAt = parseDate(rawDate);
      if (isNaN(createdAt.getTime())) throw new Error('invalid');
    } catch {
      console.log(`Row ${i + 1}: skipped (unparseable date: "${rawDate}")`);
      skipped++;
      continue;
    }

    const pipi    = pipiRaw?.trim()    === '✓';
    const kaki    = kakiRaw?.trim()    === '✓';
    const nothing = nothingRaw?.trim() === '✓';
    const dur     = duration?.trim() || null;

    await pool.query(
      `INSERT INTO walks (created_at, who, when_time, pipi, kaki, nothing, duration)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [createdAt, who.trim(), whenTime.trim(), pipi, kaki, nothing, dur]
    );
    inserted++;
    console.log(`Row ${i + 1}: inserted — ${who.trim()} @ ${createdAt.toISOString()}`);
  }

  console.log(`\nDone. Inserted: ${inserted}, Skipped: ${skipped}`);
  await pool.end();
}

main().catch(err => { console.error(err); process.exit(1); });

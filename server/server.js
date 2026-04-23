require('dotenv').config();
const express = require('express');
const { Pool }  = require('pg');
const { Resend } = require('resend');
const cron = require('node-cron');

const resend = new Resend(process.env.RESEND_API_KEY);

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ── Constants ──────────────────────────────────────────────────────────────────

const NAMES = ['תהל', 'ערן', 'אורית', 'אהד'];
const NAME_EMAILS = {
  'תהל':  'tahel.raviv@gmail.com',
  'ערן':   'eran.raviv@gmail.com',
  'אורית': 'ohresearch@gmail.com',
  'אהד':  'ohadraviv14@gmail.com',
};
const DEFAULT_NOTIFICATIONS = {
  'תהל':  { walkNotification: false, dailySummary: false, weeklySummary: false, monthlySummary: false, reminder: true  },
  'ערן':   { walkNotification: true,  dailySummary: true,  weeklySummary: true,  monthlySummary: true,  reminder: false },
  'אורית': { walkNotification: true,  dailySummary: true,  weeklySummary: true,  monthlySummary: true,  reminder: false },
  'אהד':  { walkNotification: false, dailySummary: false, weeklySummary: false, monthlySummary: false, reminder: true  },
};
const DEFAULT_TIMES = { dailySummary: 8, weeklySummary: 8, monthlySummary: 8, reminder: 8 };

// ── Config (PostgreSQL) ────────────────────────────────────────────────────────

async function getConfig(key, fallback) {
  const { rows } = await pool.query('SELECT value FROM app_config WHERE key = $1', [key]);
  return rows.length ? JSON.parse(rows[0].value) : fallback;
}

async function setConfig(key, value) {
  await pool.query(
    `INSERT INTO app_config (key, value) VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [key, JSON.stringify(value)]
  );
}

const getNotificationConfig = () => getConfig('notifications', DEFAULT_NOTIFICATIONS);
const getTimeConfig          = () => getConfig('times', DEFAULT_TIMES);

async function getRecipientsFor(type) {
  const cfg = await getNotificationConfig();
  return NAMES
    .filter(n => cfg[n]?.[type] && NAME_EMAILS[n])
    .map(n => NAME_EMAILS[n])
    .join(',');
}

// ── WhatsApp (WAHA) ────────────────────────────────────────────────────────────

async function sendWhatsApp(text) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (process.env.WAHA_API_KEY) headers['X-Api-Key'] = process.env.WAHA_API_KEY;
    const res = await fetch(`${process.env.WAHA_BASE_URL}/api/sendText`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        chatId:  process.env.WHATSAPP_GROUP_ID,
        text,
        session: process.env.WAHA_SESSION || 'default',
      }),
    });
    if (!res.ok) console.error('WAHA error:', res.status, await res.text());
  } catch (err) {
    console.error('WhatsApp send failed:', err.message);
  }
}

function buildWalkMessage(data) {
  const greetings = [
    'שיהיה לכולם ערב מקסים!', 'שיהיה לכולם יום נפלא!', 'שיהיה לכולם בוקר טוב!',
    'חבקו אותה חזק! 🤗', 'היא מחכה לכולם בבית! 🏠', 'היא אוהבת אתכם! ❤️',
  ];
  const greeting = greetings[Math.floor(Math.random() * greetings.length)];
  const parts = [];
  if (data.pipiChecked) parts.push('פיפי');
  if (data.kakiChecked) parts.push('קקי');
  const resultLine = data.nothingChecked ? 'לא עשתה כלום' : 'עשתה ' + parts.join(' ו');
  return `🐶 וופל יצאה לטיול עם ${data.who}\n${resultLine}\n${greeting}`;
}

// ── Email (Resend) ─────────────────────────────────────────────────────────────

async function sendEmail({ to, subject, text, html }) {
  if (!to) return;
  try {
    const { error } = await resend.emails.send({
      from: 'WaffleWalks 🐾 <waffle@raviv360.com>',
      to: to.split(',').map(s => s.trim()),
      subject,
      text,
      html,
    });
    if (error) console.error('Resend error:', error);
  } catch (err) {
    console.error('Email error:', err.message);
  }
}

async function sendWalkEmail(data) {
  const to = await getRecipientsFor('walkNotification');
  if (!to) return;
  const what = [];
  if (data.pipiChecked)  what.push('פיפי 💧');
  if (data.kakiChecked)  what.push('קקי 💩');
  if (data.nothingChecked) what.push('כלום 🚫');
  const html = `<div dir="rtl" style="font-family:Arial,sans-serif;max-width:400px;margin:0 auto;padding:20px">
    <div style="background:#8B5E3C;padding:20px;border-radius:12px 12px 0 0;text-align:center">
      <h1 style="color:white;margin:0">🐕 וופל יצאה לטייל!</h1></div>
    <div style="background:white;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e0e0e0">
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:10px;font-weight:bold;color:#5D4037">מי:</td><td style="padding:10px">${data.who}</td></tr>
        <tr style="background:#f5f0eb"><td style="padding:10px;font-weight:bold;color:#5D4037">מתי:</td><td style="padding:10px">${data.when}</td></tr>
        <tr><td style="padding:10px;font-weight:bold;color:#5D4037">מה עשתה:</td><td style="padding:10px">${what.join(', ')}</td></tr>
        ${data.duration ? `<tr style="background:#f5f0eb"><td style="padding:10px;font-weight:bold;color:#5D4037">משך:</td><td style="padding:10px">${data.duration}</td></tr>` : ''}
      </table></div></div>`;
  await sendEmail({ to, subject: '🐕 וופל יצאה לטייל!', text: `מי: ${data.who} | מתי: ${data.when} | ${what.join(', ')}`, html });
}

// ── Summary helpers ────────────────────────────────────────────────────────────

async function getWalksInRange(start, end) {
  const { rows } = await pool.query(
    'SELECT * FROM walks WHERE created_at >= $1 AND created_at < $2 ORDER BY created_at',
    [start, end]
  );
  return rows;
}

function buildStats(walks) {
  const stats = {};
  NAMES.forEach(n => { stats[n] = { total: 0, morning: 0, noon: 0, evening: 0, night: 0, pipi: 0, kaki: 0 }; });
  const timeMap = { 'בוקר': 'morning', 'צהריים': 'noon', 'ערב': 'evening', 'לילה': 'night' };
  walks.forEach(w => {
    const s = stats[w.who];
    if (!s) return;
    s.total++;
    const t = timeMap[w.when_time]; if (t) s[t]++;
    if (w.pipi) s.pipi++;
    if (w.kaki) s.kaki++;
  });
  return stats;
}

function buildSummaryHtml(title, subtitle, walks, stats) {
  let body = walks.length === 0
    ? '<p style="text-align:center;color:#999;font-size:16px">לא היו טיולים בתקופה זו 😴</p>'
    : (() => {
        let h = `<p style="color:#5D4037;font-size:18px;text-align:center;margin-bottom:16px">סה"כ <strong>${walks.length}</strong> טיולים</p>
          <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
            <tr style="background:#8B5E3C;color:white">
              <th style="padding:10px;text-align:right">שם</th>
              <th style="padding:10px;text-align:center">טיולים</th>
              <th style="padding:10px;text-align:center">💧</th>
              <th style="padding:10px;text-align:center">💩</th></tr>`;
        let alt = false;
        NAMES.forEach(name => {
          const s = stats[name]; if (!s.total) return;
          const bg = alt ? 'background:#f5f0eb;' : ''; alt = !alt;
          h += `<tr style="${bg}"><td style="padding:10px;font-weight:bold;color:#5D4037">${name}</td>
            <td style="padding:10px;text-align:center">${s.total}</td>
            <td style="padding:10px;text-align:center">${s.pipi}</td>
            <td style="padding:10px;text-align:center">${s.kaki}</td></tr>`;
        });
        h += '</table><h3 style="color:#5D4037;margin:16px 0 8px">חלוקה לפי שעות:</h3><table style="width:100%;border-collapse:collapse">';
        [['🌅 בוקר','morning'],['☀️ צהריים','noon'],['🌆 ערב','evening'],['🌙 לילה','night']].forEach(([label, key]) => {
          const count = NAMES.reduce((s, n) => s + stats[n][key], 0);
          if (count) h += `<tr><td style="padding:6px 10px">${label}</td><td style="padding:6px 10px;text-align:center;font-weight:bold">${count}</td></tr>`;
        });
        h += '</table>';
        return h;
      })();

  return `<div dir="rtl" style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px">
    <div style="background:#8B5E3C;padding:20px;border-radius:12px 12px 0 0;text-align:center">
      <h1 style="color:white;margin:0">🐕 ${title}</h1>
      <p style="color:#f5e6d3;margin:8px 0 0;font-size:14px">${subtitle}</p></div>
    <div style="background:white;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e0e0e0">
      ${body}
      __LEADERBOARD__
    </div></div>`;
}

async function buildLeaderboardHtml() {
  const { rows } = await pool.query(
    `SELECT who, COUNT(*)::int AS count FROM walks GROUP BY who ORDER BY count DESC`
  );
  if (!rows.length) return '';
  const medals = ['🥇','🥈','🥉'];
  let h = `<div style="margin-top:20px;border-top:2px solid #f5e6d3;padding-top:16px">
    <h3 style="color:#5D4037;margin:0 0 12px;text-align:center">🏆 לוח המובילים</h3>
    <table style="width:100%;border-collapse:collapse">
      <tr style="background:#5D4037;color:white">
        <th style="padding:8px 10px;text-align:right">מקום</th>
        <th style="padding:8px 10px;text-align:right">שם</th>
        <th style="padding:8px 10px;text-align:center">טיולים</th></tr>`;
  rows.forEach((r, i) => {
    const bg = i % 2 === 1 ? 'background:#f5f0eb;' : '';
    h += `<tr style="${bg}"><td style="padding:8px 10px;font-size:18px">${medals[i] || (i+1)+'.'}</td>
      <td style="padding:8px 10px;font-weight:bold;color:#5D4037">${r.who}</td>
      <td style="padding:8px 10px;text-align:center;font-weight:bold;font-size:16px">${r.count}</td></tr>`;
  });
  return h + '</table></div>';
}

// ── Scheduled jobs ─────────────────────────────────────────────────────────────

const activeCrons = [];

function stopCrons() { activeCrons.forEach(j => j.stop()); activeCrons.length = 0; }

async function startCrons() {
  stopCrons();
  const t = await getTimeConfig();
  const TZ = 'Asia/Jerusalem';
  activeCrons.push(cron.schedule(`0 ${t.dailySummary}   * * *`, sendDailySummary,   { timezone: TZ }));
  activeCrons.push(cron.schedule(`0 ${t.reminder}       * * *`, sendDailyReminder,  { timezone: TZ }));
  activeCrons.push(cron.schedule(`0 ${t.weeklySummary}  * * 5`, sendWeeklySummary,  { timezone: TZ }));
  activeCrons.push(cron.schedule(`0 ${t.monthlySummary} 1 * *`, sendMonthlySummary, { timezone: TZ }));
  console.log('Crons running — daily=%dh reminder=%dh weekly=%dh monthly=%dh', t.dailySummary, t.reminder, t.weeklySummary, t.monthlySummary);
}

async function sendDailySummary() {
  const today = startOf('day');
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const walks = await getWalksInRange(yesterday, today);
  const stats = buildStats(walks);
  const label = yesterday.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });
  const leaderboard = await buildLeaderboardHtml();
  const html = buildSummaryHtml('סיכום יומי', label, walks, stats).replace('__LEADERBOARD__', leaderboard);
  const to = await getRecipientsFor('dailySummary');
  await sendEmail({ to, subject: `🐕 סיכום יומי — ${label}`, text: `${label} | ${walks.length} טיולים`, html });
}

async function sendWeeklySummary() {
  const end = startOf('day');
  const start = new Date(end); start.setDate(start.getDate() - 7);
  const walks = await getWalksInRange(start, end);
  const stats = buildStats(walks);
  const fmt = d => d.toLocaleDateString('he-IL', { day: 'numeric', month: 'long' });
  const label = `${fmt(start)} — ${fmt(new Date(end - 86400000))}`;
  const html = buildSummaryHtml('סיכום שבועי', label, walks, stats).replace('__LEADERBOARD__', '');
  const to = await getRecipientsFor('weeklySummary');
  await sendEmail({ to, subject: `🐕 סיכום שבועי — ${label}`, text: `${label} | ${walks.length} טיולים`, html });
}

async function sendMonthlySummary() {
  const now = new Date();
  const end   = new Date(now.getFullYear(), now.getMonth(), 1);
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const walks = await getWalksInRange(start, end);
  const stats = buildStats(walks);
  const label = start.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
  const html = buildSummaryHtml('סיכום חודשי', label, walks, stats).replace('__LEADERBOARD__', '');
  const to = await getRecipientsFor('monthlySummary');
  await sendEmail({ to, subject: `🐕 סיכום חודשי — ${label}`, text: `${label} | ${walks.length} טיולים`, html });
}

async function sendDailyReminder() {
  const today = startOf('day');
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const walks = await getWalksInRange(yesterday, today);
  if (!walks.length) return; // skip if nobody walked at all (family day off)
  const walkedSet = new Set(walks.map(w => w.who));
  const cfg = await getNotificationConfig();
  const dayStr = yesterday.toLocaleDateString('he-IL', { weekday: 'long' });
  for (const name of NAMES) {
    if (walkedSet.has(name) || !cfg[name]?.reminder) continue;
    const to = NAME_EMAILS[name]; if (!to) continue;
    const html = `<div dir="rtl" style="font-family:Arial,sans-serif;max-width:400px;margin:0 auto;padding:20px">
      <div style="background:#FF8F00;padding:20px;border-radius:12px 12px 0 0;text-align:center">
        <h1 style="color:white;margin:0">🐕 וופל מחכה לך!</h1></div>
      <div style="background:white;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e0e0e0;text-align:center">
        <p style="font-size:18px;color:#5D4037">היי ${name},</p>
        <p style="font-size:16px;color:#666">שמנו לב שאתמול (${dayStr}) לא הוצאת את וופל לטיול.</p>
        <p style="font-size:16px;color:#666">וופל תשמח לצאת איתך היום! 🐾</p></div></div>`;
    await sendEmail({ to, subject: '🐕 וופל מחכה לך!', text: `היי ${name}, לא הוצאת את וופל אתמול (${dayStr}). היא מחכה לך!`, html });
  }
}

function startOf(unit) {
  const d = new Date(); d.setHours(0, 0, 0, 0); return d;
}

// ── Admin panel HTML ───────────────────────────────────────────────────────────

const ADMIN_HTML = `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>WaffleWalks Admin</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,sans-serif;background:#f5e6d3;padding:16px;min-height:100vh}
.card{background:white;border-radius:16px;padding:24px;max-width:620px;margin:0 auto;box-shadow:0 4px 16px rgba(0,0,0,.1)}
h1{color:#5D4037;text-align:center;margin-bottom:16px;font-size:22px}
h2{color:#5D4037;font-size:15px;margin-bottom:10px}
table{width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px}
th{background:#8B5E3C;color:white;padding:10px 8px;text-align:center;font-size:13px}
th:first-child{text-align:right}
td{padding:10px 8px;border-bottom:1px solid #f0e0d0;text-align:center}
td:first-child{text-align:right;font-weight:bold;color:#5D4037}
tr:nth-child(even) td{background:#fdf8f5}
input[type=checkbox]{width:20px;height:20px;cursor:pointer;accent-color:#8B5E3C}
.time-row{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:12px;margin-bottom:8px}
.time-field label{display:block;color:#5D4037;font-size:13px;margin-bottom:4px;font-weight:bold}
.time-field input{width:100%;padding:8px;border:2px solid #D7CCC8;border-radius:8px;font-size:16px;text-align:center}
.note{font-size:12px;color:#999;margin-bottom:20px}
.btn{width:100%;padding:14px;border:none;border-radius:12px;background:#8B5E3C;color:white;font-size:16px;font-weight:bold;cursor:pointer;margin-bottom:10px}
.btn-outline{background:white;color:#8B5E3C;border:2px solid #8B5E3C}
.status{text-align:center;padding:8px;font-size:14px;min-height:20px;border-radius:8px}
.status.ok{color:#2E7D32;background:#e8f5e9}
.status.err{color:#C62828;background:#ffebee}
.loading{text-align:center;color:#8B5E3C;padding:40px;font-size:16px}
.login{display:flex;gap:8px;margin-bottom:16px}
.login input{flex:1;padding:10px;border:2px solid #D7CCC8;border-radius:8px;font-size:16px}
.login button{padding:10px 20px;border:none;border-radius:8px;background:#8B5E3C;color:white;font-size:16px;cursor:pointer}
</style>
</head>
<body>
<div class="card">
  <h1>🐾 WaffleWalks — הגדרות</h1>
  <div class="login">
    <input type="password" id="pwd" placeholder="סיסמת מנהל" onkeydown="if(event.key==='Enter')load()">
    <button onclick="load()">כניסה</button>
  </div>
  <div id="content" class="loading">הכנס סיסמה לטעינת ההגדרות</div>
</div>
<script>
var NAMES=['תהל','ערן','אורית','אהד'];
var TYPES=[
  {key:'walkNotification',label:'התראה מיידית'},
  {key:'dailySummary',label:'סיכום יומי'},
  {key:'weeklySummary',label:'סיכום שבועי'},
  {key:'monthlySummary',label:'סיכום חודשי'},
  {key:'reminder',label:'תזכורת'}
];
var pwd='';
function load(){
  pwd=document.getElementById('pwd').value;
  fetch('/api/admin/config',{headers:{'x-admin-password':pwd}})
    .then(function(r){return r.ok?r.json():Promise.reject(r.status)})
    .then(render)
    .catch(function(){st('❌ סיסמה שגויה','err')});
}
function render(cfg){
  var n=cfg.notifications,t=cfg.times;
  var h='<h2>התראות לפי אדם</h2><table><tr><th>שם</th>';
  TYPES.forEach(function(tp){h+='<th>'+tp.label+'</th>';});
  h+='</tr>';
  NAMES.forEach(function(name){
    h+='<tr><td>'+name+'</td>';
    TYPES.forEach(function(tp){
      var chk=n[name]&&n[name][tp.key]?'checked':'';
      h+='<td><input type="checkbox" data-name="'+name+'" data-type="'+tp.key+'" '+chk+'></td>';
    });
    h+='</tr>';
  });
  h+='</table><h2>שעת שליחה (0–23)</h2><div class="time-row">';
  TYPES.filter(function(tp){return tp.key!=='walkNotification';}).forEach(function(tp){
    h+='<div class="time-field"><label>'+tp.label+'</label>';
    h+='<input type="number" id="time_'+tp.key+'" min="0" max="23" value="'+(t[tp.key]!==undefined?t[tp.key]:8)+'"></div>';
  });
  h+='</div><p class="note">* שינוי שעות ייכנס לתוקף לאחר לחיצה על עדכן טריגרים</p>';
  h+='<button class="btn" onclick="save()">💾 שמור הגדרות</button>';
  h+='<button class="btn btn-outline" onclick="rebuild()">🔄 עדכן טריגרים</button>';
  h+='<div class="status" id="st"></div>';
  document.getElementById('content').innerHTML=h;
}
function save(){
  var notif={};NAMES.forEach(function(n){notif[n]={};});
  document.querySelectorAll('input[data-name]').forEach(function(cb){
    notif[cb.dataset.name][cb.dataset.type]=cb.checked;
  });
  var times={};
  TYPES.filter(function(tp){return tp.key!=='walkNotification';}).forEach(function(tp){
    times[tp.key]=parseInt(document.getElementById('time_'+tp.key).value)||8;
  });
  st('שומר...','');
  fetch('/api/admin/config',{method:'POST',headers:{'Content-Type':'application/json','x-admin-password':pwd},body:JSON.stringify({notifications:notif,times:times})})
    .then(function(r){return r.ok?st('✅ נשמר בהצלחה!','ok'):Promise.reject()})
    .catch(function(){st('❌ שגיאה בשמירה','err')});
}
function rebuild(){
  st('מעדכן טריגרים...','');
  fetch('/api/admin/triggers',{method:'POST',headers:{'x-admin-password':pwd}})
    .then(function(r){return r.ok?st('✅ טריגרים עודכנו!','ok'):Promise.reject()})
    .catch(function(){st('❌ שגיאה','err')});
}
function st(msg,cls){var el=document.getElementById('st');if(el){el.textContent=msg;el.className='status '+cls;}}
</script>
</body>
</html>`;

// ── Routes ─────────────────────────────────────────────────────────────────────

function requireAdmin(req, res, next) {
  const pwd = req.headers['x-admin-password'] || req.query.pwd;
  if (pwd !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

app.post('/api/walks', async (req, res) => {
  const d = req.body;
  try {
    await pool.query(
      'INSERT INTO walks (who, when_time, pipi, kaki, nothing, duration) VALUES ($1,$2,$3,$4,$5,$6)',
      [d.who, d.when, !!d.pipiChecked, !!d.kakiChecked, !!d.nothingChecked, d.duration || null]
    );
    sendWhatsApp(buildWalkMessage(d)).catch(console.error);
    sendWalkEmail(d).catch(console.error);
    res.json({ result: 'success' });
  } catch (err) {
    console.error('Walk error:', err);
    res.status(500).json({ result: 'error', error: err.message });
  }
});

app.get('/admin', (_req, res) => res.send(ADMIN_HTML));

app.get('/api/admin/config', requireAdmin, async (_req, res) => {
  const [notifications, times] = await Promise.all([getNotificationConfig(), getTimeConfig()]);
  res.json({ notifications, times });
});

app.post('/api/admin/config', requireAdmin, async (req, res) => {
  const { notifications, times } = req.body;
  if (notifications) await setConfig('notifications', notifications);
  if (times)         await setConfig('times', times);
  res.json({ result: 'success' });
});

app.post('/api/admin/triggers', requireAdmin, async (_req, res) => {
  await startCrons();
  res.json({ result: 'success' });
});

// ── Boot ───────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`WaffleWalks listening on port ${PORT}`);
  await startCrons();
});

/**
 * WaffleWalks - Google Apps Script
 *
 * הוראות התקנה:
 * 1. היכנס ל-Google Sheets בחשבון eran.raviv@gmail.com
 * 2. צור גיליון חדש בשם "WaffleWalks"
 * 3. לחץ על Extensions > Apps Script
 * 4. מחק את כל הקוד הקיים והעתק את הקוד הזה
 * 5. שמור (Ctrl+S)
 * 6. לחץ על Deploy > New deployment
 * 7. בחר "Web app"
 * 8. הגדרות:
 *    - Execute as: Me (eran.raviv@gmail.com)
 *    - Who has access: Anyone
 * 9. לחץ Deploy
 * 10. העתק את ה-URL שמתקבל
 * 11. הדבק את ה-URL בקובץ index.html במקום YOUR_GOOGLE_APPS_SCRIPT_URL_HERE
 */

function doGet(e) {
  return HtmlService.createHtmlOutput(getAdminHtml())
    .setTitle('WaffleWalks Admin 🐾')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getAdminHtml() {
  return '<!DOCTYPE html>' +
  '<html dir="rtl" lang="he"><head>' +
  '<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
  '<title>WaffleWalks Admin</title>' +
  '<style>' +
  '* { margin:0; padding:0; box-sizing:border-box; }' +
  'body { font-family: Arial, sans-serif; background: #f5e6d3; padding: 16px; min-height:100vh; }' +
  '.card { background: white; border-radius: 16px; padding: 24px; max-width: 620px; margin: 0 auto; box-shadow: 0 4px 16px rgba(0,0,0,.1); }' +
  'h1 { color:#5D4037; text-align:center; margin-bottom:24px; font-size:22px; }' +
  'h2 { color:#5D4037; font-size:15px; margin-bottom:10px; }' +
  'table { width:100%; border-collapse:collapse; margin-bottom:24px; font-size:14px; }' +
  'th { background:#8B5E3C; color:white; padding:10px 8px; text-align:center; font-size:13px; }' +
  'th:first-child { text-align:right; }' +
  'td { padding:10px 8px; border-bottom:1px solid #f0e0d0; text-align:center; }' +
  'td:first-child { text-align:right; font-weight:bold; color:#5D4037; }' +
  'tr:nth-child(even) td { background:#fdf8f5; }' +
  'input[type=checkbox] { width:20px; height:20px; cursor:pointer; accent-color:#8B5E3C; }' +
  '.time-row { display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:12px; margin-bottom:8px; }' +
  '.time-field label { display:block; color:#5D4037; font-size:13px; margin-bottom:4px; font-weight:bold; }' +
  '.time-field input { width:100%; padding:8px; border:2px solid #D7CCC8; border-radius:8px; font-size:16px; text-align:center; }' +
  '.note { font-size:12px; color:#999; margin-bottom:20px; }' +
  '.btn { width:100%; padding:14px; border:none; border-radius:12px; background:#8B5E3C; color:white; font-size:16px; font-weight:bold; cursor:pointer; margin-bottom:10px; }' +
  '.btn:disabled { background:#ccc; cursor:not-allowed; }' +
  '.btn-outline { background:white; color:#8B5E3C; border:2px solid #8B5E3C; }' +
  '.status { text-align:center; padding:8px; font-size:14px; min-height:20px; border-radius:8px; }' +
  '.status.ok { color:#2E7D32; background:#e8f5e9; }' +
  '.status.err { color:#C62828; background:#ffebee; }' +
  '.loading { text-align:center; color:#8B5E3C; padding:40px; font-size:16px; }' +
  '</style></head><body>' +
  '<div class="card">' +
  '<h1>🐾 WaffleWalks — הגדרות</h1>' +
  '<div id="content" class="loading">טוען הגדרות...</div>' +
  '</div>' +
  '<script>' +
  'var NAMES = ["תהל","ערן","אורית","אהד"];' +
  'var TYPES = [' +
  '  {key:"walkNotification", label:"התראה מיידית"},' +
  '  {key:"dailySummary",   label:"סיכום יומי"},' +
  '  {key:"weeklySummary",  label:"סיכום שבועי"},' +
  '  {key:"monthlySummary", label:"סיכום חודשי"},' +
  '  {key:"reminder",       label:"תזכורת"}' +
  '];' +
  'function render(cfg) {' +
  '  var n = cfg.notifications, t = cfg.times;' +
  '  var h = "<h2>התראות לפי אדם</h2><table><tr><th>שם</th>";' +
  '  TYPES.forEach(function(tp){ h += "<th>" + tp.label + "</th>"; });' +
  '  h += "</tr>";' +
  '  NAMES.forEach(function(name) {' +
  '    h += "<tr><td>" + name + "</td>";' +
  '    TYPES.forEach(function(tp) {' +
  '      var chk = n[name] && n[name][tp.key] ? "checked" : "";' +
  '      h += "<td><input type=\\"checkbox\\" data-name=\\"" + name + "\\" data-type=\\"" + tp.key + "\\" " + chk + "></td>";' +
  '    });' +
  '    h += "</tr>";' +
  '  });' +
  '  h += "</table>";' +
  '  h += "<h2>שעת שליחה (0–23)</h2><div class=\\"time-row\\">";' +
  '  TYPES.filter(function(tp){ return tp.key !== "walkNotification"; }).forEach(function(tp) {' +
  '    h += "<div class=\\"time-field\\"><label>" + tp.label + "</label>";' +
  '    h += "<input type=\\"number\\" id=\\"time_" + tp.key + "\\" min=\\"0\\" max=\\"23\\" value=\\"" + (t[tp.key] !== undefined ? t[tp.key] : 8) + "\\"></div>";' +
  '  });' +
  '  h += "</div><p class=\\"note\\">* שינוי שעות ייכנס לתוקף לאחר לחיצה על עדכן טריגרים</p>";' +
  '  h += "<button class=\\"btn\\" onclick=\\"save()\\">💾 שמור הגדרות</button>";' +
  '  h += "<button class=\\"btn btn-outline\\" onclick=\\"rebuild()\\">🔄 עדכן טריגרים</button>";' +
  '  h += "<div class=\\"status\\" id=\\"st\\"></div>";' +
  '  document.getElementById("content").innerHTML = h;' +
  '}' +
  'function save() {' +
  '  var notif = {}; NAMES.forEach(function(n){ notif[n] = {}; });' +
  '  document.querySelectorAll("input[data-name]").forEach(function(cb){' +
  '    notif[cb.dataset.name][cb.dataset.type] = cb.checked;' +
  '  });' +
  '  var times = {};' +
  '  TYPES.filter(function(tp){ return tp.key !== "walkNotification"; }).forEach(function(tp){ times[tp.key] = parseInt(document.getElementById("time_" + tp.key).value) || 8; });' +
  '  setStatus("שומר...", "");' +
  '  google.script.run' +
  '    .withSuccessHandler(function(){ setStatus("✅ נשמר בהצלחה!", "ok"); })' +
  '    .withFailureHandler(function(e){ setStatus("❌ " + e.message, "err"); })' +
  '    .saveConfigFromAdmin({notifications: notif, times: times});' +
  '}' +
  'function rebuild() {' +
  '  setStatus("מעדכן טריגרים...", "");' +
  '  google.script.run' +
  '    .withSuccessHandler(function(){ setStatus("✅ טריגרים עודכנו!", "ok"); })' +
  '    .withFailureHandler(function(e){ setStatus("❌ " + e.message, "err"); })' +
  '    .rebuildTriggersFromAdmin();' +
  '}' +
  'function setStatus(msg, cls) {' +
  '  var el = document.getElementById("st");' +
  '  el.textContent = msg; el.className = "status " + cls;' +
  '}' +
  'google.script.run' +
  '  .withSuccessHandler(render)' +
  '  .withFailureHandler(function(e){ document.getElementById("content").innerHTML = "<p style=\'color:red\'>שגיאה: " + e.message + "</p>"; })' +
  '  .getConfigForAdmin();' +
  '<\/script></body></html>';
}

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Create headers if first time
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['תאריך ושעה', 'מי', 'מתי', 'פיפי', 'קקי', 'כלום', 'משך']);
      var headerRange = sheet.getRange(1, 1, 1, 7);
      headerRange.setBackground('#8B5E3C');
      headerRange.setFontColor('#ffffff');
      headerRange.setFontWeight('bold');
      headerRange.setHorizontalAlignment('center');
    }

    var data = JSON.parse(e.postData.contents);

    // Append row to sheet — store a real Date object so date comparisons work reliably
    sheet.appendRow([
      new Date(),
      data.who,
      data.when,
      data.pipiChecked ? '✓' : '',
      data.kakiChecked ? '✓' : '',
      data.nothingChecked ? '✓' : '',
      data.duration || ''
    ]);

    // Send notification emails
    sendNotification(data);

    return ContentService
      .createTextOutput(JSON.stringify({ result: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('Error: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function sendNotification(data) {
  var recipients = getRecipientsFor('walkNotification');
  if (!recipients) return;
  var subject = '🐕 וופל יצאה לטייל!';

  var what = [];
  if (data.pipiChecked) what.push('פיפי 💧');
  if (data.kakiChecked) what.push('קקי 💩');
  if (data.nothingChecked) what.push('כלום 🚫');

  var htmlBody = '<div dir="rtl" style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">'
    + '<div style="background: #8B5E3C; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">'
    + '<h1 style="color: white; margin: 0;">🐕 וופל יצאה לטייל!</h1>'
    + '</div>'
    + '<div style="background: white; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e0e0e0;">'
    + '<table style="width: 100%; border-collapse: collapse;">'
    + '<tr><td style="padding: 10px; font-weight: bold; color: #5D4037;">מי:</td><td style="padding: 10px;">' + data.who + '</td></tr>'
    + '<tr style="background: #f5f0eb;"><td style="padding: 10px; font-weight: bold; color: #5D4037;">מתי:</td><td style="padding: 10px;">' + data.when + '</td></tr>'
    + '<tr><td style="padding: 10px; font-weight: bold; color: #5D4037;">מה עשתה:</td><td style="padding: 10px;">' + what.join(', ') + '</td></tr>'
    + '<tr style="background: #f5f0eb;"><td style="padding: 10px; font-weight: bold; color: #5D4037;">זמן:</td><td style="padding: 10px;">' + data.timestamp + '</td></tr>'
    + (data.duration ? '<tr><td style="padding: 10px; font-weight: bold; color: #5D4037;">משך:</td><td style="padding: 10px;">' + data.duration + '</td></tr>' : '')
    + '</table>'
    + '</div></div>';

  var textBody = 'וופל יצאה לטייל!\n\n'
    + 'מי: ' + data.who + '\n'
    + 'מתי: ' + data.when + '\n'
    + 'מה עשתה: ' + what.join(', ') + '\n'
    + 'זמן: ' + data.timestamp;

  try {
    MailApp.sendEmail({
      to: recipients,
      subject: subject,
      body: textBody,
      htmlBody: htmlBody,
      name: 'WaffleWalks 🐾'
    });
  } catch (error) {
    Logger.log('Email error: ' + error.toString());
  }
}

// ============================================================
// SUMMARY EMAILS - Daily / Weekly / Monthly
// ============================================================

var SUMMARY_RECIPIENTS = 'eran.raviv@gmail.com,ohresearch@gmail.com';
var NAMES = ['תהל', 'ערן', 'אורית', 'אהד'];
var NAME_EMAILS = {
  'תהל': 'tahel.raviv@gmail.com',
  'ערן': 'eran.raviv@gmail.com',
  'אורית': 'ohresearch@gmail.com',
  'אהד': 'ohadraviv14@gmail.com'
};

// ============================================================
// CONFIG — stored in PropertiesService
// ============================================================

function getNotificationConfig() {
  var stored = PropertiesService.getScriptProperties().getProperty('NOTIFICATION_CONFIG');
  if (stored) return JSON.parse(stored);
  // Defaults
  return {
    'תהל':  { walkNotification: false, dailySummary: false, weeklySummary: false, monthlySummary: false, reminder: true  },
    'ערן':   { walkNotification: true,  dailySummary: true,  weeklySummary: true,  monthlySummary: true,  reminder: false },
    'אורית': { walkNotification: true,  dailySummary: true,  weeklySummary: true,  monthlySummary: true,  reminder: false },
    'אהד':  { walkNotification: false, dailySummary: false, weeklySummary: false, monthlySummary: false, reminder: true  }
  };
}

function getTimeConfig() {
  var stored = PropertiesService.getScriptProperties().getProperty('TIME_CONFIG');
  if (stored) return JSON.parse(stored);
  return { dailySummary: 8, weeklySummary: 8, monthlySummary: 8, reminder: 8 };
}

/** Returns a comma-separated list of emails for a given notification type. */
function getRecipientsFor(notifType) {
  var config = getNotificationConfig();
  var emails = [];
  NAMES.forEach(function(name) {
    if (config[name] && config[name][notifType] && NAME_EMAILS[name]) {
      emails.push(NAME_EMAILS[name]);
    }
  });
  return emails.join(',');
}

/** Called from admin panel via google.script.run */
function getConfigForAdmin() {
  return { notifications: getNotificationConfig(), times: getTimeConfig() };
}

/** Called from admin panel via google.script.run */
function saveConfigFromAdmin(config) {
  var props = PropertiesService.getScriptProperties();
  if (config.notifications) props.setProperty('NOTIFICATION_CONFIG', JSON.stringify(config.notifications));
  if (config.times)         props.setProperty('TIME_CONFIG',         JSON.stringify(config.times));
}

/** Called from admin panel to re-create triggers with updated times */
function rebuildTriggersFromAdmin() {
  setupTriggers();
}

/**
 * Get all walks within a date range.
 * Each row: [timestamp, who, when, pipi, kaki]
 */
function getWalksInRange(startDate, endDate) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  var data = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
  var walks = [];

  data.forEach(function(row) {
    var ts = row[0] instanceof Date ? row[0] : new Date(row[0]);
    if (isNaN(ts.getTime())) return; // skip unparseable rows
    if (ts >= startDate && ts < endDate) {
      walks.push({
        timestamp: row[0],
        who: row[1],
        when: row[2],
        pipi: row[3] === '✓',
        kaki: row[4] === '✓',
        nothing: row[5] === '✓'
      });
    }
  });

  return walks;
}

/**
 * Build summary stats from a list of walks.
 */
function buildStats(walks) {
  var stats = {};
  NAMES.forEach(function(name) {
    stats[name] = { total: 0, morning: 0, noon: 0, evening: 0, night: 0, pipi: 0, kaki: 0 };
  });

  var timeMap = { 'בוקר': 'morning', 'צהריים': 'noon', 'ערב': 'evening', 'לילה': 'night' };

  walks.forEach(function(w) {
    var s = stats[w.who];
    if (!s) return;
    s.total++;
    var timeKey = timeMap[w.when];
    if (timeKey) s[timeKey]++;
    if (w.pipi) s.pipi++;
    if (w.kaki) s.kaki++;
  });

  return stats;
}

/**
 * Build HTML email for a summary period.
 */
function buildSummaryEmail(title, subtitle, walks, stats) {
  var html = '<div dir="rtl" style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">'
    + '<div style="background: #8B5E3C; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">'
    + '<h1 style="color: white; margin: 0;">🐕 ' + title + '</h1>'
    + '<p style="color: #f5e6d3; margin: 8px 0 0; font-size: 14px;">' + subtitle + '</p>'
    + '</div>'
    + '<div style="background: white; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e0e0e0;">';

  if (walks.length === 0) {
    html += '<p style="text-align: center; color: #999; font-size: 16px;">לא היו טיולים בתקופה זו 😴</p>';
  } else {
    html += '<p style="color: #5D4037; font-size: 18px; text-align: center; margin-bottom: 16px;">סה"כ <strong>' + walks.length + '</strong> טיולים</p>';

    // Per-person table
    html += '<table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">'
      + '<tr style="background: #8B5E3C; color: white;">'
      + '<th style="padding: 10px; text-align: right;">שם</th>'
      + '<th style="padding: 10px; text-align: center;">טיולים</th>'
      + '<th style="padding: 10px; text-align: center;">💧</th>'
      + '<th style="padding: 10px; text-align: center;">💩</th>'
      + '</tr>';

    var rowBg = false;
    NAMES.forEach(function(name) {
      var s = stats[name];
      if (s.total === 0) return;
      var bg = rowBg ? ' background: #f5f0eb;' : '';
      rowBg = !rowBg;
      html += '<tr style="' + bg + '">'
        + '<td style="padding: 10px; font-weight: bold; color: #5D4037;">' + name + '</td>'
        + '<td style="padding: 10px; text-align: center;">' + s.total + '</td>'
        + '<td style="padding: 10px; text-align: center;">' + s.pipi + '</td>'
        + '<td style="padding: 10px; text-align: center;">' + s.kaki + '</td>'
        + '</tr>';
    });
    html += '</table>';

    // Time distribution
    html += '<h3 style="color: #5D4037; margin: 16px 0 8px;">חלוקה לפי שעות:</h3>'
      + '<table style="width: 100%; border-collapse: collapse;">';
    var times = [
      { label: '🌅 בוקר', key: 'morning' },
      { label: '☀️ צהריים', key: 'noon' },
      { label: '🌆 ערב', key: 'evening' },
      { label: '🌙 לילה', key: 'night' }
    ];
    times.forEach(function(t) {
      var count = 0;
      NAMES.forEach(function(name) { count += stats[name][t.key]; });
      if (count > 0) {
        html += '<tr><td style="padding: 6px 10px;">' + t.label + '</td>'
          + '<td style="padding: 6px 10px; text-align: center; font-weight: bold;">' + count + '</td></tr>';
      }
    });
    html += '</table>';
  }

  html += '</div></div>';
  return html;
}

/**
 * Returns all walks ever recorded (no date filter).
 */
function getAllWalks() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  var data = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
  var walks = [];

  data.forEach(function(row) {
    var ts = row[0] instanceof Date ? row[0] : new Date(row[0]);
    if (isNaN(ts.getTime())) return;
    walks.push({
      timestamp: ts,
      who: row[1],
      pipi: row[3] === '✓',
      kaki: row[4] === '✓',
      nothing: row[5] === '✓'
    });
  });

  return walks;
}

/**
 * Builds the all-time leaderboard HTML block.
 */
function buildLeaderboardHtml() {
  var walks = getAllWalks();
  if (walks.length === 0) return '';

  // Tally totals per person
  var totals = {};
  NAMES.forEach(function(name) { totals[name] = 0; });
  walks.forEach(function(w) {
    if (totals[w.who] !== undefined) totals[w.who]++;
  });

  // Sort descending
  var ranked = NAMES
    .map(function(name) { return { name: name, count: totals[name] }; })
    .filter(function(x) { return x.count > 0; })
    .sort(function(a, b) { return b.count - a.count; });

  if (ranked.length === 0) return '';

  var medals = ['🥇', '🥈', '🥉'];
  var firstDate = walks[0].timestamp.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });

  var html = '<div style="margin-top: 20px; border-top: 2px solid #f5e6d3; padding-top: 16px;">'
    + '<h3 style="color: #5D4037; margin: 0 0 12px; text-align: center;">🏆 לוח המובילים — מאז ' + firstDate + '</h3>'
    + '<table style="width: 100%; border-collapse: collapse;">'
    + '<tr style="background: #5D4037; color: white;">'
    + '<th style="padding: 8px 10px; text-align: right;">מקום</th>'
    + '<th style="padding: 8px 10px; text-align: right;">שם</th>'
    + '<th style="padding: 8px 10px; text-align: center;">טיולים</th>'
    + '</tr>';

  ranked.forEach(function(entry, i) {
    var bg = i % 2 === 1 ? ' background: #f5f0eb;' : '';
    var medal = medals[i] || (i + 1) + '.';
    html += '<tr style="' + bg + '">'
      + '<td style="padding: 8px 10px; font-size: 18px;">' + medal + '</td>'
      + '<td style="padding: 8px 10px; font-weight: bold; color: #5D4037;">' + entry.name + '</td>'
      + '<td style="padding: 8px 10px; text-align: center; font-weight: bold; font-size: 16px;">' + entry.count + '</td>'
      + '</tr>';
  });

  html += '</table></div>';
  return html;
}

/**
 * DAILY SUMMARY - runs every day at 8:00 AM, summarizes yesterday.
 */
function sendDailySummary() {
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  var dayStr = yesterday.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });

  var walks = getWalksInRange(yesterday, today);
  var stats = buildStats(walks);

  // Build email: daily summary + leaderboard appended inside the card
  var summaryHtml = buildSummaryEmail('סיכום יומי', dayStr, walks, stats);
  var leaderboardHtml = buildLeaderboardHtml();
  // Insert leaderboard before the closing </div></div>
  var html = summaryHtml.replace('</div></div>', leaderboardHtml + '</div></div>');

  var textBody = 'סיכום יומי - ' + dayStr + '\nסה"כ טיולים: ' + walks.length;

  var dailyRecipients = getRecipientsFor('dailySummary');
  if (!dailyRecipients) return;
  try {
    MailApp.sendEmail({
      to: dailyRecipients,
      subject: '🐕 סיכום יומי — ' + dayStr,
      body: textBody,
      htmlBody: html,
      name: 'WaffleWalks 🐾'
    });
  } catch (error) {
    Logger.log('Daily summary email error: ' + error.toString());
  }
}

/**
 * WEEKLY SUMMARY - runs every Friday at 8:00 AM, summarizes the past week (Sat-Fri).
 */
function sendWeeklySummary() {
  var today = new Date();
  today.setHours(0, 0, 0, 0);

  // Go back to last Saturday
  var endDate = new Date(today);
  var startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 7); // one week back

  var startStr = startDate.toLocaleDateString('he-IL', { day: 'numeric', month: 'long' });
  var endStr = new Date(endDate.getTime() - 86400000).toLocaleDateString('he-IL', { day: 'numeric', month: 'long' });

  var walks = getWalksInRange(startDate, endDate);
  var stats = buildStats(walks);
  var html = buildSummaryEmail('סיכום שבועי', startStr + ' — ' + endStr, walks, stats);

  var textBody = 'סיכום שבועי: ' + startStr + ' — ' + endStr + '\nסה"כ טיולים: ' + walks.length;

  var weeklyRecipients = getRecipientsFor('weeklySummary');
  if (!weeklyRecipients) return;
  try {
    MailApp.sendEmail({
      to: weeklyRecipients,
      subject: '🐕 סיכום שבועי — ' + startStr + ' עד ' + endStr,
      body: textBody,
      htmlBody: html,
      name: 'WaffleWalks 🐾'
    });
  } catch (error) {
    Logger.log('Weekly summary email error: ' + error.toString());
  }
}

/**
 * MONTHLY SUMMARY - runs on the 1st of each month, summarizes the previous month.
 */
function sendMonthlySummary() {
  var today = new Date();
  var endDate = new Date(today.getFullYear(), today.getMonth(), 1); // 1st of current month
  var startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1); // 1st of previous month

  var monthStr = startDate.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });

  var walks = getWalksInRange(startDate, endDate);
  var stats = buildStats(walks);
  var html = buildSummaryEmail('סיכום חודשי', monthStr, walks, stats);

  var textBody = 'סיכום חודשי - ' + monthStr + '\nסה"כ טיולים: ' + walks.length;

  var monthlyRecipients = getRecipientsFor('monthlySummary');
  if (!monthlyRecipients) return;
  try {
    MailApp.sendEmail({
      to: monthlyRecipients,
      subject: '🐕 סיכום חודשי — ' + monthStr,
      body: textBody,
      htmlBody: html,
      name: 'WaffleWalks 🐾'
    });
  } catch (error) {
    Logger.log('Monthly summary email error: ' + error.toString());
  }
}

/**
 * DAILY REMINDER - sends a friendly nudge to whoever didn't walk Waffle yesterday.
 * Runs together with sendDailySummary at 8:00 AM.
 */
function sendDailyReminder() {
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  var walks = getWalksInRange(yesterday, today);

  // Find who DID walk yesterday
  var walkedYesterday = {};
  walks.forEach(function(w) { walkedYesterday[w.who] = true; });

  var reminderConfig = getNotificationConfig();

  // Find who DIDN'T walk yesterday AND has reminders enabled
  var slackers = NAMES.filter(function(name) {
    return !walkedYesterday[name] && reminderConfig[name] && reminderConfig[name].reminder;
  });

  if (slackers.length === 0) return;
  if (walks.length === 0) return; // nobody walked at all — skip (family day off)

  var dayStr = yesterday.toLocaleDateString('he-IL', { weekday: 'long' });

  slackers.forEach(function(name) {
    var email = NAME_EMAILS[name];
    if (!email) return;

    var htmlBody = '<div dir="rtl" style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">'
      + '<div style="background: #FF8F00; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">'
      + '<h1 style="color: white; margin: 0;">🐕 וופל מחכה לך!</h1>'
      + '</div>'
      + '<div style="background: white; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e0e0e0; text-align: center;">'
      + '<p style="font-size: 18px; color: #5D4037;">היי ' + name + ',</p>'
      + '<p style="font-size: 16px; color: #666;">שמנו לב שאתמול (' + dayStr + ') לא הוצאת את וופל לטיול.</p>'
      + '<p style="font-size: 16px; color: #666;">וופל תשמח לצאת איתך היום! 🐾</p>'
      + '</div></div>';

    var textBody = 'היי ' + name + ', שמנו לב שאתמול (' + dayStr + ') לא הוצאת את וופל לטיול. וופל תשמח לצאת איתך היום!';

    try {
      MailApp.sendEmail({
        to: email,
        subject: '🐕 וופל מחכה לך!',
        body: textBody,
        htmlBody: htmlBody,
        name: 'WaffleWalks 🐾'
      });
    } catch (error) {
      Logger.log('Reminder email error for ' + name + ': ' + error.toString());
    }
  });
}

/**
 * Run this ONCE to set up all automatic triggers.
 * Go to Apps Script editor > Run > setupTriggers
 */
function setupTriggers() {
  var times = getTimeConfig();

  // Remove existing triggers to avoid duplicates
  ScriptApp.getProjectTriggers().forEach(function(t) { ScriptApp.deleteTrigger(t); });

  ScriptApp.newTrigger('sendDailySummary')
    .timeBased().everyDays(1).atHour(times.dailySummary).create();

  ScriptApp.newTrigger('sendDailyReminder')
    .timeBased().everyDays(1).atHour(times.reminder).create();

  ScriptApp.newTrigger('sendWeeklySummary')
    .timeBased().onWeekDay(ScriptApp.WeekDay.FRIDAY).atHour(times.weeklySummary).create();

  ScriptApp.newTrigger('sendMonthlySummary')
    .timeBased().onMonthDay(1).atHour(times.monthlySummary).create();

  Logger.log('Triggers set: daily=' + times.dailySummary + 'h, weekly=' + times.weeklySummary + 'h, monthly=' + times.monthlySummary + 'h, reminder=' + times.reminder + 'h');
}

// ============================================================
// ONE-TIME FIX — run once then delete
// ============================================================

/**
 * Converts old Hebrew string timestamps (e.g. "14.2.2026, 8:14:15")
 * to real Date objects in column A. Run once, then delete.
 */
function fixOldTimestamps() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;

  var range = sheet.getRange(2, 1, lastRow - 1, 1);
  var values = range.getValues();
  var fixed = 0;

  values.forEach(function(row, i) {
    var cell = row[0];
    if (cell instanceof Date) return; // already fine

    var str = String(cell).trim();
    // Format: "14.2.2026, 8:14:15"
    var match = str.match(/^(\d+)\.(\d+)\.(\d+),\s*(\d+):(\d+):(\d+)/);
    if (!match) return;

    var d = parseInt(match[1]), mo = parseInt(match[2]) - 1, y = parseInt(match[3]);
    var h = parseInt(match[4]), mi = parseInt(match[5]), s = parseInt(match[6]);
    var date = new Date(y, mo, d, h, mi, s);

    if (!isNaN(date.getTime())) {
      sheet.getRange(i + 2, 1).setValue(date);
      fixed++;
    }
  });

  Logger.log('Fixed ' + fixed + ' rows.');
}

// ============================================================
// TEST FUNCTIONS
// ============================================================

// Test function
function testFunction() {
  var testData = {
    timestamp: new Date().toLocaleString('he-IL'),
    who: 'ערן',
    when: 'בוקר',
    pipiChecked: true,
    kakiChecked: false
  };

  var e = {
    postData: {
      contents: JSON.stringify(testData)
    }
  };

  Logger.log(doPost(e));
}

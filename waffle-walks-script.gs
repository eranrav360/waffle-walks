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

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Create headers if first time
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['תאריך ושעה', 'מי', 'מתי', 'פיפי', 'קקי']);
      var headerRange = sheet.getRange(1, 1, 1, 5);
      headerRange.setBackground('#8B5E3C');
      headerRange.setFontColor('#ffffff');
      headerRange.setFontWeight('bold');
      headerRange.setHorizontalAlignment('center');
    }

    var data = JSON.parse(e.postData.contents);

    // Append row to sheet
    sheet.appendRow([
      data.timestamp,
      data.who,
      data.when,
      data.pipiChecked ? '✓' : '',
      data.kakiChecked ? '✓' : ''
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
  var recipients = 'eran.raviv@gmail.com,ohresearch@gmail.com';
  var subject = '🐕 וופל יצאה לטייל!';

  var what = [];
  if (data.pipiChecked) what.push('פיפי 💧');
  if (data.kakiChecked) what.push('קקי 💩');

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

/**
 * Get all walks within a date range.
 * Each row: [timestamp, who, when, pipi, kaki]
 */
function getWalksInRange(startDate, endDate) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  var data = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
  var walks = [];

  data.forEach(function(row) {
    var ts = new Date(row[0]);
    if (ts >= startDate && ts < endDate) {
      walks.push({
        timestamp: row[0],
        who: row[1],
        when: row[2],
        pipi: row[3] === '✓',
        kaki: row[4] === '✓'
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
  var html = buildSummaryEmail('סיכום יומי', dayStr, walks, stats);

  var textBody = 'סיכום יומי - ' + dayStr + '\nסה"כ טיולים: ' + walks.length;

  try {
    MailApp.sendEmail({
      to: SUMMARY_RECIPIENTS,
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

  try {
    MailApp.sendEmail({
      to: SUMMARY_RECIPIENTS,
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

  try {
    MailApp.sendEmail({
      to: SUMMARY_RECIPIENTS,
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
 * Run this ONCE to set up all automatic triggers.
 * Go to Apps Script editor > Run > setupTriggers
 */
function setupTriggers() {
  // Remove existing triggers to avoid duplicates
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(trigger) {
    ScriptApp.deleteTrigger(trigger);
  });

  // Daily at 8:00 AM
  ScriptApp.newTrigger('sendDailySummary')
    .timeBased()
    .everyDays(1)
    .atHour(8)
    .create();

  // Weekly on Friday at 8:00 AM
  ScriptApp.newTrigger('sendWeeklySummary')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.FRIDAY)
    .atHour(8)
    .create();

  // Monthly on the 1st at 8:00 AM
  ScriptApp.newTrigger('sendMonthlySummary')
    .timeBased()
    .onMonthDay(1)
    .atHour(8)
    .create();

  Logger.log('All triggers set up successfully!');
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

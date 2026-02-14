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

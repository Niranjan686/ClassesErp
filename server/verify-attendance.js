const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = path.join(__dirname, '..', 'screenshots', 'attendance');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function runAttendanceVerification() {
  console.log('🚀 Starting Attendance Module Visual Verification...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

    // 1. Log in as Class Admin
    console.log('🔑 Logging in as Class Admin (K001)...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));

    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Class Admin (K001)')) {
        await btn.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 500));

    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) {
      await submitBtn.click();
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 8000 }).catch(() => {});
    }
    await new Promise(r => setTimeout(r, 2000));

    // 2. Daily Attendance Entry (/attendance-entry)
    console.log('📸 Capturing Daily Attendance Entry (/attendance-entry)...');
    await page.goto('http://localhost:5173/attendance-entry', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2500));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '01_daily_attendance_entry.png'), fullPage: false });
    console.log('✅ Saved 01_daily_attendance_entry.png');

    // 3. Quick RFID Punch Mode in Attendance Entry
    console.log('📸 Capturing RFID Quick Punch Terminal...');
    const tabs = await page.$$('button[role="tab"]');
    if (tabs.length >= 2) {
      await tabs[1].click(); // Switch to Quick RFID Punch tab
      await new Promise(r => setTimeout(r, 1500));
      await page.screenshot({ path: path.join(OUTPUT_DIR, '02_quick_rfid_punch_terminal.png'), fullPage: false });
      console.log('✅ Saved 02_quick_rfid_punch_terminal.png');
    }

    // 4. Monthly Attendance Matrix Grid (/attendance-monthly)
    console.log('📸 Capturing Monthly Attendance Matrix (/attendance-monthly)...');
    await page.goto('http://localhost:5173/attendance-monthly', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2500));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '03_monthly_attendance_matrix.png'), fullPage: false });
    console.log('✅ Saved 03_monthly_attendance_matrix.png');

    console.log('🎉 Attendance verification screenshots saved in:', OUTPUT_DIR);
  } catch (err) {
    console.error('❌ Verification Error:', err);
  } finally {
    await browser.close();
  }
}

runAttendanceVerification();

const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = path.join(__dirname, '..', 'screenshots', 'student_app');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function runStudentAppVerification() {
  console.log('🚀 Starting Student Mobile App Visual Verification...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    // Use standard modern mobile resolution in device viewport mode (iPhone 14 / Pixel 7: 412x915)
    await page.setViewport({ width: 500, height: 920, deviceScaleFactor: 2 });

    // 1. Visit /app (Mobile Login Screen)
    console.log('📸 Capturing Student Mobile App Login (/app)...');
    await page.goto('http://localhost:5173/app', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '01_student_app_mobile_login.png') });
    console.log('✅ Saved 01_student_app_mobile_login.png');

    // 2. Click "Get Verification Code"
    console.log('📸 Triggering OTP screen...');
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) {
      await submitBtn.click();
      await new Promise(r => setTimeout(r, 1500));
    }
    await page.screenshot({ path: path.join(OUTPUT_DIR, '02_student_app_otp_screen.png') });
    console.log('✅ Saved 02_student_app_otp_screen.png');

    // 3. Verify OTP & Log In
    console.log('🔑 Logging into Student App...');
    const verifyBtn = await page.$('button[type="submit"]');
    if (verifyBtn) {
      await verifyBtn.click();
      await new Promise(r => setTimeout(r, 2500));
    }
    await page.screenshot({ path: path.join(OUTPUT_DIR, '03_student_app_home_screen.png') });
    console.log('✅ Saved 03_student_app_home_screen.png');

    // 4. Attendance Tab
    console.log('📸 Capturing Attendance Tab...');
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Attend')) {
        await btn.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '04_student_app_attendance_tab.png') });
    console.log('✅ Saved 04_student_app_attendance_tab.png');

    // 5. Notes Tab
    console.log('📸 Capturing Notes Tab...');
    const noteButtons = await page.$$('button');
    for (const btn of noteButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Notes')) {
        await btn.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '05_student_app_study_notes_tab.png') });
    console.log('✅ Saved 05_student_app_study_notes_tab.png');

    // 6. Fees Tab
    console.log('📸 Capturing Fees Tab...');
    const feeButtons = await page.$$('button');
    for (const btn of feeButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Fees')) {
        await btn.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '06_student_app_fees_tab.png') });
    console.log('✅ Saved 06_student_app_fees_tab.png');

    console.log('🎉 Student Mobile App verification complete! All screenshots saved in:', OUTPUT_DIR);
  } catch (err) {
    console.error('❌ Verification Error:', err);
  } finally {
    await browser.close();
  }
}

runStudentAppVerification();

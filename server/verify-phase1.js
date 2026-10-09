const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = path.join(__dirname, '..', 'screenshots', 'phase1');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function runVerification() {
  console.log('🚀 Starting Phase 1 Live MongoDB & UI Verification...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

    // ==========================================
    // 1. Class Admin Login (K001 - Keerti Classes)
    // ==========================================
    console.log('🔑 Logging in as Class Admin (K001)...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));

    // Find and click the "Class Admin (K001)" button
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Class Admin (K001)')) {
        await btn.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 500));

    // Click submit
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) {
      await submitBtn.click();
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 8000 }).catch(() => {});
    }
    await new Promise(r => setTimeout(r, 2500));
    console.log('Current URL after Admin login:', page.url());

    // 2. Class Admin Dashboard Screenshot
    console.log('📸 Capturing Live Class Admin Dashboard...');
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2500));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '01_admin_dashboard.png'), fullPage: false });
    console.log('✅ Saved 01_admin_dashboard.png');

    // 3. Student Roster Screenshot
    console.log('📸 Capturing Student Roster (/students)...');
    await page.goto('http://localhost:5173/students', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2500));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '02_student_roster.png'), fullPage: false });
    console.log('✅ Saved 02_student_roster.png');

    // 4. Fee Management Screenshot
    console.log('📸 Capturing Fee Management (/fee-management)...');
    await page.goto('http://localhost:5173/fee-management', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2500));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '03_fee_management.png'), fullPage: false });
    console.log('✅ Saved 03_fee_management.png');

    // 5. Marks Entry Screenshot
    console.log('📸 Capturing Marks Entry (/marks-entry)...');
    await page.goto('http://localhost:5173/marks-entry', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2500));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '04_marks_entry.png'), fullPage: false });
    console.log('✅ Saved 04_marks_entry.png');

    // ==========================================
    // 6. Student Login & Consumer Student Portal
    // ==========================================
    console.log('🔑 Navigating to Login for Student persona...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));

    // Find and click the "Student (K001)" button
    const studentButtons = await page.$$('button');
    for (const btn of studentButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Student (K001)')) {
        await btn.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 500));

    // Click submit
    const studentSubmit = await page.$('button[type="submit"]');
    if (studentSubmit) {
      await studentSubmit.click();
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 8000 }).catch(() => {});
    }
    await new Promise(r => setTimeout(r, 3000));
    console.log('Current URL after Student login:', page.url());

    // 7. Student Portal Screenshot
    console.log('📸 Capturing Consumer Student Portal (/student-portal)...');
    await page.screenshot({ path: path.join(OUTPUT_DIR, '05_consumer_student_portal.png'), fullPage: false });
    console.log('✅ Saved 05_consumer_student_portal.png');

    console.log('🎉 Phase 1 verification complete! All screenshots saved in:', OUTPUT_DIR);
  } catch (err) {
    console.error('❌ Verification Error:', err);
  } finally {
    await browser.close();
  }
}

runVerification();

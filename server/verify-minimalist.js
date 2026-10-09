const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = path.join(__dirname, '..', 'screenshots', 'minimalist');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function runMinimalistVerification() {
  console.log('🚀 Starting Minimalist UI Verification...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

    // 1. Minimalist Login Screen
    console.log('📸 Capturing Minimalist Login Screen...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '01_minimalist_login_admin.png'), fullPage: false });
    console.log('✅ Saved 01_minimalist_login_admin.png');

    // Toggle Super Admin
    const roleButtons = await page.$$('button');
    for (const btn of roleButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Super Admin')) {
        await btn.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '02_minimalist_login_superadmin.png'), fullPage: false });
    console.log('✅ Saved 02_minimalist_login_superadmin.png');

    // 2. Log in as Class Admin
    for (const btn of roleButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Class Admin')) {
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
    await new Promise(r => setTimeout(r, 2500));

    // 3. Class Admin Dashboard Screenshot
    console.log('📸 Capturing Clean Class Admin Dashboard...');
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '03_minimalist_admin_dashboard.png'), fullPage: false });
    console.log('✅ Saved 03_minimalist_admin_dashboard.png');

    // 4. Attendance Entry Screenshot
    console.log('📸 Capturing Clean Attendance Entry...');
    await page.goto('http://localhost:5173/attendance-entry', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '04_minimalist_attendance_entry.png'), fullPage: false });
    console.log('✅ Saved 04_minimalist_attendance_entry.png');

    console.log('🎉 Minimalist verification complete! All screenshots saved in:', OUTPUT_DIR);
  } catch (err) {
    console.error('❌ Verification Error:', err);
  } finally {
    await browser.close();
  }
}

runMinimalistVerification();
